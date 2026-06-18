import { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AdminProfile from '../AdminProfile';
import './Header.css';

const Header = ({ title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        <div className="profile-menu">
          <button 
            className="profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              <User size={16} />
            </div>
            <span className="profile-name">Admin</span>
            <ChevronDown size={14} className={`chevron ${showProfileMenu ? 'open' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div 
                className="dropdown-item"
                onClick={() => {
                  setShowProfileModal(true);
                  setShowProfileMenu(false);
                }}
              >
                <User size={16} />
                <span>Profile</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item logout" onClick={logout}>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Profile Modal */}
      <AdminProfile 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </header>
  );
};

export default Header;
