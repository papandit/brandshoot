# Live Deployment Fix — End-to-End Runbook

Goal: make **API-key generation work on the live site** (`brandshoot.onewebmart.cloud`)
and get the **latest frontend code** deployed. Everything is done **on the server**
(`72.62.79.188`) over SSH — not on your PC, and not in the repo's `nginx.conf`
(that file is stale/unused).

---

## 0. Current state (what's broken vs working)

Tested live just now:

| Request | Result | Meaning |
|---|---|---|
| `POST /auth/login` | `400` JSON (Flask) | ✅ proxied |
| `GET /content/categories` | `200` JSON (Flask) | ✅ proxied |
| `GET /api/v1/jobs/x` | `401` JSON (Flask) | ✅ proxied — **public API works** |
| `POST /api-keys` | **`405` (nginx)** | ❌ **NOT proxied** — key creation fails |
| `GET /api-keys/plans` | `200` **HTML** (SPA) | ❌ NOT proxied (200 is the static page, not JSON) |

**Root cause:** the live nginx forwards `/auth`, `/content`, `/api/v1`, … to Flask, but
has **no rule for `/api-keys`**, so the dashboard's create/list/rotate/revoke calls hit
the static SPA. **One nginx `location` block fixes it.** No app code change is required.

---

## 1. SSH into the server

```bash
ssh root@72.62.79.188          # use your real user / SSH key
```

---

## 2. Find how nginx runs (container vs host)

```bash
docker ps | grep -iE 'nginx|proxy'
```

- **Output shows an nginx container** → note its NAME (e.g. `nginx`, `proxy`,
  `frontend`). You're in the **Docker** path (2A below).
- **No output** → nginx runs on the host directly. You're in the **Host** path (2B).

> The live site reports `nginx/1.29.8`, so there is definitely an nginx in front.

### 2A. Docker path — locate the config file
```bash
NG=<nginx-container-name>                       # set this
docker exec $NG nginx -T | grep -n "api/v1"     # find the working proxy rule
docker exec $NG nginx -T | grep -nE "configuration file|server_name|location /(auth|api)"
```
`nginx -T` prints every included file, each preceded by:
```
# configuration file /etc/nginx/conf.d/xxxxx.conf:
```
Find the file whose `server { }` has `server_name brandshoot.onewebmart.cloud` **and**
`location /api/v1`. That's your target file.

The file is almost always mounted from the host — find the host path:
```bash
docker inspect $NG --format '{{json .Mounts}}' | tr ',' '\n' | grep -i '\.conf\|nginx'
```
Edit the file on the **host** side of that mount (next step). If it's NOT mounted (baked
into the image), edit inside the container with `docker exec -it $NG vi <file>` — but a
mount is far more common.

### 2B. Host path — locate the config file
```bash
nginx -T | grep -n "api/v1"
nginx -T | grep -nE "configuration file|server_name"
```
Target file is usually `/etc/nginx/conf.d/*.conf` or `/etc/nginx/sites-enabled/*`.

---

## 3. Add the `/api-keys` proxy rule

Open the target file (e.g. `vi /etc/nginx/conf.d/brandshoot.conf`). Inside the **same
`server { }`** that already has `location /api/v1 { … }`, copy that block and add this
right next to it:

```nginx
# BrandShoot — dashboard API-key management (create / list / plans / rotate / revoke)
location /api-keys {
    proxy_pass http://<SAME-UPSTREAM-AS-/api/v1>;   # e.g. http://flask_app:8000  (copy from the /api/v1 block)
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

> ⚠️ **Use the exact same `proxy_pass` upstream as the existing `/api/v1` block** — copy
> it verbatim. It might be `http://flask_app:8000`, `http://127.0.0.1:1300`,
> `http://backend:8000`, etc., depending on your setup.
>
> A prefix `location /api-keys` automatically covers `/api-keys/plans`,
> `/api-keys/{id}/rotate`, `/api-keys/{id}/revoke`, and `DELETE /api-keys/{id}`.
>
> If your server uses a regex that lists API prefixes (e.g.
> `location ~ ^/(auth|content|api/v1)`), just add `api-keys` to that alternation instead:
> `location ~ ^/(auth|content|api/v1|api-keys)`.

---

## 4. Test config & reload nginx

**Host:**
```bash
nginx -t && nginx -s reload
```
**Docker:**
```bash
docker exec $NG nginx -t && docker exec $NG nginx -s reload
```
`nginx -t` must say `syntax is ok` / `test is successful` before you reload.

### Verify the fix (run from anywhere)
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://brandshoot.onewebmart.cloud/api-keys \
  -H "Content-Type: application/json" -d '{"name":"probe"}'
```
- **`401`** = ✅ fixed (now reaching Flask, which rejects the missing auth — correct).
- **`405`** = ❌ still static; the rule didn't take. Recheck you edited the right file /
  server block and reloaded.

After this, log into the live dashboard → **Generate API Key** → it should succeed.

---

## 5. Deploy the latest frontend code

The fixes above make key *creation* work. To also ship the latest UI changes
(My Creations redesign, landing stats, etc.) that are already pushed to GitHub
(`papandit/brandshoot`, branch `main`), redeploy the frontend.

First, find the deployment dir on the server:
```bash
find / -maxdepth 6 -name 'docker-compose.y*ml' 2>/dev/null | grep -i 'flyr\|brandshoot'
# or look where the repo was cloned:
ls -la /root /opt /srv /var/www 2>/dev/null | grep -iE 'flyr|brandshoot'
```

Then, **in that project directory**:
```bash
cd <project-dir>
git pull origin main          # pull the latest committed code
```

Now rebuild whichever way this project is deployed (pick the one that matches):

**A) Docker Compose**
```bash
docker compose build frontend && docker compose up -d frontend
# (and if the backend changed) docker compose build flask_app && docker compose up -d flask_app
```

**B) Static build served by nginx (no frontend container)**
```bash
cd frontend
npm ci
# Build with the API base the site uses. It currently builds with "" (same-origin),
# which is correct because nginx proxies /auth, /api/v1, and now /api-keys:
npm run build
# Publish dist/ to the web root nginx serves (find it via `nginx -T | grep root`):
#   e.g. rsync -a --delete dist/ /var/www/brandshoot/
```

> The frontend builds with `API_BASE_URL = ""` (same-origin). That is the **correct**
> setting *as long as nginx proxies the API paths* — which, after Step 3, it does for
> `/api-keys` too. Do not hardcode `127.0.0.1:5000` for production.

If a managed platform (Coolify / Dokploy / CapRover) deploys this repo, just trigger a
redeploy of the `main` branch from its UI instead of the manual build above.

---

## 6. Full end-to-end verification

```bash
BASE=https://brandshoot.onewebmart.cloud

echo "1) public API reachable:"; curl -s -o /dev/null -w "  /api/v1 -> %{http_code} (want 401)\n" "$BASE/api/v1/jobs/x" -H "X-API-Key: x"
echo "2) key mgmt reachable:";   curl -s -o /dev/null -w "  /api-keys -> %{http_code} (want 401)\n" -X POST "$BASE/api-keys" -H "Content-Type: application/json" -d '{"name":"probe"}'
echo "3) plans reachable:";      curl -s -w "\n  /api-keys/plans -> %{http_code}\n" "$BASE/api-keys/plans" -H "X-API-Key: x" | head -c 120
```
Expected: `/api/v1 -> 401`, `/api-keys -> 401`, `/api-keys/plans` returns **JSON** (not HTML).

Then in a browser:
1. Log in (e.g. `admin@gmail.com`).
2. Open **Developer API** → enter a name → **Generate API Key** → secret appears → copy.
3. Open **My Creations** → cards show in a proper grid, click → big viewer with
   **Download** + **Share**.
4. Use the generated key from another app per **API_INTEGRATION_GUIDE.md**.

---

## 7. Rollback (if anything breaks)

nginx change:
```bash
# restore the file you edited (keep a backup first: cp file file.bak before editing)
cp <target-file>.bak <target-file>
nginx -t && nginx -s reload      # or docker exec $NG ...
```
frontend deploy: `git checkout <previous-commit>` in the project dir and rebuild, or
redeploy the previous release from your platform UI.

---

## Quick reference — the whole fix in 6 commands (Docker example)

```bash
ssh root@72.62.79.188
NG=$(docker ps --format '{{.Names}}' | grep -iE 'nginx|proxy' | head -1); echo "nginx=$NG"
docker exec $NG nginx -T | grep -n "api/v1"          # confirm upstream + file
# …edit the mounted conf: add the `location /api-keys { proxy_pass <same-upstream>; … }` block…
docker exec $NG nginx -t && docker exec $NG nginx -s reload
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://brandshoot.onewebmart.cloud/api-keys -H "Content-Type: application/json" -d '{"name":"probe"}'   # want 401
```
