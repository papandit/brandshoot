// Web port of mobile BrandingMainModelSelectionScreen.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IoCheckmarkCircle } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { fetchBrandingModels } from '../../services/api';
import { getFullUrl } from '../../config';
import '../pages.css';

export default function BrandingMainModelSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, showcaseItem } = location.state || {};

  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrandingModels()
      .then((data) =>
        setModels(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            image: getFullUrl(m.image_url),
            posesCount: (m.poses || []).length,
          }))
        )
      )
      .catch((e) => console.warn('Failed to fetch branding models:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = () => {
    if (!selectedModelId) {
      toast.error('Please select a model first.');
      return;
    }
    const model = models.find((m) => m.id === selectedModelId);
    navigate('/branding/poses', {
      state: { categoryId, modelId: model.id, modelName: model.name, showcaseItem },
    });
  };

  return (
    <div className="page-flow">
      <AppHeader title="Select Model" />
      <div className="flow-content">
        <h2 className="section-title">Choose a Model</h2>
        <p className="section-subtitle">Select the model you want to use for your branded image</p>

        {loading ? (
          <div className="page-loader" style={{ minHeight: '40vh' }}>
            <span className="spinner" />
          </div>
        ) : (
          <div className="grid-2">
            {models.map((model) => (
              <button
                key={model.id}
                className={`select-card ${selectedModelId === model.id ? 'selected' : ''}`}
                onClick={() => setSelectedModelId(model.id)}
              >
                <img className="card-image" src={model.image} alt={model.name} loading="lazy" />
                <span className="card-name">{model.name}</span>
                <span className="card-hint" style={{ paddingBottom: 8 }}>
                  {model.posesCount} poses
                </span>
                {selectedModelId === model.id && (
                  <span className="card-check">
                    <IoCheckmarkCircle />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flow-footer">
        <button className="app-button primary" disabled={!selectedModelId} onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
