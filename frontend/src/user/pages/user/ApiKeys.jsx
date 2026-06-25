// Developer API key management — create / list / rotate / revoke keys that let
// external sites integrate BrandShoot's Try-On, Photoshoot and Catalog features.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  IoArrowForwardOutline,
} from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import {
  listApiKeys,
  createApiKey,
  rotateApiKey,
  revokeApiKey,
} from '../../services/api';
import '../pages.css';
import './user.css';

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState(null); // one-time secret to reveal

  const loadKeys = () =>
    listApiKeys()
      .then((res) => setKeys(res.keys || []))
      .catch(() => toast.error('Failed to load API keys'));

  useEffect(() => {
    loadKeys().finally(() => setLoading(false));
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
      const res = await createApiKey(name.trim());
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
            <code>X-API-Key</code> header. Usage draws from your credit balance. Call the API from
            your own backend so the key stays secret.
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
              onKeyDown={(e) => e.key === 'Enter' && !creating && handleCreate()}
            />
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

        {/* Integration guide lives on its own page now */}
        <Link to="/api-docs" className="details-card doc-cta">
          <div className="doc-cta-icon">
            <IoCodeSlashOutline />
          </div>
          <div className="doc-cta-text">
            <h3>How to use your key in other software</h3>
            <p className="api-intro">
              Step-by-step integration guide — endpoints, the job flow, and ready-to-copy
              cURL / Node / Python examples.
            </p>
          </div>
          <IoArrowForwardOutline className="doc-cta-arrow" />
        </Link>
      </div>
    </div>
  );
}
