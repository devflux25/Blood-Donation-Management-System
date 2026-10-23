import sys
import getpass
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User

def create_admin():
    print("=" * 60)
    print(" Blood Donation Management System - Administrator Provisioning")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        full_name = input("Enter Full Name [Default: System Admin]: ").strip() or "System Admin"
        email = input("Enter Email Address: ").strip()
        if not email or "@" not in email:
            print("Error: A valid email address is required.")
            sys.exit(1)
        
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"User with email '{email}' already exists.")
            sys.exit(1)

        password = getpass.getpass("Enter Secure Admin Password (min 6 chars): ")
        if len(password) < 6:
            print("Error: Password must be at least 6 characters long.")
            sys.exit(1)

        confirm = getpass.getpass("Confirm Password: ")
        if password != confirm:
            print("Error: Passwords do not match.")
            sys.exit(1)

        hashed = get_password_hash(password)
        admin_user = User(
            full_name=full_name,
            email=email,
            hashed_password=hashed,
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("\nSUCCESS: Administrator created successfully!")
        print(f"User: {full_name} ({email}) | Role: admin")
    except Exception as e:
        print(f"\nFailed to create administrator: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
