import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ title }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-container">
        <Header title={title} />
        <main className="main-content">
          <Outlet />
        </main>
        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default Layout;
