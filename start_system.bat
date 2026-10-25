@echo off
title Smart Parking Management System - PBL Evaluator Runner
echo =====================================================================
echo SMART PARKING MANAGEMENT SYSTEM - PBL INDIVIDUAL EVALUATION RUNNER
echo Project: SE-lab-LA (SCRUM)
echo =====================================================================
echo.

echo [1/3] Checking Python and Node environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.9+.
    pause
    exit /b
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js 18+.
    pause
    exit /b
)

echo [2/3] Starting FastAPI Backend on port 8001...
cd backend
if not exist venv (
    echo Setting up Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install fastapi uvicorn pydantic python-multipart
) else (
    call venv\Scripts\activate.bat
)
start "Smart Parking - Backend (FastAPI)" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"
cd ..

echo [3/3] Starting React Vite Frontend on port 5174...
cd frontend
if not exist node_modules (
    echo Installing npm dependencies...
    npm install
)
start "Smart Parking - Frontend (React + Vite)" cmd /k "npm run dev"
cd ..

echo.
echo =====================================================================
echo SYSTEM ONLINE!
echo Frontend Application: http://localhost:5174
echo Backend REST Docs:    http://127.0.0.1:8001/docs
echo.
echo Quick Demo Credentials:
echo Admin:    admin@smartparking.edu  /  Admin@123
echo Customer: elena.m@example.com     /  User@123
echo =====================================================================
pause
