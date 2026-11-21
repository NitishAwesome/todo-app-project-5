import urllib.request
import urllib.error
import json
import time
import sys
import os
from dotenv import load_dotenv

load_dotenv("fastapi-backend/.env")
load_dotenv(".env")

BASE_URL = "http://127.0.0.1:8000"

def req(path, method="GET", body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    request = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method=method)
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
    print("=== STARTING FULL PLANOVA STEP 7 E2E INTEGRATION TEST SUITE ===")

    # 1. Admin Authentication with Environment Credentials
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_pwd = os.environ.get("ADMIN_PASSWORD")
    print(f"\n1. Testing Admin Login with '{admin_email}'...")
    status, res = req("/api/auth/login", "POST", {"email": admin_email, "password": admin_pwd})
    assert status == 200, f"Admin login failed: {status} {res}"
    admin_token = res["access_token"]
    assert res["user"]["role"] == "Admin", "User is not Admin"
    print("✓ Admin login successful! Token issued.")

    # 2. Test User Registration & Login
    test_email = f"user_step7_{int(time.time())}@planova.com"
    print(f"\n2. Testing User Registration for {test_email}...")
    status, res = req("/api/auth/register", "POST", {
        "name": "Step7 Tester",
        "email": test_email,
        "password": "Password123!"
    })
    assert status == 201, f"Registration failed: {status} {res}"

    status, res = req("/api/auth/login", "POST", {
        "email": test_email,
        "password": "Password123!"
    })
    assert status == 200, f"Login failed: {status} {res}"
    user_token = res["access_token"]
    user_id = res["user"]["id"]
    print("✓ User registered and authenticated successfully!")

    # 3. Create Task
    print("\n3. Testing Task Creation...")
    status, task = req("/api/tasks/", "POST", {
        "title": "Build Planova Step 7 Frontend Integration",
        "description": "Subtasks, tags, reminders, notifications, and dark mode preferences.",
        "priority": "High",
        "status": "Pending",
        "due_date": "2026-11-28"
    }, token=user_token)
    assert status == 201, f"Task creation failed: {status} {task}"
    task_id = task["id"]
    print(f"✓ Task created successfully with ID: {task_id}")

    # 4. Create and Toggle Subtasks
    print("\n4. Testing Subtasks & Checklist...")
    status, sub1 = req(f"/api/tasks/{task_id}/subtasks", "POST", {"title": "Design dark theme tokens"}, token=user_token)
    assert status == 201, f"Subtask 1 creation failed: {status} {sub1}"
    sub1_id = sub1["id"]

    status, sub2 = req(f"/api/tasks/{task_id}/subtasks", "POST", {"title": "Implement notification bell"}, token=user_token)
    assert status == 201, f"Subtask 2 creation failed: {status} {sub2}"
    sub2_id = sub2["id"]

    status, sub3 = req(f"/api/tasks/{task_id}/subtasks", "POST", {"title": "Verify MySQL cascade delete"}, token=user_token)
    assert status == 201, f"Subtask 3 creation failed: {status} {sub3}"

    # Toggle subtask 1 to completed
    status, toggled = req(f"/api/subtasks/{sub1_id}/toggle", "PATCH", token=user_token)
    assert status == 200 and toggled["is_completed"] is True, f"Toggle failed: {status} {toggled}"
    print(f"✓ Subtasks created (3) and Subtask {sub1_id} toggled to completed.")

    # 5. Tags and Tag Assignment
    print("\n5. Testing Custom Tags...")
    status, tags_list = req("/api/tags/", "GET", token=user_token)
    assert status == 200 and len(tags_list) >= 4, f"Tags listing failed: {status} {tags_list}"
    print(f"✓ Default seeded tags found: {[t['name'] for t in tags_list]}")

    status, custom_tag = req("/api/tags/", "POST", {"name": "Phase7", "color": "#8b5cf6"}, token=user_token)
    assert status == 201, f"Custom tag creation failed: {status} {custom_tag}"
    custom_tag_id = custom_tag["id"]

    # Assign tags to task
    tag_ids_to_assign = [tags_list[0]["id"], custom_tag_id]
    status, assigned_tags = req(f"/api/tasks/{task_id}/tags", "POST", {"tag_ids": tag_ids_to_assign}, token=user_token)
    assert status == 200 and len(assigned_tags) == 2, f"Tag assignment failed: {status} {assigned_tags}"
    print(f"✓ Assigned {len(assigned_tags)} tags to Task {task_id}.")

    # 6. Verify Task retrieval includes Subtasks & Tags
    print("\n6. Testing Task Response with Subtasks & Tags...")
    status, user_tasks = req("/api/tasks/", "GET", token=user_token)
    assert status == 200, f"Get tasks failed: {status} {user_tasks}"
    target_task = next((t for t in user_tasks if t["id"] == task_id), None)
    assert target_task is not None, "Created task not in task list"
    assert len(target_task.get("subtasks", [])) == 3, f"Expected 3 subtasks, got {len(target_task.get('subtasks', []))}"
    assert len(target_task.get("tags", [])) == 2, f"Expected 2 tags, got {len(target_task.get('tags', []))}"
    print(f"✓ Task {task_id} returned with {len(target_task['subtasks'])} subtasks and {len(target_task['tags'])} tags!")

    # 7. Task Activity Log
    print("\n7. Testing Task Activity History Audit Logs...")
    status, activity = req(f"/api/tasks/{task_id}/activity", "GET", token=user_token)
    assert status == 200 and len(activity) >= 2, f"Activity logs failed: {status} {activity}"
    actions = [a["action"] for a in activity]
    print(f"✓ Activity logs found ({len(activity)} entries): {actions}")

    # 8. Reminders & Due Processing to In-App Notifications
    print("\n8. Testing Reminders & In-App Notifications...")
    past_due_time = "2026-11-20T10:00:00" # Past time to trigger immediate notification on process-due
    status, reminder = req("/api/reminders/", "POST", {"task_id": task_id, "remind_at": past_due_time}, token=user_token)
    assert status == 201, f"Reminder creation failed: {status} {reminder}"
    print(f"✓ Scheduled reminder created for Task {task_id}")

    # Process due reminders
    status, process_res = req("/api/reminders/process-due", "POST", token=user_token)
    assert status == 200, f"Process due failed: {status} {process_res}"
    print(f"✓ Processed due reminders: {process_res}")

    # Verify notification unread count
    status, unread = req("/api/notifications/unread-count", "GET", token=user_token)
    assert status == 200 and unread["unread_count"] >= 1, f"Unread count check failed: {status} {unread}"
    print(f"✓ In-App Notifications unread count: {unread['unread_count']}")

    # Get notifications list
    status, notifs = req("/api/notifications/", "GET", token=user_token)
    assert status == 200 and len(notifs) >= 1, f"Notifications list failed: {status} {notifs}"
    notif_id = notifs[0]["id"]
    print(f"✓ Latest notification: '{notifs[0]['title']}' - {notifs[0]['message']}")

    # Mark notification as read
    status, read_notif = req(f"/api/notifications/{notif_id}/read", "PATCH", token=user_token)
    assert status == 200 and read_notif["is_read"] is True, f"Mark read failed: {status} {read_notif}"
    print("✓ Notification successfully marked as read!")

    # 9. User Preferences & Dark Mode
    print("\n9. Testing User Preferences & Dark Mode Persistence...")
    status, prefs = req("/api/preferences/", "GET", token=user_token)
    assert status == 200, f"Get preferences failed: {status} {prefs}"
    print(f"✓ Default preferences: theme={prefs['theme']}, default_view={prefs['default_task_view']}")

    # Update preferences
    status, updated_prefs = req("/api/preferences/", "PATCH", {
        "theme": "dark",
        "default_task_view": "kanban",
        "notifications_enabled": True,
        "timezone": "Asia/Kolkata"
    }, token=user_token)
    assert status == 200, f"Update preferences failed: {status} {updated_prefs}"
    assert updated_prefs["theme"] == "dark"
    assert updated_prefs["default_task_view"] == "kanban"
    assert updated_prefs["timezone"] == "Asia/Kolkata"
    print("✓ Preferences updated: theme='dark', default_task_view='kanban', timezone='Asia/Kolkata' saved to MySQL!")

    print("\n=======================================================")
    print("ALL 9 TEST SUITES PASSED 100% WITH ZERO ERRORS!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
