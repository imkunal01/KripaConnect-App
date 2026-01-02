import { Link } from 'react-router-dom'
import './FormStyles.css'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-container">
      {/* Left Side: Form & Content */}
      <div className="auth-left">
        <div className="auth-header">
          <Link to="/" className="brand-logo">KripaConnect</Link>
        </div>
        
        <div className="auth-content">
          <div className="auth-titles">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </div>
        
        <div className="auth-footer">
          <p>© {new Date().getFullYear()} KripaConnect Inc.</p>
        </div>
      </div>

      {/* Right Side: Visual & Gradient */}
      <div className="auth-right">
        <div className="glass-overlay">
          <div className="right-content">
            <div className="nav-pill">
              <span>New here?</span>
              <Link to="/signup" className="join-btn">Join Us</Link>
            </div>
            
            <div className="hero-text">
              <h2>Discover the hidden gems of the world, one step at a time.</h2>
              <p>Join a community of explorers and creators sharing unique perspectives.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}