import sqlite3
import os
import hashlib
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "smart_parking.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def hash_password(password: str) -> str:
    # PBKDF2 HMAC SHA256 with consistent salt for local PBL evaluation
    salt = b"smart_parking_pbl_salt_2026"
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return pwd_hash.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parking_slots (
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

    CREATE TABLE IF NOT EXISTS reservations (
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

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT UNIQUE NOT NULL,
        reservation_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        hourly_rate REAL NOT NULL,
        duration_hours REAL NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'Simulated Card',
        status TEXT NOT NULL DEFAULT 'Paid',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_case_id TEXT UNIQUE NOT NULL,
        module TEXT NOT NULL,
        test_scenario TEXT NOT NULL,
        test_data TEXT NOT NULL,
        expected_result TEXT NOT NULL,
        actual_result TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        test_type TEXT DEFAULT 'Functional',
        executed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS defects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bug_id TEXT UNIQUE NOT NULL,
        bug_description TEXT NOT NULL,
        steps_to_reproduce TEXT NOT NULL,
        severity TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        resolution TEXT,
        related_module TEXT NOT NULL,
        retest_result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jira_epics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        epic_key TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'In Progress'
    );

    CREATE TABLE IF NOT EXISTS jira_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_key TEXT UNIQUE NOT NULL,
        epic_key TEXT NOT NULL,
        parent_key TEXT,
        item_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        sprint_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Planned'
    );

    CREATE TABLE IF NOT EXISTS jira_sprints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sprint_name TEXT UNIQUE NOT NULL,
        goal TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        status TEXT NOT NULL DEFAULT 'Active'
    );
    """)

    conn.commit()

    # Seed initial data if tables are empty
    seed_data_if_empty(conn)
    conn.close()

def seed_data_if_empty(conn):
    cursor = conn.cursor()

    # Seed users
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        admin_pwd = hash_password("Admin@123")
        customer_pwd = hash_password("User@123")
        users = [
            ("Alex Morgan (Admin)", "admin@smartparking.edu", "+1 (555) 234-5678", admin_pwd, "Administrator"),
            ("Elena Moretti", "elena.m@example.com", "+1 (555) 987-6543", customer_pwd, "Customer"),
            ("Julian Thorne", "julian.t@example.com", "+1 (555) 456-7890", customer_pwd, "Customer"),
            ("Naomi Sato", "naomi.s@example.com", "+1 (555) 321-6548", customer_pwd, "Customer"),
            ("Victor Dubois", "victor.d@example.com", "+1 (555) 789-0123", customer_pwd, "Customer"),
            ("Silvia Rossi", "silvia.r@example.com", "+1 (555) 654-9870", customer_pwd, "Customer")
        ]
        cursor.executemany("""
            INSERT INTO users (name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        """, users)

    # Seed parking slots
    cursor.execute("SELECT COUNT(*) FROM parking_slots")
    if cursor.fetchone()[0] == 0:
        slots = [
            # Zone A - North Entry (Cars & Bikes)
            ("A-101", "Car", "Zone A (North Wing)", 5.0, "Occupied", "CA-9842-TX"),
            ("A-102", "Car", "Zone A (North Wing)", 5.0, "Available", None),
            ("A-103", "Car", "Zone A (North Wing)", 5.0, "Available", None),
            ("A-104", "Car", "Zone A (North Wing)", 5.0, "Occupied", "NY-3245-AB"),
            ("A-105", "Bike", "Zone A (North Wing)", 2.5, "Available", None),
            ("A-106", "Bike", "Zone A (North Wing)", 2.5, "Occupied", "BK-9912-CD"),

            # Zone B - South Plaza (Cars & Bikes)
            ("B-201", "Car", "Zone B (South Plaza)", 5.0, "Available", None),
            ("B-202", "Car", "Zone B (South Plaza)", 5.0, "Occupied", "FL-7723-GH"),
            ("B-203", "Car", "Zone B (South Plaza)", 5.0, "Maintenance", None),
            ("B-204", "Car", "Zone B (South Plaza)", 5.0, "Available", None),
            ("B-205", "Bike", "Zone B (South Plaza)", 2.5, "Available", None),
            ("B-206", "Bike", "Zone B (South Plaza)", 2.5, "Available", None),

            # Zone C - Basement Level (EV & Premium)
            ("C-301", "Car", "Zone C (Basement EV)", 6.5, "Available", None),
            ("C-302", "Car", "Zone C (Basement EV)", 6.5, "Occupied", "WA-4482-KL"),
            ("C-303", "Car", "Zone C (Basement EV)", 6.5, "Available", None),
            ("C-304", "Bike", "Zone C (Basement EV)", 3.0, "Available", None),

            # Zone D - East Tower
            ("D-401", "Car", "Zone D (East Tower)", 4.5, "Available", None),
            ("D-402", "Car", "Zone D (East Tower)", 4.5, "Available", None),
            ("D-403", "Car", "Zone D (East Tower)", 4.5, "Maintenance", None),
            ("D-404", "Bike", "Zone D (East Tower)", 2.0, "Available", None),
        ]
        cursor.executemany("""
            INSERT INTO parking_slots (slot_number, vehicle_type, location_zone, hourly_rate, status, current_vehicle)
            VALUES (?, ?, ?, ?, ?, ?)
        """, slots)

    # Seed sample reservations
    cursor.execute("SELECT COUNT(*) FROM reservations")
    if cursor.fetchone()[0] == 0:
        now = datetime.now()
        r1_start = (now - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M")
        r1_end = (now + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M")
        r2_start = (now - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M")
        r2_end = (now + timedelta(hours=3)).strftime("%Y-%m-%d %H:%M")
        r3_start = (now + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M")
        r3_end = (now + timedelta(hours=5)).strftime("%Y-%m-%d %H:%M")
        r4_start = (now - timedelta(days=1, hours=3)).strftime("%Y-%m-%d %H:%M")
        r4_end = (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M")

        reservations = [
            ("RES-10492", 1, 2, "Elena Moretti", "elena.m@example.com", "+1 (555) 987-6543", "CA-9842-TX", "Car", r1_start, r1_end, 4.0, 20.0, "Confirmed"),
            ("RES-20984", 4, 3, "Julian Thorne", "julian.t@example.com", "+1 (555) 456-7890", "NY-3245-AB", "Car", r2_start, r2_end, 4.0, 20.0, "Confirmed"),
            ("RES-33412", 8, 4, "Naomi Sato", "naomi.s@example.com", "+1 (555) 321-6548", "FL-7723-GH", "Car", r3_start, r3_end, 4.0, 20.0, "Confirmed"),
            ("RES-40129", 14, 5, "Victor Dubois", "victor.d@example.com", "+1 (555) 789-0123", "WA-4482-KL", "Car", r1_start, r1_end, 4.0, 26.0, "Confirmed"),
            ("RES-50871", 6, 6, "Silvia Rossi", "silvia.r@example.com", "+1 (555) 654-9870", "BK-9912-CD", "Bike", r2_start, r2_end, 4.0, 10.0, "Confirmed"),
            ("RES-09123", 2, 2, "Elena Moretti", "elena.m@example.com", "+1 (555) 987-6543", "CA-9842-TX", "Car", r4_start, r4_end, 3.0, 15.0, "Completed"),
            ("RES-08119", 7, 3, "Julian Thorne", "julian.t@example.com", "+1 (555) 456-7890", "NY-1102-ZZ", "Car", r4_start, r4_end, 2.0, 10.0, "Cancelled")
        ]
        cursor.executemany("""
            INSERT INTO reservations (booking_id, slot_id, user_id, customer_name, customer_email, customer_phone, vehicle_reg_number, vehicle_type, start_time, end_time, duration_hours, total_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, reservations)

    # Seed sample payments
    cursor.execute("SELECT COUNT(*) FROM payments")
    if cursor.fetchone()[0] == 0:
        payments = [
            ("TXN-88301", 1, 20.0, 5.0, 4.0, "Simulated Credit Card", "Paid", "Academic simulation: Visa ending in 4242"),
            ("TXN-88302", 2, 20.0, 5.0, 4.0, "Simulated UPI", "Paid", "Academic simulation: UPI ref @axis092"),
            ("TXN-88303", 3, 20.0, 5.0, 4.0, "Simulated NetBanking", "Pending", "Awaiting confirmation simulator"),
            ("TXN-88304", 4, 26.0, 6.5, 4.0, "Simulated Credit Card", "Paid", "Academic simulation: Mastercard ending in 8819"),
            ("TXN-88305", 5, 10.0, 2.5, 4.0, "Simulated UPI", "Paid", "Academic simulation: PhonePe simulated receipt"),
            ("TXN-79110", 6, 15.0, 5.0, 3.0, "Simulated Credit Card", "Paid", "Past completed booking transaction"),
        ]
        cursor.executemany("""
            INSERT INTO payments (transaction_id, reservation_id, amount, hourly_rate, duration_hours, payment_method, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, payments)

    # Seed JIRA Epics, Items, Sprints for "SE-lab-LA (SCRUM)"
    cursor.execute("SELECT COUNT(*) FROM jira_epics")
    if cursor.fetchone()[0] == 0:
        epics = [
            ("EPIC-1", "Parking Slot Management", "Capabilities to configure, monitor, categorize, and change status of parking slots in real time.", "Completed"),
            ("EPIC-2", "Parking Reservation Management", "Core booking lifecycle, slot allocation, overlap prevention, and cancellation workflows.", "Completed"),
            ("EPIC-3", "User Management", "Authentication, customer and administrator profile control, role-based access, and registration.", "Completed"),
            ("EPIC-4", "Parking Payment Management", "Automated fee calculator by vehicle rate and duration, simulated transaction settlement, and audit logs.", "Completed")
        ]
        cursor.executemany("INSERT INTO jira_epics (epic_key, title, description, status) VALUES (?, ?, ?, ?)", epics)

        sprints = [
            ("Sprint 1: Parking Slot Management", "Implement parking slot CRUD, zone classification, slot number uniqueness, and dynamic status tracking.", "2026-09-01", "2026-09-14", "Completed"),
            ("Sprint 2: Parking Reservation Management", "Implement reservation creation, date-time validation, collision prevention, and cancellation mechanics.", "2026-09-15", "2026-09-28", "Completed"),
            ("Sprint 3: User Management", "Build secure user registration, password hashing (PBKDF2-HMAC), session/profile management, and validation.", "2026-09-29", "2026-10-12", "Completed"),
            ("Sprint 4: Parking Payment Management & Polish", "Develop duration fee calculation engine, simulated payment gateway dialog, transaction audit trail, and dashboard metrics.", "2026-10-13", "2026-10-26", "Active")
        ]
        cursor.executemany("INSERT INTO jira_sprints (sprint_name, goal, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)", sprints)

        items = [
            # Epic 1 Items
            ("SE-101", "EPIC-1", None, "Story", "View Available Parking Slots", "As an administrator, I want to see all parking slots filtered by availability, zone, and vehicle type.", "Sprint 1: Parking Slot Management", "Verified"),
            ("SE-102", "EPIC-1", "SE-101", "Task", "Design Parking Slot Interface", "Create modern card grid and table views with visual badges inspired by clean dispatch dashboards.", "Sprint 1: Parking Slot Management", "Verified"),
            ("SE-103", "EPIC-1", "SE-101", "Task", "Implement Parking Slot Availability", "Filter slots by status (Available, Occupied, Maintenance) and vehicle type (Car, Bike).", "Sprint 1: Parking Slot Management", "Verified"),
            ("SE-104", "EPIC-1", "SE-101", "Subtask", "Test Parking Slot Availability", "Write test cases for filtering by status and verifying live counts update correctly.", "Sprint 1: Parking Slot Management", "Verified"),
            ("SE-105", "EPIC-1", None, "Story", "Add and Manage Parking Slots", "As an administrator, I want to create and edit parking slots with custom hourly rates and zones.", "Sprint 1: Parking Slot Management", "Verified"),
            ("SE-106", "EPIC-1", "SE-105", "Task", "Design Add Parking Slot Form", "Build modal dialog with inputs for Slot Number, Vehicle Type, Location Zone, and Rate.", "Sprint 1: Parking Slot Management", "Verified"),
            ("SE-107", "EPIC-1", "SE-105", "Task", "Implement Add Parking Slot Functionality", "Add backend POST endpoint with uniqueness check for slot number and validation.", "Sprint 1: Parking Slot Management", "Verified"),
            ("SE-108", "EPIC-1", "SE-105", "Subtask", "Test Add Parking Slot Functionality", "Verify duplicate slot number rejection and required field error displays.", "Sprint 1: Parking Slot Management", "Verified"),
            ("SE-109", "EPIC-1", None, "Story", "Update Parking Slot Status", "Enable administrators to transition slot status while safeguarding against active booking conflicts.", "Sprint 1: Parking Slot Management", "Verified"),

            # Epic 2 Items
            ("SE-201", "EPIC-2", None, "Story", "Book a Parking Slot", "As a customer or admin, I want to reserve an available parking slot for a specified time window.", "Sprint 2: Parking Reservation Management", "Verified"),
            ("SE-202", "EPIC-2", "SE-201", "Task", "Design Parking Reservation Interface", "Interactive booking form with slot selector, date/time pickers, customer details, and vehicle reg.", "Sprint 2: Parking Reservation Management", "Verified"),
            ("SE-203", "EPIC-2", "SE-201", "Task", "Implement Parking Reservation", "Backend transactional logic to save booking and mark slot occupied/reserved.", "Sprint 2: Parking Reservation Management", "Verified"),
            ("SE-204", "EPIC-2", "SE-201", "Task", "Validate Parking Reservation", "Ensure slot is available, time range is positive, and prevent double booking.", "Sprint 2: Parking Reservation Management", "Verified"),
            ("SE-205", "EPIC-2", "SE-201", "Subtask", "Test Parking Reservation", "Run equivalence partitioning on valid and invalid reservation timestamps and unavailable slots.", "Sprint 2: Parking Reservation Management", "Verified"),
            ("SE-206", "EPIC-2", None, "Story", "View Booking Details", "View comprehensive reservation details including generated Booking ID, slot info, and fee.", "Sprint 2: Parking Reservation Management", "Verified"),
            ("SE-207", "EPIC-2", None, "Story", "Cancel a Reservation", "Allow safe cancellation with confirmation dialog and automatic slot availability recalculation.", "Sprint 2: Parking Reservation Management", "Verified"),
            ("SE-208", "EPIC-2", "SE-207", "Task", "Handle Reservation Cancellation", "Update reservation status to Cancelled and mark slot Available.", "Sprint 2: Parking Reservation Management", "Verified"),

            # Epic 3 Items
            ("SE-301", "EPIC-3", None, "Story", "Register a New User", "Allow new customers or administrators to sign up with validated email, phone, and role.", "Sprint 3: User Management", "Verified"),
            ("SE-302", "EPIC-3", "SE-301", "Task", "Design User Registration and Login Interface", "Clean authentication modal and customer profile panel.", "Sprint 3: User Management", "Verified"),
            ("SE-303", "EPIC-3", "SE-301", "Task", "Implement User Registration", "Secure backend endpoint checking email uniqueness and applying PBKDF2 password hashing.", "Sprint 3: User Management", "Verified"),
            ("SE-304", "EPIC-3", "SE-301", "Task", "Validate User Registration and Login", "Email format validation, phone digits validation, password minimum length.", "Sprint 3: User Management", "Verified"),
            ("SE-305", "EPIC-3", "SE-301", "Subtask", "Test User Registration and Login", "Verify rejection of duplicate emails, invalid passwords, and role assignment.", "Sprint 3: User Management", "Verified"),
            ("SE-306", "EPIC-3", None, "Story", "Log In to the System", "Provide credential verification, session management, and logout mechanism.", "Sprint 3: User Management", "Verified"),
            ("SE-307", "EPIC-3", "SE-306", "Task", "Implement User Login", "Authenticate password hash against stored hash and generate active session token.", "Sprint 3: User Management", "Verified"),
            ("SE-308", "EPIC-3", None, "Story", "Manage User Profile", "Administrators can view, search, and update user records and roles.", "Sprint 3: User Management", "Verified"),

            # Epic 4 Items
            ("SE-401", "EPIC-4", None, "Story", "Calculate Parking Fees", "Dynamically compute fee based on slot hourly rate and parking duration in hours.", "Sprint 4: Parking Payment Management & Polish", "Verified"),
            ("SE-402", "EPIC-4", "SE-401", "Task", "Design Parking Payment Interface", "Simulated payment modal displaying transparent itemized breakdown (Rate x Hours = Total).", "Sprint 4: Parking Payment Management & Polish", "Verified"),
            ("SE-403", "EPIC-4", "SE-401", "Task", "Implement Parking Fee Calculation", "Backend business rule calculating minimum 1 hour, prorated duration, and vehicle rate.", "Sprint 4: Parking Payment Management & Polish", "Verified"),
            ("SE-404", "EPIC-4", "SE-401", "Subtask", "Validate Parking Fee Calculation", "Boundary value analysis testing on 0 duration, fraction hours, and high durations.", "Sprint 4: Parking Payment Management & Polish", "Verified"),
            ("SE-405", "EPIC-4", None, "Story", "Make a Parking Payment", "Simulate mock payment processing with transaction ID generation and academic disclaimer.", "Sprint 4: Parking Payment Management & Polish", "Verified"),
            ("SE-406", "EPIC-4", "SE-405", "Task", "Implement Payment Status Tracking", "Persist transactions with status Paid/Pending/Failed and link to reservation ID.", "Sprint 4: Parking Payment Management & Polish", "Verified"),
            ("SE-407", "EPIC-4", "SE-405", "Subtask", "Test Parking Payment Functionality", "Prevent duplicate payments on already paid reservations and record audit trail.", "Sprint 4: Parking Payment Management & Polish", "Verified"),
            ("SE-408", "EPIC-4", None, "Story", "View Payment Status", "Comprehensive payment ledger with filters for method, status, date, and reservation key.", "Sprint 4: Parking Payment Management & Polish", "Verified"),
        ]
        cursor.executemany("""
            INSERT INTO jira_items (item_key, epic_key, parent_key, item_type, title, description, sprint_name, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, items)

    # Seed PBL Test Cases
    cursor.execute("SELECT COUNT(*) FROM test_cases")
    if cursor.fetchone()[0] == 0:
        tests = [
            ("TC-PS-001", "Parking Slot Management", "Add new slot with valid unique slot number and zone", "Slot: A-107, Type: Car, Zone: Zone A, Rate: $5.0", "Slot created with status 'Available' and 201 Created", "Slot A-107 created successfully in database", "Pass", "Functional", "2026-10-25 10:15:00"),
            ("TC-PS-002", "Parking Slot Management", "Reject duplicate parking slot number creation", "Slot: A-101 (Already exists)", "HTTP 400 Bad Request with error 'Slot number already exists'", "HTTP 400 with duplicate slot validation error returned", "Pass", "Validation", "2026-10-25 10:17:12"),
            ("TC-PS-003", "Parking Slot Management", "Reject slot creation with empty slot number or negative rate", "Slot: '', Rate: -5.0", "Frontend & Backend validation error preventing creation", "Validation triggers 'Slot number required and rate must be > 0'", "Pass", "Boundary Value", "2026-10-25 10:18:40"),
            ("TC-PS-004", "Parking Slot Management", "Prevent setting slot to Available when confirmed reservation exists", "Slot: A-101 (Active booking RES-10492)", "System rejects status override or warns active reservation conflict", "Confirmed booking conflict checked; status protected", "Pass", "Integration", "2026-10-25 10:20:05"),
            ("TC-PR-001", "Parking Reservation Management", "Create reservation for available slot with valid vehicle info", "Slot: A-102, Name: Mark Davis, Reg: CA-5541-XY, Duration: 3h", "Booking confirmed, booking ID generated, slot marked Occupied", "Booking RES-61029 generated; slot status updated to Occupied", "Pass", "Functional", "2026-10-25 10:22:15"),
            ("TC-PR-002", "Parking Reservation Management", "Attempt to reserve an already occupied or maintenance slot", "Slot: B-203 (Maintenance)", "System rejects booking with 'Slot B-203 is currently unavailable'", "HTTP 400 returned: 'Slot is currently Maintenance'", "Pass", "Equivalence Partitioning", "2026-10-25 10:24:30"),
            ("TC-PR-003", "Parking Reservation Management", "Prevent two active reservations occupying same slot at same time", "Slot: A-101, overlapping time window", "HTTP 400 conflict: 'Active reservation already occupies this slot'", "Collision prevented; overlap query verified", "Pass", "Boundary Value", "2026-10-25 10:26:00"),
            ("TC-PR-004", "Parking Reservation Management", "Cancel confirmed reservation and recalculate slot availability", "Cancel booking RES-10492", "Booking status set to Cancelled, slot freed to Available", "Reservation cancelled; slot A-101 returned to Available", "Pass", "Functional", "2026-10-25 10:28:10"),
            ("TC-UM-001", "User Management", "Register new customer with valid email, phone, and password", "Email: john.doe@example.com, Phone: +1 555-1122, Pwd: valid", "User registered, password hashed securely (PBKDF2), role Customer", "User created with hashed password; plaintext never stored", "Pass", "Functional", "2026-10-25 10:30:45"),
            ("TC-UM-002", "User Management", "Reject duplicate email registration", "Email: admin@smartparking.edu (Existing)", "HTTP 400 Bad Request: 'Email already registered'", "Duplicate email rejected with clear error message", "Pass", "Validation", "2026-10-25 10:32:00"),
            ("TC-UM-003", "User Management", "Login with valid credentials", "admin@smartparking.edu / Admin@123", "Authentication successful, user session and profile returned", "Session authenticated with Administrator privileges", "Pass", "Functional", "2026-10-25 10:33:20"),
            ("TC-UM-004", "User Management", "Login with invalid password", "admin@smartparking.edu / WrongPass999", "HTTP 401 Unauthorized: 'Invalid email or password'", "HTTP 401 returned, authentication securely denied", "Pass", "Security / Validation", "2026-10-25 10:34:10"),
            ("TC-PM-001", "Parking Payment Management", "Calculate parking fee based on hourly rate and duration", "Rate: $5.00/hr, Duration: 4.0 hours", "Total amount calculated as $20.00 with itemized breakdown", "Fee engine computes $20.00 exact breakdown", "Pass", "Functional", "2026-10-25 10:36:00"),
            ("TC-PM-002", "Parking Payment Management", "Simulate successful payment transaction", "Res: RES-33412, Amount: $20.00, Method: Simulated Card", "Payment record created with status 'Paid' and unique TXN ID", "TXN generated, status set to Paid, receipt rendered", "Pass", "Functional", "2026-10-25 10:37:45"),
            ("TC-PM-003", "Parking Payment Management", "Simulate failed payment attempt scenario", "Res: RES-33412, Force error toggle: True", "Payment recorded as 'Failed' with error reason and retry prompt", "Failed status saved, prompt to retry simulation displayed", "Pass", "Equivalence Partitioning", "2026-10-25 10:39:10"),
            ("TC-PM-004", "Parking Payment Management", "Prevent duplicate payment processing for completed reservation", "Attempt payment on already Paid RES-10492", "System rejects with 'Reservation is already fully paid'", "Duplicate payment prevention confirmed in backend", "Pass", "Integration", "2026-10-25 10:40:30"),
        ]
        cursor.executemany("""
            INSERT INTO test_cases (test_case_id, module, test_scenario, test_data, expected_result, actual_result, status, test_type, executed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tests)

    # Seed Sample Defect in Bug Tracking
    cursor.execute("SELECT COUNT(*) FROM defects")
    if cursor.fetchone()[0] == 0:
        sample_defects = [
            ("BUG-101", "[Sample Defect] Timezone offset discrepancy on reservation end-time selector",
             "1. Open reservation form. 2. Select 23:00 start time and 3 hours duration. 3. Observe end-time rollover across midnight.",
             "Minor", "Medium", "Fixed", "Applied ISO 8601 localized datetime parsing in frontend and backend helper.",
             "Parking Reservation Management", "Retested: Passed with cross-midnight date boundary calculation verified.")
        ]
        cursor.executemany("""
            INSERT INTO defects (bug_id, bug_description, steps_to_reproduce, severity, priority, status, resolution, related_module, retest_result)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_defects)

    conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialized and seeded successfully.")
