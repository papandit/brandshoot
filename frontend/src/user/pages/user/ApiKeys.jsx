// Developer API key management — create / list / rotate / revoke keys that let
// external sites integrate BrandShoot's Try-On, Photoshoot and Catalog features.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  IoKeyOutline,
  IoCopyOutline,
  IoWarningOutline,
  IoCheckmarkCircle,
  IoRefreshOutline,
  IoTrashOutline,
  IoAddCircleOutline,
  IoCodeSlashOutline,
} from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import {
  fetchApiPlans,
  listApiKeys,
  createApiKey,
  rotateApiKey,
  revokeApiKey,
} from '../../services/api';
import { API_BASE_URL } from '../../config';
import '../pages.css';
import './user.css';

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Copy-able code snippet block used in the integration guide.
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

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('free');
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState(null); // one-time secret to reveal

  const loadKeys = () =>
    listApiKeys()
      .then((res) => setKeys(res.keys || []))
      .catch(() => toast.error('Failed to load API keys'));

  useEffect(() => {
    Promise.all([
      loadKeys(),
      fetchApiPlans()
        .then((res) => {
          setPlans(res.plans || {});
          const first = Object.keys(res.plans || {})[0];
          if (first) setPlan(first);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed — select and copy manually');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Give the key a name');
      return;
    }
    setCreating(true);
    try {
      const res = await createApiKey(name.trim(), plan);
      setNewSecret(res.key.secret);
      setName('');
      await loadKeys();
      toast.success('API key created');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const handleRotate = async (keyId) => {
    if (!window.confirm('Rotate this key? The current secret will stop working immediately.')) return;
    try {
      const res = await rotateApiKey(keyId);
      setNewSecret(res.key.secret);
      await loadKeys();
      toast.success('API key rotated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to rotate key');
    }
  };

  const handleRevoke = async (keyId) => {
    if (!window.confirm('Revoke this key permanently? Integrations using it will stop working.')) return;
    try {
      await revokeApiKey(keyId);
      await loadKeys();
      toast.success('API key revoked');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to revoke key');
    }
  };

  if (loading) {
    return (
      <div className="page-flow">
        <AppHeader title="Developer API" />
        <div className="page-loader">
          <span className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-flow">
      <AppHeader title="Developer API" />
      <div className="flow-content">
        {/* Intro */}
        <div className="details-card">
          <h3>BrandShoot API Keys</h3>
          <p className="api-intro">
            Generate a key to integrate BrandShoot into your e-commerce site or app —
            <b> Try-On</b>, <b>Model Photoshoot</b> and <b>Catalog</b> creation. Send the key in the{' '}
            <code>X-API-Key</code> header. Usage draws from your credit balance and is limited by the
            key's plan. Call the API from your own backend so the key stays secret.
          </p>
        </div>

        {/* One-time secret reveal */}
        {newSecret && (
          <div className="secret-box">
            <div className="sb-warning">
              <IoWarningOutline /> Copy your secret now — it won't be shown again.
            </div>
            <div className="secret-row">
              <code>{newSecret}</code>
              <button onClick={() => copy(newSecret)}>
                <IoCopyOutline /> Copy
              </button>
            </div>
            <button
              className="app-button"
              style={{ marginTop: 12 }}
              onClick={() => setNewSecret(null)}
            >
              <IoCheckmarkCircle /> I've saved it
            </button>
          </div>
        )}

        {/* Create form */}
        <div className="details-card">
          <h3>Create a new key</h3>
          <div className="form-field">
            <label>Key name</label>
            <input
              type="text"
              placeholder="e.g. My Store (production)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)}>
              {Object.entries(plans).map(([key, limits]) => (
                <option key={key} value={key}>
                  {key} — {limits.rate_limit_per_min}/min, {limits.monthly_quota.toLocaleString()} images/mo
                </option>
              ))}
            </select>
          </div>
          <button className="app-button primary" disabled={creating} onClick={handleCreate}>
            <IoAddCircleOutline /> {creating ? 'Generating...' : 'Generate API Key'}
          </button>
        </div>

        {/* Existing keys */}
        <div className="details-card">
          <h3>Your keys ({keys.length})</h3>
          {keys.length === 0 && (
            <p className="api-intro">No keys yet. Create one above to get started.</p>
          )}
          {keys.map((k) => (
            <div key={k.id} className={`api-key-card ${k.status === 'revoked' ? 'revoked' : ''}`}>
              <div className="akc-head">
                <IoKeyOutline />
                <span className="akc-name">{k.name}</span>
                <span
                  className={`status-badge ${k.status === 'active' ? 'active' : 'suspended'}`}
                  style={{ marginLeft: 'auto', marginTop: 0 }}
                >
                  {k.status}
                </span>
              </div>
              <div className="akc-prefix">{k.key_prefix}…</div>
              <div className="akc-meta">
                <span>Plan: <b>{k.plan}</b></span>
                <span>Usage: <b>{k.usage_this_period}</b> / {k.monthly_quota.toLocaleString()}</span>
                <span>Rate: <b>{k.rate_limit_per_min}/min</b></span>
                <span>Last used: <b>{formatDate(k.last_used_at)}</b></span>
              </div>
              {k.status === 'active' && (
                <div className="akc-actions">
                  <button onClick={() => handleRotate(k.id)}>
                    <IoRefreshOutline /> Rotate
                  </button>
                  <button className="danger" onClick={() => handleRevoke(k.id)}>
                    <IoTrashOutline /> Revoke
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* How others can use this — integration guide */}
        <div className="details-card">
          <h3>
            <IoCodeSlashOutline style={{ verticalAlign: '-3px', marginRight: 6 }} />
            How others integrate BrandShoot
          </h3>
          <p className="api-intro" style={{ marginBottom: 16 }}>
            Share this with the developer adding BrandShoot to a store or app. They use your key to
            offer three features to their shoppers — <b>Try-On</b>, <b>Model Photoshoot</b> and{' '}
            <b>Catalog</b>. Images are sent as base64 and generation is asynchronous: each call
            returns a <code>jobId</code> you poll until it's done.
          </p>

          <div className="api-step">
            <h4>1. Authenticate</h4>
            <p>Send the API key in the <code>X-API-Key</code> header on every request.</p>
            <CodeBlock code={`X-API-Key: <your-api-key>`} />
          </div>

          <div className="api-step">
            <h4>2. Available endpoints</h4>
            <div className="endpoint-row">
              <span className="http-method">POST</span>
              <code>/api/v1/tryon</code>
              <span className="ep-desc">Shopper photo + product → try-on</span>
            </div>
            <div className="endpoint-row">
              <span className="http-method">POST</span>
              <code>/api/v1/photoshoot</code>
              <span className="ep-desc">Product + model → multiple poses</span>
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
          </div>

          <div className="api-step">
            <h4>3. Start a Try-On (example)</h4>
            <p>Returns a <code>jobId</code> immediately and deducts 1 credit from your balance.</p>
            <CodeBlock
              code={`curl -X POST ${API_BASE_URL}/api/v1/tryon \\
  -H "X-API-Key: <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "categoryId": "fashion",
    "productImage": "<base64 product image>",
    "userImage": "<base64 of the shopper photo>"
  }'

# → { "jobId": "abc12345", "feature": "tryon", "totalImages": 1 }`}
            />
          </div>

          <div className="api-step">
            <h4>4. Poll for the result</h4>
            <p>Keep polling until <code>status</code> is <code>done</code>, then read <code>images[]</code>.</p>
            <CodeBlock
              code={`curl ${API_BASE_URL}/api/v1/jobs/abc12345 \\
  -H "X-API-Key: <your-api-key>"

# → { "status": "done", "images": [ { "imageUrl": "uploads/....jpg" } ] }`}
            />
          </div>

          <div className="api-step">
            <h4>From your server (JavaScript)</h4>
            <CodeBlock
              code={`const r = await fetch("${API_BASE_URL}/api/v1/tryon", {
  method: "POST",
  headers: {
    "X-API-Key": process.env.BRANDSHOOT_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ categoryId, productImage, userImage }),
});
const { jobId } = await r.json();`}
            />
          </div>

          <div className="security-note">
            <IoWarningOutline />
            <span>
              Call the API from your own backend so the key stays secret — never expose it in a
              shopper's browser. Each generated image is billed to your credit balance and counts
              toward this key's monthly quota.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
