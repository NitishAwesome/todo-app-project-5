import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from sqlalchemy import text


def run_migration():
    migration_file = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../database/migrations/v2_step7_smart_productivity.sql")
    )
    if not os.path.exists(migration_file):
        print(f"[ERROR] Migration file not found: {migration_file}")
        sys.exit(1)

    print(f"Applying migration: {migration_file} ...")
    with open(migration_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Split statements by semicolon
    statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]

    db = SessionLocal()
    try:
        for stmt in statements:
            # Skip comment-only lines
            lines = [l for l in stmt.splitlines() if not l.strip().startswith("--")]
            clean_stmt = "\n".join(lines).strip()
            if clean_stmt:
                db.execute(text(clean_stmt))
        db.commit()
        print(f"[OK] Successfully executed {len(statements)} migration statements!")

        # Verify tables created
        tables = [t[0] for t in db.execute(text("SHOW TABLES")).fetchall()]
        print("Updated MySQL Tables:")
        for t in sorted(tables):
            print(f"  - {t}")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Migration failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
