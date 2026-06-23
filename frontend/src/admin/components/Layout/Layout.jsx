import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ title }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} />
      <div className="main-container">
        <Header title={title} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="main-content">
          <Outlet />
        </main>
        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default Layout;
