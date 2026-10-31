#!/usr/bin/env python3
"""
Smart Parking Management System - Supabase Cloud Synchronization Script
Synchronizes all users, parking slots, reservations, and payment receipts from SQLite to Supabase.
"""

import sys
import os
import sqlite3

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.supabase_client import (
    supabase_sync_user,
    supabase_sync_slot,
    supabase_sync_reservation,
    supabase_sync_payment,
    get_supabase_cloud_status,
    is_supabase_configured,
    SUPABASE_URL,
    SUPABASE_KEY
)

DB_PATH = os.path.join(os.path.dirname(__file__), "backend", "smart_parking.db")

def sync_all():
    print("====================================================================")
    print("🚀 SMART PARKING MANAGEMENT SYSTEM — SUPABASE SYNC")
    print("====================================================================")
    print(f"Supabase Project URL : {SUPABASE_URL}")
    print(f"API Key Configured   : {'✓ Yes' if is_supabase_configured() else '✗ Missing in .env'}")

    if not is_supabase_configured():
        print("\n⚠️  [ACTION REQUIRED] SUPABASE_KEY IS NOT CONFIGURED IN .env")
        print("To allow ParkPulse to sync your tables and users to Supabase:")
        print("  1. Open your Supabase Dashboard:")
        print("     https://supabase.com/dashboard/project/jsigdjyqhvgheefrddol/settings/api")
        print("  2. Copy the 'service_role' secret key (or 'anon' public key).")
        print("  3. Open .env and set:")
        print("     SUPABASE_KEY=your_key_here")
        print("\n📌 Also make sure you have executed 'supabase_schema.sql' in the Supabase SQL Editor:")
        print("     https://supabase.com/dashboard/project/jsigdjyqhvgheefrddol/sql/new\n")
        print("--------------------------------------------------------------------")
        return

    if not os.path.exists(DB_PATH):
        print(f"❌ SQLite database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Sync Users (Admin and Customer credentials)
    cursor.execute("SELECT * FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    print(f"\n👤 Syncing {len(users)} User Profiles & Credentials to Supabase...")
    user_success = 0
    for u in users:
        u["raw_password"] = "Admin@123" if u["role"] == "Administrator" else "User@123"
        if supabase_sync_user(u):
            user_success += 1
            print(f"  ✓ {u['name']} ({u['email']}) [Role: {u['role']}] -> Synced")
        else:
            print(f"  ⚠️ {u['name']} ({u['email']}) -> Cloud sync pending (ensure public.users exists)")

    # 2. Sync Parking Slots
    cursor.execute("SELECT * FROM parking_slots")
    slots = [dict(row) for row in cursor.fetchall()]
    print(f"\n🅿️  Syncing {len(slots)} Parking Slots to Supabase...")
    slot_success = 0
    for s in slots:
        if supabase_sync_slot(s):
            slot_success += 1
            print(f"  ✓ Slot {s['slot_number']} ({s['location_zone']}) -> Synced")
        else:
            pass
    if slot_success == 0:
        print("  ℹ️  Public tables not yet executed in Supabase SQL editor.")
        print("     To create tables: open https://supabase.com/dashboard/project/jsigdjyqhvgheefrddol/sql/new")
        print("     Paste supabase_schema.sql and click RUN.")

    # 3. Sync Reservations (Bookings)
    cursor.execute("SELECT * FROM reservations")
    reservations = [dict(row) for row in cursor.fetchall()]
    print(f"\n📅 Syncing {len(reservations)} Reservations / Bookings to Supabase...")
    res_success = 0
    for r in reservations:
        if supabase_sync_reservation(r):
            res_success += 1
            print(f"  ✓ Booking {r['booking_id']} ({r['customer_name']}) -> Synced")
        else:
            pass

    # 4. Sync Payment Receipts
    cursor.execute("SELECT * FROM payments")
    payments = [dict(row) for row in cursor.fetchall()]
    print(f"\n💳 Syncing {len(payments)} Payment Receipts to Supabase...")
    pay_success = 0
    for p in payments:
        if supabase_sync_payment(p):
            pay_success += 1
            print(f"  ✓ Transaction {p['transaction_id']} (₹{p['amount']}) -> Synced")
        else:
            pass

    conn.close()

    print("\n--------------------------------------------------------------------")
    print(f"✨ Synchronization Summary:")
    print(f"   - Users in Supabase Auth/DB : {user_success}/{len(users)}")
    print(f"   - Parking Slots Synced      : {slot_success}/{len(slots)}")
    print(f"   - Reservations Synced       : {res_success}/{len(reservations)}")
    print(f"   - Payment Receipts Synced   : {pay_success}/{len(payments)}")
    print("--------------------------------------------------------------------")

if __name__ == "__main__":
    sync_all()
