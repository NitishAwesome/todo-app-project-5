"""
Planova Demo Data Seeder
Populates a fresh or existing database (local MySQL or TiDB Cloud) with:
- 1 Admin account (admin@example.com)
- 6 Group 5 Team Member accounts (password123 for all)
- Categories, Tags, and Personal Tasks
- 1 Enterprise Shared Team Task assigned to team members
- Idempotent and safe to run multiple times.
"""

import os
import sys
import argparse
from datetime import date, datetime, timedelta, time

# Add fastapi-backend root to sys.path
BASE_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_BACKEND not in sys.path:
    sys.path.append(BASE_BACKEND)

from dotenv import load_dotenv

parser = argparse.ArgumentParser(description="Planova Demo Data Seeder")
parser.add_argument("--env", type=str, default=None, help="Path to environment file (e.g. .env.tidb)")
args, _ = parser.parse_known_args()

target_env = None
if args.env:
    target_env = args.env if os.path.isabs(args.env) else os.path.abspath(os.path.join(os.getcwd(), args.env))
else:
    tidb_candidate = os.path.join(BASE_BACKEND, ".env.tidb")
    local_candidate = os.path.join(BASE_BACKEND, ".env")
    if os.path.exists(tidb_candidate):
        target_env = tidb_candidate
    elif os.path.exists(local_candidate):
        target_env = local_candidate

if target_env and os.path.exists(target_env):
    load_dotenv(target_env, override=True)
    env_display = os.path.relpath(target_env, os.path.dirname(BASE_BACKEND))
else:
    load_dotenv(override=True)
    env_display = "system environment"

from sqlalchemy import create_engine, URL
from sqlalchemy.orm import sessionmaker

db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST", "localhost")
db_port = int(os.getenv("DB_PORT", "3306"))
db_name = os.getenv("DB_NAME", "todo_app")
db_ssl_env = os.getenv("DB_SSL", "").strip().lower()
db_ssl_ca = os.getenv("DB_SSL_CA", "")

use_ssl = db_ssl_env in ("true", "1", "yes") or (db_port == 4000 and db_ssl_env != "false")

connect_args = {}
if use_ssl:
    import certifi
    ca_path = db_ssl_ca
    if not ca_path or not os.path.exists(ca_path):
        ca_path = certifi.where()
    connect_args["ssl"] = {
        "ca": ca_path,
        "check_hostname": True,
    }

db_url = URL.create(
    drivername="mysql+pymysql",
    username=db_user,
    password=db_password,
    host=db_host,
    port=db_port,
    database=db_name
)

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

from app.models.user import User
from app.models.category import Category
from app.models.task import Task
from app.models.subtask import Subtask
from app.models.tag import Tag
from app.models.team_task import TeamTask, TaskAssignment, AssignmentDiscussion
from app.models.user_preference import UserPreference
from app.services.auth_service import hash_password


def seed_data():
    print("=" * 65)
    print("PLANOVA — SEEDING DEMO USERS AND STARTER WORKSPACE DATA")
    print("=" * 65)
    print(f"Target Database : {db_name} on {db_host}:{db_port}")
    print(f"Loaded Config   : {env_display}")
    print(f"SSL / TLS       : {'YES (Verified)' if use_ssl else 'NO'}")

    db = SessionLocal()
    default_pwd = hash_password("password123")

    try:
        # 1. Seed Team Accounts
        team_members = [
            {"name": "Admin One", "email": "admin@example.com", "role": "Admin"},
            {"name": "Sarthak Kene", "email": "sarthak@planova.com", "role": "User"},
            {"name": "Rehan Malim", "email": "rehan@planova.com", "role": "User"},
            {"name": "Sanskruti", "email": "sanskruti@planova.com", "role": "User"},
            {"name": "Ishwari", "email": "ishwari@planova.com", "role": "User"},
            {"name": "Sanyukta", "email": "sanyukta@planova.com", "role": "User"},
            {"name": "Mohan", "email": "mohan@planova.com", "role": "User"},
        ]

        created_users = {}
        print("\n1. Seeding Users (Default password: 'password123'):")
        for m in team_members:
            user = db.query(User).filter(User.email == m["email"]).first()
            if not user:
                user = User(
                    name=m["name"],
                    email=m["email"],
                    password_hash=default_pwd,
                    role=m["role"]
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"  [+] Created {m['role']:<5}: {m['name']} ({m['email']})")
            else:
                print(f"  [.] Exists  {user.role:<5}: {user.name} ({user.email})")
            created_users[m["email"]] = user

            # Seed User Preference
            pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
            if not pref:
                db.add(UserPreference(user_id=user.id, theme="light", timezone="UTC", default_task_view="dashboard"))
                db.commit()

        admin_user = created_users.get("admin@example.com")
        sarthak_user = created_users.get("sarthak@planova.com")

        # 2. Seed Categories and Tags for Sarthak
        print("\n2. Seeding Categories & Tags:")
        categories_data = ["Engineering", "Design", "Personal"]
        cat_map = {}
        for cat_name in categories_data:
            cat = db.query(Category).filter(Category.user_id == sarthak_user.id, Category.name == cat_name).first()
            if not cat:
                cat = Category(user_id=sarthak_user.id, name=cat_name)
                db.add(cat)
                db.commit()
                db.refresh(cat)
            cat_map[cat_name] = cat
        print(f"  [+] Configured {len(cat_map)} categories for {sarthak_user.name}")

        tags_data = [("Urgent", "#ef4444"), ("Sprint 7", "#8b5cf6"), ("Bug", "#f59e0b")]
        for tag_name, color in tags_data:
            tag = db.query(Tag).filter(Tag.user_id == sarthak_user.id, Tag.name == tag_name).first()
            if not tag:
                db.add(Tag(user_id=sarthak_user.id, name=tag_name, color=color))
                db.commit()
        print(f"  [+] Configured tags for {sarthak_user.name}")

        # 3. Seed Personal Tasks for Sarthak
        print("\n3. Seeding Personal Tasks:")
        today = date.today()
        sample_tasks = [
            {
                "title": "Review 14 MySQL Database Tables & Foreign Keys",
                "description": "Verify ER diagram, cascading deletions, and composite constraints for viva.",
                "status": "Completed",
                "priority": "High",
                "category": cat_map.get("Engineering"),
                "due_date": today,
            },
            {
                "title": "Prepare Planova Architecture Slide Deck",
                "description": "Summarize frontend React components, FastAPI REST endpoints and database schema.",
                "status": "InProgress",
                "priority": "High",
                "category": cat_map.get("Engineering"),
                "due_date": today + timedelta(days=2),
            },
            {
                "title": "Test Kanban Drag-and-Drop and Theme Switcher",
                "description": "Verify visual transitions and glare-free dark mode before live presentation.",
                "status": "Pending",
                "priority": "Medium",
                "category": cat_map.get("Design"),
                "due_date": today + timedelta(days=5),
            },
        ]

        for t_info in sample_tasks:
            t = db.query(Task).filter(Task.user_id == sarthak_user.id, Task.title == t_info["title"]).first()
            if not t:
                t = Task(
                    user_id=sarthak_user.id,
                    category_id=t_info["category"].id if t_info["category"] else None,
                    title=t_info["title"],
                    description=t_info["description"],
                    status=t_info["status"],
                    priority=t_info["priority"],
                    due_date=t_info["due_date"],
                    due_time=time(17, 0),
                    due_datetime=datetime.combine(t_info["due_date"], time(17, 0)),
                    timezone="UTC"
                )
                db.add(t)
                db.commit()
                db.refresh(t)

                # Add sample subtasks
                db.add(Subtask(task_id=t.id, user_id=sarthak_user.id, title="Check schema migrations v2 and v3", is_completed=True, sort_order=1))
                db.add(Subtask(task_id=t.id, user_id=sarthak_user.id, title="Confirm MySQL Workbench connection", is_completed=True, sort_order=2))
                db.commit()
                print(f"  [+] Created Task: '{t.title}' [{t.status}]")

        # 4. Seed 1 Enterprise Shared Team Task (Admin -> Sarthak & Rehan)
        print("\n4. Seeding Shared Enterprise Team Task:")
        team_task_title = "Sprint 7: Production Release & Mentor Demo Preparation"
        tt = db.query(TeamTask).filter(TeamTask.title == team_task_title).first()
        if not tt:
            tt = TeamTask(
                admin_id=admin_user.id,
                title=team_task_title,
                description="Final integration checklist for the academic review meeting.",
                instructions="1. Verify local server running.\n2. Review speaking points.\n3. Test assigning tasks in Admin Console.",
                priority="High",
                due_date=today + timedelta(days=3),
                due_time=time(18, 0),
                due_datetime=datetime.combine(today + timedelta(days=3), time(18, 0)),
                timezone="UTC",
                checklist=[
                    {"item": "Check MySQL 13 tables", "completed": True},
                    {"item": "Verify Dark Mode toggle", "completed": False},
                ]
            )
            db.add(tt)
            db.commit()
            db.refresh(tt)
            print(f"  [+] Created Master Team Task: '{tt.title}'")

            # Assign to Sarthak and Rehan
            for recipient in [sarthak_user, created_users.get("rehan@planova.com")]:
                ta = TaskAssignment(
                    team_task_id=tt.id,
                    user_id=recipient.id,
                    status="InProgress",
                    progress_percent=50,
                    notes="Testing assignment dashboard and discussion thread."
                )
                db.add(ta)
                db.commit()
                db.refresh(ta)

                # Add sample discussion message
                db.add(AssignmentDiscussion(
                    assignment_id=ta.id,
                    sender_id=admin_user.id,
                    sender_role="Admin",
                    message_type="comment",
                    message=f"Welcome {recipient.name}! Please update your progress slider as you complete milestones."
                ))
                db.commit()
                print(f"  [+] Assigned to: {recipient.name} ({recipient.email})")

        print("\n" + "=" * 65)
        print("SEEDING COMPLETE! ALL WORKSPACES & USERS ARE NOW READY IN TIDB.")
        print("=" * 65)
        print("\nSummary of Login Credentials:")
        print("  Admin Login : admin@example.com     | Password: password123")
        print("  Sarthak     : sarthak@planova.com   | Password: password123")
        print("  Rehan       : rehan@planova.com     | Password: password123")
        print("  Sanskruti   : sanskruti@planova.com | Password: password123")
        print("  Ishwari     : ishwari@planova.com   | Password: password123")
        print("  Sanyukta    : sanyukta@planova.com  | Password: password123")
        print("  Mohan       : mohan@planova.com     | Password: password123")

    except Exception as e:
        db.rollback()
        safe_err = str(e)
        if db_password and db_password in safe_err:
            safe_err = safe_err.replace(db_password, "********")
        print(f"[ERROR] Seeding failed: {safe_err}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
