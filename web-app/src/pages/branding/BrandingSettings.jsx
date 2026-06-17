// Web port of mobile BrandingSettingsScreen.tsx — logo, business info, background, aspect ratio
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  IoCheckmarkCircle,
  IoCameraOutline,
  IoRefreshOutline,
  IoCallOutline,
  IoLocationOutline,
  IoGlobeOutline,
} from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { fetchBrandingBackgrounds } from '../../services/api';
import { fileToBase64 } from '../../utils/imageUtils';
import { getFullUrl } from '../../config';
import '../pages.css';
import './branding.css';

// Same aspect ratio options as the mobile app
const ASPECT_RATIOS = [
  { id: '4:5', label: '4:5', description: 'Frame (Portrait)', ratio: [4, 5] },
  { id: '1:1', label: '1:1', description: 'Blinkit / Meesho / Flipkart', ratio: [1, 1] },
  { id: '9:16', label: '9:16', description: 'Instagram Reels / Stories', ratio: [9, 16] },
  { id: '16:9', label: '16:9', description: 'YouTube / Banner', ratio: [16, 9] },
  { id: '3:4', label: '3:4', description: 'Amazon / Myntra Listing', ratio: [3, 4] },
  { id: '2:3', label: '2:3', description: 'Pinterest / Print', ratio: [2, 3] },
  { id: '5:4', label: '5:4', description: 'Facebook Ad', ratio: [5, 4] },
];

export default function BrandingSettings() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, modelId, modelName, selectedPose, showcaseItem } = location.state || {};

  const [logoUri, setLogoUri] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [backgrounds, setBackgrounds] = useState([]);
  const [selectedBgId, setSelectedBgId] = useState(null);
  const [selectedRatioId, setSelectedRatioId] = useState('4:5');
  const logoInputRef = useRef(null);

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
      .catch((e) => console.warn('Failed to fetch backgrounds:', e));
  }, []);

  if (!selectedPose) return <Navigate to="/" replace />;

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) setLogoUri(await fileToBase64(file));
  };

  const handleSave = () => {
    if (!businessName.trim()) {
      toast.error('Please enter your business name.');
      return;
    }
    if (!logoUri) {
      toast.error('Please upload your business logo.');
      return;
    }
    const background = backgrounds.find((bg) => bg.id === selectedBgId) || null;
    const aspectRatio = ASPECT_RATIOS.find((r) => r.id === selectedRatioId);
    navigate('/branding/upload', {
      state: {
        categoryId,
        modelId,
        modelName,
        selectedPose,
        showcaseItem,
        brandingSettings: {
          logoUri,
          businessName: businessName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
          webUrl: webUrl.trim(),
          background,
          aspectRatio,
        },
      },
    });
  };

  return (
    <div className="page-flow">
      <AppHeader title="Brand Settings" />
      <div className="flow-content">
        {/* Logo */}
        <section className="upload-section">
          <div className="section-label">Business Logo *</div>
          <button className="logo-picker" onClick={() => logoInputRef.current?.click()}>
            {logoUri ? (
              <img src={logoUri} alt="Business logo" />
            ) : (
              <>
                <IoCameraOutline className="lp-icon" />
                <span>Tap to upload logo</span>
              </>
            )}
          </button>
          {logoUri && (
            <button className="see-more-btn" onClick={() => logoInputRef.current?.click()}>
              <IoRefreshOutline /> Change Logo
            </button>
          )}
          <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoFile} />
        </section>

        {/* Business name */}
        <section className="upload-section">
          <div className="section-label">Business Name *</div>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="e.g. Sharma Jewellers"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
        </section>

        {/* Optional details */}
        <section className="upload-section">
          <div className="section-label">
            Optional Details <span className="input-hint">(optional)</span>
          </div>
          <div className="input-group">
            <div className="input-wrapper">
              <IoCallOutline />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="input-group">
            <div className="input-wrapper">
              <IoLocationOutline />
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="input-group">
            <div className="input-wrapper">
              <IoGlobeOutline />
              <input
                type="url"
                placeholder="Website URL"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Background */}
        <section className="upload-section">
          <div className="section-label">Background</div>
          <p className="section-subtitle" style={{ marginBottom: 'var(--spacing-sm)' }}>
            Choose a solid color or textured background
          </p>
          <div className="option-list-scroll">
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
        </section>

        {/* Aspect ratio */}
        <section className="upload-section">
          <div className="section-label">Aspect Ratio</div>
          <p className="section-subtitle" style={{ marginBottom: 'var(--spacing-sm)' }}>
            Select the output format for your platform
          </p>
          <div className="option-list-scroll">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                className={`option-row ${selectedRatioId === ratio.id ? 'selected' : ''}`}
                onClick={() => setSelectedRatioId(ratio.id)}
              >
                <span
                  className="ratio-preview"
                  style={{
                    aspectRatio: `${ratio.ratio[0]} / ${ratio.ratio[1]}`,
                  }}
                />
                <span className="opt-label" style={{ flex: 'none', width: 44 }}>
                  {ratio.label}
                </span>
                <span className="opt-desc">{ratio.description}</span>
                {selectedRatioId === ratio.id && <IoCheckmarkCircle className="opt-check" />}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flow-footer">
        <button className="app-button primary" onClick={handleSave}>
          Save &amp; Upload Product
        </button>
      </div>
    </div>
  );
}
