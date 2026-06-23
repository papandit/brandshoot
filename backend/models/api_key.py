import secrets
import hashlib
from datetime import datetime
from bson import ObjectId
from database import api_keys_col
from config import config


# Prefix used for every BrandShoot public API key. Helps integrators recognise
# the credential and lets us show a non-secret hint of the key in the dashboard.
KEY_PREFIX = "bsk_live_"
# Number of leading characters stored in clear text for display (e.g. "bsk_live_aB3dEf2g").
DISPLAY_PREFIX_LEN = 16


class ApiKey:
    """
    Public-API key model.

    Keys authenticate third-party / external callers (e-commerce merchants and the
    photoshoot community) to BrandShoot's public endpoints. The plaintext secret is
    shown to the owner exactly once at creation/rotation; only its SHA-256 hash is
    stored. Usage draws from the owning user's credit balance and is bounded by the
    key's plan tier (rate limit + monthly image quota), see config.API_PLANS.
    """

    @staticmethod
    def _hash(secret: str) -> str:
        """Return the SHA-256 hex digest used to look a key up without storing it."""
        return hashlib.sha256(secret.encode("utf-8")).hexdigest()

    @staticmethod
    def _new_secret() -> str:
        """Generate a fresh, URL-safe secret with the BrandShoot prefix."""
        return KEY_PREFIX + secrets.token_urlsafe(32)

    @staticmethod
    def _plan_limits(plan: str) -> dict:
        """Resolve a plan name to its limits, falling back to 'free'."""
        return config.API_PLANS.get(plan, config.API_PLANS["free"])

    @staticmethod
    def generate(user_id: str, name: str, plan: str = "free") -> dict:
        """
        Create a new API key for a user.

        Returns a dict containing the created document fields plus a one-time
        'secret' field (the full plaintext key). The secret is NOT stored and can
        never be retrieved again.
        """
        if plan not in config.API_PLANS:
            plan = "free"

        secret = ApiKey._new_secret()
        limits = ApiKey._plan_limits(plan)
        now = datetime.utcnow()

        doc = {
            "user_id": ObjectId(user_id),
            "name": (name or "Untitled key").strip()[:100],
            "key_prefix": secret[:DISPLAY_PREFIX_LEN],
            "key_hash": ApiKey._hash(secret),
            "plan": plan,
            "rate_limit_per_min": limits["rate_limit_per_min"],
            "monthly_quota": limits["monthly_quota"],
            "usage_this_period": 0,
            "period_start": now,
            "status": "active",
            "created_at": now,
            "updated_at": now,
            "last_used_at": None,
            "revoked_at": None,
        }

        result = api_keys_col.insert_one(doc)
        doc["_id"] = result.inserted_id
        print(f"✓ API key created for user {user_id} (plan: {plan}, prefix: {doc['key_prefix']})")

        # Attach the one-time secret for the response only.
        public = ApiKey.to_public_dict(doc)
        public["secret"] = secret
        return public

    @staticmethod
    def find_by_secret(secret: str):
        """Look up an active API key document by its plaintext secret, or None."""
        if not secret:
            return None
        return api_keys_col.find_one({"key_hash": ApiKey._hash(secret)})

    @staticmethod
    def list_for_user(user_id: str) -> list:
        """Return all of a user's keys (newest first) as public dicts."""
        try:
            docs = api_keys_col.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
            return [ApiKey.to_public_dict(d) for d in docs]
        except Exception as e:
            print(f"Error listing API keys for user {user_id}: {e}")
            return []

    @staticmethod
    def _owned(key_id: str, user_id: str):
        """Fetch a key only if it belongs to the given user."""
        try:
            return api_keys_col.find_one({"_id": ObjectId(key_id), "user_id": ObjectId(user_id)})
        except Exception as e:
            print(f"Error fetching API key {key_id}: {e}")
            return None

    @staticmethod
    def revoke(key_id: str, user_id: str) -> bool:
        """Permanently disable a key the user owns."""
        doc = ApiKey._owned(key_id, user_id)
        if not doc:
            return False
        now = datetime.utcnow()
        api_keys_col.update_one(
            {"_id": doc["_id"]},
            {"$set": {"status": "revoked", "revoked_at": now, "updated_at": now}},
        )
        print(f"✓ API key revoked: {doc.get('key_prefix')}")
        return True

    @staticmethod
    def rotate(key_id: str, user_id: str):
        """
        Replace a key's secret in place (same plan, same limits, usage preserved).
        Returns a public dict with a one-time 'secret', or None if not found.
        """
        doc = ApiKey._owned(key_id, user_id)
        if not doc:
            return None
        secret = ApiKey._new_secret()
        now = datetime.utcnow()
        api_keys_col.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "key_prefix": secret[:DISPLAY_PREFIX_LEN],
                "key_hash": ApiKey._hash(secret),
                "status": "active",
                "revoked_at": None,
                "updated_at": now,
            }},
        )
        doc = api_keys_col.find_one({"_id": doc["_id"]})
        public = ApiKey.to_public_dict(doc)
        public["secret"] = secret
        print(f"✓ API key rotated: {public['key_prefix']}")
        return public

    @staticmethod
    def effective_usage(key_doc: dict) -> int:
        """
        Usage for the current calendar month. Returns 0 if the stored period is from
        a previous month (the counter is reset lazily on the next record_usage).
        """
        period_start = key_doc.get("period_start")
        now = datetime.utcnow()
        if not period_start or (period_start.year, period_start.month) != (now.year, now.month):
            return 0
        return key_doc.get("usage_this_period", 0)

    @staticmethod
    def record_usage(key_id: str, images: int = 1):
        """
        Record `images` generated against a key, resetting the monthly counter when a
        new calendar month has started. Also stamps last_used_at.
        """
        try:
            now = datetime.utcnow()
            doc = api_keys_col.find_one(
                {"_id": ObjectId(key_id)}, {"period_start": 1, "usage_this_period": 1}
            )
            if not doc:
                return
            period_start = doc.get("period_start")
            new_period = (
                not period_start
                or (period_start.year, period_start.month) != (now.year, now.month)
            )
            if new_period:
                api_keys_col.update_one(
                    {"_id": ObjectId(key_id)},
                    {"$set": {
                        "usage_this_period": images,
                        "period_start": now,
                        "last_used_at": now,
                        "updated_at": now,
                    }},
                )
            else:
                api_keys_col.update_one(
                    {"_id": ObjectId(key_id)},
                    {"$inc": {"usage_this_period": images},
                     "$set": {"last_used_at": now, "updated_at": now}},
                )
        except Exception as e:
            print(f"Error recording API key usage for {key_id}: {e}")

    @staticmethod
    def to_public_dict(doc: dict) -> dict:
        """Serialize a key document for API responses (never exposes key_hash)."""
        return {
            "id": str(doc["_id"]),
            "name": doc.get("name"),
            "key_prefix": doc.get("key_prefix"),
            "plan": doc.get("plan"),
            "rate_limit_per_min": doc.get("rate_limit_per_min"),
            "monthly_quota": doc.get("monthly_quota"),
            "usage_this_period": ApiKey.effective_usage(doc),
            "status": doc.get("status"),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
            "last_used_at": doc.get("last_used_at").isoformat() if doc.get("last_used_at") else None,
        }
