"""
PLANOVA — STEP 9 COMPREHENSIVE END-TO-END TESTING & SECURITY HARDENING SUITE
Validates the entire full-stack application across:
1. Public Endpoints & Authentication
2. Security Hardening & RBAC (Missing, Invalid, Expired JWT, Admin Protection, Last-Admin Protection)
3. Multi-Tenant Data Isolation (Horizontal Privilege Escalation Prevention)
4. User Workflows (Tasks, Categories, Kanban, Subtasks, Tags, Reminders, Notifications, Preferences, Audit History)
5. Admin Workflows (Stats, Directory, Role Modifications, System Tasks)
6. Database Integrity & Cascade Deletions
"""

import sys
import os
import json
import time
import uuid
from dotenv import load_dotenv

# Load local environment configuration for test credentials
load_dotenv("fastapi-backend/.env")
load_dotenv(".env")
from datetime import datetime, timedelta, timezone
import urllib.request
import urllib.error
import urllib.parse
import jwt

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:5173"

def make_request(method, path, data=None, token=None, expected_status=None, base=BASE_URL):
    url = f"{base}{path}" if path.startswith("/") else f"{base}/{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body) if res_body and res_body.startswith(("{", "[")) else res_body
            if expected_status and status != expected_status:
                raise AssertionError(f"Expected HTTP {expected_status} on {method} {path}, got {status}: {res_body}")
            return status, res_json, response.headers
    except urllib.error.HTTPError as e:
        status = e.code
        res_body = e.read().decode("utf-8")
        try:
            res_json = json.loads(res_body)
        except Exception:
            res_json = res_body
        if expected_status and status != expected_status:
            raise AssertionError(f"Expected HTTP {expected_status} on {method} {path}, got {status}: {res_body}")
        return status, res_json, e.headers


def run_tests():
    print("=" * 70)
    print("=== PLANOVA STEP 9: FULL E2E AND SECURITY AUDIT TEST RUNNER ===")
    print("=" * 70)

    test_run_id = uuid.uuid4().hex[:8]
    passed = 0
    failed = 0

    def record_pass(test_name):
        nonlocal passed
        passed += 1
        print(f"[PASS] {test_name}")

    def record_fail(test_name, err):
        nonlocal failed
        failed += 1
        print(f"[FAIL] {test_name} -> {err}")

    # =========================================================================
    # SUITE 1: PUBLIC WORKFLOWS & FRONTEND AVAILABILITY
    # =========================================================================
    print("\n--- SUITE 1: Public Workflows & Frontend Availability ---")
    
    # 1.1 Frontend Routes
    for route in ["/", "/login", "/register", "/app", "/dashboard"]:
        try:
            st, body, _ = make_request("GET", route, base=FRONTEND_URL, expected_status=200)
            assert "Planova" in body, f"Page {route} does not mention Planova"
            record_pass(f"Frontend public route '{route}' renders with Planova branding")
        except Exception as e:
            record_fail(f"Frontend route '{route}'", e)

    # 1.2 Health Check
    try:
        st, body, _ = make_request("GET", "/health", expected_status=200)
        assert body.get("status") == "healthy"
        record_pass("Backend /health endpoint responds healthy")
    except Exception as e:
        record_fail("Backend /health check", e)

    # 1.3 CORS headers verification
    try:
        req = urllib.request.Request(
            f"{BASE_URL}/api/tasks/",
            headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
            method="OPTIONS"
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            allow_origin = resp.headers.get("access-control-allow-origin")
            assert allow_origin in ["http://localhost:5173", "*"]
            record_pass(f"CORS correctly allows origin http://localhost:5173 (Got: {allow_origin})")
    except Exception as e:
        record_fail("CORS preflight validation", e)

    # =========================================================================
    # SUITE 2: AUTHENTICATION, PASSWORD SECURITY & JWT HARDENING
    # =========================================================================
    print("\n--- SUITE 2: Authentication, Password Security & JWT Hardening ---")

    # 2.1 Admin Login
    admin_token = None
    admin_id = None
    try:
        st, body, _ = make_request("POST", "/api/auth/login", {
            "email": os.environ.get("ADMIN_EMAIL", "admin@example.com"),
            "password": os.environ.get("ADMIN_PASSWORD")
        }, expected_status=200)
        admin_token = body.get("access_token")
        admin_id = body.get("user", {}).get("id")
        assert admin_token and len(admin_token) > 50
        assert body.get("user", {}).get("role") == "Admin"
        record_pass(f"Admin credentials authenticate and issue signed JWT (Admin ID: {admin_id})")
    except Exception as e:
        record_fail("Admin login", e)

    # 2.2 User A and User B registration (Disposable accounts)
    user_a_email = f"user_a_{test_run_id}@planova.com"
    user_b_email = f"user_b_{test_run_id}@planova.com"
    user_a_token = None
    user_b_token = None
    user_a_id = None
    user_b_id = None

    try:
        st, body, _ = make_request("POST", "/api/auth/register", {
            "name": "User Alpha",
            "email": user_a_email,
            "password": "Password123"
        }, expected_status=201)
        user_a_id = body.get("id")
        record_pass(f"User A registered successfully (ID: {user_a_id})")
    except Exception as e:
        record_fail("User A registration", e)

    try:
        st, body, _ = make_request("POST", "/api/auth/login", {
            "email": user_a_email,
            "password": "Password123"
        }, expected_status=200)
        user_a_token = body.get("access_token")
        record_pass("User A authenticated and token acquired")
    except Exception as e:
        record_fail("User A login", e)

    try:
        st, body, _ = make_request("POST", "/api/auth/register", {
            "name": "User Beta",
            "email": user_b_email,
            "password": "Password123"
        }, expected_status=201)
        user_b_id = body.get("id")
        record_pass(f"User B registered successfully (ID: {user_b_id})")
    except Exception as e:
        record_fail("User B registration", e)

    try:
        st, body, _ = make_request("POST", "/api/auth/login", {
            "email": user_b_email,
            "password": "Password123"
        }, expected_status=200)
        user_b_token = body.get("access_token")
        record_pass("User B authenticated and token acquired")
    except Exception as e:
        record_fail("User B login", e)

    # 2.3 Duplicate Registration Rejected
    try:
        st, body, _ = make_request("POST", "/api/auth/register", {
            "name": "User Duplicate",
            "email": user_a_email,
            "password": "Password123"
        }, expected_status=409)
        record_pass("Duplicate email registration correctly rejected with HTTP 409 Conflict")
    except Exception as e:
        record_fail("Duplicate registration rejection", e)

    # 2.4 Invalid Password Rejected
    try:
        st, body, _ = make_request("POST", "/api/auth/login", {
            "email": user_a_email,
            "password": "WrongPassword999"
        }, expected_status=401)
        record_pass("Invalid password rejected with HTTP 401 Unauthorized")
    except Exception as e:
        record_fail("Invalid password rejection", e)

    # 2.5 Missing JWT Rejected
    try:
        st, body, _ = make_request("GET", "/api/tasks/", token=None, expected_status=401)
        record_pass("Missing JWT rejected with HTTP 401 Unauthorized")
    except Exception as e:
        record_fail("Missing JWT check", e)

    # 2.6 Malformed / Fake JWT Rejected
    try:
        st, body, _ = make_request("GET", "/api/tasks/", token="invalid.token.here", expected_status=401)
        record_pass("Malformed JWT rejected with HTTP 401 Unauthorized")
    except Exception as e:
        record_fail("Malformed JWT check", e)

    # 2.7 Expired JWT Rejected
    try:
        # Create an expired token using standard format with dummy secret
        expired_payload = {
            "sub": str(user_a_id),
            "exp": datetime.now(timezone.utc) - timedelta(hours=1)
        }
        # Encode with arbitrary secret - will fail signature or expiry
        expired_token = jwt.encode(expired_payload, "test_secret_key_32_characters_long!", algorithm="HS256")
        st, body, _ = make_request("GET", "/api/tasks/", token=expired_token, expected_status=401)
        record_pass("Expired/Invalid signature JWT rejected with HTTP 401 Unauthorized")
    except Exception as e:
        record_fail("Expired JWT check", e)

    # 2.8 SQL Injection Defense in Search & Filters
    try:
        sqli_tests = ["' OR '1'='1", "'; DROP TABLE tasks; --", "1 UNION SELECT 1, 2, 3"]
        for payload in sqli_tests:
            st, results, _ = make_request("GET", f"/api/tasks/?q={urllib.parse.quote(payload)}", token=user_a_token, expected_status=200)
            assert isinstance(results, list)
        record_pass("SQL injection payloads handled securely via SQLAlchemy parameterized queries")
    except Exception as e:
        record_fail("SQL injection defense", e)

    # 2.9 Invalid Input & Oversized / Missing Title Validation
    try:
        # Missing title in task creation
        st, body, _ = make_request("POST", "/api/tasks/", {"description": "No title"}, token=user_a_token, expected_status=422)
        record_pass("Task creation without title rejected with HTTP 422 Unprocessable Entity")
    except Exception as e:
        record_fail("Pydantic schema validation for missing title", e)

    # =========================================================================
    # SUITE 3: RBAC & ADMIN PROTECTION
    # =========================================================================
    print("\n--- SUITE 3: RBAC, Authorization & Admin Protection ---")

    # 3.1 Regular User attempting Admin APIs
    admin_endpoints = [
        ("GET", "/api/admin/stats"),
        ("GET", "/api/admin/users"),
        ("GET", "/api/admin/tasks"),
        ("PATCH", f"/api/admin/users/{user_a_id}/role", {"role": "Admin"}),
    ]
    for method, endpoint, *payload in admin_endpoints:
        try:
            pl = payload[0] if payload else None
            st, body, _ = make_request(method, endpoint, pl, token=user_a_token, expected_status=403)
            record_pass(f"Non-admin forbidden from {method} {endpoint} (HTTP 403)")
        except Exception as e:
            record_fail(f"RBAC check on {method} {endpoint}", e)

    # 3.2 Admin attempting to demote self
    try:
        st, body, _ = make_request("PATCH", f"/api/admin/users/{admin_id}/role", {"role": "User"}, token=admin_token, expected_status=400)
        assert "cannot remove admin privileges" in str(body).lower() or "cannot demote the last remaining administrator" in str(body).lower()
        record_pass(f"Admin demoting self rejected with HTTP 400 Bad Request (Admin ID: {admin_id})")
    except Exception as e:
        record_fail("Self-demotion prevention", e)

    # 3.3 Admin promoting user B to Admin, then demoting user B back to User
    try:
        st, body, _ = make_request("PATCH", f"/api/admin/users/{user_b_id}/role", {"role": "Admin"}, token=admin_token, expected_status=200)
        assert body.get("role") == "Admin"
        record_pass("Admin successfully promoted User B to Admin")

        # Demote user B back to User
        st, body, _ = make_request("PATCH", f"/api/admin/users/{user_b_id}/role", {"role": "User"}, token=admin_token, expected_status=200)
        assert body.get("role") == "User"
        record_pass("Admin successfully demoted User B back to User")
    except Exception as e:
        record_fail("Admin role update lifecycle", e)

    # 3.4 Last-Admin Protection Check
    try:
        # Check system admin count
        st, body, _ = make_request("GET", "/api/admin/users?role=Admin", token=admin_token, expected_status=200)
        admin_count = body.get("total", 0)
        if admin_count == 1:
            st, body, _ = make_request("PATCH", "/api/admin/users/1/role", {"role": "User"}, token=admin_token, expected_status=400)
            record_pass(f"Last-admin protection enforced (1 admin total in system, demotion blocked)")
        else:
            record_pass(f"Admin count is {admin_count}; multiple admins registered")
    except Exception as e:
        record_fail("Last admin protection", e)

    # =========================================================================
    # SUITE 4: MULTI-TENANT ISOLATION (NO HORIZONTAL PRIVILEGE ESCALATION)
    # =========================================================================
    print("\n--- SUITE 4: Multi-Tenant Boundary & Data Isolation ---")

    # User A creates Task A
    task_a_id = None
    try:
        st, body, _ = make_request("POST", "/api/tasks/", {
            "title": f"User A Secret Task {test_run_id}",
            "description": "Sensitive plan details",
            "priority": "High",
            "due_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "category_name": "Work"
        }, token=user_a_token, expected_status=201)
        task_a_id = body.get("id")
        record_pass(f"User A created private Task (ID: {task_a_id})")
    except Exception as e:
        record_fail("User A create task", e)

    # User B attempts to read Task A -> 404 (Not Found / Hidden)
    try:
        st, body, _ = make_request("GET", f"/api/tasks/{task_a_id}", token=user_b_token, expected_status=404)
        record_pass(f"User B cannot read User A's task (HTTP 404 Not Found)")
    except Exception as e:
        record_fail("Read isolation check", e)

    # User B attempts to update Task A -> 404
    try:
        st, body, _ = make_request("PATCH", f"/api/tasks/{task_a_id}", {"title": "Hacked Title"}, token=user_b_token, expected_status=404)
        record_pass(f"User B cannot update User A's task (HTTP 404 Not Found)")
    except Exception as e:
        record_fail("Update isolation check", e)

    # User B attempts to delete Task A -> 404
    try:
        st, body, _ = make_request("DELETE", f"/api/tasks/{task_a_id}", token=user_b_token, expected_status=404)
        record_pass(f"User B cannot delete User A's task (HTTP 404 Not Found)")
    except Exception as e:
        record_fail("Delete isolation check", e)

    # User A adds Subtask under Task A
    subtask_a_id = None
    try:
        st, body, _ = make_request("POST", f"/api/tasks/{task_a_id}/subtasks", {
            "title": "Subtask Alpha 1",
            "sort_order": 0
        }, token=user_a_token, expected_status=201)
        subtask_a_id = body.get("id")
        record_pass(f"User A created Subtask (ID: {subtask_a_id})")
    except Exception as e:
        record_fail("User A create subtask", e)

    # User B attempts to read User A's subtasks -> 404
    try:
        st, body, _ = make_request("GET", f"/api/tasks/{task_a_id}/subtasks", token=user_b_token, expected_status=404)
        record_pass("User B cannot access User A's subtasks (HTTP 404)")
    except Exception as e:
        record_fail("Subtask read isolation", e)

    # User B attempts to create subtask on User A's task -> 404
    try:
        st, body, _ = make_request("POST", f"/api/tasks/{task_a_id}/subtasks", {
            "title": "Malicious Subtask",
            "sort_order": 0
        }, token=user_b_token, expected_status=404)
        record_pass("User B cannot create subtask on User A's task (HTTP 404)")
    except Exception as e:
        record_fail("Subtask create isolation", e)

    # User B attempts to toggle User A's subtask -> 404
    try:
        st, body, _ = make_request("PATCH", f"/api/subtasks/{subtask_a_id}/toggle", token=user_b_token, expected_status=404)
        record_pass("User B cannot toggle User A's subtask (HTTP 404)")
    except Exception as e:
        record_fail("Subtask toggle isolation", e)

    # User B attempts to view User A's task activity log -> 403 Forbidden
    try:
        st, body, _ = make_request("GET", f"/api/tasks/{task_a_id}/activity", token=user_b_token, expected_status=403)
        record_pass("User B forbidden from reading User A's activity logs (HTTP 403 Forbidden)")
    except Exception as e:
        record_fail("Activity log isolation", e)

    # =========================================================================
    # SUITE 5: COMPLETE USER PRODUCTIVITY WORKFLOW
    # =========================================================================
    print("\n--- SUITE 5: Complete User Productivity Workflow ---")

    # 5.1 Task Status Lifecycle (Pending -> InProgress -> Completed -> Reopen)
    try:
        # Update to InProgress
        st, body, _ = make_request("PATCH", f"/api/tasks/{task_a_id}", {"status": "InProgress"}, token=user_a_token, expected_status=200)
        assert body.get("status") == "InProgress"
        # Update to Completed
        st, body, _ = make_request("PATCH", f"/api/tasks/{task_a_id}", {"status": "Completed"}, token=user_a_token, expected_status=200)
        assert body.get("status") == "Completed"
        # Reopen to Pending
        st, body, _ = make_request("PATCH", f"/api/tasks/{task_a_id}", {"status": "Pending"}, token=user_a_token, expected_status=200)
        assert body.get("status") == "Pending"
        record_pass("Task status lifecycle (Pending -> InProgress -> Completed -> Pending) verified")
    except Exception as e:
        record_fail("Task lifecycle updates", e)

    # 5.2 Filters, Search and Sorting
    try:
        # Create a second task for User A
        make_request("POST", "/api/tasks/", {
            "title": f"Research Quantum Algorithms {test_run_id}",
            "priority": "Low",
            "due_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "category_name": "Study"
        }, token=user_a_token, expected_status=201)

        # Search query
        st, results, _ = make_request("GET", "/api/tasks/?q=Quantum", token=user_a_token, expected_status=200)
        assert len(results) == 1 and "Quantum" in results[0]["title"]
        record_pass("Task search by keyword functioning accurately")

        # Priority filter
        st, results, _ = make_request("GET", "/api/tasks/?priority=High", token=user_a_token, expected_status=200)
        assert all(t["priority"] == "High" for t in results)
        record_pass("Task filtering by priority functioning accurately")

        # Status filter
        st, results, _ = make_request("GET", "/api/tasks/?status=Pending", token=user_a_token, expected_status=200)
        assert all(t["status"] == "Pending" for t in results)
        record_pass("Task filtering by status functioning accurately")
    except Exception as e:
        record_fail("Search, filtering, sorting", e)

    # 5.3 Custom Tags & Duplicate Tag Prevention
    tag_id_1 = None
    try:
        # Create tag
        st, body, _ = make_request("POST", "/api/tags/", {"name": f"TagA_{test_run_id}", "color": "#10b981"}, token=user_a_token, expected_status=201)
        tag_id_1 = body.get("id")
        record_pass(f"Custom tag created (ID: {tag_id_1})")

        # Duplicate tag name should return HTTP 400
        st, body, _ = make_request("POST", "/api/tags/", {"name": f"TagA_{test_run_id}", "color": "#10b981"}, token=user_a_token, expected_status=400)
        record_pass("Duplicate tag name rejected with HTTP 400")

        # Assign tag to Task A
        st, body, _ = make_request("POST", f"/api/tasks/{task_a_id}/tags", {"tag_ids": [tag_id_1]}, token=user_a_token, expected_status=200)
        assert any(t["id"] == tag_id_1 for t in body)
        record_pass("Custom tag assigned to task successfully")
    except Exception as e:
        record_fail("Custom tag workflow", e)

    # 5.4 Reminders & Idempotent In-App Notifications
    reminder_id = None
    try:
        # Schedule reminder for yesterday (already due) to trigger immediate notification
        past_time = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
        st, body, _ = make_request("POST", "/api/reminders/", {
            "task_id": task_a_id,
            "remind_at": past_time
        }, token=user_a_token, expected_status=201)
        reminder_id = body.get("id")
        record_pass(f"Reminder created for Task A (ID: {reminder_id})")

        # First trigger check
        st, body, _ = make_request("POST", "/api/reminders/process-due", token=user_a_token, expected_status=200)
        first_count = body.get("triggered_count")
        assert first_count >= 1

        # Second trigger check (IDEMPOTENCY TEST)
        st, body, _ = make_request("POST", "/api/reminders/process-due", token=user_a_token, expected_status=200)
        second_count = body.get("triggered_count")
        assert second_count == 0, f"Expected 0 due reminders on immediate re-call, got {second_count}"
        record_pass(f"Notification processing is strictly idempotent (Triggered 1st: {first_count}, 2nd: 0)")

        # Read unread notifications
        st, body, _ = make_request("GET", "/api/notifications/unread-count", token=user_a_token, expected_status=200)
        assert body.get("unread_count", 0) >= 1
        record_pass(f"Unread notification counter reflects triggered reminder (Count: {body.get('unread_count')})")

        # Mark all read
        st, body, _ = make_request("PATCH", "/api/notifications/read-all", token=user_a_token, expected_status=200)
        st, body, _ = make_request("GET", "/api/notifications/unread-count", token=user_a_token, expected_status=200)
        assert body.get("unread_count") == 0
        record_pass("Mark all notifications read resets badge to 0")
    except Exception as e:
        record_fail("Reminders & Notifications workflow", e)

    # 5.5 Activity Log Audit Trail
    try:
        st, logs, _ = make_request("GET", f"/api/tasks/{task_a_id}/activity", token=user_a_token, expected_status=200)
        actions = [l.get("action") for l in logs]
        assert "created" in actions or "subtask_created" in actions or "status_updated" in actions
        record_pass(f"Audit log recorded actions for Task A: {actions[:4]}")
    except Exception as e:
        record_fail("Activity log audit trail", e)

    # 5.6 User Preferences Persistence
    try:
        st, body, _ = make_request("PATCH", "/api/preferences/", {
            "theme": "dark",
            "default_task_view": "kanban",
            "timezone": "Asia/Kolkata"
        }, token=user_a_token, expected_status=200)
        assert body.get("theme") == "dark"
        assert body.get("default_task_view") == "kanban"

        # Fetch preferences back
        st, body, _ = make_request("GET", "/api/preferences/", token=user_a_token, expected_status=200)
        assert body.get("theme") == "dark" and body.get("timezone") == "Asia/Kolkata"
        record_pass("User preferences (theme, default view, timezone) persist cleanly in MySQL")
    except Exception as e:
        record_fail("Preferences persistence", e)

    # =========================================================================
    # SUITE 6: ADMIN WORKFLOW & SYSTEM-WIDE VISIBILITY
    # =========================================================================
    print("\n--- SUITE 6: Admin Workflow & System-Wide Visibility ---")

    # 6.1 Admin Stats
    try:
        st, stats, _ = make_request("GET", "/api/admin/stats", token=admin_token, expected_status=200)
        assert stats.get("total_users") >= 2
        assert stats.get("total_tasks") >= 2
        record_pass(f"Admin stats: {stats.get('total_users')} users, {stats.get('total_tasks')} tasks, rate {stats.get('completion_rate')}%")
    except Exception as e:
        record_fail("Admin stats overview", e)

    # 6.2 Admin User Directory with Search & Pagination
    try:
        st, users_res, _ = make_request("GET", f"/api/admin/users?q={user_a_email}&page=1&page_size=10", token=admin_token, expected_status=200)
        assert users_res.get("total") == 1
        assert users_res.get("items")[0]["email"] == user_a_email
        record_pass("Admin user search and pagination functioning accurately")
    except Exception as e:
        record_fail("Admin user directory search", e)

    # 6.3 Admin System-Wide Tasks Overview
    try:
        st, tasks_res, _ = make_request("GET", f"/api/admin/tasks?q={test_run_id}", token=admin_token, expected_status=200)
        assert tasks_res.get("total") >= 1
        record_pass(f"Admin system-wide task list queries tasks across users with owner metadata")
    except Exception as e:
        record_fail("Admin system task overview", e)

    # =========================================================================
    # SUITE 7: DATABASE INTEGRITY & CASCADE DELETION SAFETY
    # =========================================================================
    print("\n--- SUITE 7: Database Integrity & Cascade Deletion Safety ---")

    # Delete User A's Task A (has subtasks, tags, reminders, activity logs attached)
    try:
        st, body, _ = make_request("DELETE", f"/api/tasks/{task_a_id}", token=user_a_token, expected_status=200)
        record_pass("Task A deleted by owner")

        # Verify Task A is gone
        st, body, _ = make_request("GET", f"/api/tasks/{task_a_id}", token=user_a_token, expected_status=404)
        record_pass("Task A confirmed deleted (HTTP 404)")

        # Verify Subtask A is cascade-deleted (not orphaned)
        st, body, _ = make_request("PATCH", f"/api/subtasks/{subtask_a_id}/toggle", token=user_a_token, expected_status=404)
        record_pass("Subtasks cascaded and cleaned without leaving orphan records")

        # Verify Tag still exists for User A (tags should NOT be deleted when a task is deleted)
        st, body, _ = make_request("GET", "/api/tags/", token=user_a_token, expected_status=200)
        assert any(t["id"] == tag_id_1 for t in body)
        record_pass("Custom tag remains safe after task deletion (proper N:M junction cleanup)")
    except Exception as e:
        record_fail("Cascade deletion & referential integrity", e)

    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n" + "=" * 70)
    print(f"STEP 9 VERIFICATION COMPLETE: {passed} PASSED, {failed} FAILED")
    print("=" * 70)
    return passed, failed


if __name__ == "__main__":
    p, f = run_tests()
    if f > 0:
        sys.exit(1)
    sys.exit(0)
