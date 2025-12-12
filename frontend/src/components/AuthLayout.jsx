import { useLocation, Link } from 'react-router-dom'
import { FaShoppingCart, FaTruck, FaCreditCard, FaFacebookF, FaGoogle } from 'react-icons/fa'
import './AuthLayout.css'

export default function AuthLayout({ children }) {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  return (
    <div className="auth-container">
      {/* Background Gradients */}
      <div className="gradient-blob blob-1"></div>
      <div className="gradient-blob blob-2"></div>

      <div className="auth-content-wrapper">
        {/* Left Side - Welcome Content */}
        <div className="auth-left">
          <div className="brand-header">
            <div className="brand-logo">KC</div>
            <div className="brand-text">
              <h2>Kripa Connect</h2>
              <span>Electronics & More</span>
            </div>
          </div>
          
          <h1 className="welcome-title">Welcome to Kripa<br />Connect</h1>
          <p className="welcome-subtitle">Your trusted destination for premium electronics</p>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon icon-green"><FaShoppingCart /></div>
              <span>Easy Shopping</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon icon-blue"><FaTruck /></div>
              <span>Fast Delivery</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon icon-red"><FaCreditCard /></div>
              <span>Secure Payment</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form Card */}
        <div className="auth-right">
          <div className="glass-card">
            {/* Tab Switcher */}
            <div className="auth-tabs">
              <Link to="/login" className={`tab-btn ${isLogin ? 'active' : ''}`}>Login</Link>
              <Link to="/signup" className={`tab-btn ${!isLogin ? 'active' : ''}`}>Sign Up</Link>
            </div>

            {children}

            <div className="social-login">
              <div className="divider"><span>Or continue with</span></div>
              <div className="social-buttons">
                <button type="button" className="social-btn google">
                  <FaGoogle /> <span>Google</span>
                </button>
                <button type="button" className="social-btn facebook">
                  <FaFacebookF /> <span>Facebook</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
