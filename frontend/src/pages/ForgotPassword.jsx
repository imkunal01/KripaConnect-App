import { useNavigate, Link } from 'react-router-dom'
import SEO from '../components/SEO.jsx'
import AuthCard from '../components/AuthCard.jsx'
import '../components/AuthModal.css'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const goBack = () => {
    try {
      if (window.history.length > 1) navigate(-1)
      else navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  return (
    <div className="auth-page-container">
      <SEO
        title="Account Recovery | KripaConnect"
        description="Reset your KripaConnect account password securely."
        canonical="/forgot-password"
        robots="noindex, nofollow"
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
              aria-label="Back to login"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to login</span>
            </button>

            <Link
              to="/login"
              style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign In Instead →
            </Link>
          </div>

          <AuthCard
            initialMode="forgot"
            isModal={false}
            title="Recover Access"
            description="Enter your registered email address to receive an encrypted reset token."
          />
        </div>

        {/* Right Side: Interactive Showcase Studio */}
        <aside className="auth-studio-showcase" aria-label="KripaConnect account security">
          <div className="showcase-header-pill">
            <span className="pulse-dot" aria-hidden="true" />
            <span>256-Bit SSL Encrypted Recovery</span>
          </div>

          <div className="showcase-main-content">
            <h1 className="showcase-headline">
              Bank-grade security for your <span className="neon-highlight">Account & Orders</span>.
            </h1>

            <p className="showcase-description">
              We protect your saved corporate GST profiles, delivery locations, and order history with automated cryptographic verification tokens.
            </p>

            <div className="showcase-cards-deck">
              <div className="showcase-card-item">
                <div className="showcase-card-left">
                  <div className="showcase-card-icon green-theme">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="showcase-card-text">
                    <h4>Single-Use Security Token</h4>
                    <p>Cryptographically signed links that expire in 15 minutes</p>
                  </div>
                </div>
                <span className="showcase-card-chip">Protected</span>
              </div>

              <div className="showcase-card-item">
                <div className="showcase-card-left">
                  <div className="showcase-card-icon blue-theme">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div className="showcase-card-text">
                    <h4>Instant SMTP Dispatch</h4>
                    <p>Immediate delivery to your registered primary inbox</p>
                  </div>
                </div>
                <span className="showcase-card-chip highlight-b2b">Instant</span>
              </div>
            </div>
          </div>

          <div className="showcase-trust-bar">
            <div className="trust-stat">
              <span className="trust-number">256-Bit</span>
              <span className="trust-caption">Encryption</span>
            </div>
            <div className="trust-stat">
              <span className="trust-number">0</span>
              <span className="trust-caption">Data Leakage</span>
            </div>
            <div className="trust-stat">
              <span className="trust-number">100%</span>
              <span className="trust-caption">Privacy Guaranteed</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
