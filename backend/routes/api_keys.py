from flask import Blueprint, request, jsonify
from utils.auth_middleware import require_auth
from models.api_key import ApiKey
from config import config

api_keys_bp = Blueprint("api_keys", __name__)


@api_keys_bp.route("", methods=["GET"])
@api_keys_bp.route("/", methods=["GET"])
@require_auth
def list_keys():
    """List the authenticated user's API keys (secrets are never returned)."""
    keys = ApiKey.list_for_user(request.user_id)
    return jsonify({"success": True, "keys": keys})


@api_keys_bp.route("/plans", methods=["GET"])
@require_auth
def list_plans():
    """Expose the available plan tiers so the dashboard can render the selector."""
    return jsonify({"success": True, "plans": config.API_PLANS})


@api_keys_bp.route("", methods=["POST"])
@api_keys_bp.route("/", methods=["POST"])
@require_auth
def create_key():
    """
    Create a new API key. Returns the full secret exactly ONCE in the response;
    it is never stored in plaintext and cannot be retrieved again.
    """
    data = request.json or {}
    name = data.get("name", "Untitled key")
    plan = data.get("plan", "free")

    if plan not in config.API_PLANS:
        return jsonify({
            "success": False,
            "error": f"Invalid plan. Choose one of: {', '.join(config.API_PLANS.keys())}"
        }), 400

    key = ApiKey.generate(request.user_id, name, plan)
    return jsonify({
        "success": True,
        "message": "API key created. Copy the secret now — it will not be shown again.",
        "key": key,  # includes one-time 'secret'
    }), 201


@api_keys_bp.route("/<key_id>/rotate", methods=["POST"])
@require_auth
def rotate_key(key_id):
    """Issue a new secret for an existing key (old secret stops working immediately)."""
    key = ApiKey.rotate(key_id, request.user_id)
    if not key:
        return jsonify({"success": False, "error": "API key not found"}), 404
    return jsonify({
        "success": True,
        "message": "API key rotated. Copy the new secret now — it will not be shown again.",
        "key": key,  # includes one-time 'secret'
    })


@api_keys_bp.route("/<key_id>", methods=["DELETE"])
@api_keys_bp.route("/<key_id>/revoke", methods=["POST"])
@require_auth
def revoke_key(key_id):
    """Permanently revoke a key the user owns."""
    ok = ApiKey.revoke(key_id, request.user_id)
    if not ok:
        return jsonify({"success": False, "error": "API key not found"}), 404
    return jsonify({"success": True, "message": "API key revoked"})
