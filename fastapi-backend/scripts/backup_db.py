import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
load_dotenv()

from app.database.session import SessionLocal
from sqlalchemy import text


def make_backup():
    db = SessionLocal()
    backup_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../database/backups"))
    os.makedirs(backup_dir, exist_ok=True)
    backup_path = os.path.join(backup_dir, "backup_before_step7.sql")

    try:
        tables = [t[0] for t in db.execute(text("SHOW TABLES")).fetchall()]
        with open(backup_path, "w", encoding="utf-8") as f:
            f.write("-- Planova MySQL Backup before Step 7\n")
            f.write("SET FOREIGN_KEY_CHECKS=0;\n\n")

            for table in tables:
                create_sql = db.execute(text(f"SHOW CREATE TABLE `{table}`")).fetchone()[1]
                f.write(f"-- Table structure for `{table}`\n")
                f.write(f"{create_sql};\n\n")

                rows = db.execute(text(f"SELECT * FROM `{table}`")).fetchall()
                if rows:
                    cols = [c[0] for c in db.execute(text(f"DESCRIBE `{table}`")).fetchall()]
                    cols_str = ", ".join([f"`{c}`" for c in cols])
                    f.write(f"-- Data for `{table}` ({len(rows)} records)\n")
                    for row in rows:
                        vals = []
                        for v in row:
                            if v is None:
                                vals.append("NULL")
                            elif isinstance(v, (int, float)):
                                vals.append(str(v))
                            else:
                                escaped = str(v).replace("\\", "\\\\").replace("'", "''")
                                vals.append(f"'{escaped}'")
                        f.write(f"INSERT INTO `{table}` ({cols_str}) VALUES ({', '.join(vals)});\n")
                    f.write("\n")

            f.write("SET FOREIGN_KEY_CHECKS=1;\n")

        file_size = os.path.getsize(backup_path)
        print(f"[OK] Database backup created at: {backup_path} ({file_size} bytes, {len(tables)} tables)")
    finally:
        db.close()


if __name__ == "__main__":
    make_backup()
