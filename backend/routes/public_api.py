"""
Public BrandShoot API (v1).

API-key-authenticated endpoints that let external sites (e-commerce merchants and
the photoshoot community) drive BrandShoot's generation pipeline:

  POST /api/v1/tryon       Feature 1 - shopper uploads their own photo + a product
                           image -> single virtual try-on image.
  POST /api/v1/photoshoot  Feature 2 - product image (+ a model) -> the model wearing
                           the product across multiple poses/gestures.
  POST /api/v1/catalog     Feature 3 - product + one or more models -> catalogue images.
  GET  /api/v1/jobs/<id>   Poll a job for status + result images (owner-scoped).

These reuse the exact generation workers, in-memory job store and credit logic from
routes/generate.py; the only difference from the first-party endpoints is API-key auth,
per-key rate limit / monthly quota, and that usage is billed to the key owner's credits.
"""

import os
import uuid
import base64
import threading
from datetime import datetime

from flask import Blueprint, request, jsonify
from bson import ObjectId

from utils.api_key_middleware import require_api_key
from models.user import User
from models.generation import Generation
from models.api_key import ApiKey
from database import generations_col, app_models_col
from routes.generate import (
    jobs,
    get_scenarios,
    _run_generation,
    _run_catalogue_generation,
    _serialize_job_from_generation,
)

public_api_bp = Blueprint("public_api", __name__)


# ─── helpers ──────────────────────────────────────────────────────────────────

def _charge(user_id: str, credits_needed: int, reason: str):
    """
    Verify and deduct credits from the key owner. Returns a Flask (response, status)
    tuple on failure, or None on success.
    """
    current = User.get_credits(user_id)
    if current < credits_needed:
        return jsonify({
            "error": "insufficient_credits",
            "message": f"This API key's owner needs {credits_needed} credits but has {current}",
            "credits_needed": credits_needed,
            "current_credits": current,
        }), 402

    result = User.deduct_credits(user_id, credits_needed, reason=reason)
    if not result["success"]:
        return jsonify({"error": "credit_deduction_failed", "message": result["message"]}), 400
    return None


def _resolve_model_image(model_id: str):
    """
    Best-effort: turn a preset app_models `model_id` into base64 image data by reading
    its locally stored upload. Returns None if the model or file can't be found.
    """
    try:
        m = app_models_col.find_one({"model_id": model_id})
        if not m:
            return None
        image_url = m.get("image_url", "") or ""
        if not image_url:
            return None
        filename = image_url.split("uploads/")[-1] if "uploads/" in image_url else os.path.basename(image_url)
        path = os.path.join("uploads", filename)
        if os.path.exists(path):
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")
        print(f"[public_api] Preset model file not found on disk: {path}")
        return None
    except Exception as e:
        print(f"[public_api] Failed to resolve model image for '{model_id}': {e}")
        return None


def _create_job_record(job_id, user_id, category_id, scenarios, sub_category,
                       total_images, extra_metadata=None):
    """Register the in-memory job and persist a generation record (API-tagged)."""
    jobs[job_id] = {
        "status": "generating",
        "totalImages": total_images,
        "images": [],
        "errors": [],
        "scenarios": scenarios,
        "currentScenario": None,
        "categoryId": category_id,
        "userId": user_id,
    }

    metadata = {
        "job_id": job_id,
        "scenarios": [s["label"] for s in scenarios],
        "scenario_defs": scenarios,
        "total_images": total_images,
        "total_tokens": {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0},
        "sub_category": sub_category,
        "currentScenario": None,
        "errors": [],
        "images": [],
        "source": "api",
        "api_key_id": getattr(request, "api_key_id", None),
        "updated_at": datetime.utcnow(),
    }
    if extra_metadata:
        metadata.update(extra_metadata)

    Generation.create_generation(
        user_id=user_id,
        generation_type="image",
        category=category_id,
        prompt=f"[API:{sub_category}] Generating {total_images} image(s) for {category_id}",
        result_urls=[],
        metadata=metadata,
        status="generating",
    )


# ─── Feature 1: Try-On (shopper photo + product) ───────────────────────────────

@public_api_bp.route("/tryon", methods=["POST"])
@require_api_key
def tryon():
    """Virtual try-on: place the product on the shopper's own uploaded photo."""
    data = request.json or {}
    user_id = request.user_id

    category_id = data.get("categoryId")
    product_image = data.get("productImage")
    user_image = data.get("userImage")  # shopper's photo (base64)

    if not product_image:
        return jsonify({"error": "productImage is required"}), 400
    if not user_image:
        return jsonify({"error": "userImage (the shopper's photo) is required"}), 400

    # Single image keeps the shopper-facing flow fast and cheap (1 credit).
    scenarios = get_scenarios(category_id)
    scenario = scenarios[0] if scenarios else {"id": "tryon_0", "label": "Try-On", "prompt_hint": ""}
    scenarios = [scenario]
    credits_needed = 1

    err = _charge(user_id, credits_needed, reason="api_tryon")
    if err:
        return err

    job_id = str(uuid.uuid4())[:8]
    _create_job_record(job_id, user_id, category_id, scenarios, "tryon", credits_needed)

    # The shopper's photo is the "model image" for the try-on.
    thread = threading.Thread(
        target=_run_generation,
        args=(job_id, category_id, user_image, product_image, user_id),
    )
    thread.daemon = True
    thread.start()

    ApiKey.record_usage(request.api_key_id, credits_needed)
    print(f"[Job {job_id}] API try-on started (User: {user_id})")

    return jsonify({"jobId": job_id, "feature": "tryon", "totalImages": credits_needed}), 202


# ─── Feature 2: Model photoshoot (product -> model in multiple poses) ───────────

@public_api_bp.route("/photoshoot", methods=["POST"])
@require_api_key
def photoshoot():
    """Generate the product on a model across multiple poses/gestures (scenario set)."""
    data = request.json or {}
    user_id = request.user_id

    category_id = data.get("categoryId")
    product_image = data.get("productImage")
    model_image = data.get("modelImage")  # base64; optional if modelId is given
    model_id = data.get("modelId")

    if not product_image:
        return jsonify({"error": "productImage is required"}), 400

    if not model_image and model_id:
        model_image = _resolve_model_image(model_id)
    if not model_image:
        return jsonify({
            "error": "model_required",
            "message": "Provide a modelImage (base64) or a valid modelId of a preset model"
        }), 400

    scenarios = get_scenarios(category_id)
    if not scenarios:
        return jsonify({"error": "No scenarios configured for this categoryId"}), 400
    credits_needed = len(scenarios)

    err = _charge(user_id, credits_needed, reason="api_photoshoot")
    if err:
        return err

    job_id = str(uuid.uuid4())[:8]
    _create_job_record(job_id, user_id, category_id, scenarios, "shoot", credits_needed)

    thread = threading.Thread(
        target=_run_generation,
        args=(job_id, category_id, model_image, product_image, user_id),
    )
    thread.daemon = True
    thread.start()

    ApiKey.record_usage(request.api_key_id, credits_needed)
    print(f"[Job {job_id}] API photoshoot started: {credits_needed} pose(s) (User: {user_id})")

    return jsonify({
        "jobId": job_id,
        "feature": "photoshoot",
        "totalImages": credits_needed,
        "scenarios": [{"id": s["id"], "label": s["label"]} for s in scenarios],
    }), 202


# ─── Feature 3: Catalog creation (product + models -> catalogue) ────────────────

@public_api_bp.route("/catalog", methods=["POST"])
@require_api_key
def catalog():
    """Generate catalogue images of the product worn by one or more models."""
    data = request.json or {}
    user_id = request.user_id

    category_id = data.get("categoryId")
    product_image = data.get("productImage")
    model_images = data.get("modelImages", [])
    model_labels = data.get("modelLabels", [])
    bg_color = data.get("backgroundColor")
    bg_label = data.get("backgroundLabel", "White")

    if not product_image:
        return jsonify({"error": "productImage is required"}), 400
    if not model_images or len(model_images) == 0:
        return jsonify({"error": "At least one model image is required in modelImages[]"}), 400

    # Default labels when the caller doesn't supply them.
    if not model_labels or len(model_labels) != len(model_images):
        model_labels = [f"Model {i + 1}" for i in range(len(model_images))]

    credits_needed = len(model_images)
    err = _charge(user_id, credits_needed, reason="api_catalog")
    if err:
        return err

    job_id = str(uuid.uuid4())[:8]
    scenarios = [{"id": f"catalogue_{i}", "label": label} for i, label in enumerate(model_labels)]
    _create_job_record(
        job_id, user_id, category_id, scenarios, "catalogue", credits_needed,
        extra_metadata={"model_labels": model_labels},
    )

    thread = threading.Thread(
        target=_run_catalogue_generation,
        args=(job_id, category_id, model_images, product_image, model_labels, user_id, bg_color, bg_label),
    )
    thread.daemon = True
    thread.start()

    ApiKey.record_usage(request.api_key_id, credits_needed)
    print(f"[Job {job_id}] API catalog started: {credits_needed} model(s) (User: {user_id})")

    return jsonify({
        "jobId": job_id,
        "feature": "catalog",
        "totalImages": credits_needed,
        "scenarios": scenarios,
    }), 202


# ─── Job polling (owner-scoped) ─────────────────────────────────────────────────

@public_api_bp.route("/jobs/<job_id>", methods=["GET"])
@require_api_key
def job_status(job_id):
    """Return job status + generated images, scoped to the API key owner."""
    user_id = request.user_id

    job = jobs.get(job_id)
    if job and str(job.get("userId")) == str(user_id):
        return jsonify({
            "jobId": job_id,
            "status": job["status"],
            "totalImages": job["totalImages"],
            "completedImages": len(job["images"]),
            "currentScenario": job.get("currentScenario"),
            "images": job["images"],
            "errors": job["errors"],
        })

    try:
        generation = generations_col.find_one(
            {"metadata.job_id": job_id, "user_id": ObjectId(user_id)}
        )
    except Exception:
        generation = None

    if generation:
        return jsonify(_serialize_job_from_generation(job_id, generation))

    return jsonify({"error": "Job not found"}), 404
