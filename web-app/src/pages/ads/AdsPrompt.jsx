// Web port of mobile ads/AdsPromptScreen.tsx — prompt input with AI refinement
import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IoSparkles, IoCheckmarkCircle, IoBulbOutline, IoVideocam } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { refinePrompt } from '../../services/api';
import '../pages.css';
import './ads.css';

export default function AdsPrompt() {
  const location = useLocation();
  const navigate = useNavigate();
  const { category } = location.state || {};

  const [prompt, setPrompt] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showRefined, setShowRefined] = useState(false);

  if (!category) return <Navigate to="/ads" replace />;

  const handleRefine = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }
    setIsRefining(true);
    try {
      const data = await refinePrompt(prompt.trim(), category.id);
      setRefinedPrompt(data.refined_prompt);
      setShowRefined(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Refinement Failed');
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }
    navigate('/ads/generate', { state: { prompt: prompt.trim(), category: category.id } });
  };

  return (
    <div className="page-flow">
      <AppHeader title={`${category.title} Ad`} />
      <div className="flow-content">
        {/* Describe your ad */}
        <section style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 className="section-title" style={{ fontSize: 17 }}>
            Describe Your Ad
          </h2>
          <p className="section-subtitle" style={{ fontSize: 13, marginBottom: 'var(--spacing-md)' }}>
            Tell us what kind of video advertisement you want to create
          </p>
          <textarea
            className="ads-textarea"
            placeholder="E.g., A luxury watch rotating on a velvet cushion with soft studio lighting..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button className="app-button primary" disabled={isRefining} onClick={handleRefine}>
            {isRefining ? (
              <>
                <span className="spinner small" style={{ borderTopColor: '#fff' }} /> Refining...
              </>
            ) : (
              <>
                <IoSparkles /> Refine with AI
              </>
            )}
          </button>
        </section>

        {/* AI refined prompt */}
        {showRefined && (
          <div className="refined-section">
            <div className="refined-header">
              <IoCheckmarkCircle /> AI Refined Prompt
            </div>
            <div className="refined-box">{refinedPrompt}</div>
            <button
              className="use-refined-btn"
              onClick={() => {
                setPrompt(refinedPrompt);
                setShowRefined(false);
              }}
            >
              Use This Prompt
            </button>
          </div>
        )}

        {/* Example prompts */}
        <section>
          <h2 className="section-title" style={{ fontSize: 17, marginBottom: 'var(--spacing-md)' }}>
            Example Prompts
          </h2>
          <div className="example-chips">
            {category.examples.map((example, i) => (
              <button key={i} className="example-chip" onClick={() => setPrompt(example)}>
                <IoBulbOutline /> {example}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flow-footer">
        <button className="app-button primary" onClick={handleGenerate}>
          <IoVideocam /> Generate Ad
        </button>
      </div>
    </div>
  );
}
