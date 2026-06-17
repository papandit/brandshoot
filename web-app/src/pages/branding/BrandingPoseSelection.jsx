// Web port of mobile BrandingPoseSelectionScreen.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IoCheckmarkCircle, IoCameraOutline } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { fetchBrandingModels } from '../../services/api';
import { getFullUrl } from '../../config';
import '../pages.css';

export default function BrandingPoseSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, modelId, modelName, showcaseItem } = location.state || {};

  const [poses, setPoses] = useState([]);
  const [selectedPoseId, setSelectedPoseId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!modelId) return;
    fetchBrandingModels()
      .then((data) => {
        const model = data.find((m) => m.id === modelId);
        setPoses(
          (model?.poses || []).map((p) => ({
            id: p.id,
            image: getFullUrl(p.image_url),
            label: p.label,
          }))
        );
      })
      .catch((e) => console.warn('Failed to fetch poses:', e))
      .finally(() => setLoading(false));
  }, [modelId]);

  if (!modelId) return <Navigate to="/" replace />;

  const handleContinue = () => {
    if (!selectedPoseId) {
      toast.error('Please select a pose to continue.');
      return;
    }
    const selectedPose = poses.find((p) => p.id === selectedPoseId);
    navigate('/branding/settings', {
      state: { categoryId, modelId, modelName, selectedPose, showcaseItem },
    });
  };

  return (
    <div className="page-flow">
      <AppHeader title={`${modelName} — Select Pose`} />
      <div className="flow-content">
        <h2 className="section-title">Choose a Pose</h2>
        <p className="section-subtitle">Pick the pose you want for your branded image</p>

        {loading ? (
          <div className="page-loader" style={{ minHeight: '40vh' }}>
            <span className="spinner" />
          </div>
        ) : poses.length === 0 ? (
          <div className="empty-state">
            <IoCameraOutline />
            <p>No poses available for this model yet</p>
          </div>
        ) : (
          <div className="grid-3">
            {poses.map((pose) => (
              <button
                key={pose.id}
                className={`select-card ${selectedPoseId === pose.id ? 'selected' : ''}`}
                style={{ borderRadius: 'var(--radius-md)' }}
                onClick={() => setSelectedPoseId(pose.id)}
              >
                <img
                  className="card-image"
                  style={{ aspectRatio: '3 / 4' }}
                  src={pose.image}
                  alt={pose.label}
                  loading="lazy"
                />
                <span className="card-label">{pose.label}</span>
                {selectedPoseId === pose.id && (
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
        <button className="app-button primary" disabled={!selectedPoseId} onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
