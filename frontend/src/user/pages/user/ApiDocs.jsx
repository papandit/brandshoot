// Developer API — full step-by-step integration guide (its own page).
// Source of truth: /API_INTEGRATION_GUIDE.md in the repo. Keep them in sync.
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  IoCopyOutline,
  IoWarningOutline,
  IoKeyOutline,
  IoArrowBackOutline,
  IoLogoMarkdown,
  IoCheckmarkCircle,
} from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import '../pages.css';
import './user.css';

// External callers hit the public production host (not the dashboard's relative base).
const BASE = 'https://brandshoot.onewebmart.cloud';
const MD_URL = 'https://github.com/papandit/brandshoot/blob/main/API_INTEGRATION_GUIDE.md';

function CodeBlock({ code }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed — select and copy manually');
    }
  };
  return (
    <div className="code-block">
      <button className="cb-copy" onClick={copy}>
        <IoCopyOutline /> Copy
      </button>
      <pre>{code}</pre>
    </div>
  );
}

export default function ApiDocs() {
  return (
    <div className="page-flow">
      <AppHeader title="API Integration Guide" />
      <div className="flow-content">
        {/* Intro */}
        <div className="details-card">
          <Link to="/api-keys" className="doc-back">
            <IoArrowBackOutline /> Back to API Keys
          </Link>
          <h3>Integrate BrandShoot into your software</h3>
          <p className="api-intro">
            Use a single API key to add BrandShoot's AI product imagery to your own site,
            app, or backend. Three features are available — generation is{' '}
            <b>asynchronous</b>: every create call returns a <code>jobId</code> you poll
            until the images are ready.
          </p>
          <div className="endpoint-row">
            <span className="http-method">POST</span>
            <code>/api/v1/tryon</code>
            <span className="ep-desc">Shopper photo + product → try-on</span>
          </div>
          <div className="endpoint-row">
            <span className="http-method">POST</span>
            <code>/api/v1/photoshoot</code>
            <span className="ep-desc">Product (+ model) → multiple poses</span>
          </div>
          <div className="endpoint-row">
            <span className="http-method">POST</span>
            <code>/api/v1/catalog</code>
            <span className="ep-desc">Product + models → catalogue</span>
          </div>
          <div className="endpoint-row">
            <span className="http-method">GET</span>
            <code>{'/api/v1/jobs/{jobId}'}</code>
            <span className="ep-desc">Poll for status + result images</span>
          </div>
          <a className="doc-md-link" href={MD_URL} target="_blank" rel="noreferrer">
            <IoLogoMarkdown /> Full reference: API_INTEGRATION_GUIDE.md
          </a>
        </div>

        {/* Step 1 — Base URL & key */}
        <div className="details-card">
          <h3>Step 1 — Base URL & your key</h3>
          <p className="api-intro">All endpoints are relative to this base (always HTTPS):</p>
          <CodeBlock code={BASE} />
          <p className="api-intro" style={{ marginTop: 12 }}>
            Generate a key on the{' '}
            <Link to="/api-keys" className="doc-inline-link">
              <IoKeyOutline style={{ verticalAlign: '-2px' }} /> API Keys
            </Link>{' '}
            page and copy the secret (shown once). It looks like{' '}
            <code>bsk_live_…</code>.
          </p>
        </div>

        {/* Step 2 — Auth */}
        <div className="details-card">
          <h3>Step 2 — Authenticate every request</h3>
          <p className="api-intro">
            Send the key in the <code>X-API-Key</code> header (or{' '}
            <code>Authorization: Bearer &lt;key&gt;</code>). Requests without a valid,
            active key return <code>401</code>.
          </p>
          <CodeBlock code={`X-API-Key: bsk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
        </div>

        {/* Step 3 — Job flow */}
        <div className="details-card">
          <h3>Step 3 — How generation works</h3>
          <ol className="doc-list">
            <li>Call a create endpoint → you get <b>202</b> with a <code>jobId</code>.</li>
            <li>
              Poll <code>{'GET /api/v1/jobs/{jobId}'}</code> every <b>2–3 seconds</b> until{' '}
              <code>status</code> is <code>done</code>.
            </li>
            <li>Read <code>images[]</code> and build full URLs (Step 7).</li>
          </ol>
          <div className="security-note" style={{ marginTop: 12 }}>
            <IoCheckmarkCircle />
            <span>Each generated image costs 1 credit from your balance and counts toward the key's monthly quota.</span>
          </div>
        </div>

        {/* Step 4 — Image inputs */}
        <div className="details-card">
          <h3>Step 4 — Image inputs</h3>
          <ul className="doc-list">
            <li>Send images as <b>raw base64</b> strings.</li>
            <li>
              Strip any data-URI prefix — send <code>iVBORw0KGgo…</code>, not{' '}
              <code>data:image/png;base64,iVBORw0KGgo…</code>.
            </li>
            <li>JPEG or PNG, clear and well-lit.</li>
          </ul>
        </div>

        {/* Step 5 — Categories */}
        <div className="details-card">
          <h3>Step 5 — Categories (<code>categoryId</code>)</h3>
          <table className="doc-table">
            <thead><tr><th>categoryId</th><th>For</th></tr></thead>
            <tbody>
              <tr><td><code>Cloths</code></td><td>Fashion & clothing</td></tr>
              <tr><td><code>home</code></td><td>Home décor</td></tr>
              <tr><td><code>kitchen</code></td><td>Kitchen & dining</td></tr>
              <tr><td><code>beauty</code></td><td>Beauty & cosmetics</td></tr>
              <tr><td><code>sports</code></td><td>Sports & fitness</td></tr>
            </tbody>
          </table>
          <p className="api-intro" style={{ marginTop: 10 }}>
            Live list (no key needed): <code>GET {BASE}/content/categories</code>
          </p>
        </div>

        {/* Step 6 — Endpoints */}
        <div className="details-card">
          <h3>Step 6 — Endpoints</h3>

          <div className="api-step">
            <h4>Try-On — <code>POST /api/v1/tryon</code></h4>
            <p>Product on the shopper's own photo. Always 1 image / 1 credit.</p>
            <CodeBlock
              code={`curl -X POST ${BASE}/api/v1/tryon \\
  -H "X-API-Key: $BRANDSHOOT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "categoryId": "Cloths",
    "productImage": "<base64 product>",
    "userImage": "<base64 shopper photo>"
  }'
# → { "jobId": "abc12345", "feature": "tryon", "totalImages": 1 }`}
            />
          </div>

          <div className="api-step">
            <h4>Model Photoshoot — <code>POST /api/v1/photoshoot</code></h4>
            <p>Product on a model across several poses. Cost = number of poses.</p>
            <CodeBlock
              code={`curl -X POST ${BASE}/api/v1/photoshoot \\
  -H "X-API-Key: $BRANDSHOOT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "categoryId": "Cloths",
    "productImage": "<base64 product>",
    "modelImage": "<base64 model>"   // or "modelId": "<preset id>"
  }'`}
            />
          </div>

          <div className="api-step">
            <h4>Catalog — <code>POST /api/v1/catalog</code></h4>
            <p>Product on one or more models. Cost = number of models.</p>
            <CodeBlock
              code={`curl -X POST ${BASE}/api/v1/catalog \\
  -H "X-API-Key: $BRANDSHOOT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "categoryId": "Cloths",
    "productImage": "<base64 product>",
    "modelImages": ["<base64 model 1>", "<base64 model 2>"],
    "backgroundLabel": "White"
  }'`}
            />
          </div>

          <div className="api-step">
            <h4>Poll a job — <code>{'GET /api/v1/jobs/{jobId}'}</code></h4>
            <CodeBlock
              code={`curl ${BASE}/api/v1/jobs/abc12345 \\
  -H "X-API-Key: $BRANDSHOOT_KEY"

# → {
#   "status": "done",
#   "images": [ { "imageUrl": "uploads/2b1c....png" } ]
# }`}
            />
          </div>
        </div>

        {/* Step 7 — Reading results */}
        <div className="details-card">
          <h3>Step 7 — Read the results</h3>
          <p className="api-intro">
            <code>imageUrl</code> is a relative path. Prefix it with the base to get the
            full URL:
          </p>
          <CodeBlock code={`${BASE}/uploads/2b1c9a7e-....png`} />
        </div>

        {/* Step 8 — Full example */}
        <div className="details-card">
          <h3>Step 8 — End-to-end (Node.js, server-side)</h3>
          <CodeBlock
            code={`const BASE = "${BASE}";
const KEY = process.env.BRANDSHOOT_KEY; // never expose to the browser
const headers = { "X-API-Key": KEY, "Content-Type": "application/json" };
const toB64 = (buf) => Buffer.from(buf).toString("base64");

async function tryOn(productBuf, shopperBuf, categoryId = "Cloths") {
  const start = await fetch(\`\${BASE}/api/v1/tryon\`, {
    method: "POST", headers,
    body: JSON.stringify({
      categoryId,
      productImage: toB64(productBuf),
      userImage: toB64(shopperBuf),
    }),
  });
  const { jobId } = await start.json();

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const job = await (await fetch(\`\${BASE}/api/v1/jobs/\${jobId}\`, { headers })).json();
    if (job.status === "done") return job.images.map((im) => \`\${BASE}/\${im.imageUrl}\`);
  }
  throw new Error("timed out");
}`}
          />
        </div>

        {/* Step 9 — Errors */}
        <div className="details-card">
          <h3>Step 9 — Errors & limits</h3>
          <table className="doc-table">
            <thead><tr><th>HTTP</th><th>Meaning</th></tr></thead>
            <tbody>
              <tr><td><code>400</code></td><td>Missing/invalid field in the body</td></tr>
              <tr><td><code>401</code></td><td>Missing, invalid, or revoked key</td></tr>
              <tr><td><code>402</code></td><td>Owner out of credits — top up</td></tr>
              <tr><td><code>403</code></td><td>Key owner account disabled</td></tr>
              <tr><td><code>404</code></td><td>Wrong <code>jobId</code> (or not yours)</td></tr>
              <tr><td><code>429</code></td><td>Rate limit / monthly quota exceeded — back off, honor <code>Retry-After</code></td></tr>
            </tbody>
          </table>
        </div>

        {/* Security */}
        <div className="security-note">
          <IoWarningOutline />
          <span>
            Call the API only from <b>your own backend</b> so the key stays secret — never
            embed it in a browser or mobile app. If a key may have leaked, rotate it from
            the API Keys page; the old secret stops working immediately.
          </span>
        </div>

        <a className="doc-md-link" href={MD_URL} target="_blank" rel="noreferrer">
          <IoLogoMarkdown /> Full reference: API_INTEGRATION_GUIDE.md
        </a>
      </div>
    </div>
  );
}
