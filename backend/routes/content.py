"""
Content API — serves categories, models, backgrounds from the database.
All routes are public (no auth needed) since this is app content data.
"""

from flask import Blueprint, request, jsonify
from database import categories_col, app_models_col, branding_bg_col, prompt_templates_col, admin_settings_col

content_bp = Blueprint("content", __name__)


# ─── Categories ───────────────────────────────────────────────────────────────

@content_bp.route("/categories", methods=["GET"])
def get_categories():
    """Return all active categories ordered by `order` field."""
    only_active = request.args.get("active", "true").lower() == "true"

    query = {"is_active": True} if only_active else {}
    cats = list(categories_col.find(query).sort("order", 1))

    result = []
    for c in cats:
        result.append({
            "id": c["category_id"],
            "title": c["title"],
            "icon": c.get("icon", ""),
            "is_active": c.get("is_active", True),
            "order": c.get("order", 0),
            "subcategories": c.get("subcategories", []),
            "showcase_items": c.get("showcase_items", {}),
            "scenarios": c.get("scenarios", []),
            "prompts": c.get("prompts", {}),
        })

    return jsonify(result), 200


@content_bp.route("/categories/<category_id>", methods=["GET"])
def get_category(category_id):
    """Return a single category by its category_id."""
    c = categories_col.find_one({"category_id": category_id})
    if not c:
        return jsonify({"error": "Category not found"}), 404

    return jsonify({
        "id": c["category_id"],
        "title": c["title"],
        "icon": c.get("icon", ""),
        "is_active": c.get("is_active", True),
        "order": c.get("order", 0),
        "subcategories": c.get("subcategories", []),
        "showcase_items": c.get("showcase_items", {}),
        "scenarios": c.get("scenarios", []),
        "prompts": c.get("prompts", {}),
    }), 200


# ─── Models (photoshoot, catalogue, branding) ────────────────────────────────

@content_bp.route("/models", methods=["GET"])
def get_models():
    """
    Return models filtered by sub_type.
    Query params:
      ?sub_type=photoshoot|catalogue|branding  (required)
      ?active=true|false  (default: true)
    """
    sub_type = request.args.get("sub_type", "")
    only_active = request.args.get("active", "true").lower() == "true"

    if not sub_type:
        return jsonify({"error": "sub_type query parameter is required"}), 400

    query = {"sub_type": sub_type}
    if only_active:
        query["is_active"] = True

    models = list(app_models_col.find(query).sort("order", 1))

    result = []
    for m in models:
        doc = {
            "id": m["model_id"],
            "name": m["name"],
            "sub_type": m["sub_type"],
            "image_url": m.get("image_url", ""),
            "is_active": m.get("is_active", True),
            "order": m.get("order", 0),
        }
        # Include sub-type specific data
        if sub_type == "catalogue":
            doc["photos"] = m.get("photos", [])
        elif sub_type == "branding":
            doc["poses"] = m.get("poses", [])
            doc["before_image_url"] = m.get("before_image_url")
            doc["after_image_url"] = m.get("after_image_url")

        result.append(doc)

    return jsonify(result), 200


@content_bp.route("/models/<model_id>", methods=["GET"])
def get_model(model_id):
    """Return a single model by model_id."""
    m = app_models_col.find_one({"model_id": model_id})
    if not m:
        return jsonify({"error": "Model not found"}), 404

    doc = {
        "id": m["model_id"],
        "name": m["name"],
        "sub_type": m["sub_type"],
        "image_url": m.get("image_url", ""),
        "is_active": m.get("is_active", True),
        "order": m.get("order", 0),
        "photos": m.get("photos", []),
        "poses": m.get("poses", []),
        "before_image_url": m.get("before_image_url"),
        "after_image_url": m.get("after_image_url"),
    }
    return jsonify(doc), 200


# ─── Branding Backgrounds ────────────────────────────────────────────────────

@content_bp.route("/branding-backgrounds", methods=["GET"])
def get_branding_backgrounds():
    """Return all active branding backgrounds ordered by `order`."""
    only_active = request.args.get("active", "true").lower() == "true"

    query = {"is_active": True} if only_active else {}
    bgs = list(branding_bg_col.find(query).sort("order", 1))

    result = []
    for bg in bgs:
        result.append({
            "id": bg["bg_id"],
            "type": bg.get("type", "color"),
            "label": bg["label"],
            "color": bg.get("color"),
            "image_url": bg.get("image_url"),
            "is_active": bg.get("is_active", True),
            "order": bg.get("order", 0),
        })

    return jsonify(result), 200


# ─── Prompt Templates ────────────────────────────────────────────────────────

@content_bp.route("/prompts", methods=["GET"])
def get_prompts():
    """Return all prompt templates."""
    templates = list(prompt_templates_col.find({"is_active": True}))

    result = []
    for t in templates:
        result.append({
            "id": t["template_id"],
            "name": t["name"],
            "type": t["type"],
            "content": t["content"],
        })

    return jsonify(result), 200


# ─── Scenarios for a Category (used internally by generate.py) ───────────────

@content_bp.route("/scenarios/<category_id>", methods=["GET"])
def get_scenarios(category_id):
    """Return active scenarios for a category."""
    cat = categories_col.find_one({"category_id": category_id})
    if not cat:
        return jsonify([{"id": "default", "label": "Generated",
                         "prompt_hint": "Place the product naturally with the person in a realistic, well-lit environment."}]), 200

    scenarios = cat.get("scenarios", [])
    # Filter only active scenarios
    active = [s for s in scenarios if s.get("is_active", True)]

    if not active:
        active = [{"id": "default", "label": "Generated",
                    "prompt_hint": "Place the product naturally with the person in a realistic, well-lit environment."}]

    return jsonify(active), 200


# ─── App Config (Public) ─────────────────────────────────────────────────────

DEFAULT_APP_CONFIG = {
    "backend_url": "http://72.62.79.188:3000",
    "app_name": "Brand Shoot AI",
    "maintenance_mode": False,
    "min_app_version": "1.0.0",
}

@content_bp.route("/app-config", methods=["GET"])
def get_public_app_config():
    """
    Public endpoint to get app configuration.
    Mobile app calls this on startup to get the current backend URL.
    No authentication required.
    """
    try:
        doc = admin_settings_col.find_one({"type": "app_config"})
        if doc:
            return jsonify({
                "success": True,
                "backend_url": doc.get("backend_url", DEFAULT_APP_CONFIG["backend_url"]),
                "app_name": doc.get("app_name", DEFAULT_APP_CONFIG["app_name"]),
                "maintenance_mode": doc.get("maintenance_mode", DEFAULT_APP_CONFIG["maintenance_mode"]),
                "min_app_version": doc.get("min_app_version", DEFAULT_APP_CONFIG["min_app_version"]),
            })
        return jsonify({"success": True, **DEFAULT_APP_CONFIG})
    except Exception as e:
        print(f"Get public app config error: {e}")
        return jsonify({"success": True, **DEFAULT_APP_CONFIG})
