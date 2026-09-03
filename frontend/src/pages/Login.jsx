import { useNavigate, Link } from 'react-router-dom'
import SEO from '../components/SEO.jsx'
import AuthCard from '../components/AuthCard.jsx'
import '../components/AuthModal.css'

export default function Login() {
  const navigate = useNavigate()

  const goBack = () => {
    try {
      if (window.history.length > 1) navigate(-1)
      else navigate('/')
    } catch {
      navigate('/')
    }
  }

  return (
    <div className="auth-page-container">
      <SEO
        title="Sign In | KripaConnect Electronics & Wholesale"
        description="Sign in to your KripaConnect account to manage electronics orders, wishlist items, and B2B wholesale pricing."
        canonical="/login"
        robots="noindex, follow"
      />

      {/* Cyber Aurora Floating Background */}
      <div className="auth-aurora-bg" aria-hidden="true">
        <div className="aurora-blob aurora-blob--1" />
        <div className="aurora-blob aurora-blob--2" />
        <div className="aurora-blob aurora-blob--3" />
      </div>
      <div className="auth-grid-overlay" aria-hidden="true" />

      {/* Dual Cyber Studio Layout */}
      <div className="auth-studio-wrapper">
        {/* Left Side: Auth Card Form */}
        <div className="auth-card-outer-col">
          <div className="auth-card-top-nav">
            <button
              type="button"
              className="cyber-secondary-btn auth-back-store-btn"
              onClick={goBack}
              aria-label="Back to store"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to store</span>
            </button>

            <Link
              to="/"
              className="auth-browse-catalog-link"
            >
              Browse Catalog →
            </Link>
          </div>

          <AuthCard
            initialMode="login"
            isModal={false}
            title="Welcome Back"
            description="Sign in to access your electronics dashboard, live tracking & wholesale rates."
          />
        </div>

        {/* Right Side: Interactive Showcase Studio */}
        <aside className="auth-studio-showcase" aria-label="KripaConnect platform highlights">
          {/* Header Pill */}
          <div className="showcase-header-pill">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Direct OEM Electronics • B2B Certified</span>
          </div>

          {/* Main Headline */}
          <div className="showcase-main-content">
            <h1 className="showcase-headline">
              Smarter electronics sourcing, <span className="neon-highlight">Reimagined</span>.
            </h1>

            <p className="showcase-description">
              Access thousands of certified electronics with real-time supply chain tracking, instant volume discounts, and seamless GST invoicing.
            </p>

            {/* Interactive Live Cards Deck */}
            <div className="showcase-cards-deck">
              <div className="showcase-card-item">
                <div className="showcase-card-left">
                  <div className="showcase-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div className="showcase-card-text">
                    <h4>Direct Brand Pricing</h4>
                    <p>Verified OEM direct rates without distributor markups</p>
                  </div>
                </div>
                <span className="showcase-card-chip highlight">Best Price</span>
              </div>

              <div className="showcase-card-item">
                <div className="showcase-card-left">
                  <div className="showcase-card-icon blue-theme">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <div className="showcase-card-text">
                    <h4>Express Dispatch Radar</h4>
                    <p>Live package tracking from hub straight to doorstep</p>
                  </div>
                </div>
                <span className="showcase-card-chip highlight-b2b">Same-Day</span>
              </div>

              <div className="showcase-card-item">
                <div className="showcase-card-left">
                  <div className="showcase-card-icon green-theme">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="showcase-card-text">
                    <h4>100% Genuine Warranty</h4>
                    <p>Full manufacturer warranty coverage on all products</p>
                  </div>
                </div>
                <span className="showcase-card-chip">Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Metrics */}
          <div className="showcase-trust-bar">
            <div className="trust-stat">
              <span className="trust-number">50K+</span>
              <span className="trust-caption">Active Buyers</span>
            </div>
            <div className="trust-stat">
              <span className="trust-number">99.8%</span>
              <span className="trust-caption">On-Time Delivery</span>
            </div>
            <div className="trust-stat">
              <span className="trust-number">₹10Cr+</span>
              <span className="trust-caption">Wholesale Volume</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
