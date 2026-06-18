// Web port of mobile ads/AdsGenerationScreen.tsx — progress screen during video generation
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { IoVideocam, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';
import { generateVideo } from '../../services/api';
import '../pages.css';
import './ads.css';

const STATUS_MESSAGES = {
  generating: 'Creating your video ad...',
  completed: 'Video ready!',
  error: 'Generation failed',
};

export default function AdsGeneration() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prompt, category } = location.state || {};

  const [status, setStatus] = useState('generating');
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!prompt || startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      setProgress(0.3);
      try {
        const data = await generateVideo(prompt, category, '9:16', '720p');
        setStatus('completed');
        setProgress(1);
        setTimeout(() => {
          navigate('/ads/result', {
            state: { videoUri: data.video_uri, prompt, category },
            replace: true,
          });
        }, 1000);
      } catch (e) {
        console.error('Video generation failed:', e);
        setStatus('error');
      }
    };
    run();
  }, [prompt, category, navigate]);

  if (!prompt) return <Navigate to="/ads" replace />;

  return (
    <div className="page-flow">
      <div className="ads-gen-content">
        <div className={`ads-gen-icon ${status}`}>
          {status === 'generating' && <IoVideocam />}
          {status === 'completed' && <IoCheckmarkCircle />}
          {status === 'error' && <IoCloseCircle />}
        </div>

        <h2 className="ads-gen-status">{STATUS_MESSAGES[status]}</h2>
        <p className="ads-gen-prompt">"{prompt}"</p>

        <div className="ads-gen-progress">
          <div className="ads-gen-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        {status === 'generating' && (
          <div className="ads-gen-info">
            <span className="spinner small" /> This may take 30-60 seconds...
          </div>
        )}

        {status === 'error' && (
          <>
            <div className="ads-gen-error" style={{ marginBottom: 16 }}>
              Something went wrong. Please try again.
            </div>
            <button className="app-button outline" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
