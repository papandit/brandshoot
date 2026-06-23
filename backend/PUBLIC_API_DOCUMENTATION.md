# BrandShoot Public API (v1)

Integrate BrandShoot's AI generation into any e-commerce site or creative app using an
**API key**. Three features are exposed:

| Feature | Endpoint | Use case |
|---|---|---|
| **Try-On** | `POST /api/v1/tryon` | A shopper uploads their own photo + a product image and sees how they look with the product. |
| **Model photoshoot** | `POST /api/v1/photoshoot` | A shopkeeper uploads a product (and a model) and gets the model wearing/holding it in multiple poses & gestures. |
| **Catalog creation** | `POST /api/v1/catalog` | From a product image + one or more models, generate catalogue images. |
| **Job status** | `GET /api/v1/jobs/{jobId}` | Poll a started job for progress and result images. |

Base URL (local dev): `http://localhost:5000`

---

## Authentication

Send your API key in the **`X-API-Key`** header on every request (the
`Authorization: Bearer <key>` header is also accepted):

```
X-API-Key: bsk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get a key from the BrandShoot web portal → **API Keys**. The full secret is shown **only
once** at creation/rotation — store it securely.

> **Security:** the key spends the owner's credits, so call the API from **your own
> backend**, never directly from a shopper's browser where the key would be exposed.

### Plans

Each key has a plan tier that sets a per-minute rate limit and a monthly image quota:

| Plan | Rate limit | Monthly image quota |
|---|---|---|
| free | 10 req/min | 100 |
| standard | 60 req/min | 5,000 |
| premium | 240 req/min | 50,000 |

Generated images are also billed against the key owner's BrandShoot **credit balance**
(1 credit = 1 image).

---

## Generation is asynchronous

Generation endpoints return **`202 Accepted`** with a `jobId` immediately, then run in the
background. Poll `GET /api/v1/jobs/{jobId}` until `status` is `"done"` / `"completed"`.

Images are referenced by URL path (e.g. `uploads/...jpg`), served from the BrandShoot host.

---

## Endpoints

### POST /api/v1/tryon
Virtual try-on on the shopper's own photo. Generates **1 image** (1 credit).

Request body (JSON):
```json
{
  "categoryId": "fashion",
  "productImage": "<base64 image>",
  "userImage": "<base64 of the shopper's photo>"
}
```

Response `202`:
```json
{ "jobId": "a1b2c3d4", "feature": "tryon", "totalImages": 1 }
```

### POST /api/v1/photoshoot
Product on a model across multiple poses/gestures. Generates **one image per scenario**
configured for the category (credits = number of scenarios).

Request body (JSON) — supply `modelImage` OR `modelId`:
```json
{
  "categoryId": "fashion",
  "productImage": "<base64 image>",
  "modelImage": "<base64 of a model photo>",
  "modelId": "model_123"
}
```

Response `202`:
```json
{
  "jobId": "a1b2c3d4",
  "feature": "photoshoot",
  "totalImages": 4,
  "scenarios": [{ "id": "fashion_0", "label": "Studio" }]
}
```

### POST /api/v1/catalog
Catalogue images of the product worn by one or more models. Generates **one image per
model** (credits = number of models).

Request body (JSON):
```json
{
  "categoryId": "fashion",
  "productImage": "<base64 image>",
  "modelImages": ["<base64>", "<base64>"],
  "modelLabels": ["Model A", "Model B"],
  "backgroundColor": "#FFFFFF",
  "backgroundLabel": "White"
}
```
`modelLabels`, `backgroundColor`, `backgroundLabel` are optional.

Response `202`:
```json
{ "jobId": "a1b2c3d4", "feature": "catalog", "totalImages": 2, "scenarios": [] }
```

### GET /api/v1/jobs/{jobId}
Poll job progress. Only returns jobs created by your key's owner.

Response `200`:
```json
{
  "jobId": "a1b2c3d4",
  "status": "done",
  "totalImages": 4,
  "completedImages": 4,
  "currentScenario": null,
  "images": [
    { "scenarioId": "fashion_0", "label": "Studio", "imageUrl": "uploads/....jpg" }
  ],
  "errors": []
}
```

---

## Errors

| Status | `error` | Meaning |
|---|---|---|
| 400 | (varies) | Missing/invalid input (e.g. no `productImage`). |
| 401 | — | Missing, invalid, or revoked API key. |
| 402 | `insufficient_credits` | Key owner doesn't have enough credits. |
| 403 | — | Key owner account is not active. |
| 404 | — | Job not found (or not owned by your key). |
| 429 | `rate_limit_exceeded` | Per-minute rate limit hit. Respect the `Retry-After` header. |
| 429 | `quota_exceeded` | Monthly image quota reached for this key. |

---

## Example (curl)

```bash
# 1) Start a try-on
curl -X POST http://localhost:5000/api/v1/tryon \
  -H "X-API-Key: bsk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"categoryId":"fashion","productImage":"<base64>","userImage":"<base64>"}'
# -> { "jobId": "a1b2c3d4", ... }

# 2) Poll until done
curl http://localhost:5000/api/v1/jobs/a1b2c3d4 -H "X-API-Key: bsk_live_xxx"
```
