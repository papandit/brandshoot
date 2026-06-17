"""
Generates category-specific showcase images with Gemini and updates the
`categories` collection so each category shows its own product type
(instead of the shared jewelry placeholders).

Run after seed_data.py:  python generate_showcase_images.py

Idempotent: images that already exist on disk are NOT regenerated (no
wasted tokens) — the DB pointers are always refreshed.
"""

import os
from google import genai
from google.genai import types
from config import config
from database import categories_col

client = genai.Client(api_key=config.GEMINI_API_KEY)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SHOWCASE_DIR = os.path.join(BASE_DIR, "uploads", "seed", "showcase")
os.makedirs(SHOWCASE_DIR, exist_ok=True)

# Per-category product + prompts. "before" = plain amateur photo,
# "after" = professional AI photoshoot result.
CATEGORY_PRODUCTS = {
    "fashion": {
        "product": "an elegant designer ethnic kurta on a hanger",
        "after": "a professional fashion photoshoot of an Indian model wearing an elegant designer ethnic kurta, studio lighting, fashion magazine quality",
    },
    "home": {
        "product": "a handcrafted ceramic flower vase on a plain table",
        "after": "a professional interior-design photo of a handcrafted ceramic flower vase styled on a wooden console in a bright modern living room, soft natural light",
    },
    "kitchen": {
        "product": "a stainless steel cookware set on a kitchen counter",
        "after": "a professional advertising photo of a premium stainless steel cookware set in a luxury modern kitchen, steam rising, dramatic studio lighting",
    },
    "electronics": {
        "product": "wireless over-ear headphones lying on a desk",
        "after": "a professional product advertisement of premium wireless over-ear headphones on a dark gradient background with dramatic rim lighting, tech ad style",
    },
    "beauty": {
        "product": "a skincare serum bottle on a bathroom shelf",
        "after": "a professional cosmetics advertisement of a luxury skincare serum bottle with water splash and silk backdrop, soft glamour lighting",
    },
    "sports": {
        "product": "a pair of running shoes on the floor",
        "after": "a professional sports advertisement of modern running shoes mid-action with dust particles and dramatic spotlight, dynamic athletic ad style",
    },
}

BEFORE_STYLE = (
    "A simple, casual smartphone photo of {product}. Plain everyday background, "
    "average amateur lighting, slightly flat colors — the kind of photo a small "
    "shop owner takes to list a product online. Realistic, no text or watermark."
)

AFTER_STYLE = (
    "{after}. Photorealistic, ultra-high quality, perfect composition, "
    "no text or watermark."
)


def generate_image(prompt: str, dest_path: str):
    """Text-to-image via the same Gemini model the app uses."""
    if os.path.exists(dest_path):
        print(f"  ✔ exists, skipping: {os.path.basename(dest_path)}")
        return
    print(f"  ⏳ generating: {os.path.basename(dest_path)}")
    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[types.Part.from_text(text=prompt)],
        config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            with open(dest_path, "wb") as f:
                f.write(part.inline_data.data)
            print(f"  ✅ saved {os.path.basename(dest_path)} ({len(part.inline_data.data)} bytes)")
            return
    raise RuntimeError(f"Gemini returned no image for: {dest_path}")


def url_for(filename: str) -> str:
    return f"uploads/seed/showcase/{filename}"


def main():
    print("🎨 Generating category showcase images...\n")

    for cid, cfg in CATEGORY_PRODUCTS.items():
        print(f"— {cid} —")
        before_file = f"{cid}_before.jpg"
        after_file = f"{cid}_after.jpg"

        generate_image(BEFORE_STYLE.format(product=cfg["product"]), os.path.join(SHOWCASE_DIR, before_file))
        generate_image(AFTER_STYLE.format(after=cfg["after"]), os.path.join(SHOWCASE_DIR, after_file))

        before_url = url_for(before_file)
        after_url = url_for(after_file)

        showcase = {
            "photoshoot": [
                {"id": f"{cid}_ps1", "before_url": before_url, "after_url": after_url},
            ],
            "catalogue": [
                {"id": f"{cid}_cat1", "thumbnails": [
                    {"label": "Product View", "image_url": before_url},
                    {"label": "Studio Shot", "image_url": after_url},
                    {"label": "Key Highlights", "image_url": after_url},
                    {"label": "Before", "image_url": before_url},
                ]},
            ],
            "branding": [
                {"id": f"{cid}_br1", "before_url": before_url, "after_url": after_url},
            ],
        }

        result = categories_col.update_one(
            {"category_id": cid},
            {"$set": {"showcase_items": showcase}},
        )
        print(f"  📦 DB updated (matched={result.matched_count})\n")

    print("🎉 Done! Each category now has its own showcase images.")


if __name__ == "__main__":
    main()
