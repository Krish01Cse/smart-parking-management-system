from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from ..database import get_db_connection
from ..models import DefectCreate, DefectUpdate

router = APIRouter(prefix="/api/defects", tags=["Bug Tracking"])

@router.get("")
def get_defects(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    module: Optional[str] = Query(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM defects WHERE 1=1"
    params = []

    if status and status.lower() != "all":
        query += " AND LOWER(status) = LOWER(?)"
        params.append(status)

    if severity and severity.lower() != "all":
        query += " AND LOWER(severity) = LOWER(?)"
        params.append(severity)

    if module and module.lower() != "all":
        query += " AND LOWER(related_module) = LOWER(?)"
        params.append(module)

    query += " ORDER BY id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Metrics
    cursor.execute("SELECT COUNT(*) FROM defects")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM defects WHERE status = 'Open'")
    open_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM defects WHERE status = 'In Progress'")
    in_progress = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM defects WHERE status = 'Fixed'")
    fixed = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM defects WHERE status = 'Retested/Closed'")
    closed = cursor.fetchone()[0]

    conn.close()

    return {
        "summary": {
            "total": total,
            "open": open_count,
            "in_progress": in_progress,
            "fixed": fixed,
            "closed": closed
        },
        "defects": [dict(row) for row in rows]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_defect(data: DefectCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM defects WHERE bug_id = ?", (data.bug_id.strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Defect ID '{data.bug_id}' already exists.")

    cursor.execute("""
        INSERT INTO defects (bug_id, bug_description, steps_to_reproduce, severity, priority, status, resolution, related_module, retest_result)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.bug_id.strip().upper(), data.bug_description.strip(), data.steps_to_reproduce.strip(),
        data.severity, data.priority, data.status, data.resolution or "",
        data.related_module, data.retest_result or ""
    ))
    conn.commit()
    new_id = cursor.lastrowid

    cursor.execute("SELECT * FROM defects WHERE id = ?", (new_id,))
    new_defect = dict(cursor.fetchone())
    conn.close()
    return new_defect

@router.put("/{defect_id}")
def update_defect(defect_id: int, data: DefectUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM defects WHERE id = ?", (defect_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Defect not found.")

    updates = []
    params = []

    if data.bug_description:
        updates.append("bug_description = ?")
        params.append(data.bug_description)
    if data.steps_to_reproduce:
        updates.append("steps_to_reproduce = ?")
        params.append(data.steps_to_reproduce)
    if data.severity:
        updates.append("severity = ?")
        params.append(data.severity)
    if data.priority:
        updates.append("priority = ?")
        params.append(data.priority)
    if data.status:
        updates.append("status = ?")
        params.append(data.status)
    if data.resolution is not None:
        updates.append("resolution = ?")
        params.append(data.resolution)
    if data.retest_result is not None:
        updates.append("retest_result = ?")
        params.append(data.retest_result)

    if updates:
        query = f"UPDATE defects SET {', '.join(updates)} WHERE id = ?"
        params.append(defect_id)
        cursor.execute(query, params)
        conn.commit()

    cursor.execute("SELECT * FROM defects WHERE id = ?", (defect_id,))
    updated_defect = dict(cursor.fetchone())
    conn.close()
    return updated_defect
