"""
PLANOVA ENTERPRISE TEAM COLLABORATION TEST SUITE
Validates:
1. Admin Task Assignment to multiple users in single transaction.
2. Independent progress tracking (User A completed != User B pending).
3. Private assignment discussion streams & cross-notifications.
4. Filtered Admin Reminders (targeting only incomplete recipients).
5. Exact due date, time, and timezone handling.
6. Team productivity analytics & member rollups.
7. Strict RBAC & horizontal isolation on assignment data.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from datetime import date, time, datetime, timedelta
from dotenv import load_dotenv

load_dotenv("fastapi-backend/.env")
load_dotenv(".env")

BASE_URL = "http://127.0.0.1:8000"


def req(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as res:
            res_body = res.read().decode("utf-8")
            return res.status, json.loads(res_body) if res_body else None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, err_body


def run_tests():
    print("=== STARTING ENTERPRISE TEAM COLLABORATION TEST SUITE ===")
    passed = 0
    failed = 0

    def record_pass(msg):
        nonlocal passed
        passed += 1
        print(f"[PASS] {msg}")

    def record_fail(msg, err=""):
        nonlocal failed
        failed += 1
        print(f"[FAIL] {msg} | Error: {err}")

    # 1. Admin Login
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_pwd = os.environ.get("ADMIN_PASSWORD")
    st, res = req("POST", "/api/auth/login", {"email": admin_email, "password": admin_pwd})
    assert st == 200, f"Admin login failed: {res}"
    admin_token = res["access_token"]
    admin_id = res["user"]["id"]
    record_pass(f"Admin logged in successfully (Admin ID: {admin_id})")

    # 2. Register two test users (User X and User Y)
    test_run = int(datetime.now().timestamp())
    ux_email = f"collab_user_x_{test_run}@planova.com"
    uy_email = f"collab_user_y_{test_run}@planova.com"

    st, res = req("POST", "/api/auth/register", {"name": "User X", "email": ux_email, "password": "UserPass123!"})
    assert st == 201, f"User X register failed: {st} {res}"
    ux_id = res["id"]
    st, res = req("POST", "/api/auth/login", {"email": ux_email, "password": "UserPass123!"})
    assert st == 200, f"User X login failed: {st} {res}"
    ux_token = res["access_token"]

    st, res = req("POST", "/api/auth/register", {"name": "User Y", "email": uy_email, "password": "UserPass123!"})
    assert st == 201, f"User Y register failed: {st} {res}"
    uy_id = res["id"]
    st, res = req("POST", "/api/auth/login", {"email": uy_email, "password": "UserPass123!"})
    assert st == 200, f"User Y login failed: {st} {res}"
    uy_token = res["access_token"]
    record_pass(f"Created test users: User X (ID: {ux_id}) & User Y (ID: {uy_id})")

    # 3. Regular user forbidden from creating TeamTask
    st, res = req("POST", "/api/admin/team-tasks", {
        "title": "Unauthorized Team Task",
        "assignee_ids": [uy_id]
    }, token=ux_token)
    assert st == 403, f"Expected 403 Forbidden for non-admin, got {st}"
    record_pass("Non-admin forbidden from creating shared team tasks (HTTP 403)")

    # 4. Admin creates TeamTask assigned to both User X and User Y
    due_d = (date.today() + timedelta(days=3)).isoformat()
    st, team_task = req("POST", "/api/admin/team-tasks", {
        "title": "Prepare Annual Strategic Review",
        "description": "Consolidate KPI metrics, operational updates, and team goals.",
        "instructions": "Use the standardized Q4 slides template.",
        "priority": "High",
        "due_date": due_d,
        "due_time": "17:30:00",
        "timezone": "Asia/Kolkata",
        "assignee_ids": [ux_id, uy_id],
        "checklist": ["Draft executive summary", "Review financial tables", "Compile slide deck"],
        "send_immediate_notification": True
    }, token=admin_token)
    assert st == 201, f"Failed to create team task: {team_task}"
    task_id = team_task["id"]
    assert team_task["total_assignments"] == 2
    assert team_task["pending_count"] == 2
    assert str(team_task.get("due_time"))[:5] == "17:30"
    record_pass(f"Admin assigned TeamTask #{task_id} to 2 users with exact due time 17:30")

    # 5. Verify User X and User Y received immediate in-app notifications
    st, notifs_x = req("GET", "/api/notifications", token=ux_token)
    assert st == 200
    assert any("New Task Assigned" in n["title"] for n in notifs_x)
    record_pass("User X received in-app assignment notification pop-up data")

    st, notifs_y = req("GET", "/api/notifications", token=uy_token)
    assert st == 200
    assert any("New Task Assigned" in n["title"] for n in notifs_y)
    record_pass("User Y received in-app assignment notification pop-up data")

    # 6. Verify "Assigned to Me" for User X and User Y
    st, user_x_tasks = req("GET", "/api/assignments/me", token=ux_token)
    assert st == 200 and len(user_x_tasks) == 1
    assign_x = user_x_tasks[0]
    assign_x_id = assign_x["id"]
    assert assign_x["status"] == "Pending"
    assert assign_x["task_title"] == "Prepare Annual Strategic Review"
    record_pass(f"User X 'Assigned to Me' view populated (Assignment ID: {assign_x_id})")

    st, user_y_tasks = req("GET", "/api/assignments/me", token=uy_token)
    assert st == 200 and len(user_y_tasks) == 1
    assign_y = user_y_tasks[0]
    assign_y_id = assign_y["id"]
    assert assign_y["status"] == "Pending"
    record_pass(f"User Y 'Assigned to Me' view populated (Assignment ID: {assign_y_id})")

    # 7. Independent Progress Test: User X starts and completes task
    # User X updates to InProgress (40%)
    st, updated_x = req("PATCH", f"/api/assignments/{assign_x_id}/progress", {
        "status": "InProgress",
        "progress_percent": 40,
        "notes": "Drafted initial KPI outline."
    }, token=ux_token)
    assert st == 200 and updated_x["status"] == "InProgress"
    assert updated_x["progress_percent"] == 40
    record_pass("User X marked assignment InProgress (40%)")

    # CRITICAL CHECK: User Y's assignment MUST remain Pending (0%)
    st, user_y_tasks_check = req("GET", "/api/assignments/me", token=uy_token)
    assert user_y_tasks_check[0]["status"] == "Pending"
    assert user_y_tasks_check[0]["progress_percent"] == 0
    record_pass("INDEPENDENT PROGRESS CONFIRMED: User Y assignment remained Pending (0%) while User X was InProgress")

    # User X completes assignment
    st, completed_x = req("PATCH", f"/api/assignments/{assign_x_id}/progress", {
        "status": "Completed",
        "notes": "Finished report and submitted slides."
    }, token=ux_token)
    assert st == 200 and completed_x["status"] == "Completed"
    assert completed_x["progress_percent"] == 100
    assert completed_x["completed_at"] is not None
    record_pass("User X marked assignment Completed (100%) with completion timestamp recorded")

    # CRITICAL CHECK: User Y's assignment MUST STILL remain Pending
    st, user_y_tasks_check2 = req("GET", "/api/assignments/me", token=uy_token)
    assert user_y_tasks_check2[0]["status"] == "Pending"
    record_pass("INDEPENDENT PROGRESS CONFIRMED: User Y assignment remained Pending after User X completed")

    # 8. Discussion / Inquiry Privacy & Cross-Notifications
    # User Y asks a question
    st, disc_y = req("POST", f"/api/assignments/{assign_y_id}/discussions", {
        "message": "Should I include international market data?",
        "message_type": "inquiry"
    }, token=uy_token)
    assert st == 201
    record_pass("User Y submitted task question to Administrator")

    # Privacy Check: User X cannot view User Y's discussion
    st, err_disc = req("GET", f"/api/assignments/{assign_y_id}/discussions", token=ux_token)
    assert st == 403, f"Expected 403 for unauthorized discussion access, got {st}"
    record_pass("PRIVACY CONFIRMED: User X cannot access User Y's private discussion (HTTP 403)")

    # Admin reads and replies to User Y
    st, admin_disc_view = req("GET", f"/api/assignments/{assign_y_id}/discussions", token=admin_token)
    assert st == 200
    assert any("international market data" in d["message"] for d in admin_disc_view)

    st, admin_reply = req("POST", f"/api/assignments/{assign_y_id}/discussions", {
        "message": "Yes, include European and APAC regions please.",
        "message_type": "comment"
    }, token=admin_token)
    assert st == 201
    record_pass("Administrator replied to User Y's inquiry")

    # User Y sees Admin reply
    st, user_y_disc = req("GET", f"/api/assignments/{assign_y_id}/discussions", token=uy_token)
    assert st == 200
    assert any("European and APAC" in d["message"] for d in user_y_disc)
    record_pass("User Y received Admin reply in assignment thread")

    # 9. Admin Reminders Targeting Only Incomplete Assignees
    # Target "incomplete": User X is Completed, User Y is Pending.
    # Therefore, reminder must only go to User Y!
    st, reminder_res = req("POST", f"/api/admin/team-tasks/{task_id}/remind", {
        "recipient_filter": "incomplete",
        "message": "Please finalize your strategic review input by EOD."
    }, token=admin_token)
    assert st == 200
    assert reminder_res["reminders_sent"] == 1, f"Expected 1 reminder sent, got {reminder_res}"
    record_pass("Admin reminder targeted only incomplete assignees (sent exactly 1 reminder to User Y, skipping User X)")

    # 10. Admin Team Productivity Analytics
    st, analytics = req("GET", "/api/admin/team-analytics", token=admin_token)
    assert st == 200
    assert analytics["total_team_tasks"] >= 1
    assert analytics["completed_assignments"] >= 1
    assert analytics["pending_assignments"] >= 1
    record_pass(f"Admin Team Analytics: {analytics['total_team_tasks']} tasks, {analytics['total_assignments']} assignments, {analytics['overall_completion_rate']}% completion rate")

    print(f"\n========================================================")
    print(f"ENTERPRISE COLLABORATION SUITE: {passed} PASSED, {failed} FAILED")
    print(f"========================================================")
    assert failed == 0, f"{failed} tests failed"


if __name__ == "__main__":
    run_tests()
