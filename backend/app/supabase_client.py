import os
import json
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any
from supabase import create_client, Client

# Load local .env if present
def _load_env_file():
    for candidate in [
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.getcwd(), ".env")
    ]:
        if os.path.exists(candidate):
            try:
                with open(candidate, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip('"').strip("'")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass
_load_env_file()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jsigdjyqhvgheefrddol.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    try:
        if SUPABASE_URL and SUPABASE_KEY:
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            return _supabase_client
    except Exception as e:
        print(f"[Supabase] Client init warning: {e}")
    return None

def is_supabase_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_KEY)

def _auth_api_request(endpoint: str, data: Optional[Dict[str, Any]] = None, method: str = "GET") -> Optional[Dict[str, Any]]:
    """Helper to communicate with Supabase Auth Admin API using secret key."""
    if not is_supabase_configured():
        return None
    url = f"{SUPABASE_URL}{endpoint}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        # 422 usually means user already exists in Supabase Auth
        print(f"[Supabase Auth] HTTP {e.code} on {endpoint}: {err_msg[:120]}")
        return {"error": e.code, "message": err_msg}
    except Exception as e:
        print(f"[Supabase Auth] Exception on {endpoint}: {e}")
        return None

def supabase_sync_user_auth(user_data: Dict[str, Any]) -> bool:
    """Sync user directly into Supabase Auth Admin API so they appear in Supabase Dashboard Auth tab."""
    email = user_data["email"].strip().lower()
    raw_password = user_data.get("raw_password") or "PblPass@2026"
    meta = {
        "name": user_data.get("name", ""),
        "phone": user_data.get("phone", ""),
        "role": user_data.get("role", "Customer"),
        "email_verified": True
    }

    # Attempt to create user in Supabase Auth
    payload = {
        "email": email,
        "password": raw_password,
        "email_confirm": True,
        "user_metadata": meta
    }
    res = _auth_api_request("/auth/v1/admin/users", data=payload, method="POST")
    if res and "error" in res and res["error"] == 422:
        # User already exists in Auth, fetch id and update metadata
        list_res = _auth_api_request("/auth/v1/admin/users", method="GET")
        if list_res and "users" in list_res:
            for u in list_res["users"]:
                if u.get("email", "").lower() == email:
                    user_id = u.get("id")
                    if user_id:
                        _auth_api_request(
                            f"/auth/v1/admin/users/{user_id}",
                            data={"user_metadata": meta, "email_confirm": True},
                            method="PUT"
                        )
                    break
        return True
    return res is not None and "error" not in res

def supabase_sync_user(user_data: Dict[str, Any]) -> bool:
    """Sync user record both to Supabase Auth API and to public.users table."""
    # 1. First sync to Supabase Auth Admin API
    auth_ok = supabase_sync_user_auth(user_data)

    # 2. Upsert to public.users table if created
    table_ok = False
    client = get_supabase_client()
    if client:
        try:
            client.table("users").upsert({
                "name": user_data["name"],
                "email": user_data["email"].lower(),
                "phone": user_data["phone"],
                "password_hash": user_data["password_hash"],
                "role": user_data.get("role", "Customer")
            }, on_conflict="email").execute()
            table_ok = True
        except Exception as e:
            # Table might not be migrated yet in SQL editor
            pass

    return auth_ok or table_ok

def supabase_get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if not client:
        return None
    try:
        res = client.table("users").select("*").eq("email", email.strip().lower()).limit(1).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception:
        pass
    return None

def supabase_sync_slot(slot_data: Dict[str, Any]) -> bool:
    """Sync parking slot to Supabase parking_slots table."""
    client = get_supabase_client()
    if not client:
        return False
    try:
        client.table("parking_slots").upsert({
            "slot_number": slot_data["slot_number"],
            "vehicle_type": slot_data["vehicle_type"],
            "location_zone": slot_data["location_zone"],
            "hourly_rate": float(slot_data["hourly_rate"]),
            "status": slot_data.get("status", "Available"),
            "current_vehicle": slot_data.get("current_vehicle")
        }, on_conflict="slot_number").execute()
        return True
    except Exception as e:
        print(f"[Supabase] sync_slot notice: {e}")
        return False

def supabase_sync_reservation(res_data: Dict[str, Any]) -> bool:
    """Sync reservation to Supabase reservations table."""
    client = get_supabase_client()
    if not client:
        return False
    try:
        client.table("reservations").upsert({
            "booking_id": res_data["booking_id"],
            "slot_id": res_data.get("slot_id"),
            "customer_name": res_data["customer_name"],
            "customer_email": res_data.get("customer_email"),
            "customer_phone": res_data.get("customer_phone"),
            "vehicle_reg_number": res_data["vehicle_reg_number"],
            "vehicle_type": res_data["vehicle_type"],
            "start_time": res_data["start_time"],
            "end_time": res_data["end_time"],
            "duration_hours": float(res_data["duration_hours"]),
            "total_amount": float(res_data["total_amount"]),
            "status": res_data.get("status", "Confirmed")
        }, on_conflict="booking_id").execute()
        return True
    except Exception as e:
        print(f"[Supabase] sync_reservation notice: {e}")
        return False

def supabase_sync_payment(pay_data: Dict[str, Any]) -> bool:
    """Sync payment receipt to Supabase payments table."""
    client = get_supabase_client()
    if not client:
        return False
    try:
        client.table("payments").upsert({
            "transaction_id": pay_data["transaction_id"],
            "reservation_id": pay_data.get("reservation_id"),
            "amount": float(pay_data["amount"]),
            "hourly_rate": float(pay_data.get("hourly_rate", 5.0)),
            "duration_hours": float(pay_data.get("duration_hours", 1.0)),
            "payment_method": pay_data.get("payment_method", "Razorpay Gateway"),
            "status": pay_data.get("status", "Paid"),
            "notes": pay_data.get("notes")
        }, on_conflict="transaction_id").execute()
        return True
    except Exception as e:
        print(f"[Supabase] sync_payment notice: {e}")
        return False

def get_supabase_cloud_status() -> Dict[str, Any]:
    """Inspect Supabase Cloud connectivity, auth user count, and public table status."""
    status_info = {
        "configured": is_supabase_configured(),
        "project_url": SUPABASE_URL,
        "auth_connected": False,
        "auth_user_count": 0,
        "tables": {
            "users": {"exists": False, "count": 0},
            "parking_slots": {"exists": False, "count": 0},
            "reservations": {"exists": False, "count": 0},
            "payments": {"exists": False, "count": 0}
        }
    }

    # Check Auth Admin API
    auth_res = _auth_api_request("/auth/v1/admin/users", method="GET")
    if auth_res and "users" in auth_res:
        status_info["auth_connected"] = True
        status_info["auth_user_count"] = len(auth_res["users"])

    # Check Public Tables
    client = get_supabase_client()
    if client:
        for tbl in ["users", "parking_slots", "reservations", "payments"]:
            try:
                res = client.table(tbl).select("id", count="exact").limit(1).execute()
                status_info["tables"][tbl] = {
                    "exists": True,
                    "count": res.count if res.count is not None else len(res.data)
                }
            except Exception:
                status_info["tables"][tbl] = {"exists": False, "count": 0}

    return status_info
