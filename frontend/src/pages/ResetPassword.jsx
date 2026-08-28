import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/auth'
import SEO from '../components/SEO'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.jsx'
import '../components/AuthModal.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (!tokenFromUrl) {
      setError('Invalid or missing reset token. Please request a new password recovery link.')
    } else {
      setToken(tokenFromUrl)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    
    try {
      await resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3500)
    } catch (err) {
      setError(err.message || 'Failed to update password. The recovery link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-container">
      <SEO
        title="Set New Password | KripaConnect"
        description="Choose a new secure password for your KripaConnect account."
        canonical="/reset-password"
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
        {/* Left Side: Reset Card Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              to="/login"
              className="cyber-secondary-btn"
              style={{ width: 'auto', padding: '6px 14px', height: '36px', borderRadius: '999px', fontSize: '0.82rem', textDecoration: 'none' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to login</span>
            </Link>
          </div>

          <div className="auth-card-glass-panel">
            {/* Top Bar Brand */}
            <div className="auth-panel-topbar">
              <Link to="/" className="auth-brand-badge">
                <div className="brand-emblem">
                  <span>K</span>
                </div>
                <div className="brand-text-group">
                  <span className="brand-name">KripaConnect</span>
                  <span className="brand-tag">Security Portal</span>
                </div>
              </Link>
            </div>

            {success ? (
              <div className="cyber-success-pane">
                <div className="cyber-success-emblem">✓</div>
                <h3>Password Successfully Updated!</h3>
                <p>
                  Your credentials have been securely updated in our encrypted vault. Redirecting you to the portal login...
                </p>
                <Link
                  to="/login"
                  className="cyber-submit-btn"
                  style={{ width: '100%', textDecoration: 'none' }}
                >
                  Proceed to Login Now
                </Link>
              </div>
            ) : (
              <>
                <div className="auth-header-block">
                  <h2 className="auth-header-title">Create New Password</h2>
                  <p className="auth-header-subtitle">Enter a robust, unique password to secure your account.</p>
                </div>

                {error && (
                  <div className="cyber-alert-box" role="alert">
                    <svg className="cyber-alert-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form-stack">
                  <div className="cyber-input-group">
                    <label className="cyber-input-label" htmlFor="reset-new-password">New Security Password</label>
                    <div className="cyber-input-wrapper">
                      <svg className="cyber-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input
                        id="reset-new-password"
                        className="cyber-input has-toggle"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="cyber-pass-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="cyber-input-group">
                    <label className="cyber-input-label" htmlFor="reset-confirm-password">Confirm New Password</label>
                    <div className="cyber-input-wrapper">
                      <svg className="cyber-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input
                        id="reset-confirm-password"
                        className="cyber-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <PasswordStrengthMeter
                    password={newPassword}
                    visible={newPassword.length > 0}
                    title="New Password Strength"
                  />

                  <button
                    className="cyber-submit-btn"
                    type="submit"
                    disabled={loading || !token || newPassword.length < 8 || newPassword !== confirmPassword}
                  >
                    {loading ? 'Updating Credentials...' : 'Save Password & Sign In'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Showcase Studio */}
        <aside className="auth-studio-showcase" aria-label="KripaConnect password protection">
          <div className="showcase-header-pill">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Vault Security Standards</span>
          </div>

          <div className="showcase-main-content">
            <h1 className="showcase-headline">
              Keep your corporate <span className="neon-highlight">Data & Invoices</span> safe.
            </h1>

            <p className="showcase-description">
              A strong password prevents unauthorized modifications to your company GST profile, payment methods, and bulk order logistics.
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
                    <h4>Bcrypt Salt Hashing</h4>
                    <p>Zero plaintext storage with multi-round cryptographic salting</p>
                  </div>
                </div>
                <span className="showcase-card-chip">Standard</span>
              </div>

              <div className="showcase-card-item">
                <div className="showcase-card-left">
                  <div className="showcase-card-icon blue-theme">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="showcase-card-text">
                    <h4>Session Invalidation</h4>
                    <p>All previous active sessions will be terminated upon reset</p>
                  </div>
                </div>
                <span className="showcase-card-chip highlight-b2b">Safe</span>
              </div>
            </div>
          </div>

          <div className="showcase-trust-bar">
            <div className="trust-stat">
              <span className="trust-number">100%</span>
              <span className="trust-caption">Zero Plaintext</span>
            </div>
            <div className="trust-stat">
              <span className="trust-number">256-Bit</span>
              <span className="trust-caption">Vault Security</span>
            </div>
            <div className="trust-stat">
              <span className="trust-number">Instant</span>
              <span className="trust-caption">Sync</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
