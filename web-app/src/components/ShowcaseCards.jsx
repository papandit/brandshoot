// Web port of mobile CategoryCard.tsx, CatalogueCard.tsx, CategoryPill.tsx, CategorySection.tsx
import { useState } from 'react';
import {
  IoChevronBack,
  IoChevronForward,
  IoDownloadOutline,
} from 'react-icons/io5';
import { downloadImage } from '../utils/imageUtils';
import './components.css';

export function CategoryPill({ title, selected, onClick }) {
  return (
    <button className={`category-pill ${selected ? 'selected' : ''}`} onClick={onClick}>
      {title}
    </button>
  );
}

/** Before/After showcase card (photoshoot & branding) */
export function CategoryCard({ title, before, after, onTry }) {
  const [showBefore, setShowBefore] = useState(true);
  const currentImage = showBefore ? before : after;
  const currentLabel = showBefore ? 'Before' : 'After';

  return (
    <div className="showcase-card">
      <div className="sc-image-wrapper">
        <img className="sc-image" src={currentImage} alt={title} loading="lazy" />
        <span className="sc-badge">{currentLabel}</span>
        <button
          className="sc-download"
          onClick={() => downloadImage(currentImage, `${title}_${currentLabel}.jpg`)}
          aria-label="Download"
        >
          <IoDownloadOutline />
        </button>
        <button className="sc-nav left" onClick={() => setShowBefore(!showBefore)}>
          <IoChevronBack />
        </button>
        <button className="sc-nav right" onClick={() => setShowBefore(!showBefore)}>
          <IoChevronForward />
        </button>
      </div>
      <button className="app-button primary" onClick={onTry}>
        Try It Out
      </button>
    </div>
  );
}

/** Catalogue showcase card with thumbnail strip */
export function CatalogueCard({ title, thumbnails, onTry }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = thumbnails[activeIndex] || {};

  const cycle = (dir) => {
    setActiveIndex((i) => (i + dir + thumbnails.length) % thumbnails.length);
  };

  return (
    <div className="showcase-card">
      <div className="sc-image-wrapper">
        <img className="sc-image" src={active.image_url} alt={active.label || title} loading="lazy" />
        {active.label && <span className="sc-badge">{active.label}</span>}
        <button
          className="sc-download"
          onClick={() => downloadImage(active.image_url, `${title}_${active.label || activeIndex}.jpg`)}
          aria-label="Download"
        >
          <IoDownloadOutline />
        </button>
        {thumbnails.length > 1 && (
          <>
            <button className="sc-nav left" onClick={() => cycle(-1)}>
              <IoChevronBack />
            </button>
            <button className="sc-nav right" onClick={() => cycle(1)}>
              <IoChevronForward />
            </button>
          </>
        )}
      </div>
      {thumbnails.length > 1 && (
        <div className="sc-thumbs">
          {thumbnails.map((thumb, i) => (
            <button
              key={i}
              className={`sc-thumb ${i === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(i)}
            >
              <img src={thumb.image_url} alt={thumb.label} loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <button className="app-button primary" onClick={onTry}>
        Try It Out
      </button>
    </div>
  );
}

/** Renders the right card type for each showcase item */
export function CategorySection({ items, onTry }) {
  return (
    <div className="category-section">
      {items.map((item) => (
        <div key={item.id} style={{ marginBottom: 'var(--spacing-lg)' }}>
          {item.thumbnails ? (
            <CatalogueCard title={item.id} thumbnails={item.thumbnails} onTry={() => onTry(item)} />
          ) : (
            <CategoryCard
              title={item.id}
              before={item.before_url}
              after={item.after_url}
              onTry={() => onTry(item)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
