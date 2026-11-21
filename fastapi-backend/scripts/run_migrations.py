import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from sqlalchemy import text


def run_migrations():
    migrations_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../database/migrations")
    )
    if not os.path.exists(migrations_dir):
        print(f"[ERROR] Migrations directory not found: {migrations_dir}")
        sys.exit(1)

    # Collect and sort all .sql migration files (e.g., v2..., v3...)
    migration_files = sorted([
        os.path.join(migrations_dir, f)
        for f in os.listdir(migrations_dir)
        if f.endswith(".sql")
    ])

    if not migration_files:
        print(f"[WARNING] No .sql migration files found in {migrations_dir}")
        return

    db = SessionLocal()
    try:
        for file_path in migration_files:
            file_name = os.path.basename(file_path)
            print(f"Applying migration: {file_name} ...")
            with open(file_path, "r", encoding="utf-8") as f:
                sql_content = f.read()

            # Split statements by semicolon
            statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]
            executed_count = 0
            for stmt in statements:
                # Skip comment-only lines
                lines = [l for l in stmt.splitlines() if not l.strip().startswith("--")]
                clean_stmt = "\n".join(lines).strip()
                if clean_stmt:
                    try:
                        db.execute(text(clean_stmt))
                        db.commit()
                        executed_count += 1
                    except Exception as stmt_err:
                        err_msg = str(stmt_err).lower()
                        # Safe to ignore if table, column, index or FK constraint already exists (idempotency)
                        if any(phrase in err_msg for phrase in [
                            "duplicate column",
                            "duplicate key",
                            "duplicate foreign key",
                            "already exists",
                            "1826",  # MySQL duplicate foreign key
                            "1060",  # MySQL duplicate column
                            "1061",  # MySQL duplicate key
                            "1050",  # MySQL table already exists
                        ]):
                            db.rollback()
                            print(f"    (Skipped existing schema element: {stmt_err.args[0] if hasattr(stmt_err, 'args') and stmt_err.args else 'Already exists'})")
                            executed_count += 1
                        else:
                            raise stmt_err
            print(f"  [OK] Processed {executed_count} statements from {file_name}")

        print("\nAll database migrations applied successfully!")

        # Verify all tables created
        tables = [t[0] for t in db.execute(text("SHOW TABLES")).fetchall()]
        print(f"\nUpdated MySQL Tables ({len(tables)} total):")
        for t in sorted(tables):
            print(f"  - {t}")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Migration failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_migrations()

