// Web port of mobile CatalogueBackgroundSelectionScreen.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { IoCheckmarkCircle } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { fetchBrandingBackgrounds } from '../../services/api';
import { getFullUrl } from '../../config';
import '../pages.css';

export default function CatalogueBackgroundSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, selectedModels, modelName, showcaseItem } = location.state || {};

  const [backgrounds, setBackgrounds] = useState([]);
  const [selectedBgId, setSelectedBgId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrandingBackgrounds()
      .then((data) => {
        const mapped = data.map((bg) => ({
          ...bg,
          image: bg.image_url ? getFullUrl(bg.image_url) : undefined,
        }));
        setBackgrounds(mapped);
        if (mapped.length > 0) setSelectedBgId(mapped[0].id);
      })
      .catch((e) => console.warn('Failed to fetch backgrounds:', e))
      .finally(() => setLoading(false));
  }, []);

  if (!selectedModels) return <Navigate to="/" replace />;

  const handleContinue = () => {
    const selectedBackground = backgrounds.find((bg) => bg.id === selectedBgId) || null;
    navigate('/catalogue/upload', {
      state: { categoryId, selectedModels, modelName, showcaseItem, selectedBackground },
    });
  };

  return (
    <div className="page-flow">
      <AppHeader title="Select Background" />
      <div className="flow-content">
        <h2 className="section-title">Choose Background</h2>
        <p className="section-subtitle">
          Select a solid color or textured background for your catalogue images
        </p>

        {loading ? (
          <div className="page-loader" style={{ minHeight: '40vh' }}>
            <span className="spinner" />
          </div>
        ) : (
          <div>
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                className={`option-row ${selectedBgId === bg.id ? 'selected' : ''}`}
                onClick={() => setSelectedBgId(bg.id)}
              >
                {bg.type === 'color' ? (
                  <span className="opt-swatch" style={{ backgroundColor: bg.color }} />
                ) : (
                  <img className="opt-swatch" src={bg.image} alt={bg.label} loading="lazy" />
                )}
                <span className="opt-label">{bg.label}</span>
                {selectedBgId === bg.id && <IoCheckmarkCircle className="opt-check" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flow-footer">
        <button className="app-button primary" onClick={handleContinue}>
          Continue to Upload
        </button>
      </div>
    </div>
  );
}
