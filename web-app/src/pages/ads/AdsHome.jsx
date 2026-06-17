// Web port of mobile ads/AdsHomeScreen.tsx
import { useNavigate } from 'react-router-dom';
import {
  IoDiamondOutline,
  IoShirtOutline,
  IoPhonePortraitOutline,
  IoSparklesOutline,
  IoFastFoodOutline,
  IoCarSportOutline,
  IoChevronForward,
} from 'react-icons/io5';
import AppHeader from '../../components/AppHeader';
import { adsCategories } from './adsCategories';
import '../pages.css';
import './ads.css';

const ICONS = {
  diamond: <IoDiamondOutline />,
  shirt: <IoShirtOutline />,
  phone: <IoPhonePortraitOutline />,
  sparkles: <IoSparklesOutline />,
  food: <IoFastFoodOutline />,
  car: <IoCarSportOutline />,
};

export default function AdsHome() {
  const navigate = useNavigate();

  return (
    <div className="page-flow">
      <AppHeader title="Create Ads" />
      <div className="flow-content">
        <div className="ads-hero">
          <h1>AI Video Ads</h1>
          <p>Create engaging video advertisements with AI</p>
        </div>

        <h2 className="section-title" style={{ fontSize: 17 }}>
          Choose a Category
        </h2>

        {adsCategories.map((category) => (
          <button
            key={category.id}
            className="ads-category-card"
            onClick={() => navigate('/ads/prompt', { state: { category } })}
          >
            <span className="ads-cat-icon">{ICONS[category.icon]}</span>
            <span className="ads-cat-content">
              <span className="ads-cat-title">{category.title}</span>
              <span className="ads-cat-desc">{category.description}</span>
            </span>
            <IoChevronForward className="ads-cat-chevron" />
          </button>
        ))}
      </div>
    </div>
  );
}
