// Web port of mobile ModelSelectionScreen.tsx
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IoCheckmarkCircle, IoCameraOutline } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { fetchPhotoshootModels } from '../../services/api';
import { fileToBase64 } from '../../utils/imageUtils';
import { getFullUrl } from '../../config';
import '../pages.css';

export default function ModelSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, showcaseItem } = location.state || {};

  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [customModelImage, setCustomModelImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPhotoshootModels()
      .then((data) =>
        setModels(
          data.map((m) => ({ id: m.id, name: m.name, image: getFullUrl(m.image_url) }))
        )
      )
      .catch((e) => console.warn('Failed to fetch models:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleCustomUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setCustomModelImage(base64);
    setSelectedModel({ id: 'custom', name: 'Your Photo', image: base64 });
  };

  const handleContinue = () => {
    if (!selectedModel) {
      toast.error('Please select a model to continue.');
      return;
    }
    navigate('/photoshoot/upload', {
      state: { categoryId, model: selectedModel, customModelImage, showcaseItem },
    });
  };

  return (
    <div className="page-flow">
      <AppHeader title="Select Model" />
      <div className="flow-content">
        {loading ? (
          <div className="page-loader" style={{ minHeight: '40vh' }}>
            <span className="spinner" />
          </div>
        ) : (
          <div className="grid-2">
            {models.map((model) => (
              <button
                key={model.id}
                className={`select-card ${
                  selectedModel?.id === model.id && !customModelImage ? 'selected' : ''
                }`}
                onClick={() => {
                  setSelectedModel(model);
                  setCustomModelImage(null);
                }}
              >
                <img className="card-image contain" src={model.image} alt={model.name} loading="lazy" />
                <span className="card-name">{model.name}</span>
                {selectedModel?.id === model.id && !customModelImage && (
                  <span className="card-check">
                    <IoCheckmarkCircle />
                  </span>
                )}
              </button>
            ))}

            {/* Custom upload card */}
            <button
              className={`upload-model-card ${customModelImage ? 'selected' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {customModelImage ? (
                <img
                  src={customModelImage}
                  alt="Your uploaded photo"
                  style={{ maxHeight: 140, objectFit: 'contain', borderRadius: 8 }}
                />
              ) : (
                <IoCameraOutline className="umc-icon" />
              )}
              <span className="umc-text">Upload Your Photo</span>
              <span className="umc-hint">Tap to choose</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleCustomUpload}
            />
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
