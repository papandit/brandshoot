// Web port of mobile CatalogueModelSelectionScreen.tsx — pick 1-4 model photos
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IoCheckmarkCircle, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { fetchCatalogueModel } from '../../services/api';
import { getFullUrl } from '../../config';
import '../pages.css';

const MAX_PHOTOS = 4;
const INITIAL_MODEL_VIEWS = 6;

function PhotoGrid({ photos, selectedIds, onToggle, columns = 3 }) {
  return (
    <div className={columns === 3 ? 'grid-3' : 'grid-2'}>
      {photos.map((photo) => {
        const selected = selectedIds.includes(photo.id);
        return (
          <button
            key={photo.id}
            className={`select-card ${selected ? 'selected' : ''}`}
            style={{ borderRadius: 'var(--radius-md)' }}
            onClick={() => onToggle(photo)}
          >
            <img className="card-image square" src={photo.image} alt={photo.label} loading="lazy" />
            <span className="card-label">{photo.label}</span>
            {selected && (
              <span className="card-check">
                <IoCheckmarkCircle />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function CataloguePhotoSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, modelId, modelName, showcaseItem } = location.state || {};

  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showAllModelViews, setShowAllModelViews] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!modelId) return;
    fetchCatalogueModel(modelId)
      .then((data) =>
        setPhotos(
          (data.photos || []).map((p) => ({
            id: p.id,
            image: getFullUrl(p.image_url),
            image_url: p.image_url,
            type: p.type,
            label: p.label,
          }))
        )
      )
      .catch((e) => console.warn('Failed to fetch model photos:', e))
      .finally(() => setLoading(false));
  }, [modelId]);

  if (!modelId) return <Navigate to="/" replace />;

  const togglePhoto = (photo) => {
    setSelectedPhotos((prev) => {
      if (prev.includes(photo.id)) return prev.filter((id) => id !== photo.id);
      if (prev.length >= MAX_PHOTOS) {
        toast(`Maximum ${MAX_PHOTOS} photos can be selected`);
        return prev;
      }
      return [...prev, photo.id];
    });
  };

  const modelViews = photos.filter((p) => p.type === 'model');
  const studioViews = photos.filter((p) => p.type === 'studio');
  const highlights = photos.filter((p) => p.type === 'highlight');
  const visibleModelViews = showAllModelViews ? modelViews : modelViews.slice(0, INITIAL_MODEL_VIEWS);

  const handleContinue = () => {
    if (selectedPhotos.length === 0) {
      toast.error('Please select at least 1 photo.');
      return;
    }
    const selectedModels = photos.filter((p) => selectedPhotos.includes(p.id));
    navigate('/catalogue/background', {
      state: { categoryId, selectedModels, modelName, showcaseItem },
    });
  };

  return (
    <div className="page-flow">
      <AppHeader title={`${modelName} - Select Photos`} />
      <div className="flow-content">
        {loading ? (
          <div className="page-loader" style={{ minHeight: '40vh' }}>
            <span className="spinner" />
          </div>
        ) : (
          <>
            {modelViews.length > 0 && (
              <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h2 className="section-title">Model Views</h2>
                <PhotoGrid
                  photos={visibleModelViews}
                  selectedIds={selectedPhotos}
                  onToggle={togglePhoto}
                  columns={3}
                />
                {modelViews.length > INITIAL_MODEL_VIEWS && (
                  <button className="see-more-btn" onClick={() => setShowAllModelViews(!showAllModelViews)}>
                    {showAllModelViews ? (
                      <>
                        Show Less <IoChevronUp />
                      </>
                    ) : (
                      <>
                        See More <IoChevronDown />
                      </>
                    )}
                  </button>
                )}
              </section>
            )}

            {studioViews.length > 0 && (
              <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h2 className="section-title">Studio Views</h2>
                <PhotoGrid photos={studioViews} selectedIds={selectedPhotos} onToggle={togglePhoto} columns={2} />
              </section>
            )}

            {highlights.length > 0 && (
              <section style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h2 className="section-title">Key Highlights</h2>
                <PhotoGrid photos={highlights} selectedIds={selectedPhotos} onToggle={togglePhoto} columns={2} />
              </section>
            )}

            <div className="selection-info">
              Selected: {selectedPhotos.length}/{MAX_PHOTOS} photos
              {selectedPhotos.length === MAX_PHOTOS && (
                <span className="max-hint">Maximum 4 photos selected</span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flow-footer">
        <button
          className="app-button primary"
          disabled={selectedPhotos.length === 0}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
