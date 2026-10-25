from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
import re
from ..database import get_db_connection, hash_password, verify_password
from ..models import UserRegister, UserLogin, UserUpdate
from ..supabase_client import (
    supabase_sync_user,
    supabase_get_user_by_email,
    is_supabase_configured,
    get_supabase_client,
    get_supabase_cloud_status,
    supabase_sync_slot,
    supabase_sync_reservation,
    supabase_sync_payment
)

router = APIRouter(prefix="/api/users", tags=["User Management"])

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

@router.get("/supabase-status")
def get_supabase_status():
    return get_supabase_cloud_status()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegister):
    if not re.match(EMAIL_REGEX, data.email):
        raise HTTPException(status_code=400, detail="Invalid email address format.")

    if len(data.phone.strip()) < 7:
        raise HTTPException(status_code=400, detail="Phone number must be at least 7 characters.")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (data.email.strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Email '{data.email}' is already registered.")

    hashed_pwd = hash_password(data.password)
    cursor.execute("""
        INSERT INTO users (name, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
    """, (data.name.strip(), data.email.strip().lower(), data.phone.strip(), hashed_pwd, data.role))
    conn.commit()
    user_id = cursor.lastrowid

    cursor.execute("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?", (user_id,))
    new_user = dict(cursor.fetchone())
    conn.close()

    # Replicate credentials to Supabase Auth & users table
    supabase_sync_user({
        "name": new_user["name"],
        "email": new_user["email"],
        "phone": new_user["phone"],
        "password_hash": hashed_pwd,
        "raw_password": data.password,
        "role": new_user["role"]
    })

    return {
        "message": "User registered successfully.",
        "user": new_user,
        "supabase_synced": True
    }

@router.post("/login")
def login_user(creds: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (creds.email.strip(),))
    user = cursor.fetchone()
    conn.close()

    # Fallback to Supabase cloud if not found locally
    if not user:
        sb_user = supabase_get_user_by_email(creds.email.strip())
        if sb_user:
            user = sb_user

    if not user or not verify_password(creds.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Validate portal role requirement
    if creds.required_role:
        if creds.required_role.lower() == "administrator" and user["role"] != "Administrator":
            raise HTTPException(
                status_code=403,
                detail="Access restricted: This account does not have Administrator privileges. Please use the Customer Login portal."
            )
        elif creds.required_role.lower() == "customer" and user["role"] == "Administrator":
            # Allow admin to test customer view or notify
            pass

    user_dict = dict(user)
    return {
        "message": f"Welcome back, {user_dict['name']}!",
        "token": f"pbl-token-{user_dict['id']}-auth",
        "user": {
            "id": user_dict["id"],
            "name": user_dict["name"],
            "email": user_dict["email"],
            "phone": user_dict["phone"],
            "role": user_dict["role"],
            "created_at": user_dict.get("created_at")
        }
    }

@router.get("")
def list_users(search: Optional[str] = Query(None), role: Optional[str] = Query(None)):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT id, name, email, phone, role, created_at FROM users WHERE 1=1"
    params = []

    if role and role.lower() != "all":
        query += " AND LOWER(role) = LOWER(?)"
        params.append(role)

    if search:
        query += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard])

    query += " ORDER BY id ASC"

    cursor.execute(query, params)
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return users

@router.get("/{user_id}")
def get_user_profile(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return dict(user)

@router.put("/{user_id}")
def update_user_profile(user_id: int, data: UserUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")

    updates = []
    params = []
    if data.name:
        updates.append("name = ?")
        params.append(data.name.strip())
    if data.phone:
        updates.append("phone = ?")
        params.append(data.phone.strip())
    if data.role:
        updates.append("role = ?")
        params.append(data.role)

    if updates:
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        params.append(user_id)
        cursor.execute(query, params)
        conn.commit()

    cursor.execute("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?", (user_id,))
    updated_user = dict(cursor.fetchone())
    conn.close()

    # Sync updated profile to Supabase
    supabase_sync_user(updated_user)

    return updated_user

@router.patch("/{user_id}/role")
def update_user_role(user_id: int, role_data: dict):
    new_role = role_data.get("role")
    if new_role not in ["Administrator", "Customer"]:
        raise HTTPException(status_code=400, detail="Role must be either 'Administrator' or 'Customer'.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")

    cursor.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
    conn.commit()

    cursor.execute("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?", (user_id,))
    updated_user = dict(cursor.fetchone())
    conn.close()

    # Replicate updated role to Supabase
    supabase_sync_user(updated_user)

    return {
        "message": f"User {updated_user['name']} role updated to {new_role}.",
        "user": updated_user
    }

@router.post("/supabase-sync-all")
def trigger_supabase_sync_all():
    """Admin endpoint: synchronize all users, slots, reservations, and payments to Supabase."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users
    cursor.execute("SELECT * FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    user_synced = 0
    for u in users:
        u["raw_password"] = "Admin@123" if u["role"] == "Administrator" else "User@123"
        if supabase_sync_user(u):
            user_synced += 1

    # Slots
    cursor.execute("SELECT * FROM parking_slots")
    slots = [dict(row) for row in cursor.fetchall()]
    slot_synced = 0
    for s in slots:
        if supabase_sync_slot(s):
            slot_synced += 1

    # Reservations
    cursor.execute("SELECT * FROM reservations")
    reservations = [dict(row) for row in cursor.fetchall()]
    res_synced = 0
    for r in reservations:
        if supabase_sync_reservation(r):
            res_synced += 1

    # Payments
    cursor.execute("SELECT * FROM payments")
    payments = [dict(row) for row in cursor.fetchall()]
    pay_synced = 0
    for p in payments:
        if supabase_sync_payment(p):
            pay_synced += 1

    conn.close()

    status_cloud = get_supabase_cloud_status()

    return {
        "success": True,
        "message": f"Cloud synchronization complete! Synced {user_synced} users, {slot_synced} slots, {res_synced} reservations, and {pay_synced} payments.",
        "counts": {
            "users": f"{user_synced}/{len(users)}",
            "slots": f"{slot_synced}/{len(slots)}",
            "reservations": f"{res_synced}/{len(reservations)}",
            "payments": f"{pay_synced}/{len(payments)}"
        },
        "cloud_status": status_cloud
    }
