from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from ..database import get_db_connection
from ..models import SlotCreate, SlotUpdate, SlotStatusUpdate
from ..supabase_client import supabase_sync_slot

router = APIRouter(prefix="/api/slots", tags=["Parking Slots"])

@router.get("")
def get_slots(
    status: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    zone: Optional[str] = None,
    search: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM parking_slots WHERE 1=1"
    params = []

    if status and status.lower() != "all":
        query += " AND LOWER(status) = LOWER(?)"
        params.append(status)

    if vehicle_type and vehicle_type.lower() != "all":
        query += " AND LOWER(vehicle_type) = LOWER(?)"
        params.append(vehicle_type)

    if zone and zone.lower() != "all":
        query += " AND location_zone LIKE ?"
        params.append(f"%{zone}%")

    if search:
        query += " AND (slot_number LIKE ? OR location_zone LIKE ? OR current_vehicle LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard])

    query += " ORDER BY slot_number ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

@router.get("/summary")
def get_slots_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM parking_slots")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM parking_slots WHERE status = 'Available'")
    available = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM parking_slots WHERE status = 'Occupied'")
    occupied = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM parking_slots WHERE status = 'Maintenance'")
    maintenance = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM parking_slots WHERE vehicle_type = 'Car'")
    cars = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM parking_slots WHERE vehicle_type = 'Bike'")
    bikes = cursor.fetchone()[0]

    conn.close()
    return {
        "total": total,
        "available": available,
        "occupied": occupied,
        "maintenance": maintenance,
        "cars": cars,
        "bikes": bikes
    }

@router.get("/{slot_id}")
def get_slot(slot_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM parking_slots WHERE id = ?", (slot_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"Parking slot with ID {slot_id} not found.")
    return dict(row)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_slot(slot_data: SlotCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check for duplicate slot number
    cursor.execute("SELECT id FROM parking_slots WHERE LOWER(slot_number) = LOWER(?)", (slot_data.slot_number.strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot number '{slot_data.slot_number.strip().upper()}' already exists. Please choose a unique slot identifier."
        )

    cursor.execute("""
        INSERT INTO parking_slots (slot_number, vehicle_type, location_zone, hourly_rate, status)
        VALUES (?, ?, ?, ?, 'Available')
    """, (
        slot_data.slot_number.strip().upper(),
        slot_data.vehicle_type,
        slot_data.location_zone.strip(),
        slot_data.hourly_rate
    ))
    conn.commit()
    new_id = cursor.lastrowid

    cursor.execute("SELECT * FROM parking_slots WHERE id = ?", (new_id,))
    new_slot = dict(cursor.fetchone())
    conn.close()

    # Replicate slot to Supabase Cloud
    supabase_sync_slot(new_slot)

    return new_slot

@router.put("/{slot_id}")
def update_slot(slot_id: int, slot_data: SlotUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM parking_slots WHERE id = ?", (slot_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Parking slot not found.")

    if slot_data.slot_number:
        # Check duplicate slot number across other slots
        cursor.execute("SELECT id FROM parking_slots WHERE LOWER(slot_number) = LOWER(?) AND id != ?", (slot_data.slot_number.strip(), slot_id))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Slot number '{slot_data.slot_number.strip().upper()}' already exists."
            )

    updates = []
    params = []

    if slot_data.slot_number is not None:
        updates.append("slot_number = ?")
        params.append(slot_data.slot_number.strip().upper())
    if slot_data.vehicle_type is not None:
        updates.append("vehicle_type = ?")
        params.append(slot_data.vehicle_type)
    if slot_data.location_zone is not None:
        updates.append("location_zone = ?")
        params.append(slot_data.location_zone.strip())
    if slot_data.hourly_rate is not None:
        updates.append("hourly_rate = ?")
        params.append(slot_data.hourly_rate)
    if slot_data.status is not None:
        updates.append("status = ?")
        params.append(slot_data.status)
    if slot_data.current_vehicle is not None:
        updates.append("current_vehicle = ?")
        params.append(slot_data.current_vehicle)

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        query = f"UPDATE parking_slots SET {', '.join(updates)} WHERE id = ?"
        params.append(slot_id)
        cursor.execute(query, params)
        conn.commit()

    cursor.execute("SELECT * FROM parking_slots WHERE id = ?", (slot_id,))
    updated_slot = dict(cursor.fetchone())
    conn.close()

    # Replicate to Supabase Cloud
    supabase_sync_slot(updated_slot)

    return updated_slot

@router.patch("/{slot_id}/status")
def update_slot_status(slot_id: int, status_data: SlotStatusUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM parking_slots WHERE id = ?", (slot_id,))
    slot = cursor.fetchone()
    if not slot:
        conn.close()
        raise HTTPException(status_code=404, detail="Parking slot not found.")

    # Validation: Prevent invalid status changes when a confirmed reservation exists
    if status_data.status == "Maintenance":
        cursor.execute("""
            SELECT id, booking_id FROM reservations 
            WHERE slot_id = ? AND status = 'Confirmed'
        """, (slot_id,))
        active_res = cursor.fetchone()
        if active_res:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot place slot '{slot['slot_number']}' under maintenance. Active confirmed reservation {active_res['booking_id']} exists on this slot."
            )

    cursor.execute("""
        UPDATE parking_slots 
        SET status = ?, current_vehicle = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (status_data.status, status_data.current_vehicle if status_data.status == "Occupied" else None, slot_id))
    conn.commit()

    cursor.execute("SELECT * FROM parking_slots WHERE id = ?", (slot_id,))
    updated_slot = dict(cursor.fetchone())
    conn.close()

    # Replicate status update to Supabase Cloud
    supabase_sync_slot(updated_slot)

    return updated_slot

@router.delete("/{slot_id}")
def delete_slot(slot_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM parking_slots WHERE id = ?", (slot_id,))
    slot = cursor.fetchone()
    if not slot:
        conn.close()
        raise HTTPException(status_code=404, detail="Parking slot not found.")

    cursor.execute("SELECT COUNT(*) FROM reservations WHERE slot_id = ? AND status = 'Confirmed'", (slot_id,))
    if cursor.fetchone()[0] > 0:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete slot '{slot['slot_number']}' because it has active confirmed reservations."
        )

    cursor.execute("DELETE FROM parking_slots WHERE id = ?", (slot_id,))
    conn.commit()
    conn.close()
    return {"message": f"Parking slot '{slot['slot_number']}' deleted successfully."}
