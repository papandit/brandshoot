"""Create (or promote) an admin user.

Usage:
    python create_admin.py [email] [password] [name]

Defaults: admin@brandshoot.com / Admin@123 / "Admin"

If the email already exists, it is promoted to role="admin" (password unchanged).
Otherwise a new active admin account is created with the given password.
"""
import sys
from models.user import User

email = (sys.argv[1] if len(sys.argv) > 1 else "admin@brandshoot.com").lower()
password = sys.argv[2] if len(sys.argv) > 2 else "Admin@123"
name = sys.argv[3] if len(sys.argv) > 3 else "Admin"

existing = User.find_by_email(email)
if existing:
    User.update_user(str(existing["_id"]), {"role": "admin", "status": "active"})
    print(f"✓ Existing user promoted to admin: {email}")
else:
    User.create_user(name=name, email=email, password=password, status="active", role="admin")
    print(f"✓ Admin account created: {email}  (password: {password})")
