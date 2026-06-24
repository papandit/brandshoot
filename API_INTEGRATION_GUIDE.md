# BrandShoot API — Integration Guide

Integrate **BrandShoot**'s AI product imagery into your own website, app, or backend
using a single API key. Three features are available:

| Feature | Endpoint | What it does |
|---|---|---|
| **Try‑On** | `POST /api/v1/tryon` | Shopper's photo + a product → one virtual try‑on image |
| **Model Photoshoot** | `POST /api/v1/photoshoot` | Product (+ a model) → the model wearing it across several poses |
| **Catalog** | `POST /api/v1/catalog` | Product + one or more models → catalogue images |

Generation is **asynchronous**: every create call returns a `jobId` immediately, and
you **poll** `GET /api/v1/jobs/{jobId}` until the images are ready.

---

## 1. Base URL

```
https://brandshoot.onewebmart.cloud
```

All endpoints below are relative to this base. Always use **HTTPS**.

---

## 2. Get your API key

1. Sign in to BrandShoot and open **Developer API** (the API Keys page).
2. Enter a name and click **Generate API Key**.
3. **Copy the secret immediately** — it is shown only once and looks like:
   ```
   bsk_live_0rT_DUeJ6r5ut1fg-nvxp2M_ktYseg-fbAMT312C5UY
   ```
   Only a hash is stored; if you lose it, **rotate** the key to get a new secret.

> **Keep the key secret.** Call the API only from **your own backend/server** — never
> embed it in a browser, mobile app, or any client a shopper can inspect. Anyone with
> the key can spend your credits.

---

## 3. Authentication

Send the key on **every** request in the `X-API-Key` header:

```
X-API-Key: bsk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`Authorization: Bearer <key>` is also accepted. Requests without a valid, active key
return **401**.

---

## 4. How generation works (the job flow)

```
 ┌─────────────┐   POST /api/v1/tryon|photoshoot|catalog    ┌──────────────┐
 │ Your server │ ─────────────────────────────────────────► │  BrandShoot  │
 │             │ ◄───────────  202 { "jobId": "abc12345" } ──│              │
 │             │                                             │              │
 │             │   GET /api/v1/jobs/abc12345  (poll ~2–3s)   │              │
 │             │ ─────────────────────────────────────────► │   workers    │
 │             │ ◄──  { "status": "done", "images": [...] } ─│              │
 └─────────────┘                                             └──────────────┘
```

- A create call responds **`202 Accepted`** with a `jobId`.
- Poll the job every **2–3 seconds**. `status` is `generating` until it becomes
  `done`. Then read `images[]`.
- Each generated image costs **1 credit**, drawn from your account balance, and counts
  toward your key's monthly quota.

---

## 5. Image inputs

- Send images as **base64‑encoded strings** (the raw base64 only).
- **Strip** any data‑URI prefix — send `iVBORw0KGgo...`, **not**
  `data:image/png;base64,iVBORw0KGgo...`.
- JPEG or PNG, ideally a clear, well‑lit product/person shot.

---

## 6. Categories

`categoryId` selects the styling/prompt set. Current values:

| categoryId | For |
|---|---|
| `Cloths` | Fashion & clothing |
| `home` | Home décor |
| `kitchen` | Kitchen & dining |
| `beauty` | Beauty & cosmetics |
| `sports` | Sports & fitness |

Fetch the live list any time (no key required):
```
GET https://brandshoot.onewebmart.cloud/content/categories
```

---

## 7. Endpoints

### 7.1 Try‑On — `POST /api/v1/tryon`
Places the product onto the **shopper's own photo**. Always 1 image / **1 credit**.

**Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `productImage` | base64 | ✅ | The product to try on |
| `userImage` | base64 | ✅ | The shopper's photo |
| `categoryId` | string | recommended | e.g. `Cloths` |

**Response `202`**
```json
{ "jobId": "abc12345", "feature": "tryon", "totalImages": 1 }
```

---

### 7.2 Model Photoshoot — `POST /api/v1/photoshoot`
Puts the product on a model across several poses. Cost = number of poses for the
category (**N credits**).

**Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `productImage` | base64 | ✅ | The product |
| `modelImage` | base64 | one of these | Your own model photo… |
| `modelId` | string | one of these | …or a BrandShoot preset model id |
| `categoryId` | string | recommended | e.g. `Cloths` |

**Response `202`**
```json
{
  "jobId": "def67890",
  "feature": "photoshoot",
  "totalImages": 4,
  "scenarios": [
    { "id": "shoot_0", "label": "Front pose" },
    { "id": "shoot_1", "label": "Side pose" }
  ]
}
```

---

### 7.3 Catalog — `POST /api/v1/catalog`
Generates catalogue images of the product on one or more models. Cost = number of
models (**N credits**).

**Body**
| Field | Type | Required | Notes |
|---|---|---|---|
| `productImage` | base64 | ✅ | The product |
| `modelImages` | base64[] | ✅ | One entry per model |
| `modelLabels` | string[] | optional | Labels per model (defaults `Model 1`, `Model 2`, …) |
| `categoryId` | string | recommended | e.g. `Cloths` |
| `backgroundColor` | string | optional | e.g. `#FFFFFF` |
| `backgroundLabel` | string | optional | e.g. `White` (default) |

**Response `202`**
```json
{
  "jobId": "ghi13579",
  "feature": "catalog",
  "totalImages": 2,
  "scenarios": [
    { "id": "catalogue_0", "label": "Model 1" },
    { "id": "catalogue_1", "label": "Model 2" }
  ]
}
```

---

### 7.4 Poll a job — `GET /api/v1/jobs/{jobId}`
Scoped to your key's owner. Keep polling until `status` is `done`.

**Response**
```json
{
  "jobId": "abc12345",
  "status": "done",
  "totalImages": 1,
  "completedImages": 1,
  "currentScenario": null,
  "images": [
    { "imageUrl": "uploads/2b1c9a7e-....png" }
  ],
  "errors": []
}
```

- `status`: `generating` → `done`. Partial results may appear in `images[]` before
  completion.
- **`imageUrl` is a relative path.** Build the full URL by prefixing the base:
  ```
  https://brandshoot.onewebmart.cloud/uploads/2b1c9a7e-....png
  ```

---

## 8. Credits, rate limits & quotas

- Every generated image = **1 credit** from the key owner's balance.
- Each key has a **plan** with a per‑minute rate limit and a monthly image quota
  (e.g. Free = 10 req/min, 100 images/month).
- The key's current usage and limits are visible on the Developer API dashboard.

---

## 9. Error responses

All errors are JSON: `{ "success": false, "error": "...", "message": "..." }`
(create calls may use a bare `{ "error": "..." }`).

| HTTP | `error` | Meaning / fix |
|---|---|---|
| `400` | `productImage is required`, … | Missing/invalid field in the body |
| `401` | `API key required` / `Invalid API key` | Missing, wrong, or revoked key |
| `402` | `insufficient_credits` | Owner is out of credits — top up |
| `403` | owner not found / not active | The key's owner account is disabled |
| `404` | `Job not found` | Wrong `jobId`, or it belongs to another key |
| `429` | `rate_limit_exceeded` | Too many req/min — back off; honor `Retry-After` |
| `429` | `quota_exceeded` | Monthly image quota reached |

Recommended polling: every **2–3 s**, with a sensible timeout (e.g. give up after
~2–3 minutes) and exponential backoff on `429`.

---

## 10. End‑to‑end examples

### cURL
```bash
# 1) Start a try-on
curl -X POST https://brandshoot.onewebmart.cloud/api/v1/tryon \
  -H "X-API-Key: $BRANDSHOOT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "Cloths",
    "productImage": "'"$(base64 -w0 product.jpg)"'",
    "userImage": "'"$(base64 -w0 shopper.jpg)"'"
  }'
# → { "jobId": "abc12345", "feature": "tryon", "totalImages": 1 }

# 2) Poll until done
curl https://brandshoot.onewebmart.cloud/api/v1/jobs/abc12345 \
  -H "X-API-Key: $BRANDSHOOT_KEY"
# → { "status": "done", "images": [ { "imageUrl": "uploads/....png" } ] }
```

### Node.js (server-side)
```js
const BASE = "https://brandshoot.onewebmart.cloud";
const KEY = process.env.BRANDSHOOT_KEY; // never expose this to the browser
const headers = { "X-API-Key": KEY, "Content-Type": "application/json" };

const toB64 = (buf) => Buffer.from(buf).toString("base64");

async function tryOn(productBuf, shopperBuf, categoryId = "Cloths") {
  // 1) submit
  const start = await fetch(`${BASE}/api/v1/tryon`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      categoryId,
      productImage: toB64(productBuf),
      userImage: toB64(shopperBuf),
    }),
  });
  if (!start.ok) throw new Error(`submit failed: ${start.status}`);
  const { jobId } = await start.json();

  // 2) poll
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const res = await fetch(`${BASE}/api/v1/jobs/${jobId}`, { headers });
    const job = await res.json();
    if (job.status === "done") {
      return job.images.map((im) => `${BASE}/${im.imageUrl}`);
    }
  }
  throw new Error("timed out waiting for job");
}
```

### Python (server-side)
```python
import os, time, base64, requests

BASE = "https://brandshoot.onewebmart.cloud"
HEADERS = {"X-API-Key": os.environ["BRANDSHOOT_KEY"]}

def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

def try_on(product_path, shopper_path, category_id="Cloths"):
    # 1) submit
    r = requests.post(f"{BASE}/api/v1/tryon", headers=HEADERS, json={
        "categoryId": category_id,
        "productImage": b64(product_path),
        "userImage": b64(shopper_path),
    })
    r.raise_for_status()
    job_id = r.json()["jobId"]

    # 2) poll
    for _ in range(60):
        time.sleep(2.5)
        job = requests.get(f"{BASE}/api/v1/jobs/{job_id}", headers=HEADERS).json()
        if job.get("status") == "done":
            return [f"{BASE}/{im['imageUrl']}" for im in job["images"]]
    raise TimeoutError("job did not finish in time")
```

---

## 11. Best practices

- **Server‑side only.** Proxy these calls through your own backend so the key stays
  secret. Expose only your own thin endpoint to the browser.
- **Poll politely.** 2–3 s interval; stop after a timeout; back off on `429` using the
  `Retry-After` header.
- **Watch credits.** A `402` means the owner is out of credits — surface a clear
  message and top up.
- **Store the full image URL** (`BASE + "/" + imageUrl`) returned by the job; download
  or re‑host it if you need long‑term durability.
- **Rotate, don't share.** If a key may have leaked, rotate it from the dashboard — the
  old secret stops working immediately.

---

*Questions or higher limits? Contact the BrandShoot team.*
