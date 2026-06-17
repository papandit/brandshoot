// Web port of mobile BrandingUploadScreen.tsx — summary + product upload + start generation
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppHeader from '../../components/AppHeader';
import UploadDropzone from '../../components/UploadDropzone';
import InsufficientCreditsModal from '../../components/InsufficientCreditsModal';
import { startBrandingGenerationJob } from '../../services/api';
import { fileToBase64, imageUrlToBase64 } from '../../utils/imageUtils';
import '../pages.css';
import './branding.css';

export default function BrandingUpload() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, modelId, modelName, selectedPose, brandingSettings, showcaseItem } =
    location.state || {};

  const [productImage, setProductImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsInfo, setCreditsInfo] = useState({ needed: 0, current: 0 });

  // Pre-select showcase "before" image as the product, like the mobile app
  useEffect(() => {
    if (showcaseItem?.before_url && !productImage) {
      setProductImage(showcaseItem.before_url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!brandingSettings) return <Navigate to="/" replace />;

  const { background, aspectRatio } = brandingSettings;

  const handleGenerate = async () => {
    if (!productImage) {
      toast.error('Please upload a product image first.');
      return;
    }
    setLoading(true);
    try {
      const poseBase64 = await imageUrlToBase64(selectedPose.image);
      const productBase64 = productImage.startsWith('data:')
        ? productImage
        : await imageUrlToBase64(productImage);
      const logoBase64 = brandingSettings.logoUri || null;

      const data = await startBrandingGenerationJob({
        categoryId,
        modelId,
        poseImage: poseBase64,
        productImage: productBase64,
        logoImage: logoBase64,
        businessName: brandingSettings.businessName,
        phoneNumber: brandingSettings.phoneNumber,
        address: brandingSettings.address,
        webUrl: brandingSettings.webUrl,
        backgroundColor: background?.type === 'color' ? background.color : null,
        backgroundLabel: background?.label,
        aspectRatio: aspectRatio?.id,
        aspectRatioDescription: aspectRatio?.description,
      });

      navigate('/branding/result', {
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
        toast.error('Failed to generate branding image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-flow">
      <AppHeader title="Upload Product" />
      <div className="flow-content">
        {/* Branding summary */}
        <section className="upload-section">
          <div className="summary-card">
            <h3>Branding Summary</h3>
            <div className="summary-row">
              <span className="sr-label">Model:</span>
              <span className="sr-value">{modelName}</span>
            </div>
            <div className="summary-row">
              <span className="sr-label">Pose:</span>
              <span className="sr-value">{selectedPose?.label}</span>
            </div>
            <div className="summary-row">
              <span className="sr-label">Business:</span>
              <span className="sr-value">{brandingSettings.businessName}</span>
            </div>
            {background && (
              <div className="summary-row">
                <span className="sr-label">Background:</span>
                <span className="sr-value">
                  {background.type === 'color' && (
                    <span className="sr-color-dot" style={{ backgroundColor: background.color }} />
                  )}
                  {background.label}
                </span>
              </div>
            )}
            {aspectRatio && (
              <div className="summary-row">
                <span className="sr-label">Aspect Ratio:</span>
                <span className="sr-value">
                  {aspectRatio.label} — {aspectRatio.description}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Selected pose preview */}
        <section className="upload-section">
          <div className="section-label">Selected Pose</div>
          <div className="preview-card">
            <img src={selectedPose?.image} alt={selectedPose?.label} style={{ height: 180 }} />
            <span className="preview-label">{selectedPose?.label}</span>
          </div>
        </section>

        {/* Product upload */}
        <section className="upload-section">
          <div className="section-label">Product Image *</div>
          <UploadDropzone
            onFile={async (file) => {
              const base64 = await fileToBase64(file);
              setProductImage(base64);
            }}
          />
        </section>

        {productImage && (
          <section className="upload-section">
            <div className="section-label">Product Preview</div>
            <div className="preview-card">
              <img src={productImage} alt="Product" style={{ height: 220 }} />
            </div>
          </section>
        )}
      </div>

      <div className="flow-footer">
        <button
          className="app-button primary"
          disabled={loading || !productImage}
          onClick={handleGenerate}
        >
          {loading ? 'Generating...' : 'Generate Branded Image'}
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
        generationType="branded"
      />
    </div>
  );
}
