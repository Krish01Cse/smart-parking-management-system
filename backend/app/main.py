from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from .database import init_db
from .routers import slots, reservations, auth, payments, dashboard, jira, testing, bugs, docs, ml_analytics

app = FastAPI(
    title="ParkPulse™ API — Intelligent Cloud Parking Operating System",
    description="Enterprise Backend REST API with Supabase Sync, Razorpay Gateway & ML Analytics",
    version="2.0.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to ensure database is created & seeded
@app.on_event("startup")
def on_startup():
    init_db()

# Include routers
app.include_router(slots.router)
app.include_router(reservations.router)
app.include_router(auth.router)
app.include_router(payments.router)
app.include_router(dashboard.router)
app.include_router(ml_analytics.router)
app.include_router(jira.router)
app.include_router(testing.router)
app.include_router(bugs.router)
app.include_router(docs.router)

@app.get("/")
def root():
    return {
        "project": "ParkPulse™ Intelligent Cloud Parking Operating System",
        "evaluation": "Project-Based Learning (PBL) Individual Evaluation",
        "jira_project": "SE-lab-LA (SCRUM)",
        "status": "Online and Operational",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "database": "sqlite3:smart_parking.db"
    }
