// Shared result screen — web port of ResultScreen / CatalogueResultScreen / BrandingResultScreen.
// Polls the generation job every 4s, shows progress, main viewer, thumbnails, downloads, zoom.
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  IoCheckmarkCircle,
  IoDownloadOutline,
  IoExpandOutline,
  IoClose,
  IoImageOutline,
} from 'react-icons/io5';
import AppHeader from './AppHeader';
import { pollJobStatus } from '../services/api';
import { downloadImage, downloadMultipleImages } from '../utils/imageUtils';
import { getFullUrl } from '../config';
import './ResultView.css';

const POLL_INTERVAL = 4000;

export default function ResultView({ title, generatingText, doneText, showTryAnother = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = location.state || {};
  const { jobId, totalImages, productImage } = params;

  const [images, setImages] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ completed: 0, total: 0 });
  const [zoomVisible, setZoomVisible] = useState(false);

  // Poll job status until done
  useEffect(() => {
    if (!jobId || isDone) return undefined;
    const tick = async () => {
      try {
        const data = await pollJobStatus(jobId);
        setCurrentScenario(data.currentScenario);
        setImages((prev) => (data.images.length > prev.length ? data.images : prev));
        if (data.status === 'done') setIsDone(true);
      } catch (e) {
        console.error('Poll error:', e);
      }
    };
    tick();
    const interval = setInterval(tick, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [jobId, isDone]);

  // Original product image first, then generated images
  const allImages = useMemo(() => {
    const list = [];
    if (productImage) {
      list.push({ scenarioId: '__original__', label: 'Original Product', imageUrl: productImage });
    }
    return [...list, ...images.map((img) => ({ ...img, imageUrl: getFullUrl(img.imageUrl) }))];
  }, [productImage, images]);

  // Jump to the first generated image when it arrives
  useEffect(() => {
    if (images.length === 1 && productImage) setActiveIndex(1);
  }, [images.length, productImage]);

  if (!jobId) return <Navigate to="/" replace />;

  const active = allImages[activeIndex];
  const isOriginal = active?.scenarioId === '__original__';
  const progress = totalImages ? images.length / totalImages : 0;
  const pendingCount = Math.max(0, (totalImages || 0) - images.length);

  const handleDownloadAll = async () => {
    const items = images.map((img, i) => ({
      uri: getFullUrl(img.imageUrl),
      filename: `${img.label || `image_${i + 1}`}.png`,
    }));
    if (items.length === 0) return;
    if (!window.confirm(`Download all ${items.length} images?`)) return;
    setIsDownloadingAll(true);
    setDownloadProgress({ completed: 0, total: items.length });
    await downloadMultipleImages(items, (completed, total) =>
      setDownloadProgress({ completed, total })
    );
    setIsDownloadingAll(false);
  };

  return (
    <div className="page-flow">
      <AppHeader title={title} />

      {/* Status bar */}
      <div className="rv-status-bar">
        {!isDone ? (
          <>
            <div className="rv-status-row">
              <span className="spinner small" />
              <span className="rv-status-text">
                {generatingText} {images.length}/{totalImages}
                {currentScenario ? ` — ${currentScenario}...` : '...'}
              </span>
            </div>
            <div className="rv-progress-track">
              <div className="rv-progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        ) : (
          <div className="rv-status-row done">
            <IoCheckmarkCircle />
            <span className="rv-status-text">{doneText}</span>
          </div>
        )}
      </div>

      <div className="rv-content">
        {/* Main image viewer */}
        <div className="rv-main-card">
          {active ? (
            <>
              {isOriginal && (
                <div className="rv-original-banner">
                  <IoImageOutline /> Original Product
                </div>
              )}
              <img className="rv-main-image" src={active.imageUrl} alt={active.label} />
              <button className="rv-expand" onClick={() => setZoomVisible(true)}>
                <IoExpandOutline />
              </button>
            </>
          ) : (
            <div className="rv-main-placeholder">
              <span className="spinner" />
              <p>Waiting for first image...</p>
            </div>
          )}
        </div>

        {active && (
          <div className="rv-image-footer">
            <span className="rv-image-label">{active.label}</span>
            {!isOriginal && (
              <button
                className="rv-download-btn"
                onClick={() => downloadImage(active.imageUrl, `${active.label}.png`)}
              >
                <IoDownloadOutline /> Download
              </button>
            )}
          </div>
        )}

        {/* Thumbnail strip */}
        <div className="rv-thumbs">
          {allImages.map((img, i) => (
            <button
              key={img.scenarioId + i}
              className={`rv-thumb ${i === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(i)}
            >
              <img src={img.imageUrl} alt={img.label} />
              {img.scenarioId === '__original__' && <span className="rv-thumb-badge">Original</span>}
            </button>
          ))}
          {Array.from({ length: pendingCount }).map((_, i) => (
            <div key={`pending-${i}`} className="rv-thumb loading">
              <span className="spinner small" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {isDone && (
        <div className="flow-footer">
          <div className="rv-footer-row">
            <button
              className="app-button primary"
              disabled={images.length === 0}
              onClick={handleDownloadAll}
            >
              Download All
            </button>
            {showTryAnother && (
              <button className="app-button outline" onClick={() => navigate('/')}>
                Try Another
              </button>
            )}
          </div>
        </div>
      )}

      {/* Download progress modal */}
      {isDownloadingAll && (
        <div className="modal-overlay">
          <div className="rv-download-modal">
            <span className="spinner" />
            <h3>Downloading Images...</h3>
            <p>
              {downloadProgress.completed} / {downloadProgress.total}
            </p>
            <div className="rv-progress-track wide">
              <div
                className="rv-progress-fill"
                style={{
                  width: `${(downloadProgress.completed / (downloadProgress.total || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Zoom modal */}
      {zoomVisible && active && (
        <div className="rv-zoom-overlay" onClick={() => setZoomVisible(false)}>
          <button className="rv-zoom-close" onClick={() => setZoomVisible(false)}>
            <IoClose />
          </button>
          <img src={active.imageUrl} alt={active.label} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
