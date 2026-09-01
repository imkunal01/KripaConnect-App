import { useNavigate, Link } from 'react-router-dom'
import SEO from '../components/SEO.jsx'
import AuthCard from '../components/AuthCard.jsx'
import '../components/AuthModal.css'

export default function Signup() {
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
        title="Create Account | KripaConnect Electronics & Wholesale"
        description="Create your KripaConnect account to shop certified electronics, unlock wholesale B2B pricing, and track shipments."
        canonical="/signup"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="cyber-secondary-btn"
              style={{ width: 'auto', padding: '6px 14px', height: '36px', borderRadius: '999px', fontSize: '0.82rem' }}
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
              style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
            >
              Explore Store →
            </Link>
          </div>

          <AuthCard
            initialMode="signup"
            isModal={false}
            title="Create Account"
            description="Choose your account type and unlock direct wholesale B2B pricing."
          />
        </div>

        {/* Right Side: Interactive Showcase Studio */}
        <aside className="auth-studio-showcase" aria-label="KripaConnect account benefits">
          {/* Header Pill */}
          <div className="showcase-header-pill">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Instant Activation • 0% Onboarding Fee</span>
          </div>

          {/* Main Headline */}
          <div className="showcase-main-content">
            <h1 className="showcase-headline">
              Unlock <span className="neon-highlight--b2b">Wholesale Tiers</span> & Bulk Margins.
            </h1>

            <p className="showcase-description">
              Whether you are shopping for your personal setup or sourcing inventory for your electronics store, KripaConnect gives you unmatchable brand-direct prices.
            </p>

            {/* Interactive Live Cards Deck */}
            <div className="showcase-cards-deck">
              <div className="showcase-card-item">
                <div className="showcase-card-left">
                  <div className="showcase-card-icon blue-theme">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </div>
                  <div className="showcase-card-text">
                    <h4>Volume-Based Discounts</h4>
                    <p>Up to 40% margin benefit on wholesale electronics orders</p>
                  </div>
                </div>
                <span className="showcase-card-chip highlight-b2b">Up to 40% Off</span>
              </div>

              <div className="showcase-card-item">
                <div className="showcase-card-left">
                  <div className="showcase-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="showcase-card-text">
                    <h4>Automated GST Invoicing</h4>
                    <p>Instant tax invoice download with full input credit</p>
                  </div>
                </div>
                <span className="showcase-card-chip highlight">Tax Credit</span>
              </div>

              <div className="showcase-card-item">
                <div className="showcase-card-left">
                  <div className="showcase-card-icon green-theme">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <div className="showcase-card-text">
                    <h4>Priority Courier Dispatch</h4>
                    <p>Same-day dispatch with insured priority transit</p>
                  </div>
                </div>
                <span className="showcase-card-chip">Fast Transit</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Metrics */}
          <div className="showcase-trust-bar">
            <div className="trust-stat">
              <span className="trust-number">₹10Cr+</span>
              <span className="trust-caption">Wholesale Volume</span>
            </div>
            <div className="trust-stat">
              <span className="trust-number">100%</span>
              <span className="trust-caption">GST Invoiced</span>
            </div>
            <div className="trust-stat">
              <span className="trust-number">24/7</span>
              <span className="trust-caption">B2B Support</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
