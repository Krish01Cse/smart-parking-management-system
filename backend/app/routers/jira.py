from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from ..database import get_db_connection
from ..models import JiraItemUpdate

router = APIRouter(prefix="/api/jira", tags=["JIRA Project Overview"])

@router.get("/overview")
def get_jira_overview():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM jira_epics ORDER BY id ASC")
    epics = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT * FROM jira_sprints ORDER BY id ASC")
    sprints = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT * FROM jira_items ORDER BY id ASC")
    items = [dict(row) for row in cursor.fetchall()]

    # Calculate completion stats
    total_items = len(items)
    completed_items = sum(1 for item in items if item["status"] in ("Completed", "Verified"))
    completion_rate = round((completed_items / total_items * 100), 1) if total_items > 0 else 0

    conn.close()

    return {
        "project_name": "SE-lab-LA (SCRUM)",
        "methodology": "Agile Scrum Framework",
        "total_epics": len(epics),
        "total_sprints": len(sprints),
        "total_work_items": total_items,
        "completed_work_items": completed_items,
        "completion_rate": completion_rate,
        "epics": epics,
        "sprints": sprints,
        "items": items
    }

@router.patch("/items/{item_key}")
def update_jira_item(item_key: str, data: JiraItemUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM jira_items WHERE item_key = ?", (item_key,))
    item = cursor.fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="JIRA item not found.")

    updates = ["status = ?"]
    params = [data.status]

    if data.title:
        updates.append("title = ?")
        params.append(data.title)
    if data.description:
        updates.append("description = ?")
        params.append(data.description)

    params.append(item_key)
    query = f"UPDATE jira_items SET {', '.join(updates)} WHERE item_key = ?"
    cursor.execute(query, params)
    conn.commit()

    cursor.execute("SELECT * FROM jira_items WHERE item_key = ?", (item_key,))
    updated_item = dict(cursor.fetchone())
    conn.close()

    return updated_item
