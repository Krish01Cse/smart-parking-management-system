from fastapi import APIRouter
from datetime import datetime
from ..database import get_db_connection

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Metrics"])

@router.get("/metrics")
def get_dashboard_metrics():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Slot counts
    cursor.execute("SELECT COUNT(*) FROM parking_slots")
    total_slots = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM parking_slots WHERE status = 'Available'")
    available_slots = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM parking_slots WHERE status = 'Occupied'")
    occupied_slots = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM parking_slots WHERE status = 'Maintenance'")
    maintenance_slots = cursor.fetchone()[0]

    # Users
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]

    # Reservations
    cursor.execute("SELECT COUNT(*) FROM reservations WHERE status = 'Confirmed'")
    active_reservations = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM reservations WHERE status = 'Completed'")
    completed_reservations = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM reservations WHERE status = 'Cancelled'")
    cancelled_reservations = cursor.fetchone()[0]

    # Today's reservations
    today_str = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("SELECT COUNT(*) FROM reservations WHERE start_time LIKE ?", (f"{today_str}%",))
    today_reservations = cursor.fetchone()[0]

    # Payments
    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'Paid'")
    total_revenue = round(cursor.fetchone()[0], 2)

    cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'Pending'")
    pending_payments = round(cursor.fetchone()[0], 2)

    # Zone occupancy breakdown
    cursor.execute("""
        SELECT location_zone, 
               COUNT(*) as total,
               SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
               SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
               SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance
        FROM parking_slots
        GROUP BY location_zone
    """)
    zone_stats = [dict(row) for row in cursor.fetchall()]

    # Vehicle type breakdown
    cursor.execute("""
        SELECT vehicle_type, COUNT(*) as count 
        FROM parking_slots 
        GROUP BY vehicle_type
    """)
    vehicle_distribution = [dict(row) for row in cursor.fetchall()]

    # Recent reservations (latest 5)
    cursor.execute("""
        SELECT r.*, p.slot_number, p.location_zone 
        FROM reservations r
        JOIN parking_slots p ON r.slot_id = p.id
        ORDER BY r.id DESC LIMIT 5
    """)
    recent_reservations = [dict(row) for row in cursor.fetchall()]

    # Recent transactions (latest 5)
    cursor.execute("""
        SELECT p.*, r.booking_id, r.customer_name, s.slot_number
        FROM payments p
        JOIN reservations r ON p.reservation_id = r.id
        JOIN parking_slots s ON r.slot_id = s.id
        ORDER BY p.id DESC LIMIT 5
    """)
    recent_transactions = [dict(row) for row in cursor.fetchall()]

    # Occupancy rate percentage
    occupancy_rate = round((occupied_slots / total_slots * 100), 1) if total_slots > 0 else 0

    conn.close()

    return {
        "total_slots": total_slots,
        "available_slots": available_slots,
        "occupied_slots": occupied_slots,
        "maintenance_slots": maintenance_slots,
        "occupancy_rate": occupancy_rate,
        "total_users": total_users,
        "active_reservations": active_reservations,
        "completed_reservations": completed_reservations,
        "cancelled_reservations": cancelled_reservations,
        "today_reservations": today_reservations,
        "total_revenue": total_revenue,
        "pending_payments": pending_payments,
        "zone_stats": zone_stats,
        "vehicle_distribution": vehicle_distribution,
        "recent_reservations": recent_reservations,
        "recent_transactions": recent_transactions
    }
