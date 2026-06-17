// Web port of mobile InsufficientCreditsModal.tsx
import { IoClose, IoDiamond, IoAlertCircle, IoCheckmarkCircle } from 'react-icons/io5';
import './components.css';

export default function InsufficientCreditsModal({
  visible,
  onClose,
  onBuyCredits,
  creditsNeeded,
  currentCredits,
  generationType = 'photos',
}) {
  if (!visible) return null;
  const creditsShort = Math.max(0, creditsNeeded - currentCredits);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box credits-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <IoClose />
        </button>

        <div className="cm-icon-circle">
          <IoDiamond />
        </div>
        <h2>Insufficient Credits</h2>

        <div className="cm-credits-card">
          <div className="cm-credit-item">
            <div className="cm-credit-label">You Have</div>
            <div className="cm-credit-value">
              <IoDiamond style={{ color: 'var(--color-error)' }} /> {currentCredits}
            </div>
          </div>
          <div className="cm-divider" />
          <div className="cm-credit-item">
            <div className="cm-credit-label">You Need</div>
            <div className="cm-credit-value">
              <IoDiamond style={{ color: 'var(--color-primary)' }} /> {creditsNeeded}
            </div>
          </div>
        </div>

        <div className="cm-shortage">
          <IoAlertCircle /> You're short by {creditsShort} credits
        </div>

        <p className="cm-message">
          To generate your {generationType}, you need {creditsNeeded} credits. Purchase more
          credits to unlock unlimited AI-powered photo generation!
        </p>

        <div className="cm-benefits">
          <div className="cm-benefit">
            <IoCheckmarkCircle /> Instant credit top-up
          </div>
          <div className="cm-benefit">
            <IoCheckmarkCircle /> Generate unlimited photos
          </div>
          <div className="cm-benefit">
            <IoCheckmarkCircle /> No subscription required
          </div>
        </div>

        <button className="app-button primary" onClick={onBuyCredits}>
          Buy Credits Now
        </button>
        <button className="cm-later" onClick={onClose}>
          Maybe Later
        </button>
      </div>
    </div>
  );
}
