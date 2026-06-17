// Web port of mobile CatalogueUploadScreen.tsx — upload product & start catalogue generation
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppHeader from '../../components/AppHeader';
import UploadDropzone from '../../components/UploadDropzone';
import InsufficientCreditsModal from '../../components/InsufficientCreditsModal';
import { startCatalogueGenerationJob } from '../../services/api';
import { fileToBase64, imageUrlToBase64 } from '../../utils/imageUtils';
import '../pages.css';

export default function CatalogueUpload() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, selectedModels, showcaseItem, selectedBackground } = location.state || {};

  const [productImage, setProductImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsInfo, setCreditsInfo] = useState({ needed: 0, current: 0 });

  // Pre-select the showcase thumbnail as the product image, like the mobile app
  useEffect(() => {
    const showcaseUrl = showcaseItem?.thumbnails?.[0]?.image_url;
    if (showcaseUrl && !productImage) setProductImage(showcaseUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!selectedModels) return <Navigate to="/" replace />;

  const handleGenerate = async () => {
    if (!productImage) {
      toast.error('Please upload a product image first.');
      return;
    }
    setLoading(true);
    try {
      const modelImages = await Promise.all(
        selectedModels.map((m) => imageUrlToBase64(m.image))
      );
      const productBase64 = productImage.startsWith('data:')
        ? productImage
        : await imageUrlToBase64(productImage);

      const data = await startCatalogueGenerationJob({
        categoryId,
        modelImages,
        productImage: productBase64,
        modelLabels: selectedModels.map((m) => m.label),
        backgroundColor: selectedBackground?.color || null,
        backgroundLabel: selectedBackground?.label,
      });

      navigate('/catalogue/result', {
        state: {
          jobId: data.jobId,
          totalImages: data.totalImages,
          scenarios: data.scenarios,
          productImage,
        },
      });
    } catch (error) {
      if (error.response?.status === 402) {
        setCreditsInfo({
          needed: error.response.data?.credits_needed || 0,
          current: error.response.data?.current_credits || 0,
        });
        setShowCreditsModal(true);
      } else {
        toast.error('Failed to start catalogue generation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-flow">
      <AppHeader title="Upload Product" />
      <div className="flow-content">
        {selectedBackground && (
          <div className="upload-section">
            <div className="section-label">Selected Background</div>
            <div className="option-row" style={{ cursor: 'default', marginBottom: 0 }}>
              {selectedBackground.type === 'color' ? (
                <span
                  className="opt-swatch"
                  style={{ backgroundColor: selectedBackground.color, width: 40, height: 40 }}
                />
              ) : (
                <img
                  className="opt-swatch"
                  src={selectedBackground.image}
                  alt={selectedBackground.label}
                  style={{ width: 40, height: 40 }}
                />
              )}
              <span className="opt-label">{selectedBackground.label}</span>
            </div>
          </div>
        )}

        <div className="upload-section">
          <div className="section-label">Selected Model Photos ({selectedModels.length})</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {selectedModels.map((m) => (
              <div key={m.id} className="preview-card" style={{ width: 100, flexShrink: 0 }}>
                <img src={m.image} alt={m.label} style={{ width: 100, height: 100, objectFit: 'cover' }} />
                <span className="preview-label" style={{ fontSize: 9 }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="upload-section">
          <div className="section-label">Product Image</div>
          <UploadDropzone
            onFile={async (file) => {
              const base64 = await fileToBase64(file);
              setProductImage(base64);
            }}
          />
        </div>

        {productImage && (
          <div className="upload-section">
            <div className="section-label">Product Preview</div>
            <div className="preview-card">
              <img src={productImage} alt="Product" style={{ height: 240 }} />
            </div>
          </div>
        )}
      </div>

      <div className="flow-footer">
        <button className="app-button primary" disabled={loading} onClick={handleGenerate}>
          {loading ? 'Generating...' : 'Generate Catalogue'}
        </button>
      </div>

      <InsufficientCreditsModal
        visible={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        onBuyCredits={() => {
          setShowCreditsModal(false);
          navigate('/buy-credits');
        }}
        creditsNeeded={creditsInfo.needed}
        currentCredits={creditsInfo.current}
        generationType="catalogue"
      />
    </div>
  );
}
