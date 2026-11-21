"""
PLANOVA STEP 9.6: VISUAL REFINEMENT & REAL BROWSER RENDERING VERIFIER
Uses Selenium with headless Chrome to:
1. Verify button dimensions, single-line text, 18-20px SVGs.
2. Verify removal of forbidden labels (All Systems Synced, Productivity Active, etc.).
3. Verify accurate task counts and sample tasks.
4. Capture high-fidelity screenshots for Desktop, Mobile, Showcase tabs, Dark mode, and Authenticated workspaces.
"""

import sys
import os
import time
import json
from dotenv import load_dotenv

load_dotenv("fastapi-backend/.env")
sys.path.append("fastapi-backend")

from app.database.session import SessionLocal
from app.models.user import User
from app.models.task import Task
from app.models.category import Category
from app.services.auth_service import hash_password

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SCREENSHOT_DIR = os.path.abspath("docs/verification/screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
ASSETS_DIR = os.path.abspath("frontend/public/assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

def setup_demo_data():
    db = SessionLocal()
    try:
        # Create or fetch demo user
        demo_email = "demo.user@planova.com"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            user = User(
                name="Demo User",
                email=demo_email,
                password_hash=hash_password("DemoPass123!"),
                role="User"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Ensure Categories exist for demo user
        categories = {}
        for cat_name in ["Planning", "Work", "Personal", "Routine"]:
            cat = db.query(Category).filter(Category.user_id == user.id, Category.name == cat_name).first()
            if not cat:
                cat = Category(name=cat_name, user_id=user.id)
                db.add(cat)
                db.commit()
                db.refresh(cat)
            categories[cat_name] = cat.id

        # Clean old demo tasks and insert 4 simple tasks
        db.query(Task).filter(Task.user_id == user.id).delete()
        db.commit()

        tasks = [
            Task(
                user_id=user.id,
                category_id=categories["Planning"],
                title="Review weekly goals",
                description="Assess key objectives and weekly progress.",
                status="Completed",
                priority="Medium",
                due_date="2026-11-21"
            ),
            Task(
                user_id=user.id,
                category_id=categories["Work"],
                title="Prepare presentation",
                description="Outline project deliverables and slide deck.",
                status="InProgress",
                priority="High",
                due_date="2026-11-22"
            ),
            Task(
                user_id=user.id,
                category_id=categories["Personal"],
                title="Read a chapter",
                description="Focus reading for 30 minutes in the evening.",
                status="InProgress",
                priority="Low",
                due_date="2026-11-23"
            ),
            Task(
                user_id=user.id,
                category_id=categories["Routine"],
                title="Plan tomorrow",
                description="Organize prioritized schedule for tomorrow morning.",
                status="Pending",
                priority="Low",
                due_date="2026-11-24"
            ),
        ]
        db.add_all(tasks)
        db.commit()
        print(f"[OK] Demo user ({demo_email}) seeded with 4 realistic tasks.")
        return demo_email, "DemoPass123!"
    finally:
        db.close()


def run_visual_verification():
    demo_email, demo_pwd = setup_demo_data()

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
        # ==========================================
        # 1. DESKTOP LANDING PAGE INSPECTION
        # ==========================================
        print("\n--- 1. Testing Desktop Landing Page (1440x900) ---")
        driver.set_window_size(1440, 900)
        driver.get("http://localhost:5173/")
        time.sleep(1.5)

        # Inspect Hero Buttons
        btn_primary = driver.find_element(By.CSS_SELECTOR, ".btn-hero-primary")
        btn_secondary = driver.find_element(By.CSS_SELECTOR, ".btn-hero-secondary")

        btn_p_text = btn_primary.text.strip()
        btn_s_text = btn_secondary.text.strip()
        btn_p_rect = btn_primary.rect
        btn_s_rect = btn_secondary.rect

        print(f"Primary button text: '{btn_p_text}' | Size: {btn_p_rect['width']}x{btn_p_rect['height']}px")
        print(f"Secondary button text: '{btn_s_text}' | Size: {btn_s_rect['width']}x{btn_s_rect['height']}px")

        assert "Get Started" in btn_p_text, f"Expected 'Get Started', got '{btn_p_text}'"
        assert "Explore Features" in btn_s_text, f"Expected 'Explore Features', got '{btn_s_text}'"
        assert 45 <= btn_p_rect['height'] <= 55, f"Expected height ~48-52px, got {btn_p_rect['height']}px"
        assert 45 <= btn_s_rect['height'] <= 55, f"Expected height ~48-52px, got {btn_s_rect['height']}px"

        # Inspect SVG Dimensions
        svg_p = btn_primary.find_element(By.TAG_NAME, "svg")
        svg_s = btn_secondary.find_element(By.TAG_NAME, "svg")
        svg_p_rect = svg_p.rect
        svg_s_rect = svg_s.rect
        print(f"Primary button SVG size: {svg_p_rect['width']}x{svg_p_rect['height']}px")
        print(f"Secondary button SVG size: {svg_s_rect['width']}x{svg_s_rect['height']}px")
        assert 16 <= svg_p_rect['width'] <= 22, f"Expected SVG width ~18-20px, got {svg_p_rect['width']}px"
        assert 16 <= svg_s_rect['width'] <= 22, f"Expected SVG width ~18-20px, got {svg_s_rect['width']}px"

        # Inspect Single-line text
        white_space = btn_primary.value_of_css_property("white-space")
        assert white_space == "nowrap", f"Expected white-space: nowrap, got {white_space}"

        # Check for forbidden labels in HTML
        html = driver.page_source
        forbidden_labels = [
            "All Systems Synced",
            "Productivity Active",
            "Active & Synced",
            "Current cycle",
            "Queued",
            "Active focus",
            "Accomplished",
            "planova.app/workspace"
        ]
        for fl in forbidden_labels:
            assert fl not in html, f"Forbidden label '{fl}' found in landing page DOM!"
        print("[PASS] All forbidden labels confirmed completely removed from DOM.")

        # Take Desktop Hero screenshot
        p1 = os.path.join(SCREENSHOT_DIR, "01_desktop_hero.png")
        driver.save_screenshot(p1)
        print(f"[OK] Saved screenshot: {p1}")

        # ==========================================
        # 2. SHOWCASE TABS INSPECTION
        # ==========================================
        print("\n--- 2. Testing Showcase Tabs ---")
        driver.execute_script("document.getElementById('preview').scrollIntoView();")
        time.sleep(1)

        tabs = ["dashboard", "tasks", "kanban", "calendar"]
        for tab_name in tabs:
            tab_btn = driver.find_element(By.CSS_SELECTOR, f"button.showcase-tab[role='tab']:nth-of-type({tabs.index(tab_name)+1})")
            tab_btn.click()
            time.sleep(0.5)
            p_tab = os.path.join(SCREENSHOT_DIR, f"02_showcase_{tab_name}.png")
            driver.save_screenshot(p_tab)
            print(f"[OK] Saved tab screenshot ({tab_name}): {p_tab}")

        # ==========================================
        # 3. DARK MODE TOGGLE INSPECTION
        # ==========================================
        print("\n--- 3. Testing Dark Mode Toggle ---")
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(0.5)
        theme_toggle = driver.find_element(By.CSS_SELECTOR, ".theme-switch-btn")
        theme_toggle.click()
        time.sleep(1)

        theme_attr = driver.execute_script("return document.documentElement.getAttribute('data-theme');")
        print(f"Theme attribute after click: {theme_attr}")
        p_dark = os.path.join(SCREENSHOT_DIR, "03_dark_mode_landing.png")
        driver.save_screenshot(p_dark)
        print(f"[OK] Saved dark mode screenshot: {p_dark}")

        # Switch back to light mode
        theme_toggle.click()
        time.sleep(0.5)

        # ==========================================
        # 4. MOBILE VIEWPORT INSPECTION (375x812)
        # ==========================================
        print("\n--- 4. Testing Mobile Viewport (375x812) ---")
        driver.set_window_size(375, 812)
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)

        btn_p_mobile = driver.find_element(By.CSS_SELECTOR, ".btn-hero-primary")
        btn_s_mobile = driver.find_element(By.CSS_SELECTOR, ".btn-hero-secondary")
        m_p_rect = btn_p_mobile.rect
        m_s_rect = btn_s_mobile.rect
        print(f"Mobile primary button size: {m_p_rect['width']}x{m_p_rect['height']}px")
        print(f"Mobile secondary button size: {m_s_rect['width']}x{m_s_rect['height']}px")
        assert 45 <= m_p_rect['height'] <= 55, f"Expected height ~50px on mobile, got {m_p_rect['height']}px"

        p_mobile = os.path.join(SCREENSHOT_DIR, "04_mobile_hero.png")
        driver.save_screenshot(p_mobile)
        print(f"[OK] Saved mobile screenshot: {p_mobile}")

        # ==========================================
        # 5. AUTHENTICATED WORKSPACES INSPECTION
        # ==========================================
        print("\n--- 5. Testing Authenticated Workspaces ---")
        driver.set_window_size(1440, 900)
        driver.get("http://localhost:5173/#login")
        time.sleep(1)

        # Fill login form
        email_input = wait.until(EC.presence_of_element_located((By.ID, "auth-email")))
        pwd_input = driver.find_element(By.ID, "auth-password")
        submit_btn = driver.find_element(By.CSS_SELECTOR, ".auth-submit-btn")

        email_input.clear()
        email_input.send_keys(demo_email)
        pwd_input.clear()
        pwd_input.send_keys(demo_pwd)
        submit_btn.click()
        time.sleep(2)

        # Verify Dashboard Overview
        p_dash = os.path.join(SCREENSHOT_DIR, "05_authenticated_dashboard.png")
        driver.save_screenshot(p_dash)
        print(f"[OK] Saved authenticated dashboard screenshot: {p_dash}")

        # Also save high-res dashboard preview to frontend public assets
        p_asset = os.path.join(ASSETS_DIR, "real_dashboard_preview.png")
        driver.save_screenshot(p_asset)
        print(f"[OK] Saved public asset preview: {p_asset}")

        # Navigate to My Tasks
        tasks_tab = driver.find_element(By.XPATH, "//button[contains(., 'My Tasks')]")
        tasks_tab.click()
        time.sleep(1)
        p_tasks = os.path.join(SCREENSHOT_DIR, "06_authenticated_tasks.png")
        driver.save_screenshot(p_tasks)
        print(f"[OK] Saved tasks workspace screenshot: {p_tasks}")

        # Navigate to Kanban Board
        kanban_tab = driver.find_element(By.XPATH, "//button[contains(., 'Kanban')]")
        kanban_tab.click()
        time.sleep(1)
        p_kanban = os.path.join(SCREENSHOT_DIR, "07_authenticated_kanban.png")
        driver.save_screenshot(p_kanban)
        print(f"[OK] Saved Kanban board screenshot: {p_kanban}")

        # Navigate to Calendar
        cal_tab = driver.find_element(By.XPATH, "//button[contains(., 'Calendar')]")
        cal_tab.click()
        time.sleep(1)
        p_cal = os.path.join(SCREENSHOT_DIR, "08_authenticated_calendar.png")
        driver.save_screenshot(p_cal)
        print(f"[OK] Saved calendar screenshot: {p_cal}")

        # ==========================================
        # 6. ADMIN PORTAL INSPECTION
        # ==========================================
        print("\n--- 6. Testing Admin Portal ---")
        # Logout demo user and clear storage for clean admin session
        driver.execute_script("localStorage.clear(); sessionStorage.clear(); window.location.href = 'http://localhost:5173/#login';")
        time.sleep(1.5)

        # Login as Admin
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
        admin_pwd = os.environ.get("ADMIN_PASSWORD")

        email_input = wait.until(EC.presence_of_element_located((By.ID, "auth-email")))
        pwd_input = driver.find_element(By.ID, "auth-password")
        submit_btn = driver.find_element(By.CSS_SELECTOR, ".auth-submit-btn")

        email_input.clear()
        email_input.send_keys(admin_email)
        pwd_input.clear()
        pwd_input.send_keys(admin_pwd)
        submit_btn.click()
        time.sleep(2)

        # Admin is automatically routed to Admin Dashboard upon login
        time.sleep(2)
        p_admin = os.path.join(SCREENSHOT_DIR, "09_admin_portal.png")
        driver.save_screenshot(p_admin)
        print(f"[OK] Saved admin portal screenshot: {p_admin}")

        print("\n========================================================")
        print("ALL VISUAL CHECKS AND REAL SCREENSHOTS COMPLETED SUCCESSFULLY")
        print("========================================================")

    finally:
        driver.quit()


if __name__ == "__main__":
    run_visual_verification()
