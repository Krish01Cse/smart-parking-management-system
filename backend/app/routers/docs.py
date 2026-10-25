from fastapi import APIRouter

router = APIRouter(prefix="/api/docs", tags=["Project Documentation"])

@router.get("")
def get_project_documentation():
    return {
        "title": "ParkPulse™ — Intelligent Cloud Parking Operating System",
        "academic_context": "Project-Based Learning (PBL) Individual Evaluation — Software Engineering Lab",
        "jira_project": "SE-lab-LA (SCRUM)",
        "problem_statement": "Urban parking management frequently suffers from inefficient manual ticket operations, uncoordinated slot allocation resulting in double-bookings, traffic congestion near entry points, lack of real-time occupancy visibility, and vulnerable payment tracking. A centralized digital smart parking management platform is essential to streamline space utilization, automate reservations, enforce role-based access, and provide transparent simulated revenue reconciliation.",
        "objectives": [
            "Provide real-time tracking and categorization of parking slots across designated parking zones.",
            "Automate reservation scheduling with strict collision-prevention logic preventing double-booking.",
            "Enforce role-based access for Administrators and Customers with secure cryptographic password storage (PBKDF2-HMAC).",
            "Calculate dynamic parking charges based on vehicle classification and duration, supporting safe simulated transactions.",
            "Demonstrate complete alignment with the planned JIRA project 'SE-lab-LA (SCRUM)', test-case matrix, and defect life cycle."
        ],
        "scope": "The system encompasses four functional core modules (Parking Slot Management, Reservation Management, User Management, and Payment Management) supported by integrated local project management (JIRA overview), defect tracking, test execution register, and academic analytics.",
        "tech_stack": {
            "frontend": "React 19 + TypeScript + Vite + Tailwind CSS",
            "icons": "Lucide React",
            "charts": "Recharts (BarChart, PieChart, AreaChart)",
            "backend": "Python 3.9+ with FastAPI & Uvicorn ASGI Server",
            "database": "SQLite (Relational schema with Foreign Keys and ON CASCADE/RESTRICT rules)",
            "security": "PBKDF2-HMAC SHA256 password hashing with application-level salt"
        },
        "architecture": {
            "pattern": "Three-Tier Client-Server Architecture",
            "frontend_tier": "React SPA delivering responsive dashboards, slot cards, reservation modal wizard, and evaluation consoles.",
            "api_tier": "FastAPI ASGI layer hosting parameterized RESTful endpoints with Pydantic payload validation and error middleware.",
            "data_tier": "SQLite database persisting user accounts, slot states, reservation schedules, transaction audit logs, and test registers."
        },
        "database_tables": [
            {"name": "users", "description": "Stores registered accounts with name, email, phone, role, and hashed credentials."},
            {"name": "parking_slots", "description": "Maintains physical slot numbers, vehicle classifications, zone labels, hourly rates, and statuses."},
            {"name": "reservations", "description": "Tracks vehicle reservations, customer identities, assigned slots, start/end windows, and fee totals."},
            {"name": "payments", "description": "Audit register of simulated checkout transactions, reference reservation IDs, amounts, and statuses."},
            {"name": "test_cases", "description": "Persistent PBL test-case execution matrix with equivalence partitioning and boundary value scenarios."},
            {"name": "defects", "description": "Structured bug tracking register with severity, priority, reproduction steps, and resolution states."},
            {"name": "jira_epics / jira_items / jira_sprints", "description": "Local representation of the 'SE-lab-LA (SCRUM)' JIRA project hierarchy."}
        ],
        "api_endpoints": [
            {"method": "GET / POST", "path": "/api/slots", "desc": "List filtered slots or register new slot"},
            {"method": "PATCH", "path": "/api/slots/{id}/status", "desc": "Update slot status with reservation conflict safeguards"},
            {"method": "GET / POST", "path": "/api/reservations", "desc": "Fetch reservations or create new booking with collision prevention"},
            {"method": "POST", "path": "/api/reservations/{id}/cancel", "desc": "Cancel booking and recalculate slot availability"},
            {"method": "POST", "path": "/api/users/register", "desc": "Register user with email uniqueness and PBKDF2 hashing"},
            {"method": "POST", "path": "/api/users/login", "desc": "Authenticate user credentials"},
            {"method": "POST", "path": "/api/payments/process-simulated", "desc": "Simulate card/UPI checkout with duplicate transaction lock"},
            {"method": "GET", "path": "/api/dashboard/metrics", "desc": "Aggregated real-time metrics, counts, and occupancy breakdown"},
            {"method": "GET / POST", "path": "/api/testing/cases", "desc": "Retrieve and manage PBL test cases"},
            {"method": "POST", "path": "/api/testing/run-suite", "desc": "Execute automated backend test suite"}
        ]
    }
