import React from 'react';
import {
  BookOpen,
  Layers,
  Database,
  Server,
  Code2,
  CheckCircle2,
  ShieldCheck,
  Terminal,
  ArrowRight,
  ExternalLink,
  Laptop
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>PBL Individual Evaluation Report</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ParkPulse<span className="text-emerald-700">™</span> — Intelligent Cloud Parking System
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            JIRA Project: SE-lab-LA (SCRUM) • Enterprise Software Engineering PBL Submission
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-900 text-white text-xs space-y-1">
          <span className="font-bold block text-emerald-300">PBL Evaluator Quick Demo:</span>
          <p className="text-[11px] text-emerald-100">
            Admin: <b className="font-mono text-white">admin@smartparking.edu</b>
          </p>
          <p className="text-[11px] text-emerald-100">
            Password: <b className="font-mono text-white">Admin@123</b>
          </p>
        </div>
      </div>

      {/* Architecture Visual Diagram (React Frontend -> FastAPI REST API -> SQLite Database) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#143d2b]" />
          <span>System Architecture (3-Tier Layered Design)</span>
        </h3>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-center">
          {/* Frontend Tier */}
          <div className="flex-1 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs w-full">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-2 font-bold">
              <Laptop className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">React 19 + TypeScript SPA</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Vite bundler, Tailwind CSS, Lucide icons, Recharts interactive graphs
            </p>
          </div>

          <div className="text-slate-400 font-bold hidden md:block">
            <ArrowRight className="w-6 h-6 text-[#143d2b]" />
          </div>

          {/* API Tier */}
          <div className="flex-1 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs w-full">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#143d2b] flex items-center justify-center mx-auto mb-2 font-bold">
              <Server className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">FastAPI REST API</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Uvicorn ASGI, Pydantic schemas, PBKDF2-HMAC password encryption
            </p>
          </div>

          <div className="text-slate-400 font-bold hidden md:block">
            <ArrowRight className="w-6 h-6 text-[#143d2b]" />
          </div>

          {/* Database Tier */}
          <div className="flex-1 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs w-full">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-2 font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">SQLite Database</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Foreign key constraints, ACID transactional atomicity, persistence
            </p>
          </div>
        </div>
      </div>

      {/* Problem Statement & Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Problem Statement</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Conventional parking lots frequently suffer from uncoordinated slot assignment leading to double-bookings, traffic bottlenecks, manual paper ticketing errors, lack of visibility into vehicle occupancy by zone, and vulnerable payment handling. A unified digital management system is required to automate reservations, enforce real-time slot conflict prevention, and record verified simulated transaction ledgers.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Key Objectives</h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
            <li><b>Real-time Slot Control:</b> Categorize car and bike spaces across designated zones.</li>
            <li><b>Collision-Free Bookings:</b> Overlap prevention algorithms rejecting double bookings.</li>
            <li><b>Role-Based User Security:</b> PBKDF2 password hashing with separate Admin/Customer roles.</li>
            <li><b>Simulated Revenue Settlement:</b> Duration tariff calculation with simulated card/UPI checkout.</li>
            <li><b>Full PBL Compliance:</b> Direct alignment with JIRA project <code>SE-lab-LA (SCRUM)</code>.</li>
          </ul>
        </div>
      </div>

      {/* The Four Core Modules */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Implemented Core Modules (Epics 1 – 4)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
              EPIC 1
            </span>
            <h4 className="text-xs font-bold text-slate-900">Module 1: Parking Slot Management</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Provides full CRUD for parking slots, filtering by vehicle type (Car/Bike) and zone, uniqueness validation for slot numbers, and safeguards preventing slots from being switched to Maintenance when an active reservation is ongoing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
              EPIC 2
            </span>
            <h4 className="text-xs font-bold text-slate-900">Module 2: Parking Reservation Management</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Handles slot allocation, vehicle registration tracking, start/end scheduling, and date-time interval overlap checks. Automatically recalculates slot availability upon reservation creation and cancellation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
              EPIC 3
            </span>
            <h4 className="text-xs font-bold text-slate-900">Module 3: User Management</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Manages customer and administrator profiles, email uniqueness verification, role-based access, and cryptographic password hashing using 100,000 rounds of PBKDF2-HMAC (SHA256).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
              EPIC 4
            </span>
            <h4 className="text-xs font-bold text-slate-900">Module 4: Parking Payment Management</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Computes parking fees from configurable duration and hourly rates, generates unique transaction IDs (TXN-XXXXXX), provides simulated Card/UPI/NetBanking checkouts, and enforces duplicate-payment prevention.
            </p>
          </div>
        </div>
      </div>

      {/* Database Schema Reference */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-600" />
          <span>Persistent SQLite Database Schema</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1">
            <b className="text-slate-900">users:</b>
            <p className="text-slate-600">id, name, email (UNIQUE), phone, password_hash, role, created_at</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1">
            <b className="text-slate-900">parking_slots:</b>
            <p className="text-slate-600">id, slot_number (UNIQUE), vehicle_type, location_zone, hourly_rate, status, current_vehicle, updated_at</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1">
            <b className="text-slate-900">reservations:</b>
            <p className="text-slate-600">id, booking_id (UNIQUE), slot_id (FK), customer_name, vehicle_reg_number, start_time, end_time, total_amount, status</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1">
            <b className="text-slate-900">payments:</b>
            <p className="text-slate-600">id, transaction_id (UNIQUE), reservation_id (FK), amount, hourly_rate, duration_hours, payment_method, status</p>
          </div>
        </div>
      </div>

      {/* Evaluator Walkthrough Guide */}
      <div className="p-6 rounded-3xl bg-[#143d2b] text-white space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-300" />
          <span>Step-by-Step Evaluation Walkthrough for the Teacher / Evaluator</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-1.5">
            <b className="text-emerald-300 font-bold block">1. Test Slot Creation & Duplication</b>
            <p className="text-emerald-100 text-[11px]">
              Navigate to Parking Slots → click "+ Add Slot" → enter existing slot number "A-101". Notice immediate backend HTTP 400 rejection preventing duplicates!
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-1.5">
            <b className="text-emerald-300 font-bold block">2. Test Reservation & Collision Lock</b>
            <p className="text-emerald-100 text-[11px]">
              Book slot A-102 with vehicle reg "CA-9842". Attempt to book the same slot for an overlapping time window. System rejects collision!
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-1.5">
            <b className="text-emerald-300 font-bold block">3. Simulate Payment & Duplicate Lock</b>
            <p className="text-emerald-100 text-[11px]">
              Go to Reservations → click "Pay Fee" on a confirmed booking. Complete checkout. Try paying again — backend prevents duplicate transaction!
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-1.5">
            <b className="text-emerald-300 font-bold block">4. Execute Test Suite & View JIRA</b>
            <p className="text-emerald-100 text-[11px]">
              Go to Testing page → click "Execute Live Test Runner" to observe real-time database validation and test matrix updates matching SE-lab-LA (SCRUM).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
