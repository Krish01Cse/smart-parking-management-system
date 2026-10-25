from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from datetime import datetime
import random
from ..database import get_db_connection
from ..models import ReservationCreate
from ..supabase_client import supabase_sync_reservation, supabase_sync_slot

router = APIRouter(prefix="/api/reservations", tags=["Parking Reservations"])

def generate_booking_id():
    return f"RES-{random.randint(10000, 99999)}"

def parse_iso_or_custom_dt(dt_str: str) -> datetime:
    formats = [
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(dt_str, fmt)
        except ValueError:
            pass
    raise ValueError(f"Unable to parse timestamp '{dt_str}'. Use YYYY-MM-DD HH:MM or ISO format.")

@router.get("")
def get_reservations(
    status: Optional[str] = Query(None),
    vehicle_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT r.*, p.slot_number, p.location_zone, p.hourly_rate as slot_rate,
               pay.status as payment_status, pay.transaction_id
        FROM reservations r
        JOIN parking_slots p ON r.slot_id = p.id
        LEFT JOIN payments pay ON pay.id = (
            SELECT id FROM payments
            WHERE reservation_id = r.id
            ORDER BY (status = 'Paid') DESC, id DESC
            LIMIT 1
        )
        WHERE 1=1
    """
    params = []

    if status and status.lower() != "all":
        query += " AND LOWER(r.status) = LOWER(?)"
        params.append(status)

    if vehicle_type and vehicle_type.lower() != "all":
        query += " AND LOWER(r.vehicle_type) = LOWER(?)"
        params.append(vehicle_type)

    if search:
        query += " AND (r.booking_id LIKE ? OR r.customer_name LIKE ? OR r.vehicle_reg_number LIKE ? OR p.slot_number LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard, wildcard])

    query += " ORDER BY r.id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/{reservation_id}")
def get_reservation(reservation_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT r.*, p.slot_number, p.location_zone, p.hourly_rate as slot_rate,
               pay.status as payment_status, pay.transaction_id, pay.payment_method
        FROM reservations r
        JOIN parking_slots p ON r.slot_id = p.id
        LEFT JOIN payments pay ON r.id = pay.reservation_id
        WHERE r.id = ?
    """, (reservation_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Reservation not found.")
    return dict(row)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_reservation(data: ReservationCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Verify slot exists and matches vehicle type
    cursor.execute("SELECT * FROM parking_slots WHERE id = ?", (data.slot_id,))
    slot = cursor.fetchone()
    if not slot:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Selected parking slot ID {data.slot_id} does not exist.")

    if slot["status"] == "Maintenance":
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot '{slot['slot_number']}' is currently under Maintenance and cannot be reserved."
        )

    if slot["vehicle_type"] != data.vehicle_type:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot '{slot['slot_number']}' is designated for {slot['vehicle_type']}, but requested booking is for {data.vehicle_type}."
        )

    # 2. Validate timestamps
    try:
        start_dt = parse_iso_or_custom_dt(data.start_time)
        end_dt = parse_iso_or_custom_dt(data.end_time)
    except ValueError as e:
        conn.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if end_dt <= start_dt:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation end time must be after the start time."
        )

    diff_seconds = (end_dt - start_dt).total_seconds()
    duration_hours = round(diff_seconds / 3600.0, 1)
    if duration_hours < 0.5:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum reservation duration is 30 minutes (0.5 hour)."
        )

    # 3. Check for overlapping active reservations on this slot (prevent double booking)
    # Check if any confirmed reservation on this slot overlaps with requested window
    cursor.execute("""
        SELECT booking_id, start_time, end_time FROM reservations
        WHERE slot_id = ? AND status = 'Confirmed'
    """, (data.slot_id,))
    existing_bookings = cursor.fetchall()

    for b in existing_bookings:
        try:
            b_start = parse_iso_or_custom_dt(b["start_time"])
            b_end = parse_iso_or_custom_dt(b["end_time"])
            # Overlap condition: max(start_dt, b_start) < min(end_dt, b_end)
            if max(start_dt, b_start) < min(end_dt, b_end):
                conn.close()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Time collision: Slot '{slot['slot_number']}' is already booked by reservation '{b['booking_id']}' from {b['start_time']} to {b['end_time']}."
                )
        except ValueError:
            pass

    # 4. Calculate total amount
    hourly_rate = slot["hourly_rate"]
    total_amount = round(duration_hours * hourly_rate, 2)
    booking_id = generate_booking_id()

    # 5. Insert reservation
    cursor.execute("""
        INSERT INTO reservations (
            booking_id, slot_id, customer_name, customer_email, customer_phone,
            vehicle_reg_number, vehicle_type, start_time, end_time,
            duration_hours, total_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
    """, (
        booking_id, data.slot_id, data.customer_name.strip(),
        data.customer_email.strip() if data.customer_email else None,
        data.customer_phone.strip() if data.customer_phone else None,
        data.vehicle_reg_number.strip().upper(), data.vehicle_type,
        data.start_time, data.end_time, duration_hours, total_amount
    ))
    reservation_id = cursor.lastrowid

    # 6. Update parking slot status to 'Occupied' with current vehicle
    cursor.execute("""
        UPDATE parking_slots
        SET status = 'Occupied', current_vehicle = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (data.vehicle_reg_number.strip().upper(), data.slot_id))

    conn.commit()

    cursor.execute("""
        SELECT r.*, p.slot_number, p.location_zone, p.hourly_rate as slot_rate
        FROM reservations r
        JOIN parking_slots p ON r.slot_id = p.id
        WHERE r.id = ?
    """, (reservation_id,))
    created_res = dict(cursor.fetchone())
    conn.close()

    # Replicate reservation and slot to Supabase Cloud
    supabase_sync_reservation(created_res)
    supabase_sync_slot({
        "slot_number": created_res["slot_number"],
        "vehicle_type": created_res["vehicle_type"],
        "location_zone": created_res["location_zone"],
        "hourly_rate": created_res["slot_rate"],
        "status": "Occupied",
        "current_vehicle": created_res["vehicle_reg_number"]
    })

    return created_res

@router.post("/{reservation_id}/cancel")
def cancel_reservation(reservation_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM reservations WHERE id = ?", (reservation_id,))
    reservation = cursor.fetchone()
    if not reservation:
        conn.close()
        raise HTTPException(status_code=404, detail="Reservation not found.")

    if reservation["status"] == "Cancelled":
        conn.close()
        raise HTTPException(status_code=400, detail="Reservation is already cancelled.")

    slot_id = reservation["slot_id"]

    # Mark reservation as cancelled
    cursor.execute("UPDATE reservations SET status = 'Cancelled' WHERE id = ?", (reservation_id,))

    # Check if there are any other remaining active confirmed reservations on this slot
    cursor.execute("""
        SELECT COUNT(*) FROM reservations
        WHERE slot_id = ? AND status = 'Confirmed' AND id != ?
    """, (slot_id, reservation_id))
    other_active = cursor.fetchone()[0]

    freed_slot = None
    if other_active == 0:
        # Restore slot to Available
        cursor.execute("""
            UPDATE parking_slots
            SET status = 'Available', current_vehicle = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (slot_id,))
        cursor.execute("SELECT * FROM parking_slots WHERE id = ?", (slot_id,))
        freed_slot = dict(cursor.fetchone())

    conn.commit()

    cursor.execute("""
        SELECT r.*, p.slot_number, p.location_zone, p.hourly_rate as slot_rate
        FROM reservations r
        JOIN parking_slots p ON r.slot_id = p.id
        WHERE r.id = ?
    """, (reservation_id,))
    updated_res = dict(cursor.fetchone())
    conn.close()

    # Replicate cancellation to Supabase Cloud
    supabase_sync_reservation(updated_res)
    if freed_slot:
        supabase_sync_slot(freed_slot)

    return {
        "message": f"Reservation {reservation['booking_id']} successfully cancelled. Slot status updated.",
        "reservation": updated_res
    }
