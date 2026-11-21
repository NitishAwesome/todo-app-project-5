"""
Development Administrative Provisioning Utility for Planova
Securely provisions or promotes an administrator account using masked password input.
"""

import sys
import os
import getpass

# Add parent directory to path so app modules can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password


def promote_or_create_admin(email: str):
    email = email.strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = "Admin"
            change_pwd = input(f"User '{email}' found. Do you want to update their password? (y/N): ").strip().lower()
            if change_pwd == "y":
                pwd = getpass.getpass("Enter new administrator password (masked): ")
                pwd_confirm = getpass.getpass("Confirm new password: ")
                if pwd != pwd_confirm:
                    print("[ERROR] Passwords do not match.")
                    sys.exit(1)
                user.password_hash = hash_password(pwd)
                print(f"[OK] Password updated securely with Argon2id for '{email}'.")

            db.commit()
            db.refresh(user)
            print(f"[OK] User '{email}' (ID: {user.id}) confirmed as role 'Admin'.")
            return user
        else:
            print(f"User '{email}' not found. Creating a new administrator account.")
            name = input("Enter administrator display name: ").strip() or "Administrator"
            pwd = getpass.getpass("Enter password for new administrator (masked): ")
            pwd_confirm = getpass.getpass("Confirm password: ")
            if pwd != pwd_confirm:
                print("[ERROR] Passwords do not match.")
                sys.exit(1)

            new_admin = User(
                name=name,
                email=email,
                password_hash=hash_password(pwd),
                role="Admin"
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            print(f"[OK] Created new administrator '{email}' (ID: {new_admin.id}) with role 'Admin'.")
            return new_admin
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        target_email = input("Enter user email to promote/provision as Admin: ").strip()
    else:
        target_email = sys.argv[1].strip()

    if not target_email:
        print("[ERROR] Email is required.")
        sys.exit(1)

    promote_or_create_admin(target_email)
