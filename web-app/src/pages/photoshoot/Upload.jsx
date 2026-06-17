// Web port of mobile UploadScreen.tsx — upload product image & start photoshoot generation
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppHeader from '../../components/AppHeader';
import UploadDropzone from '../../components/UploadDropzone';
import InsufficientCreditsModal from '../../components/InsufficientCreditsModal';
import { startGenerationJob } from '../../services/api';
import { fileToBase64, imageUrlToBase64 } from '../../utils/imageUtils';
import '../pages.css';

export default function Upload() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, model, customModelImage, showcaseItem } = location.state || {};

  const [productImage, setProductImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsInfo, setCreditsInfo] = useState({ needed: 0, current: 0 });

  // Pre-select the showcase "before" image as the product, like the mobile app
  useEffect(() => {
    if (showcaseItem?.before_url && !productImage) {
      setProductImage(showcaseItem.before_url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!model) return <Navigate to="/" replace />;

  const modelImageSrc = customModelImage || model.image;

  const handleGenerate = async () => {
    if (!productImage) {
      toast.error('Please upload a product image first.');
      return;
    }
    setLoading(true);
    try {
      const modelBase64 = customModelImage || (await imageUrlToBase64(model.image));
      const productBase64 = productImage.startsWith('data:')
        ? productImage
        : await imageUrlToBase64(productImage);

      const data = await startGenerationJob({
        categoryId,
        modelImage: modelBase64,
        productImage: productBase64,
      });

      navigate('/photoshoot/result', {
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
        toast.error('Failed to start generation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-flow">
      <AppHeader title="Upload Product" />
      <div className="flow-content">
        <div className="upload-section">
          <div className="section-label">Selected Model</div>
          <div className="preview-card">
            <img src={modelImageSrc} alt={model.name} style={{ height: 200 }} />
          </div>
        </div>

        <div className="upload-section">
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
          {loading ? 'Generating...' : 'Generate Result'}
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
        generationType="photos"
      />
    </div>
  );
}
