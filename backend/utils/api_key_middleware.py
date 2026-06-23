import time
from collections import defaultdict, deque
from functools import wraps
from threading import Lock
from flask import request, jsonify
from models.api_key import ApiKey
from models.user import User


# In-memory sliding-window rate limiter, keyed by API key id. Mirrors the existing
# in-memory `jobs` store in routes/generate.py. NOTE: this is per-process, so under
# Gunicorn with multiple workers the effective limit is approximate. Back it with
# Redis/Mongo if exact multi-worker limiting is ever required.
_rate_windows = defaultdict(deque)
_rate_lock = Lock()


def _check_rate_limit(key_id: str, limit_per_min: int):
    """Return (allowed: bool, retry_after_seconds: int) for one request."""
    if not limit_per_min or limit_per_min <= 0:
        return True, 0
    now = time.time()
    window_start = now - 60
    with _rate_lock:
        dq = _rate_windows[key_id]
        while dq and dq[0] < window_start:
            dq.popleft()
        if len(dq) >= limit_per_min:
            retry_after = int(60 - (now - dq[0])) + 1
            return False, max(retry_after, 1)
        dq.append(now)
        return True, 0


def require_api_key(f):
    """
    Decorator for public API routes. Authenticates the caller with a BrandShoot API
    key, enforces the key's rate limit + monthly quota, and attaches the owning user
    to the request context (request.user_id / request.current_user), so wrapped
    handlers can reuse the existing credit + generation logic unchanged.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Accept the key via X-API-Key (preferred) or Authorization: Bearer <key>.
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            auth_header = request.headers.get("Authorization", "")
            if auth_header:
                api_key = auth_header.split(" ")[1] if " " in auth_header else auth_header

        if not api_key:
            return jsonify({
                "success": False,
                "error": "API key required. Send it in the 'X-API-Key' header."
            }), 401

        key_doc = ApiKey.find_by_secret(api_key)
        if not key_doc:
            return jsonify({"success": False, "error": "Invalid API key"}), 401

        if key_doc.get("status") != "active":
            return jsonify({"success": False, "error": "This API key has been revoked"}), 401

        # The owning user pays for usage, so they must exist and be active.
        user = User.find_by_id(str(key_doc["user_id"]))
        if not user:
            return jsonify({"success": False, "error": "API key owner not found"}), 403
        if user.get("status") != "active":
            return jsonify({"success": False, "error": "API key owner account is not active"}), 403

        # Per-minute rate limit.
        allowed, retry_after = _check_rate_limit(
            str(key_doc["_id"]), key_doc.get("rate_limit_per_min", 0)
        )
        if not allowed:
            resp = jsonify({
                "success": False,
                "error": "rate_limit_exceeded",
                "message": f"Rate limit of {key_doc.get('rate_limit_per_min')} requests/min exceeded",
            })
            resp.status_code = 429
            resp.headers["Retry-After"] = str(retry_after)
            return resp

        # Monthly image quota (coarse gate; a multi-image request may slightly overshoot).
        used = ApiKey.effective_usage(key_doc)
        quota = key_doc.get("monthly_quota", 0)
        if quota and used >= quota:
            return jsonify({
                "success": False,
                "error": "quota_exceeded",
                "message": f"Monthly quota of {quota} images reached for this key",
                "usage_this_period": used,
                "monthly_quota": quota,
            }), 429

        # Expose context for the wrapped handler (same fields require_auth provides).
        request.api_key_doc = key_doc
        request.api_key_id = str(key_doc["_id"])
        request.current_user = user
        request.user_id = str(user["_id"])

        return f(*args, **kwargs)

    return decorated_function
