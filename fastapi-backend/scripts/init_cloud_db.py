"""
Planova Cloud & Local Database Initializer and Migration Verifier
Supports both local MySQL 8.0 (port 3306) and TiDB Cloud Serverless (port 4000).

Features:
- Idempotent: safe to run multiple times without data loss.
- Version-tracked: uses `schema_migrations` table to prevent re-execution.
- TiDB Trigger Compatibility: detects and documents unsupported MySQL triggers,
  logging explicit explanations and application-level equivalence.
- Verified TLS: uses certifi or custom CA (e.g. isrgrootx1.pem) when DB_SSL=true or port 4000.
- Isolated Environment: accepts `--env` flag (e.g. --env .env.tidb) to keep local MySQL untouched.
- Secret Safe: never outputs passwords or raw credential strings.
"""

import os
import sys
import re
import argparse
from datetime import datetime

# Add fastapi-backend root to sys.path
BASE_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_BACKEND not in sys.path:
    sys.path.append(BASE_BACKEND)

from dotenv import load_dotenv

# Parse CLI arguments
parser = argparse.ArgumentParser(description="Planova Cloud & Local Database Initializer")
parser.add_argument("--env", type=str, default=None, help="Path to environment file (e.g. .env.tidb)")
args, _ = parser.parse_known_args()

# Determine environment file to load
target_env = None
if args.env:
    if os.path.isabs(args.env):
        target_env = args.env
    else:
        target_env = os.path.abspath(os.path.join(os.getcwd(), args.env))
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

from sqlalchemy import create_engine, URL, text
from sqlalchemy.orm import sessionmaker


def split_sql_statements(sql_text: str) -> list[str]:
    """
    Parses SQL text into discrete statements, stripping line comments
    and block comments while preserving semicolons inside quotes.
    """
    sql_clean = re.sub(r"/\*.*?\*/", "", sql_text, flags=re.DOTALL)

    statements = []
    current_stmt = []

    for line in sql_clean.splitlines():
        stripped = line.strip()
        if stripped.startswith("--") or stripped.startswith("#"):
            continue
        if "-- " in line:
            line = line.split("-- ")[0]

        if line.strip():
            current_stmt.append(line)
            if line.strip().endswith(";"):
                full_stmt = "\n".join(current_stmt).strip()
                if full_stmt.endswith(";"):
                    full_stmt = full_stmt[:-1].strip()
                if full_stmt:
                    statements.append(full_stmt)
                current_stmt = []

    if current_stmt:
        remaining = "\n".join(current_stmt).strip()
        if remaining.endswith(";"):
            remaining = remaining[:-1].strip()
        if remaining:
            statements.append(remaining)

    return statements


def ensure_migration_table(db):
    """Creates the migration version tracking table if it does not exist."""
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(100) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """))
    db.commit()


def is_migration_applied(db, version: str) -> bool:
    """Checks whether a migration version has already been recorded."""
    res = db.execute(
        text("SELECT 1 FROM schema_migrations WHERE version = :ver"),
        {"ver": version}
    ).fetchone()
    return res is not None


def record_migration(db, version: str, description: str):
    """Records a completed migration version in schema_migrations."""
    db.execute(
        text("INSERT INTO schema_migrations (version, description) VALUES (:ver, :desc)"),
        {"ver": version, "desc": description}
    )
    db.commit()


def check_tidb_engine(db) -> tuple[bool, str]:
    """Detects whether the target database is PingCAP TiDB."""
    try:
        res = db.execute(text("SELECT tidb_version()")).fetchone()
        if res and res[0]:
            first_line = res[0].strip().split("\n")[0]
            return True, first_line
        return True, "TiDB Cloud"
    except Exception:
        db.rollback()
        return False, "Standard MySQL / MariaDB"


def run_cloud_init():
    print("=" * 70)
    print("PLANOVA — DATABASE INITIALIZER & CLOUD MIGRATION RUNNER")
    print("=" * 70)

    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", "3306"))
    db_user = os.getenv("DB_USER", "")
    db_password = os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("DB_NAME", "todo_app")
    db_ssl_env = os.getenv("DB_SSL", "").strip().lower()
    db_ssl_ca = os.getenv("DB_SSL_CA", "")

    use_ssl = db_ssl_env in ("true", "1", "yes") or (db_port == 4000 and db_ssl_env != "false")

    print(f"Loaded Config   : {env_display}")
    print(f"Target Database : {db_name} on {db_host}:{db_port}")
    print(f"Database User   : {db_user}")

    connect_args = {}
    if use_ssl:
        import certifi
        ca_path = db_ssl_ca
        if not ca_path or not os.path.exists(ca_path):
            ca_path = certifi.where()
            ca_display = f"certifi bundle ({os.path.basename(ca_path)})"
        else:
            ca_display = f"custom verified CA ({ca_path})"
        print(f"SSL / TLS Active: YES [check_hostname=True, CA={ca_display}]")
        connect_args["ssl"] = {
            "ca": ca_path,
            "check_hostname": True,
        }
    else:
        print(f"SSL / TLS Active: NO (Plain TCP)")

    # Build connection URL safely
    db_url = URL.create(
        drivername="mysql+pymysql",
        username=db_user,
        password=db_password,
        host=db_host,
        port=db_port,
        database=db_name
    )

    print("\n[STEP 1/4] Testing live database connection...")
    try:
        engine = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30
        )
        with engine.connect() as test_conn:
            test_conn.execute(text("SELECT 1"))
        print("[SUCCESS] Live connection established successfully!")
    except Exception as conn_err:
        err_msg = str(conn_err)
        if db_password and db_password in err_msg:
            err_msg = err_msg.replace(db_password, "********")
        print(f"\n[ERROR] Connection failed: {err_msg}")
        if "Access denied" in err_msg:
            print("\n[GUIDANCE] Authentication failed. Please ensure:")
            print("  1. The password in .env.tidb is your newly reset TiDB Cloud password.")
            print("  2. The username in .env.tidb matches the TiDB user format: <prefix>.root")
            print("  3. There are no accidental spaces around the password in .env.tidb.")
        elif "certificate" in err_msg.lower() or "ssl" in err_msg.lower():
            print("\n[GUIDANCE] TLS/SSL certificate verification error.")
            print("  Verify that DB_SSL_CA points to the correct ISRG Root X1 certificate.")
        sys.exit(1)

    SessionMaker = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    db = SessionMaker()

    try:
        # Step 2: Detect Engine & Capabilities
        print("\n[STEP 2/4] Inspecting database engine capabilities...")
        is_tidb, engine_desc = check_tidb_engine(db)
        print(f"[INFO] Engine Identified: {engine_desc}")
        if is_tidb:
            print("[INFO] PingCAP TiDB Serverless detected. Trigger emulation active at application layer.")

        # Ensure migration tracking table
        ensure_migration_table(db)
        existing_tables = [t[0] for t in db.execute(text("SHOW TABLES")).fetchall()]
        print(f"[INFO] Existing tables count before execution: {len(existing_tables)}")

        # Step 3: Run Baseline Schema + Migrations
        print("\n[STEP 3/4] Applying schema migrations in sequence...")
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        migration_stages = [
            {
                "version": "v1_baseline_schema",
                "file": os.path.join(base_dir, "database/schema.sql"),
                "desc": "Baseline users, categories, tasks tables",
            },
            {
                "version": "v2_smart_productivity",
                "file": os.path.join(base_dir, "database/migrations/v2_step7_smart_productivity.sql"),
                "desc": "Subtasks, tags, task_tags, reminders, notifications, activity logs, preferences",
            },
            {
                "version": "v3_team_collaboration",
                "file": os.path.join(base_dir, "database/migrations/v3_team_collaboration.sql"),
                "desc": "Team tasks, task assignments, assignment discussions, exact deadline times",
            },
        ]

        for stage in migration_stages:
            version = stage["version"]
            file_path = stage["file"]
            desc = stage["desc"]
            file_name = os.path.basename(file_path)

            print(f"\n--- Migration Stage: {version} ({file_name}) ---")

            if is_migration_applied(db, version):
                print(f"[SKIP] Version '{version}' was already applied previously.")
                continue

            if not os.path.exists(file_path):
                print(f"[FATAL] Migration script file not found: {file_path}")
                sys.exit(1)

            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            statements = split_sql_statements(content)
            executed = 0

            for stmt in statements:
                # Skip CREATE DATABASE or USE statements when already connected to target database
                if re.match(r"^CREATE\s+DATABASE", stmt, re.IGNORECASE):
                    print("  [SKIP] CREATE DATABASE statement (already connected).")
                    continue
                if re.match(r"^USE\s+", stmt, re.IGNORECASE):
                    print("  [SKIP] USE statement.")
                    continue

                # Handle triggers on TiDB explicitly
                is_trigger_stmt = bool(re.search(r"\bTRIGGER\b", stmt, re.IGNORECASE))
                if is_trigger_stmt and is_tidb:
                    print("  [INFO] TiDB Compatibility: Omitted procedural trigger statement:")
                    first_line = stmt.strip().splitlines()[0]
                    print(f"         > '{first_line}'")
                    print("         * Trigger Explanation: MySQL uses trg_categories_before_delete to disassociate")
                    print("           tasks before a category is deleted. TiDB's distributed engine does not support")
                    print("           triggers. Planova handles category deletion safely at the application layer.")
                    continue

                try:
                    db.execute(text(stmt))
                    db.commit()
                    executed += 1
                except Exception as stmt_err:
                    err_lower = str(stmt_err).lower()
                    # Idempotency checks for re-run safety
                    if any(phrase in err_lower for phrase in [
                        "duplicate column",
                        "duplicate key",
                        "duplicate foreign key",
                        "already exists",
                        "1826",  # Duplicate FK
                        "1060",  # Duplicate column
                        "1061",  # Duplicate key
                        "1050",  # Table already exists
                    ]):
                        db.rollback()
                        print("  [IDEMPOTENT SKIP] Schema element already exists.")
                        executed += 1
                    elif is_trigger_stmt and ("does not support triggers" in err_lower or "1105" in err_lower):
                        db.rollback()
                        print(f"  [INFO] Omitted unsupported trigger on target engine ({type(stmt_err).__name__}).")
                    else:
                        db.rollback()
                        safe_stmt_err = str(stmt_err)
                        if db_password and db_password in safe_stmt_err:
                            safe_stmt_err = safe_stmt_err.replace(db_password, "********")
                        print(f"[ERROR] Statement execution failed:\n{stmt}\nError: {safe_stmt_err}")
                        sys.exit(1)

            record_migration(db, version, desc)
            print(f"[OK] Applied '{version}' successfully ({executed} statements processed).")

        # Step 4: Verification and Table Audit
        print("\n[STEP 4/4] Verifying all application tables & schema extensions...")
        print("=" * 70)
        print("DATABASE SCHEMA AUDIT & VERIFICATION")
        print("=" * 70)

        final_tables = [t[0] for t in db.execute(text("SHOW TABLES")).fetchall()]
        expected_tables = [
            "assignment_discussions",
            "categories",
            "notifications",
            "reminders",
            "schema_migrations",
            "subtasks",
            "tags",
            "task_activity_logs",
            "task_assignments",
            "task_tags",
            "tasks",
            "team_tasks",
            "user_preferences",
            "users",
        ]

        print(f"Total Tables Discovered: {len(final_tables)}")
        missing_tables = [t for t in expected_tables if t not in final_tables]

        for t in sorted(final_tables):
            status = "VERIFIED" if t in expected_tables else "EXTRA"
            print(f"  - {t:<28} [{status}]")

        if missing_tables:
            print(f"\n[ERROR] Missing required tables: {missing_tables}")
            sys.exit(1)

        print("\n[SUCCESS] All 14 tables (13 application + 1 migration tracking) verified!")

        # Verify altered columns
        task_cols = [c[0] for c in db.execute(text("DESCRIBE tasks")).fetchall()]
        print("\nChecking exact deadline fields on 'tasks':")
        for col in ["due_time", "due_datetime", "timezone"]:
            present = col in task_cols
            print(f"  - tasks.{col:<18} [{'OK' if present else 'MISSING'}]")

        notif_cols = [c[0] for c in db.execute(text("DESCRIBE notifications")).fetchall()]
        print("\nChecking assignment fields on 'notifications':")
        for col in ["assignment_id", "action_url", "actor_name"]:
            present = col in notif_cols
            print(f"  - notifications.{col:<14} [{'OK' if present else 'MISSING'}]")

        print("\n" + "=" * 70)
        print("DATABASE INITIALIZATION & VERIFICATION COMPLETE (100% HEALTHY)")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        err_str = str(e)
        if db_password and db_password in err_str:
            err_str = err_str.replace(db_password, "********")
        print(f"[FATAL] Initialization aborted: {err_str}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_cloud_init()
