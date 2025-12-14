import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3 className="footer-brand-title">Kripa Connect</h3>
          <p className="footer-brand-description">
            Your trusted destination for premium electronics. Fast delivery, secure payments, and exceptional service.
          </p>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-section-title">Quick Links</h4>
          <div className="footer-links">
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/products" className="footer-link">Products</Link>
            <Link to="/categories" className="footer-link">Categories</Link>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-section-title">Support</h4>
          <div className="footer-links">
            <Link to="/about" className="footer-link">About Us</Link>
            <Link to="/contact" className="footer-link">Contact</Link>
            <Link to="/policy" className="footer-link">Privacy & Terms</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Kripa Connect. All rights reserved.
      </div>
    </footer>
  )
}

