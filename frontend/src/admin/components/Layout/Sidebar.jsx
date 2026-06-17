import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Grid3x3,
  UserCircle,
  Image as ImageIcon,
  Palette,
  FileText,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/token-stats', icon: BarChart3, label: 'Token Stats' },
    { path: '/categories', icon: Grid3x3, label: 'Categories' },
    { path: '/models', icon: UserCircle, label: 'Models' },
    { path: '/backgrounds', icon: Palette, label: 'Backgrounds' },
    { path: '/prompts', icon: FileText, label: 'Prompts' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <ImageIcon size={28} className="logo-icon" />
          <span className="logo-text">Brand Shoot Admin</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <LogOut size={20} className="nav-icon" />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
