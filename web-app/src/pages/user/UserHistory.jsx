// Web port of mobile UserHistoryScreen.tsx — "My Creations" with category filters
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IoImagesOutline, IoDownloadOutline, IoOpenOutline, IoClose } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { fetchMyGenerations } from '../../services/api';
import { downloadImage } from '../../utils/imageUtils';
import { getFullUrl } from '../../config';
import '../pages.css';
import './user.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function UserHistory() {
  const [generations, setGenerations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewerUrl, setViewerUrl] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchMyGenerations(filterCategory)
      .then((data) => {
        setGenerations(data.generations || []);
        setCategories(data.categories || []);
        if (filterCategory === 'all') setTotal(data.total ?? (data.generations || []).length);
      })
      .catch(() => toast.error('Failed to load your creations'))
      .finally(() => setLoading(false));
  }, [filterCategory]);

  return (
    <div className="page-flow">
      <AppHeader title="My Creations" />
      <div className="flow-content">
        {/* Filter chips */}
        <div className="filter-chips">
          <button
            className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            All ({total})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="page-loader" style={{ minHeight: '40vh' }}>
            <span className="spinner" />
          </div>
        ) : generations.length === 0 ? (
          <div className="empty-state">
            <IoImagesOutline />
            <h3>No creations yet</h3>
            <p>Your generated images from the last 30 days will appear here</p>
          </div>
        ) : (
          generations.map((gen) => (
            <div key={gen.id} className="generation-card">
              <div className="gen-card-header">
                <span className="gen-badge">{gen.category}</span>
                {gen.sub_category && <span className="gen-badge sub">{gen.sub_category}</span>}
                <span className="gen-date">{formatDate(gen.created_at)}</span>
              </div>
              <div className="gen-thumbs">
                {(gen.result_urls || []).map((url, i) => {
                  const fullUrl = getFullUrl(url);
                  return (
                    <div key={i} className="gen-thumb">
                      <img
                        src={fullUrl}
                        alt={`${gen.category} ${i + 1}`}
                        loading="lazy"
                        onClick={() => setViewerUrl(fullUrl)}
                      />
                      <div className="gen-thumb-actions">
                        <button
                          onClick={() => downloadImage(fullUrl, `creation_${gen.id}_${i + 1}.png`)}
                          aria-label="Download"
                        >
                          <IoDownloadOutline />
                        </button>
                        <button onClick={() => window.open(fullUrl, '_blank')} aria-label="Open">
                          <IoOpenOutline />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full-screen viewer */}
      {viewerUrl && (
        <div className="viewer-overlay" onClick={() => setViewerUrl(null)}>
          <button className="viewer-close" onClick={() => setViewerUrl(null)}>
            <IoClose />
          </button>
          <img src={viewerUrl} alt="Creation" onClick={(e) => e.stopPropagation()} />
          <div className="viewer-actions">
            <button onClick={() => downloadImage(viewerUrl, 'creation.png')}>
              <IoDownloadOutline />
              Download
            </button>
            <button onClick={() => window.open(viewerUrl, '_blank')}>
              <IoOpenOutline />
              Open
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
