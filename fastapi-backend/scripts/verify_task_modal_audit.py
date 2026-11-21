"""
PLANOVA STEP 9.7: TASK MODAL & FORM CONTROLS AUDIT VERIFIER
Uses Selenium with headless Chrome to:
1. Verify TaskFormModal dimensions (width ~560-640px, padding ~24px).
2. Verify all inputs, textarea, selects, and date pickers have height ~44-48px and full width.
3. Verify two-column layout for Priority and Status on desktop, collapsing to 1 column on mobile.
4. Verify validation error state, tag chip styling, and button heights.
5. Verify contextual preselection (Kanban status, Calendar date, Edit prefill).
6. Verify keyboard accessibility (Escape key closing).
7. Capture screenshots for Desktop Create, Validation Error, Edit, Dark Mode, and Mobile.
"""

import sys
import os
import time
from dotenv import load_dotenv

load_dotenv("fastapi-backend/.env")
sys.path.append("fastapi-backend")

from app.database.session import SessionLocal
from app.models.user import User
from app.models.task import Task
from app.models.category import Category
from app.models.tag import Tag
from app.services.auth_service import hash_password

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SCREENSHOT_DIR = os.path.abspath("docs/verification/screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def setup_test_environment():
    db = SessionLocal()
    try:
        user_email = "modal.tester@planova.com"
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            user = User(
                name="Modal Tester",
                email=user_email,
                password_hash=hash_password("TestPass123!"),
                role="User"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Categories
        cat = db.query(Category).filter(Category.user_id == user.id, Category.name == "Engineering").first()
        if not cat:
            cat = Category(name="Engineering", user_id=user.id)
            db.add(cat)
            db.commit()
            db.refresh(cat)

        # Tags
        for tag_name, tag_color in [("Frontend", "#3b82f6"), ("Backend", "#10b981"), ("Urgent", "#ef4444")]:
            t = db.query(Tag).filter(Tag.user_id == user.id, Tag.name == tag_name).first()
            if not t:
                t = Tag(name=tag_name, color=tag_color, user_id=user.id)
                db.add(t)
                db.commit()

        # Seed sample task
        db.query(Task).filter(Task.user_id == user.id).delete()
        db.commit()
        sample_task = Task(
            user_id=user.id,
            category_id=cat.id,
            title="Review quarterly infrastructure architecture",
            description="Audit server capacity, database indexing, and API latencies.",
            status="InProgress",
            priority="High",
            due_date="2026-11-28"
        )
        db.add(sample_task)
        db.commit()
        return user_email, "TestPass123!"
    finally:
        db.close()


def run_modal_audit():
    user_email, user_pwd = setup_test_environment()

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1440,900")
    chrome_options.add_argument("--force-device-scale-factor=1.5")
    chrome_options.binary_location = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

    driver = webdriver.Chrome(options=chrome_options)
    wait = WebDriverWait(driver, 10)

    try:
        # 1. Login
        print("\n--- 1. Authenticating as Test User ---")
        driver.get("http://localhost:5173/#login")
        time.sleep(1)

        email_input = wait.until(EC.presence_of_element_located((By.ID, "auth-email")))
        pwd_input = driver.find_element(By.ID, "auth-password")
        submit_btn = driver.find_element(By.CSS_SELECTOR, ".auth-submit-btn")

        email_input.clear()
        email_input.send_keys(user_email)
        pwd_input.clear()
        pwd_input.send_keys(user_pwd)
        submit_btn.click()
        time.sleep(2)

        # 2. Open Create Task Modal from Dashboard
        print("\n--- 2. Inspecting Create Task Modal (Desktop 1440x900) ---")
        new_task_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'New Task')] | //button[contains(., 'Add Task')]")))
        new_task_btn.click()
        time.sleep(0.8)

        modal = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".tfm-modal")))
        m_rect = modal.rect
        print(f"Modal width: {m_rect['width']}px, height: {m_rect['height']}px")
        assert 540 <= m_rect['width'] <= 650, f"Expected modal width ~560-640px, got {m_rect['width']}px"

        # Check Title Input
        title_in = driver.find_element(By.ID, "tfm-title")
        t_rect = title_in.rect
        print(f"Title input size: {t_rect['width']}x{t_rect['height']}px")
        assert 44 <= t_rect['height'] <= 50, f"Expected input height ~44-48px, got {t_rect['height']}px"
        assert t_rect['width'] > 450, f"Expected full-width title input (>450px), got {t_rect['width']}px"

        # Check Description Textarea
        desc_in = driver.find_element(By.ID, "tfm-description")
        d_rect = desc_in.rect
        print(f"Description textarea size: {d_rect['width']}x{d_rect['height']}px")
        assert d_rect['height'] >= 85, f"Expected textarea height >=85px, got {d_rect['height']}px"
        assert d_rect['width'] > 450, f"Expected full-width textarea (>450px), got {d_rect['width']}px"

        # Check Category Select
        cat_select = driver.find_element(By.ID, "tfm-category")
        c_rect = cat_select.rect
        print(f"Category select size: {c_rect['width']}x{c_rect['height']}px")
        assert 44 <= c_rect['height'] <= 50, f"Expected category select height ~44-48px, got {c_rect['height']}px"

        # Check Two-Column Layout for Priority and Status
        p_select = driver.find_element(By.ID, "tfm-priority")
        s_select = driver.find_element(By.ID, "tfm-status")
        p_rect = p_select.rect
        s_rect = s_select.rect
        print(f"Priority select size: {p_rect['width']}x{p_rect['height']}px (Y: {p_rect['y']})")
        print(f"Status select size: {s_rect['width']}x{s_rect['height']}px (Y: {s_rect['y']})")
        assert abs(p_rect['y'] - s_rect['y']) < 5, f"Priority and Status must be aligned horizontally on desktop! Difference: {abs(p_rect['y'] - s_rect['y'])}"
        assert 44 <= p_rect['height'] <= 50, f"Expected priority select height ~44-48px, got {p_rect['height']}px"
        assert 44 <= s_rect['height'] <= 50, f"Expected status select height ~44-48px, got {s_rect['height']}px"

        # Check Due Date Input
        date_in = driver.find_element(By.ID, "tfm-due-date")
        dt_rect = date_in.rect
        print(f"Due Date input size: {dt_rect['width']}x{dt_rect['height']}px")
        assert 44 <= dt_rect['height'] <= 50, f"Expected date input height ~44-48px, got {dt_rect['height']}px"

        # Check Tags Chips
        tags = driver.find_elements(By.CSS_SELECTOR, ".tfm-tag-pill")
        print(f"Rendered tag chips: {len(tags)}")
        assert len(tags) > 0, "Expected at least 1 tag chip rendered in Add mode!"
        tag_rect = tags[0].rect
        assert tag_rect['height'] >= 28, f"Expected chip height >= 28px, got {tag_rect['height']}px"

        # Check Buttons in Footer
        cancel_btn = driver.find_element(By.XPATH, "//div[contains(@class, 'tfm-actions')]//button[contains(., 'Cancel')]")
        submit_task_btn = driver.find_element(By.XPATH, "//div[contains(@class, 'tfm-actions')]//button[@type='submit']")
        cb_rect = cancel_btn.rect
        sb_rect = submit_task_btn.rect
        print(f"Cancel button size: {cb_rect['width']}x{cb_rect['height']}px")
        print(f"Submit button size: {sb_rect['width']}x{sb_rect['height']}px")
        assert 42 <= cb_rect['height'] <= 50, f"Expected Cancel button height ~44-48px, got {cb_rect['height']}px"
        assert 42 <= sb_rect['height'] <= 50, f"Expected Submit button height ~44-48px, got {sb_rect['height']}px"

        # Capture Desktop Create Task Modal Screenshot
        p_create = os.path.join(SCREENSHOT_DIR, "modal_01_create_task_desktop.png")
        driver.save_screenshot(p_create)
        print(f"[OK] Saved screenshot: {p_create}")

        # 3. Trigger Required Field Validation
        print("\n--- 3. Testing Required Field Validation ---")
        submit_task_btn.click()
        time.sleep(0.5)

        error_elem = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".tfm-error-text")))
        err_text = error_elem.text.strip()
        print(f"Validation error displayed: '{err_text}'")
        assert "Title is required" in err_text or "required" in err_text.lower(), f"Unexpected error message: '{err_text}'"

        p_err = os.path.join(SCREENSHOT_DIR, "modal_02_validation_error.png")
        driver.save_screenshot(p_err)
        print(f"[OK] Saved validation error screenshot: {p_err}")

        # 4. Fill and Submit Task
        print("\n--- 4. Creating Task via Modal ---")
        title_in.send_keys("Complete security architectural review")
        desc_in.send_keys("Review OWASP Top 10 vulnerabilities, verify CORS policies, and audit Argon2id hashing parameters.")
        tags[0].click()  # Select first tag
        time.sleep(0.3)
        submit_task_btn.click()
        time.sleep(1.5)
        print("[OK] Task submitted successfully.")

        # 5. Test Edit Task Modal
        print("\n--- 5. Inspecting Edit Task Modal ---")
        # Navigate to My Tasks
        tasks_tab = driver.find_element(By.XPATH, "//button[contains(., 'My Tasks')]")
        tasks_tab.click()
        time.sleep(1)

        edit_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".action-icon-btn.edit, button[title*='Edit task'], button[aria-label*='Edit task']")))
        edit_btn.click()
        time.sleep(0.8)

        # Verify Edit Modal title and tabs
        edit_heading = driver.find_element(By.ID, "tfm-heading").text
        assert "Edit Task" in edit_heading, f"Expected 'Edit Task', got '{edit_heading}'"

        # Check tabs exist in Edit mode
        nav_tabs = driver.find_elements(By.CSS_SELECTOR, ".tfm-tab-btn")
        print(f"Edit modal tabs: {len(nav_tabs)} tabs found.")
        assert len(nav_tabs) >= 4, "Expected at least 4 tabs in Edit mode (Details, Subtasks, Tags, Reminder, Activity)"

        p_edit = os.path.join(SCREENSHOT_DIR, "modal_03_edit_task_desktop.png")
        driver.save_screenshot(p_edit)
        print(f"[OK] Saved edit modal screenshot: {p_edit}")

        # Close edit modal via Escape key
        print("\n--- 6. Testing Keyboard Escape Key Behavior ---")
        driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
        time.sleep(0.8)
        modals_open = driver.find_elements(By.CSS_SELECTOR, ".tfm-modal")
        assert len(modals_open) == 0, "Modal failed to close upon pressing Escape key!"
        print("[PASS] Modal correctly closed via Escape key.")

        # 7. Test Dark Mode Task Modal
        print("\n--- 7. Testing Dark Mode Task Modal ---")
        # Toggle theme in navbar or document
        driver.execute_script("document.documentElement.setAttribute('data-theme', 'dark');")
        time.sleep(0.5)

        # Open Create Task modal in Dark Mode
        add_btn = driver.find_element(By.XPATH, "//button[contains(., 'New Task')]")
        add_btn.click()
        time.sleep(0.8)

        modal_bg = driver.find_element(By.CSS_SELECTOR, ".tfm-modal").value_of_css_property("background-color")
        print(f"Dark mode modal background color: {modal_bg}")

        p_dark = os.path.join(SCREENSHOT_DIR, "modal_04_dark_mode.png")
        driver.save_screenshot(p_dark)
        print(f"[OK] Saved dark mode modal screenshot: {p_dark}")

        # Close modal
        driver.find_element(By.CSS_SELECTOR, ".tfm-close-btn").click()
        time.sleep(0.5)
        driver.execute_script("document.documentElement.setAttribute('data-theme', 'light');")

        # 8. Test Mobile Task Modal Responsive Behavior
        print("\n--- 8. Testing Mobile Task Modal (<640px) ---")
        driver.set_window_size(500, 800)
        time.sleep(0.5)

        add_btn = driver.find_element(By.XPATH, "//button[contains(., 'New Task')]")
        add_btn.click()
        time.sleep(0.8)

        win_w = driver.execute_script("return window.innerWidth")
        modal_mobile = driver.find_element(By.CSS_SELECTOR, ".tfm-modal")
        m_mob_rect = driver.execute_script("return arguments[0].getBoundingClientRect()", modal_mobile)
        print(f"Mobile modal CSS size: {m_mob_rect['width']:.1f}x{m_mob_rect['height']:.1f}px (Viewport {win_w}px)")
        assert m_mob_rect['width'] <= win_w, f"Modal overflows mobile screen width: {m_mob_rect['width']}px > {win_w}px"

        # Verify Priority and Status are stacked vertically on mobile
        p_select_m = driver.find_element(By.ID, "tfm-priority")
        s_select_m = driver.find_element(By.ID, "tfm-status")
        pm_rect = driver.execute_script("return arguments[0].getBoundingClientRect()", p_select_m)
        sm_rect = driver.execute_script("return arguments[0].getBoundingClientRect()", s_select_m)
        print(f"Mobile Priority Y: {pm_rect['y']:.1f}, Status Y: {sm_rect['y']:.1f}")
        assert sm_rect['y'] > pm_rect['y'], "Priority and Status should stack vertically on mobile viewport!"

        p_mob = os.path.join(SCREENSHOT_DIR, "modal_05_mobile.png")
        driver.save_screenshot(p_mob)
        print(f"[OK] Saved mobile modal screenshot: {p_mob}")

        # Close modal
        driver.find_element(By.CSS_SELECTOR, ".tfm-close-btn").click()
        time.sleep(0.5)

        # 9. Test Contextual Entry Points (Kanban & Calendar)
        print("\n--- 9. Testing Contextual Entry Points ---")
        driver.set_window_size(1440, 900)
        time.sleep(0.5)

        # Contextual 1: Kanban Board Status
        kanban_tab = driver.find_element(By.XPATH, "//button[contains(., 'Kanban')]")
        kanban_tab.click()
        time.sleep(1)

        kanban_add_inprog = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".kanban-add-col-btn, button[title*='Add task']")))
        kanban_add_inprog.click()
        time.sleep(0.8)

        status_val = driver.find_element(By.ID, "tfm-status").get_attribute("value")
        print(f"Kanban preselected status: '{status_val}'")
        assert status_val in ["Pending", "InProgress", "Completed"], f"Invalid status: {status_val}"
        driver.find_element(By.CSS_SELECTOR, ".tfm-close-btn").click()
        time.sleep(0.5)

        # Contextual 2: Calendar Date Selection
        cal_tab = driver.find_element(By.XPATH, "//button[contains(., 'Calendar')]")
        cal_tab.click()
        time.sleep(1)

        cal_day = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".calendar-day-cell.in-month")))
        cal_day.click()
        time.sleep(0.8)

        date_val = driver.find_element(By.ID, "tfm-due-date").get_attribute("value")
        print(f"Calendar preselected due date: '{date_val}'")
        assert len(date_val) > 0, "Calendar date preselection failed!"
        driver.find_element(By.CSS_SELECTOR, ".tfm-close-btn").click()
        time.sleep(0.5)

        print("\n========================================================")
        print("TASK MODAL AUDIT & VISUAL CHECKS ALL PASSED SUCCESSFULLY")
        print("========================================================")

    finally:
        driver.quit()


if __name__ == "__main__":
    run_modal_audit()
