// Web port of mobile HomeScreen.tsx — Discover page with categories + showcase cards
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoVideocamOutline, IoMenuOutline, IoCamera, IoGrid, IoSparkles } from 'react-icons/io5';
import SidebarDrawer from '../components/SidebarDrawer';
import { CategoryPill, CategorySection } from '../components/ShowcaseCards';
import { fetchCategories } from '../services/api';
import { getFullUrl } from '../config';
import './home.css';

const SUBCATEGORIES = [
  { id: 'photoshoot', title: 'Photo Shoot', icon: <IoCamera /> },
  { id: 'catalogue', title: 'Catalogue', icon: <IoGrid /> },
  { id: 'branding', title: 'Branding', icon: <IoSparkles /> },
];

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState('photoshoot');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0].id);
      })
      .catch((e) => console.warn('Failed to fetch categories:', e))
      .finally(() => setLoading(false));
  }, []);

  // Showcase items of the selected category + subcategory, with full image URLs
  const showcaseItems = useMemo(() => {
    const category = categories.find((c) => c.id === selectedCategory);
    if (!category) return [];
    const items = category.showcase_items?.[selectedSubcategory] || [];
    return items.map((item) => ({
      ...item,
      before_url: item.before_url ? getFullUrl(item.before_url) : undefined,
      after_url: item.after_url ? getFullUrl(item.after_url) : undefined,
      thumbnails: item.thumbnails
        ? item.thumbnails.map((t) => ({ ...t, image_url: getFullUrl(t.image_url) }))
        : undefined,
    }));
  }, [categories, selectedCategory, selectedSubcategory]);

  const handleTry = (showcaseItem) => {
    const state = { categoryId: selectedCategory, subcategoryType: selectedSubcategory, showcaseItem };
    if (selectedSubcategory === 'photoshoot') navigate('/photoshoot/models', { state });
    else if (selectedSubcategory === 'catalogue') navigate('/catalogue/models', { state });
    else navigate('/branding/models', { state });
  };

  return (
    <div className="page-flow">
      {/* Home header */}
      <header className="home-header">
        <h1 className="home-hero">BrandShoot</h1>
        <div className="home-header-actions">
          <button className="home-icon-btn accent" onClick={() => navigate('/ads')} aria-label="Video Ads">
            <IoVideocamOutline />
          </button>
          <button className="home-icon-btn" onClick={() => setSidebarVisible(true)} aria-label="Menu">
            <IoMenuOutline />
          </button>
        </div>
      </header>

      <div className="home-content">
        {/* Category pills */}
        <div className="home-pills">
          {categories.map((cat) => (
            <CategoryPill
              key={cat.id}
              title={cat.title}
              selected={cat.id === selectedCategory}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>

        {/* Subcategory tabs */}
        <div className="home-subcats">
          {SUBCATEGORIES.map((sub) => (
            <button
              key={sub.id}
              className={`home-subcat ${selectedSubcategory === sub.id ? 'active' : ''}`}
              onClick={() => setSelectedSubcategory(sub.id)}
            >
              <span className="subcat-icon">{sub.icon}</span>
              <span className="subcat-title">{sub.title}</span>
            </button>
          ))}
        </div>

        {/* Showcase cards */}
        {loading ? (
          <div className="page-loader" style={{ minHeight: '40vh' }}>
            <span className="spinner" />
          </div>
        ) : showcaseItems.length > 0 ? (
          <div className="home-showcase-grid">
            <CategorySection items={showcaseItems} onTry={handleTry} />
          </div>
        ) : (
          <div className="empty-state">
            <h3>No showcase items yet</h3>
            <p>Try another category or subcategory</p>
          </div>
        )}
      </div>

      <SidebarDrawer
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={(path) => {
          setSidebarVisible(false);
          navigate(path);
        }}
      />
    </div>
  );
}
