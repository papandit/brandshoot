"""Promote a user to admin role. Usage: python promote_admin.py <email>"""
import sys
from pymongo import MongoClient
from config import config

email = sys.argv[1] if len(sys.argv) > 1 else "admin@flyr.com"
db = MongoClient(config.MONGO_URL)[config.DB_NAME]
result = db.users.update_one({"email": email}, {"$set": {"role": "admin"}})
user = db.users.find_one({"email": email}, {"email": 1, "role": 1})
print(f"matched={result.matched_count}, user={user}")
