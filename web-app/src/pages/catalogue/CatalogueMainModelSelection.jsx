// Web port of mobile CatalogueMainModelSelectionScreen.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IoCheckmarkCircle } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { fetchCatalogueModels } from '../../services/api';
import { getFullUrl } from '../../config';
import '../pages.css';

export default function CatalogueMainModelSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, showcaseItem } = location.state || {};

  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalogueModels()
      .then((data) =>
        setModels(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            image: getFullUrl(m.image_url),
            hasPhotos: (m.photos || []).length > 0,
          }))
        )
      )
      .catch((e) => console.warn('Failed to fetch catalogue models:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = () => {
    if (!selectedModel) {
      toast.error('Please select a model first.');
      return;
    }
    navigate('/catalogue/photos', {
      state: {
        categoryId,
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        showcaseItem,
      },
    });
  };

  return (
    <div className="page-flow">
      <AppHeader title="Select Model" />
      <div className="flow-content">
        <h2 className="section-title">Choose a Model</h2>
        <p className="section-subtitle">Select a model to view their available photos</p>

        {loading ? (
          <div className="page-loader" style={{ minHeight: '40vh' }}>
            <span className="spinner" />
          </div>
        ) : (
          <div className="grid-2">
            {models.map((model) => (
              <button
                key={model.id}
                className={`select-card ${selectedModel?.id === model.id ? 'selected' : ''}`}
                onClick={() => setSelectedModel(model)}
              >
                <img className="card-image" src={model.image} alt={model.name} loading="lazy" />
                <span className="card-name">{model.name}</span>
                <span className="card-hint" style={{ paddingBottom: 8, fontStyle: 'italic' }}>
                  {model.hasPhotos ? 'Photos Available' : 'Coming Soon'}
                </span>
                {selectedModel?.id === model.id && (
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
        <button className="app-button primary" disabled={!selectedModel} onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
