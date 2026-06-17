// Web port of mobile ads/AdsResultScreen.tsx — video player + download + create another
import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IoDocumentTextOutline, IoDownloadOutline, IoAddOutline } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { getFullUrl } from '../../config';
import '../pages.css';
import './ads.css';

export default function AdsResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { videoUri, prompt, category } = location.state || {};
  const [isDownloading, setIsDownloading] = useState(false);

  if (!videoUri) return <Navigate to="/ads" replace />;

  const videoUrl = getFullUrl(videoUri);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'flyr_ad.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Video downloaded!');
    } catch {
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="page-flow">
      <AppHeader title="Your Ad" />
      <div className="flow-content">
        <div className="ads-video-container">
          <video src={videoUrl} controls autoPlay playsInline />
        </div>

        <div className="ads-info-section">
          <div className="ads-info-header">
            <IoDocumentTextOutline /> Prompt
          </div>
          <p className="ads-info-prompt">{prompt}</p>
          <span className="ads-category-badge">{category}</span>
        </div>

        <div className="ads-actions">
          <button className="app-button primary" disabled={isDownloading} onClick={handleDownload}>
            <IoDownloadOutline /> {isDownloading ? 'Downloading...' : 'Download Video'}
          </button>
          <button className="app-button outline" onClick={() => navigate('/ads')}>
            <IoAddOutline /> Create Another
          </button>
        </div>
      </div>
    </div>
  );
}
