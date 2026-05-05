"""
Admin API Routes — /admin/*

Protected endpoints that require role='admin'. Provides:
  - Dashboard stats
  - User management (list, status toggle, details)
  - Generation analytics (per-user, global, filtered by date range)
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId
from database import users_col, generations_col, admin_settings_col
from utils.auth_middleware import require_auth

admin_bp = Blueprint("admin", __name__)


# ─── Middleware: require admin role ───────────────────────────────────────────

def require_admin(f):
    """Decorator that wraps require_auth AND checks role == 'admin'."""
    from functools import wraps

    @wraps(f)
    @require_auth
    def decorated(*args, **kwargs):
        user_id = request.user_id
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated


# ═════════════════════════════════════════════════════════════════════════════
#  DASHBOARD
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route("/dashboard", methods=["GET"])
@require_admin
def dashboard():
    """Dashboard summary: user count, generation count, token totals."""
    try:
        total_users = users_col.count_documents({})
        active_users = users_col.count_documents({"status": "active"})
        suspended_users = users_col.count_documents({"status": {"$ne": "active"}})

        total_generations = generations_col.count_documents({})

        # Aggregate total tokens across all generations
        pipeline = [
            {"$group": {
                "_id": None,
                "total_input_tokens": {"$sum": "$metadata.total_tokens.input_tokens"},
                "total_output_tokens": {"$sum": "$metadata.total_tokens.output_tokens"},
                "total_tokens": {"$sum": "$metadata.total_tokens.total_tokens"},
                "total_images": {"$sum": "$metadata.total_images"},
            }}
        ]
        token_agg = list(generations_col.aggregate(pipeline))
        token_stats = token_agg[0] if token_agg else {
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_tokens": 0,
            "total_images": 0,
        }
        token_stats.pop("_id", None)

        # Recent sign-ups (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_users_this_week = users_col.count_documents({"created_at": {"$gte": week_ago}})

        # This month generations
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        generations_this_month = generations_col.count_documents({"created_at": {"$gte": month_start}})

        return jsonify({
            "users": {
                "total": total_users,
                "active": active_users,
                "suspended": suspended_users,
                "new_this_week": new_users_this_week,
            },
            "generations": {
                "total": total_generations,
                "this_month": generations_this_month,
            },
            "tokens": token_stats,
        })

    except Exception as e:
        print(f"Admin dashboard error: {e}")
        return jsonify({"error": "Failed to load dashboard"}), 500


# ═════════════════════════════════════════════════════════════════════════════
#  USER MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route("/users", methods=["GET"])
@require_admin
def list_users():
    """List all users with pagination. Query: ?page=1&limit=20&search=email"""
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        search = request.args.get("search", "").strip()
        skip = (page - 1) * limit

        query = {}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
            ]

        total = users_col.count_documents(query)
        users_cursor = users_col.find(query).sort("created_at", -1).skip(skip).limit(limit)

        users = []
        for u in users_cursor:
            users.append({
                "id": str(u["_id"]),
                "name": u.get("name", ""),
                "email": u.get("email", ""),
                "phone": u.get("phone", ""),
                "status": u.get("status", "active"),
                "role": u.get("role", "user"),
                "created_at": u.get("created_at", "").isoformat() if u.get("created_at") else None,
            })

        return jsonify({
            "users": users,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit,
        })

    except Exception as e:
        print(f"Admin list users error: {e}")
        return jsonify({"error": "Failed to list users"}), 500


@admin_bp.route("/users/<user_id>", methods=["GET"])
@require_admin
def get_user_detail(user_id):
    """Get detailed user info + their generation stats."""
    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Generation stats for this user
        pipeline = [
            {"$match": {"user_id": ObjectId(user_id)}},
            {"$group": {
                "_id": None,
                "credits": {"$sum": "$credits"},
                "total_generations": {"$sum": 1},
                "total_images": {"$sum": "$metadata.total_images"},
                "total_input_tokens": {"$sum": "$metadata.total_tokens.input_tokens"},
                "total_output_tokens": {"$sum": "$metadata.total_tokens.output_tokens"},
                "total_tokens": {"$sum": "$metadata.total_tokens.total_tokens"},
            }}
        ]
        agg = list(generations_col.aggregate(pipeline))
        gen_stats = agg[0] if agg else {
            "total_generations": 0,
            "total_images": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_tokens": 0,
        }
        gen_stats.pop("_id", None)

        return jsonify({
            "user": {
                "id": str(user["_id"]),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "phone": user.get("phone", ""),
                "status": user.get("status", "active"),
                "role": user.get("role", "user"),
                "profile_picture": user.get("profile_picture"),
                "credits": user.get("credits", 0),
                "created_at": user.get("created_at", "").isoformat() if user.get("created_at") else None,
                "updated_at": user.get("updated_at", "").isoformat() if user.get("updated_at") else None,
            },
            "generation_stats": gen_stats,
        })

    except Exception as e:
        print(f"Admin user detail error: {e}")
        return jsonify({"error": "Failed to get user"}), 500


@admin_bp.route("/users/<user_id>/status", methods=["PUT"])
@require_admin
def update_user_status(user_id):
    """Toggle user status. Body: { "status": "active" | "suspended" }"""
    try:
        data = request.json
        new_status = data.get("status")
        if new_status not in ("active", "suspended"):
            return jsonify({"error": "Status must be 'active' or 'suspended'"}), 400

        result = users_col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"success": True, "message": f"User status updated to {new_status}"})

    except Exception as e:
        print(f"Admin update status error: {e}")
        return jsonify({"error": "Failed to update status"}), 500


# ═════════════════════════════════════════════════════════════════════════════
#  GENERATION ANALYTICS
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route("/users/<user_id>/generations", methods=["GET"])
@require_admin
def get_user_generations(user_id):
    """List generations for a specific user. Query: ?page=1&limit=10"""
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        skip = (page - 1) * limit

        query = {"user_id": ObjectId(user_id)}
        total = generations_col.count_documents(query)
        gens_cursor = generations_col.find(query).sort("created_at", -1).skip(skip).limit(limit)

        generations = []
        for g in gens_cursor:
            meta = g.get("metadata", {})
            token_info = meta.get("total_tokens", {})
            generations.append({
                "id": str(g["_id"]),
                "category": g.get("category", ""),
                "prompt": g.get("prompt", ""),
                "sub_category": meta.get("sub_category", ""),
                "total_images": meta.get("total_images", 0),
                "input_tokens": token_info.get("input_tokens", 0),
                "output_tokens": token_info.get("output_tokens", 0),
                "total_tokens": token_info.get("total_tokens", 0),
                "result_urls": g.get("result_urls", []),
                "status": g.get("status", ""),
                "created_at": g.get("created_at", "").isoformat() if g.get("created_at") else None,
            })

        return jsonify({
            "generations": generations,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit,
        })

    except Exception as e:
        print(f"Admin generations error: {e}")
        return jsonify({"error": "Failed to get generations"}), 500


@admin_bp.route("/token-stats", methods=["GET"])
@require_admin
def token_stats():
    """
    Global token usage stats with filters.
    Query params:
      ?filter=all|month|previous_month|last_3_months|last_6_months|year|custom
      &from=YYYY-MM-DD&to=YYYY-MM-DD  (only for custom)
    """
    try:
        filter_type = request.args.get("filter", "all")
        now = datetime.utcnow()

        match_stage = {}
        if filter_type == "month":
            # Current month
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            match_stage = {"created_at": {"$gte": month_start}}
        elif filter_type == "previous_month":
            # Previous month (1st of prev month → 1st of current month)
            cur_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 1:
                prev_month_start = cur_month_start.replace(year=now.year - 1, month=12)
            else:
                prev_month_start = cur_month_start.replace(month=now.month - 1)
            match_stage = {"created_at": {"$gte": prev_month_start, "$lt": cur_month_start}}
        elif filter_type == "last_3_months":
            # Last 3 months from today
            m = now.month - 3
            y = now.year
            if m <= 0:
                m += 12
                y -= 1
            start = now.replace(year=y, month=m, day=1, hour=0, minute=0, second=0, microsecond=0)
            match_stage = {"created_at": {"$gte": start}}
        elif filter_type == "last_6_months":
            # Last 6 months from today
            m = now.month - 6
            y = now.year
            if m <= 0:
                m += 12
                y -= 1
            start = now.replace(year=y, month=m, day=1, hour=0, minute=0, second=0, microsecond=0)
            match_stage = {"created_at": {"$gte": start}}
        elif filter_type == "year":
            year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            match_stage = {"created_at": {"$gte": year_start}}
        elif filter_type == "custom":
            from_date = request.args.get("from")
            to_date = request.args.get("to")
            if from_date and to_date:
                match_stage = {
                    "created_at": {
                        "$gte": datetime.fromisoformat(from_date),
                        "$lte": datetime.fromisoformat(to_date) + timedelta(days=1),
                    }
                }

        pipeline = [
            {"$match": match_stage} if match_stage else {"$match": {}},
            {"$group": {
                "_id": None,
                "total_generations": {"$sum": 1},
                "total_images": {"$sum": "$metadata.total_images"},
                "total_input_tokens": {"$sum": "$metadata.total_tokens.input_tokens"},
                "total_output_tokens": {"$sum": "$metadata.total_tokens.output_tokens"},
                "total_tokens": {"$sum": "$metadata.total_tokens.total_tokens"},
            }}
        ]

        agg = list(generations_col.aggregate(pipeline))
        stats = agg[0] if agg else {
            "total_generations": 0,
            "total_images": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_tokens": 0,
        }
        stats.pop("_id", None)
        stats["filter"] = filter_type

        # Per-category breakdown
        cat_pipeline = [
            {"$match": match_stage} if match_stage else {"$match": {}},
            {"$group": {
                "_id": "$category",
                "count": {"$sum": 1},
                "tokens": {"$sum": "$metadata.total_tokens.total_tokens"},
                "images": {"$sum": "$metadata.total_images"},
            }},
            {"$sort": {"count": -1}},
        ]
        categories = []
        for c in generations_col.aggregate(cat_pipeline):
            categories.append({
                "category": c["_id"] or "unknown",
                "count": c["count"],
                "tokens": c["tokens"],
                "images": c["images"],
            })

        stats["categories"] = categories

        return jsonify(stats)

    except Exception as e:
        print(f"Admin token stats error: {e}")
        return jsonify({"error": "Failed to get token stats"}), 500


# ═════════════════════════════════════════════════════════════════════════════
#  COST SETTINGS
# ═════════════════════════════════════════════════════════════════════════════

DEFAULT_SETTINGS = {
    "input_cost_per_million": 2,
    "output_cost_per_million": 12,
    "usd_to_inr": 83.5,
    "per_image_cost": 10,
}

DEFAULT_APP_CONFIG = {
    "backend_url": "http://72.62.79.188:3000",
    "app_name": "Brand Shoot AI",
    "maintenance_mode": False,
    "min_app_version": "1.0.0",
}


@admin_bp.route("/settings", methods=["GET"])
@require_admin
def get_settings():
    """Get cost settings. Returns defaults if not set."""
    try:
        doc = admin_settings_col.find_one({"type": "cost_settings"})
        if doc:
            return jsonify({
                "input_cost_per_million": doc.get("input_cost_per_million", DEFAULT_SETTINGS["input_cost_per_million"]),
                "output_cost_per_million": doc.get("output_cost_per_million", DEFAULT_SETTINGS["output_cost_per_million"]),
                "usd_to_inr": doc.get("usd_to_inr", DEFAULT_SETTINGS["usd_to_inr"]),
                "per_image_cost": doc.get("per_image_cost", DEFAULT_SETTINGS["per_image_cost"]),
            })
        return jsonify(DEFAULT_SETTINGS)
    except Exception as e:
        print(f"Admin get settings error: {e}")
        return jsonify({"error": "Failed to get settings"}), 500


@admin_bp.route("/settings", methods=["PUT"])
@require_admin
def update_settings():
    """Update cost settings. Body: { input_cost_per_million, output_cost_per_million, usd_to_inr, per_image_cost }"""
    try:
        data = request.json
        update = {
            "type": "cost_settings",
            "input_cost_per_million": float(data.get("input_cost_per_million", DEFAULT_SETTINGS["input_cost_per_million"])),
            "output_cost_per_million": float(data.get("output_cost_per_million", DEFAULT_SETTINGS["output_cost_per_million"])),
            "usd_to_inr": float(data.get("usd_to_inr", DEFAULT_SETTINGS["usd_to_inr"])),
            "per_image_cost": float(data.get("per_image_cost", DEFAULT_SETTINGS["per_image_cost"])),
            "updated_at": datetime.utcnow(),
        }
        admin_settings_col.update_one(
            {"type": "cost_settings"},
            {"$set": update},
            upsert=True
        )
        print(f"✓ Admin settings updated: {update}")
        return jsonify({"success": True, "message": "Settings updated", **{k: v for k, v in update.items() if k not in ('type', 'updated_at')}})
    except Exception as e:
        print(f"Admin update settings error: {e}")
        return jsonify({"error": "Failed to update settings"}), 500


# ═════════════════════════════════════════════════════════════════════════════
#  CREDITS MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route("/users/<user_id>/credits", methods=["POST"])
@require_admin
def add_user_credits(user_id):
    """
    Add credits to a user account.
    Body: { "credits": 100, "reason": "Admin bonus" }
    """
    try:
        data = request.json
        credits_to_add = data.get("credits", 0)
        reason = data.get("reason", "admin_credit_addition")
        
        if not isinstance(credits_to_add, (int, float)) or credits_to_add <= 0:
            return jsonify({"error": "Credits must be a positive number"}), 400
        
        # Add credits to user
        from models.user import User
        result = User.add_credits(user_id, int(credits_to_add), reason=reason)
        
        if not result:
            return jsonify({"error": "Failed to add credits"}), 500
        
        # Get updated user info
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        new_credits = user.get("credits", 0)
        
        print(f"✓ Admin added {credits_to_add} credits to user {user_id}")
        print(f"  New balance: {new_credits}")
        
        return jsonify({
            "success": True,
            "message": f"Successfully added {credits_to_add} credits",
            "credits_added": int(credits_to_add),
            "total_credits": new_credits,
            "reason": reason
        }), 200
        
    except Exception as e:
        print(f"Admin add credits error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to add credits"}), 500


# ═════════════════════════════════════════════════════════════════════════════
#  APP CONFIG (Backend URL, Maintenance Mode, etc.)
# ═════════════════════════════════════════════════════════════════════════════

@admin_bp.route("/app-config", methods=["GET"])
@require_admin
def get_app_config():
    """Get app configuration including backend URL. Admin only."""
    try:
        doc = admin_settings_col.find_one({"type": "app_config"})
        if doc:
            return jsonify({
                "backend_url": doc.get("backend_url", DEFAULT_APP_CONFIG["backend_url"]),
                "app_name": doc.get("app_name", DEFAULT_APP_CONFIG["app_name"]),
                "maintenance_mode": doc.get("maintenance_mode", DEFAULT_APP_CONFIG["maintenance_mode"]),
                "min_app_version": doc.get("min_app_version", DEFAULT_APP_CONFIG["min_app_version"]),
            })
        return jsonify(DEFAULT_APP_CONFIG)
    except Exception as e:
        print(f"Admin get app config error: {e}")
        return jsonify({"error": "Failed to get app config"}), 500


@admin_bp.route("/app-config", methods=["PUT"])
@require_admin
def update_app_config():
    """Update app configuration including backend URL. Admin only."""
    try:
        data = request.json
        update = {
            "type": "app_config",
            "backend_url": data.get("backend_url", DEFAULT_APP_CONFIG["backend_url"]),
            "app_name": data.get("app_name", DEFAULT_APP_CONFIG["app_name"]),
            "maintenance_mode": data.get("maintenance_mode", DEFAULT_APP_CONFIG["maintenance_mode"]),
            "min_app_version": data.get("min_app_version", DEFAULT_APP_CONFIG["min_app_version"]),
            "updated_at": datetime.utcnow(),
        }
        admin_settings_col.update_one(
            {"type": "app_config"},
            {"$set": update},
            upsert=True
        )
        print(f"✓ App config updated: {update}")
        return jsonify({
            "success": True, 
            "message": "App config updated", 
            **{k: v for k, v in update.items() if k not in ('type', 'updated_at')}
        })
    except Exception as e:
        print(f"Admin update app config error: {e}")
        return jsonify({"error": "Failed to update app config"}), 500
