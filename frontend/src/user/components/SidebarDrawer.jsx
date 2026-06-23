// Web port of mobile SidebarDrawer.tsx — slide-in drawer from the right
import { useEffect, useState } from 'react';
import {
  IoImages,
  IoAddCircle,
  IoPersonOutline,
  IoImagesOutline,
  IoKeyOutline,
  IoLogOutOutline,
  IoChevronForward,
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { getUserCredits } from '../services/api';
import './components.css';

function MenuItem({ icon, label, onClick }) {
  return (
    <button className="sd-menu-item" onClick={onClick}>
      <span className="sd-menu-icon">{icon}</span>
      <span className="sd-menu-label">{label}</span>
      <IoChevronForward className="sd-menu-chevron" />
    </button>
  );
}

export default function SidebarDrawer({ visible, onClose, onNavigate }) {
  const { user, logout } = useAuth();
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    if (visible) {
      getUserCredits()
        .then((res) => setCredits(res.credits))
        .catch(() => setCredits(null));
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="sidebar-drawer">
        <div className="sd-user">
          <div className="sd-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div className="sd-name">{user?.name}</div>
          <div className="sd-email">{user?.email}</div>
        </div>

        <div className="sd-divider" />

        <div className="sd-credits-card">
          <div className="sd-credits-row">
            <span className="sd-credits-icon">
              <IoImages />
            </span>
            <div>
              <div className="sd-credits-label">Images Left</div>
              <div className="sd-credits-value">
                {credits === null ? <span className="spinner small" /> : credits}
              </div>
            </div>
          </div>
          <button className="sd-buymore" onClick={() => onNavigate('/buy-credits')}>
            <IoAddCircle /> Buy More
          </button>
        </div>

        <div className="sd-divider" />

        <nav className="sd-menu">
          <MenuItem
            icon={<IoPersonOutline />}
            label="My Profile"
            onClick={() => onNavigate('/profile')}
          />
          <MenuItem
            icon={<IoImagesOutline />}
            label="My Creations"
            onClick={() => onNavigate('/history')}
          />
          <MenuItem
            icon={<IoKeyOutline />}
            label="Developer API"
            onClick={() => onNavigate('/api-keys')}
          />
        </nav>

        <div className="sd-footer">
          <div className="sd-divider" />
          <button className="sd-logout" onClick={logout}>
            <IoLogOutOutline /> Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
