import { Heart } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-text">
            © {currentYear} Brand Shoot Admin. All rights reserved.
          </p>
        </div>
        <div className="footer-right">
          <p className="footer-text">
            Made with <Heart size={14} className="heart-icon" /> by Flyr Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
