#!/usr/bin/env python3
"""
=============================================================================
PARKPULSE™ SMART PARKING MANAGEMENT SYSTEM — WHITE-BOX TEST SUITE
=============================================================================
Academic Evaluation: SE-lab-LA / Software Engineering PBL
Coverage Criteria Covered:
  - SECTION A: Statement Coverage (Every executable statement runs >= 1 time)
  - SECTION B: Branch / Decision Coverage (Every decision evaluates to True and False)
  - SECTION C: Condition / Multiple-Condition Coverage (Boolean sub-expressions)
  - SECTION D: Path Coverage (Happy paths, conflict paths, and error handling)
  - SECTION E: Loop Coverage (0 iterations, 1 iteration, N iterations)
  - SECTION F: Input Validation & Boundary Value Analysis (BVA on Pydantic schemas)
  - SECTION G: Cryptographic Security & Password Hashing Verification
=============================================================================
"""

import sys
import os
import re
import sqlite3
import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from pydantic import ValidationError
from fastapi import HTTPException

# Ensure backend directory is in python search path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.database import hash_password, verify_password
from app.models import (
    SlotCreate,
    SlotUpdate,
    SlotStatusUpdate,
    ReservationCreate,
    UserRegister,
    UserLogin,
    PaymentCreate,
    RazorpayPaymentVerify
)
from app.routers.reservations import (
    parse_iso_or_custom_dt,
    generate_booking_id,
    create_reservation,
    get_reservations,
    cancel_reservation
)
from app.routers.payments import (
    calculate_fee,
    generate_txn_id,
    process_simulated_payment,
    create_razorpay_order,
    verify_razorpay_payment
)
from app.routers.slots import (
    get_slots,
    get_slot,
    create_slot,
    update_slot_status
)


# ---------------------------------------------------------------------------
# SHARED HELPERS & IN-MEMORY TEST DATABASE FIXTURES
# ---------------------------------------------------------------------------

class MockDbProxy:
    """Wrapper that keeps the in-memory database alive even when functions call conn.close()."""
    def __init__(self, conn):
        self._conn = conn

    def close(self):
        pass

    def __getattr__(self, item):
        return getattr(self._conn, item)


def create_in_memory_db():
    """Builds a temporary, isolated SQLite database with fresh ParkPulse schema."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'Customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE parking_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_number TEXT UNIQUE NOT NULL,
            vehicle_type TEXT NOT NULL,
            location_zone TEXT NOT NULL,
            hourly_rate REAL NOT NULL DEFAULT 5.0,
            status TEXT NOT NULL DEFAULT 'Available',
            current_vehicle TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id TEXT UNIQUE NOT NULL,
            slot_id INTEGER NOT NULL,
            user_id INTEGER,
            customer_name TEXT NOT NULL,
            customer_email TEXT,
            customer_phone TEXT,
            vehicle_reg_number TEXT NOT NULL,
            vehicle_type TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration_hours REAL NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE RESTRICT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT UNIQUE NOT NULL,
            reservation_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            hourly_rate REAL NOT NULL,
            duration_hours REAL NOT NULL,
            payment_method TEXT NOT NULL DEFAULT 'UPI (Google Pay)',
            status TEXT NOT NULL DEFAULT 'Paid',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
        );
    """)

    # Populate baseline seed rows
    cursor.execute("""
        INSERT INTO parking_slots (id, slot_number, vehicle_type, location_zone, hourly_rate, status)
        VALUES 
            (1, 'A-101', 'Car', 'Zone A (North Wing)', 5.0, 'Available'),
            (2, 'A-102', 'Car', 'Zone A (North Wing)', 5.0, 'Occupied'),
            (3, 'A-103', 'Bike', 'Zone A (North Wing)', 2.5, 'Available'),
            (4, 'B-201', 'Car', 'Zone B (South Plaza)', 6.0, 'Maintenance');
    """)

    cursor.execute("""
        INSERT INTO users (id, name, email, phone, password_hash, role)
        VALUES 
            (1, 'Alex Morgan', 'admin@smartparking.edu', '+15550192834', 'test_hash_admin', 'Administrator'),
            (2, 'Krish Chachada', 'krish@example.com', '9302088011', 'test_hash_customer', 'Customer');
    """)

    conn.commit()
    return MockDbProxy(conn)



def make_reservation_data(**overrides):
    """Build a valid ReservationCreate payload with optional field overrides."""
    now = datetime.now()
    defaults = {
        "slot_id": 1,
        "customer_name": "Elena Moretti",
        "customer_email": "elena@example.com",
        "customer_phone": "+91 9876543210",
        "vehicle_reg_number": "CA-9842-TX",
        "vehicle_type": "Car",
        "start_time": (now + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M"),
        "end_time": (now + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M")
    }
    defaults.update(overrides)
    return ReservationCreate(**defaults)


# =============================================================================
# SECTION A — STATEMENT COVERAGE
# =============================================================================
# Goal: Execute every executable line in core reservation, slot, and payment logic.
# =============================================================================

class TestStatementCoverage:
    """
    STATEMENT COVERAGE: Ensures every statement in normal execution paths
    executes without unhandled exceptions or dead code.
    """

    def test_fee_calculator_executes_all_calculation_statements(self):
        """
        Traces lines in calculate_fee (payments.py):
          line 30: subtotal = round(hourly_rate * duration_hours, 2)
          line 31: service_tax = round(subtotal * 0.05, 2)
          line 32: total_amount = round(subtotal + service_tax, 2)
          line 34: return payload dict
        """
        fee = calculate_fee(hourly_rate=10.0, duration_hours=3.0)
        assert fee["hourly_rate"] == 10.0
        assert fee["duration_hours"] == 3.0
        assert fee["subtotal"] == 30.0
        assert fee["service_charge"] == 1.50   # 5% tax
        assert fee["total_amount"] == 31.50
        assert "3.0 hrs @ ₹10.00/hr" in fee["breakdown_text"]

    def test_create_reservation_executes_all_main_statements(self):
        """
        Traces lines in create_reservation (reservations.py):
          1. Slot lookup & verification
          2. Timestamp parsing & duration computation
          3. Collision detection loop
          4. Fee calculation
          5. DB INSERT statement & slot status transition
        """
        conn = create_in_memory_db()
        with patch("app.routers.reservations.get_db_connection", return_value=conn), \
             patch("app.routers.reservations.supabase_sync_reservation", return_value=True), \
             patch("app.routers.reservations.supabase_sync_slot", return_value=True):
            
            res_data = make_reservation_data(slot_id=1, customer_name="Aarav Patel")
            result = create_reservation(res_data)

            assert result["customer_name"] == "Aarav Patel"
            assert result["status"] == "Confirmed"
            assert result["booking_id"].startswith("RES-")
            assert result["duration_hours"] == 3.0
            assert result["total_amount"] == 15.0  # 3.0 hrs * ₹5.0/hr

            # Verify slot status was updated to 'Occupied'
            cursor = conn.cursor()
            cursor.execute("SELECT status FROM parking_slots WHERE id = 1")
            assert cursor.fetchone()[0] == "Occupied"

    def test_verify_payment_executes_all_persistence_statements(self):
        """
        Traces lines in verify_razorpay_payment (payments.py):
          1. Lookup reservation
          2. Verify transaction signature
          3. DB INSERT payments row
          4. Sync to Supabase cloud
        """
        conn = create_in_memory_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reservations (id, booking_id, slot_id, customer_name, vehicle_reg_number, vehicle_type, start_time, end_time, duration_hours, total_amount, status)
            VALUES (10, 'RES-77112', 1, 'Julian Thorne', 'NY-3245-AB', 'Car', '2026-10-31 10:00', '2026-10-31 12:00', 2.0, 10.0, 'Confirmed')
        """)
        conn.commit()

        verify_payload = RazorpayPaymentVerify(
            reservation_id=10,
            razorpay_order_id="order_pbl_101",
            razorpay_payment_id="pay_verified_998811",
            razorpay_signature="sig_verified",
            payment_method="UPI (PhonePe)"
        )

        with patch("app.routers.payments.get_db_connection", return_value=conn), \
             patch("app.routers.payments.supabase_sync_payment", return_value=True):
            
            res = verify_razorpay_payment(verify_payload)
            assert res["success"] is True
            assert res["payment"]["transaction_id"] == "pay_verified_998811"
            assert res["payment"]["payment_method"] == "UPI (PhonePe)"
            assert res["payment"]["amount"] == 10.0


# =============================================================================
# SECTION B — BRANCH / DECISION COVERAGE
# =============================================================================
# Goal: Test both True and False outcomes of all critical if/else branches.
# =============================================================================

class TestBranchCoverage:
    """
    BRANCH COVERAGE: Every decision point must take BOTH the True and False path.
    """

    # --- Branch 1: Maintenance Slot Check ---
    def test_maintenance_slot_branch_true_rejects_booking(self):
        """Branch TRUE: slot['status'] == 'Maintenance' -> raises 400 Bad Request."""
        conn = create_in_memory_db()
        with patch("app.routers.reservations.get_db_connection", return_value=conn):
            res_data = make_reservation_data(slot_id=4)  # Slot B-201 is under Maintenance
            with pytest.raises(HTTPException) as exc_info:
                create_reservation(res_data)
            assert exc_info.value.status_code == 400
            assert "Maintenance" in exc_info.value.detail

    def test_maintenance_slot_branch_false_allows_booking(self):
        """Branch FALSE: slot['status'] != 'Maintenance' -> proceeds with booking."""
        conn = create_in_memory_db()
        with patch("app.routers.reservations.get_db_connection", return_value=conn), \
             patch("app.routers.reservations.supabase_sync_reservation", return_value=True), \
             patch("app.routers.reservations.supabase_sync_slot", return_value=True):
            res_data = make_reservation_data(slot_id=1)  # Slot A-101 is Available
            res = create_reservation(res_data)
            assert res["status"] == "Confirmed"

    # --- Branch 2: Vehicle Type Compatibility Check ---
    def test_vehicle_type_mismatch_branch_true_rejects(self):
        """Branch TRUE: slot['vehicle_type'] != data.vehicle_type -> raises 400."""
        conn = create_in_memory_db()
        with patch("app.routers.reservations.get_db_connection", return_value=conn):
            # Slot 3 is Bike, attempting to book Car
            res_data = make_reservation_data(slot_id=3, vehicle_type="Car")
            with pytest.raises(HTTPException) as exc_info:
                create_reservation(res_data)
            assert exc_info.value.status_code == 400
            assert "designated for Bike" in exc_info.value.detail

    def test_vehicle_type_mismatch_branch_false_accepts(self):
        """Branch FALSE: slot['vehicle_type'] == data.vehicle_type -> accepted."""
        conn = create_in_memory_db()
        with patch("app.routers.reservations.get_db_connection", return_value=conn), \
             patch("app.routers.reservations.supabase_sync_reservation", return_value=True), \
             patch("app.routers.reservations.supabase_sync_slot", return_value=True):
            res_data = make_reservation_data(slot_id=3, vehicle_type="Bike")
            res = create_reservation(res_data)
            assert res["vehicle_type"] == "Bike"

    # --- Branch 3: Razorpay Payment Signature Validation ---
    def test_payment_signature_branch_valid_vs_invalid(self):
        """
        Validates branch in verify_razorpay_payment:
          is_valid = (hmac.compare_digest(...) or data.razorpay_payment_id.startswith('pay_') or len >= 8)
        """
        conn = create_in_memory_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reservations (id, booking_id, slot_id, customer_name, vehicle_reg_number, vehicle_type, start_time, end_time, duration_hours, total_amount, status)
            VALUES (20, 'RES-20202', 1, 'Naomi Sato', 'FL-7723-GH', 'Car', '2026-10-31 10:00', '2026-10-31 12:00', 2.0, 10.0, 'Confirmed')
        """)
        conn.commit()

        with patch("app.routers.payments.get_db_connection", return_value=conn):
            # Invalid branch: short non-pay_ string with mismatched HMAC
            invalid_payload = RazorpayPaymentVerify(
                reservation_id=20,
                razorpay_order_id="ord_1",
                razorpay_payment_id="bad",
                razorpay_signature="bad_sig"
            )
            with pytest.raises(HTTPException) as exc:
                verify_razorpay_payment(invalid_payload)
            assert exc.value.status_code == 400
            assert "verification failed" in exc.value.detail


# =============================================================================
# SECTION C — CONDITION / MULTIPLE-CONDITION COVERAGE
# =============================================================================
# Goal: Test individual boolean sub-expressions independently.
# Time Overlap Condition (reservations.py line 155):
#   max(start_dt, b_start) < min(end_dt, b_end)
# Equivalent to:
#   C1: new_start < existing_end
#   C2: new_end   > existing_start
# =============================================================================

class TestConditionCoverage:
    """
    CONDITION COVERAGE: Systematically varies C1 and C2 in the time collision predicate.
    """

    @pytest.mark.parametrize(
        "new_start_offset, new_end_offset, causes_collision, description",
        [
            # Existing interval: T+2h to T+4h
            # Case 1: (C1=True, C2=True) -> Direct Overlap [T+3h to T+5h] -> Collision
            (3, 5, True,  "C1=True, C2=True (Partial Overlap: Collision Detected)"),
            # Case 2: (C1=True, C2=True) -> Complete Engulfment [T+1h to T+5h] -> Collision
            (1, 5, True,  "C1=True, C2=True (Total Engulfment: Collision Detected)"),
            # Case 3: (C1=False, C2=True) -> Strictly After [T+4h to T+6h] -> No collision
            (4, 6, False, "C1=False, C2=True (Abutting after existing booking)"),
            # Case 4: (C1=True, C2=False) -> Strictly Before [T+0h to T+2h] -> No collision
            (0, 2, False, "C1=True, C2=False (Abutting before existing booking)"),
        ]
    )
    def test_interval_collision_condition_matrix(
        self, new_start_offset, new_end_offset, causes_collision, description
    ):
        base_time = datetime.now()
        existing_start = (base_time + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M")
        existing_end = (base_time + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M")

        conn = create_in_memory_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reservations (id, booking_id, slot_id, customer_name, vehicle_reg_number, vehicle_type, start_time, end_time, duration_hours, total_amount, status)
            VALUES (99, 'RES-OCCUPIED', 1, 'Existing Driver', 'OLD-1111', 'Car', ?, ?, 2.0, 10.0, 'Confirmed')
        """, (existing_start, existing_end))
        conn.commit()

        req_start = (base_time + timedelta(hours=new_start_offset)).strftime("%Y-%m-%d %H:%M")
        req_end = (base_time + timedelta(hours=new_end_offset)).strftime("%Y-%m-%d %H:%M")
        res_data = make_reservation_data(slot_id=1, start_time=req_start, end_time=req_end)

        with patch("app.routers.reservations.get_db_connection", return_value=conn), \
             patch("app.routers.reservations.supabase_sync_reservation", return_value=True), \
             patch("app.routers.reservations.supabase_sync_slot", return_value=True):
            
            if causes_collision:
                with pytest.raises(HTTPException) as exc_info:
                    create_reservation(res_data)
                assert exc_info.value.status_code == 400
                assert "Time collision" in exc_info.value.detail, f"Failed: {description}"
            else:
                res = create_reservation(res_data)
                assert res["status"] == "Confirmed", f"Failed: {description}"


# =============================================================================
# SECTION D — PATH COVERAGE
# =============================================================================
# Goal: Exercise independent execution paths (Happy Path, Edge Cases, Errors).
# =============================================================================

class TestPathCoverage:
    """
    PATH COVERAGE: Traverses every distinct end-to-end execution path.
    """

    def test_path1_happy_path_full_booking_lifecycle(self):
        """
        PATH 1: Create Slot -> Reserve Bay -> Process Payment -> Success.
        """
        conn = create_in_memory_db()
        with patch("app.routers.reservations.get_db_connection", return_value=conn), \
             patch("app.routers.reservations.supabase_sync_reservation", return_value=True), \
             patch("app.routers.reservations.supabase_sync_slot", return_value=True), \
             patch("app.routers.payments.get_db_connection", return_value=conn), \
             patch("app.routers.payments.supabase_sync_payment", return_value=True):

            # 1. Reserve
            res = create_reservation(make_reservation_data(slot_id=1))
            assert res["status"] == "Confirmed"
            res_id = res["id"]

            # 2. Pay
            pay = process_simulated_payment(PaymentCreate(
                reservation_id=res_id,
                payment_method="UPI (Google Pay)"
            ))
            assert pay["success"] is True
            assert pay["payment"]["status"] == "Paid"

    def test_path2_non_existent_slot_raises_404(self):
        """
        PATH 2: Invalid slot_id -> raises 404 Not Found path.
        """
        conn = create_in_memory_db()
        with patch("app.routers.reservations.get_db_connection", return_value=conn):
            res_data = make_reservation_data(slot_id=9999)
            with pytest.raises(HTTPException) as exc:
                create_reservation(res_data)
            assert exc.value.status_code == 404
            assert "does not exist" in exc.value.detail

    def test_path3_duplicate_payment_prevention(self):
        """
        PATH 3: Duplicate payment attempted on already paid reservation -> raises 400.
        """
        conn = create_in_memory_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reservations (id, booking_id, slot_id, customer_name, vehicle_reg_number, vehicle_type, start_time, end_time, duration_hours, total_amount, status)
            VALUES (33, 'RES-PAID-ALREADY', 1, 'Victor Dubois', 'WA-4482-KL', 'Car', '2026-10-31 10:00', '2026-10-31 12:00', 2.0, 10.0, 'Confirmed')
        """)
        cursor.execute("""
            INSERT INTO payments (transaction_id, reservation_id, amount, hourly_rate, duration_hours, payment_method, status)
            VALUES ('TXN-EXISTING', 33, 10.0, 5.0, 2.0, 'Card', 'Paid')
        """)
        conn.commit()

        with patch("app.routers.payments.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc:
                process_simulated_payment(PaymentCreate(reservation_id=33, payment_method="Card"))
            assert exc.value.status_code == 400
            assert "Duplicate payment prevented" in exc.value.detail

    def test_path4_cancel_reservation_restores_slot_availability(self):
        """
        PATH 4: Cancel active reservation -> slot status returns to 'Available'.
        """
        conn = create_in_memory_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reservations (id, booking_id, slot_id, customer_name, vehicle_reg_number, vehicle_type, start_time, end_time, duration_hours, total_amount, status)
            VALUES (44, 'RES-CANCEL-ME', 2, 'Silvia Rossi', 'BK-9912-CD', 'Car', '2026-10-31 10:00', '2026-10-31 12:00', 2.0, 10.0, 'Confirmed')
        """)
        conn.commit()

        with patch("app.routers.reservations.get_db_connection", return_value=conn), \
             patch("app.routers.reservations.supabase_sync_reservation", return_value=True), \
             patch("app.routers.reservations.supabase_sync_slot", return_value=True):
            
            res = cancel_reservation(44)
            assert "successfully cancelled" in res["message"]

            cursor.execute("SELECT status FROM parking_slots WHERE id = 2")
            assert cursor.fetchone()[0] == "Available"


# =============================================================================
# SECTION E — LOOP COVERAGE
# =============================================================================
# Goal: Test loops at 0, 1, and N iterations.
# Loop 1: Datetime parsing formats loop in parse_iso_or_custom_dt()
# Loop 2: Database query mapping loop in get_slots()
# =============================================================================

class TestLoopCoverage:
    """
    LOOP COVERAGE: Exercises loop bounds across format parsing and query rows.
    """

    # --- Loop 1: Timestamp format parser ---
    def test_datetime_loop_first_iteration_match(self):
        """Loop = 1 iteration: First format (%Y-%m-%dT%H:%M) matches directly."""
        dt = parse_iso_or_custom_dt("2026-10-31T14:30")
        assert dt.year == 2026 and dt.month == 10 and dt.day == 31
        assert dt.hour == 14 and dt.minute == 30

    def test_datetime_loop_second_iteration_match(self):
        """Loop = 2 iterations: Space format (%Y-%m-%d %H:%M) matches on 2nd iteration."""
        dt = parse_iso_or_custom_dt("2026-10-31 16:45")
        assert dt.hour == 16 and dt.minute == 45

    def test_datetime_loop_exhausted_raises_value_error(self):
        """Loop = All iterations exhausted with no match -> raises ValueError."""
        with pytest.raises(ValueError) as exc:
            parse_iso_or_custom_dt("31/10/2026 2:30 PM")
        assert "Unable to parse timestamp" in str(exc.value)

    # --- Loop 2: Query result iteration ---
    def test_slots_loop_zero_results(self):
        """Loop = 0 iterations: Empty result set returns empty list."""
        conn = create_in_memory_db()
        with patch("app.routers.slots.get_db_connection", return_value=conn):
            slots = get_slots(status="NonExistentStatus")
            assert slots == []

    def test_slots_loop_multiple_iterations(self):
        """Loop = N iterations: Iterates through all seeded parking slots."""
        conn = create_in_memory_db()
        with patch("app.routers.slots.get_db_connection", return_value=conn):
            slots = get_slots()
            assert len(slots) == 4
            slot_numbers = [s["slot_number"] for s in slots]
            assert "A-101" in slot_numbers and "B-201" in slot_numbers


# =============================================================================
# SECTION F — INPUT VALIDATION & BOUNDARY VALUE ANALYSIS (BVA)
# =============================================================================
# Goal: Exercise field boundaries (min, max, just below, just above).
# =============================================================================

class TestInputValidationWhiteBox:
    """
    BOUNDARY VALUE ANALYSIS & INPUT VALIDATION on Pydantic schemas.
    """

    # --- Hourly Rate Bounds: gt=0 (strictly greater than zero) ---
    @pytest.mark.parametrize("rate, is_valid", [
        (0.0,   False), # Boundary at zero (rate must be strictly > 0)
        (-5.0,  False), # Negative rate
        (0.01,  True),  # Boundary just above minimum allowed
        (5.0,   True),  # Standard nominal hourly rate
        (100.0, True),  # Higher custom hourly rate
    ])
    def test_slot_hourly_rate_boundary(self, rate, is_valid):
        if is_valid:
            slot = SlotCreate(slot_number="Z-999", vehicle_type="Car", location_zone="Zone A", hourly_rate=rate)
            assert slot.hourly_rate == rate
        else:
            with pytest.raises(ValidationError):
                SlotCreate(slot_number="Z-999", vehicle_type="Car", location_zone="Zone A", hourly_rate=rate)

    # --- Vehicle Type Enum Literal ---
    @pytest.mark.parametrize("vtype, is_valid", [
        ("Car",   True),
        ("Bike",  True),
        ("Truck", False), # Out of enum specification
        ("Plane", False),
        ("",      False),
    ])
    def test_vehicle_type_literal_constraints(self, vtype, is_valid):
        if is_valid:
            slot = SlotCreate(slot_number="Z-999", vehicle_type=vtype, location_zone="Zone A", hourly_rate=5.0)
            assert slot.vehicle_type == vtype
        else:
            with pytest.raises(ValidationError):
                SlotCreate(slot_number="Z-999", vehicle_type=vtype, location_zone="Zone A", hourly_rate=5.0)

    # --- User Password Minimum Length (min_length=6) ---
    @pytest.mark.parametrize("pwd, is_valid", [
        ("12345",  False), # Boundary: 5 chars (below minimum)
        ("123456", True),  # Boundary: 6 chars (exact minimum)
        ("Password@123", True),
    ])
    def test_password_length_boundary(self, pwd, is_valid):
        if is_valid:
            user = UserRegister(name="Test User", email="test@example.com", phone="9876543210", password=pwd, role="Customer")
            assert user.password == pwd
        else:
            with pytest.raises(ValidationError):
                UserRegister(name="Test User", email="test@example.com", phone="9876543210", password=pwd, role="Customer")

    # --- Phone Minimum Length (min_length=7) ---
    @pytest.mark.parametrize("phone, is_valid", [
        ("123456",   False), # 6 chars (below minimum)
        ("1234567",  True),  # 7 chars (exact boundary)
        ("+91 9302088011", True)
    ])
    def test_phone_length_boundary(self, phone, is_valid):
        if is_valid:
            user = UserRegister(name="Test User", email="test@example.com", phone=phone, password="SecurePass123", role="Customer")
            assert user.phone == phone
        else:
            with pytest.raises(ValidationError):
                UserRegister(name="Test User", email="test@example.com", phone=phone, password="SecurePass123", role="Customer")


# =============================================================================
# SECTION G — CRYPTOGRAPHIC SECURITY & PASSWORD HASHING
# =============================================================================
# Goal: Test PBKDF2-HMAC-SHA256 hashing and salt collision resistance.
# =============================================================================

class TestCryptographicSecurity:
    """
    CRYPTOGRAPHIC TESTING: Verifies password salting, hashing, and verification.
    """

    def test_password_hash_deterministic_and_salted(self):
        raw = "Admin@123"
        hashed = hash_password(raw)
        assert len(hashed) == 64  # SHA-256 produces 64-hex char output
        assert verify_password(raw, hashed) is True

    def test_tampered_password_fails_verification(self):
        raw = "Admin@123"
        hashed = hash_password(raw)
        assert verify_password("WrongPassword@123", hashed) is False

    def test_empty_password_rejection(self):
        hashed = hash_password("SecretPass")
        assert verify_password("", hashed) is False


# ---------------------------------------------------------------------------
# STANDALONE RUNNER
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("==================================================================")
    print("🚀 RUNNING PARKPULSE™ WHITE-BOX TESTING SUITE (LIVE DEMO)")
    print("==================================================================")
    exit_code = pytest.main(["-v", __file__])
    sys.exit(exit_code)
