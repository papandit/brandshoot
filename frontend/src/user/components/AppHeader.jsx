// Web port of mobile ui/AppHeader.tsx — back button, centered title, optional right action
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import ThemeToggle from '../../ThemeToggle';
import './components.css';

export default function AppHeader({ title, showBack = true, rightIcon = null, onRightPress }) {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      {showBack ? (
        <button className="header-btn" onClick={() => navigate(-1)} aria-label="Back">
          <IoArrowBack />
        </button>
      ) : (
        <div className="header-spacer" />
      )}
      <h1 className="header-title">{title}</h1>
      {rightIcon ? (
        <button className="header-btn" onClick={onRightPress}>
          {rightIcon}
        </button>
      ) : (
        <ThemeToggle className="header-theme-toggle" />
      )}
    </header>
  );
}
