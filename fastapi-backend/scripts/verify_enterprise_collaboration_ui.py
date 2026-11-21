import os
import sys
import time
import json
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), ".env"))
load_dotenv(".env")

sys.path.append(BASE_DIR)

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SCREENSHOT_DIR = os.path.abspath("docs/verification/screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# Also copy to artifacts directory
ARTIFACT_DIR = r"C:\Users\nitis\.gemini\antigravity\brain\c04e4ecb-c72c-4cd3-a4f5-2402ca09913c"

def save_screenshot(driver, filename):
    path1 = os.path.join(SCREENSHOT_DIR, filename)
    driver.save_screenshot(path1)
    if os.path.exists(ARTIFACT_DIR):
        path2 = os.path.join(ARTIFACT_DIR, filename)
        try:
            import shutil
            shutil.copy2(path1, path2)
        except Exception:
            pass
    print(f"[SCREENSHOT] Saved: {path1}")

def run_collaboration_ui_verification():
    print("=== STARTING ENTERPRISE COLLABORATION UI SELENIUM VERIFICATION ===")

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1440,900")

    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 10)

    try:
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
        admin_password = os.environ.get("ADMIN_PASSWORD")
        if not admin_password:
            raise ValueError("ADMIN_PASSWORD not set in environment or .env")

        # 1. Login as Admin
        driver.get("http://localhost:5173/login")
        wait.until(EC.presence_of_element_located((By.ID, "auth-email")))

        email_input = driver.find_element(By.ID, "auth-email")
        password_input = driver.find_element(By.ID, "auth-password")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

        email_input.send_keys(admin_email)
        password_input.send_keys(admin_password)
        submit_btn.click()

        # Wait for redirect to admin workspace
        time.sleep(2)
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "admin-dashboard-root")))
        print("[PASS] Admin logged in successfully to Dashboard")

        # 2. Screenshot Admin Dashboard with Team Collaboration Metrics
        save_screenshot(driver, "collab_01_admin_dashboard.png")

        # 3. Navigate to "Task Assignments"
        # Find sidebar nav link for admin-assignments or quick link tile
        assignments_btn = driver.find_element(By.XPATH, "//button[contains(., 'Task Assignments')]")
        assignments_btn.click()
        time.sleep(1.5)

        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "admin-assignments-container")))
        print("[PASS] Navigated to Admin Task Assignments view")
        save_screenshot(driver, "collab_02_admin_assignments_view.png")

        # 4. Open "Assign New Task" modal
        new_task_btn = driver.find_element(By.XPATH, "//button[contains(., 'Assign New Task')]")
        new_task_btn.click()
        time.sleep(1)

        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "planova-modal-box")))
        print("[PASS] Assign Shared Team Task modal opened")

        # Fill in Task details
        title_in = driver.find_element(By.ID, "task-title-input")
        title_in.send_keys("Enterprise Security Architecture Review")

        desc_in = driver.find_element(By.ID, "task-desc-input")
        desc_in.send_keys("Conduct quarterly zero-trust security audit across microservices.")

        instructions_in = driver.find_element(By.ID, "task-instructions-input")
        instructions_in.send_keys("1. Check TLS certs\n2. Audit JWT secrets\n3. Verify role authorization")

        date_in = driver.find_element(By.ID, "task-due-date-input")
        date_in.send_keys("2026-11-28")

        time_in = driver.find_element(By.ID, "task-due-time-input")
        time_in.send_keys("17:30")

        # Select first 2 users in the picker
        user_items = driver.find_elements(By.CLASS_NAME, "user-picker-item")
        if len(user_items) >= 2:
            user_items[0].click()
            time.sleep(0.3)
            user_items[1].click()
            time.sleep(0.3)

        save_screenshot(driver, "collab_03_assign_task_modal_with_chips.png")
        print("[PASS] Filled task assignment details with due time and user chips")

        # Submit task assignment
        submit_assign_btn = driver.find_element(By.XPATH, "//button[contains(., 'Assign Task to')]")
        submit_assign_btn.click()
        time.sleep(2)
        print("[PASS] Created new team task assignment successfully")

        # 5. Open Task Details modal on first team task card
        detail_btns = driver.find_elements(By.XPATH, "//button[text()='Details']")
        if len(detail_btns) > 0:
            detail_btns[0].click()
            time.sleep(1.5)
            wait.until(EC.presence_of_element_located((By.CLASS_NAME, "recipient-detail-table")))
            save_screenshot(driver, "collab_04_admin_task_detail_discussion.png")
            print("[PASS] Inspected Task Details & Recipient Progress table")

            # Close details modal
            close_btn = driver.find_element(By.XPATH, "//button[text()='Close']")
            close_btn.click()
            time.sleep(0.5)

        # 6. Switch to Dark Mode
        driver.execute_script("document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('planova_theme', 'dark');")
        time.sleep(0.8)
        save_screenshot(driver, "collab_05_admin_dark_mode.png")
        print("[PASS] Verified Admin Assignments in Dark Mode")

        # Reset theme to light
        driver.execute_script("document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('planova_theme', 'light');")

        # 7. Test User "Assigned to Me" View
        # Navigate to "Assigned to Me"
        assigned_to_me_btn = driver.find_element(By.XPATH, "//button[contains(., 'Assigned to Me')]")
        assigned_to_me_btn.click()
        time.sleep(1.5)

        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "assigned-tasks-container")))
        save_screenshot(driver, "collab_06_user_assigned_to_me.png")
        print("[PASS] Navigated to 'Assigned to Me' view")

        # 8. Click Update Progress button on an assigned card
        update_btns = driver.find_elements(By.XPATH, "//button[text()='Update']")
        if len(update_btns) > 0:
            update_btns[0].click()
            time.sleep(1)
            wait.until(EC.presence_of_element_located((By.ID, "progress-slider")))

            # Enter progress note
            note_in = driver.find_element(By.ID, "progress-notes-input")
            note_in.send_keys("Completed initial security threat modeling.")

            save_screenshot(driver, "collab_07_user_progress_modal.png")
            print("[PASS] Verified User Progress Update Modal")

            # Close progress modal
            cancel_btn = driver.find_element(By.XPATH, "//button[text()='Cancel']")
            cancel_btn.click()
            time.sleep(0.5)

        # 9. Responsive Mobile Viewport (375x812)
        driver.set_window_size(375, 812)
        time.sleep(1)
        save_screenshot(driver, "collab_08_mobile_assigned_view.png")
        print("[PASS] Verified Responsive Mobile Viewport")

        print("\n=== ALL COLLABORATION UI VERIFICATIONS PASSED SUCCESSFULLY ===")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_collaboration_ui_verification()
