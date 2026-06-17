// Web port of mobile BuyMoreImagesScreen.tsx.
// Note: actual payment uses Google Play In-App Purchases, which only work inside
// the Android app — on the web we show the same UI and direct users to the app.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IoShieldCheckmark, IoLogoGooglePlaystore } from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { getUserCredits, getAppSettings } from '../../services/api';
import '../pages.css';
import './user.css';

const DISCRETE_VALUES = [10, 25, 50, 100];

export default function BuyMoreImages() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [costPerImage, setCostPerImage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUserCredits().catch(() => null), getAppSettings().catch(() => null)])
      .then(([creditsRes, settingsRes]) => {
        if (creditsRes?.success) setCurrentCredits(creditsRes.credits);
        if (settingsRes?.success) setCostPerImage(settingsRes.per_image_cost);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedValue = DISCRETE_VALUES[selectedIndex];
  const totalCost = selectedValue * costPerImage;

  const handlePurchase = () => {
    toast(
      'Purchases are completed securely via Google Play. Please open the Brand Shoot Android app to buy credits.',
      { icon: '📱', duration: 5000 }
    );
  };

  if (isLoading) {
    return (
      <div className="page-flow">
        <AppHeader title="Buy More Images" />
        <div className="page-loader">
          <span className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-flow">
      <AppHeader title="Buy More Images" />
      <div className="flow-content">
        {/* Current balance */}
        <div className="balance-card">
          <div className="bc-label">Current Balance</div>
          <div className="bc-value">{currentCredits} Images</div>
        </div>

        {/* Select images */}
        <div className="slider-card">
          <h3>Select Images</h3>
          <div className="selected-value">{selectedValue}</div>
          <div className="selected-value-label">Images</div>

          <div className="value-buttons">
            {DISCRETE_VALUES.map((value, i) => (
              <button
                key={value}
                className={i === selectedIndex ? 'active' : ''}
                onClick={() => setSelectedIndex(i)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="slider-hint">Tap a number or slide to select</div>

          <input
            className="credit-slider"
            type="range"
            min={0}
            max={DISCRETE_VALUES.length - 1}
            step={1}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
          />
        </div>

        {/* Calculation */}
        <div className="calc-card">
          <div className="calc-row">
            <span>
              {selectedValue} Images × ₹{costPerImage}
            </span>
            <span>₹{totalCost}</span>
          </div>
          <div className="calc-divider" />
          <div className="calc-row">
            <span className="calc-total-label">Total Amount</span>
            <span className="calc-total-value">₹{totalCost}</span>
          </div>
          <div className="calc-row">
            <span className="calc-new-balance">
              New Balance: {currentCredits + selectedValue} images
            </span>
          </div>
        </div>

        <button className="app-button primary" onClick={handlePurchase}>
          <IoLogoGooglePlaystore /> Buy {selectedValue} Images for ₹{totalCost}
        </button>

        <div className="payment-info">
          <IoShieldCheckmark /> Secure payment via Google Play
        </div>
      </div>
    </div>
  );
}
