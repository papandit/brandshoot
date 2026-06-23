import { useState } from 'react';
import { User, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminProfile from '../AdminProfile';
import ThemeToggle from '../../../ThemeToggle';
import './Header.css';

const Header = ({ title = 'Dashboard', onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const name = user?.name || 'Admin';
  const email = user?.email || '';
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        <ThemeToggle />

        <div className="profile-menu">
          <button
            className="profile-btn"
            onClick={() => setShowProfileMenu((v) => !v)}
          >
            <div className="profile-avatar">{initial}</div>
            <div className="profile-meta">
              <span className="profile-name">{name}</span>
              <span className="profile-role">Administrator</span>
            </div>
            <ChevronDown size={16} className={`chevron ${showProfileMenu ? 'open' : ''}`} />
          </button>

          {showProfileMenu && (
            <>
              <div className="profile-backdrop" onClick={() => setShowProfileMenu(false)} />
              <div className="profile-dropdown">
                <div className="dropdown-head">
                  <div className="profile-avatar lg">{initial}</div>
                  <div className="dropdown-head-info">
                    <div className="dd-name">{name}</div>
                    <div className="dd-email">{email || 'Administrator'}</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowProfileMenu(false);
                  }}
                >
                  <User size={16} />
                  <span>View Profile</span>
                </button>
                <button className="dropdown-item logout" onClick={logout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <AdminProfile isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </header>
  );
};

export default Header;
