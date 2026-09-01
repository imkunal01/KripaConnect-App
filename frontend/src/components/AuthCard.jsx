import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useGoogleLogin } from '@react-oauth/google'
import OtpLogin from './OtpLogin.jsx'
import PasswordStrengthMeter from './PasswordStrengthMeter.jsx'
import { forgotPassword } from '../services/auth.js'
import toast from 'react-hot-toast'
import './AuthModal.css'

export default function AuthCard({
  initialMode = 'login',
  isModal = false,
  onSuccess,
  onClose,
  redirectUrl,
  initialRole = 'customer',
  title,
  description,
}) {
  const { signIn, signUp, googleSignIn } = useAuth()
  const navigate = useNavigate()

  // Main modes: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState(initialMode)
  const [useOtp, setUseOtp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(initialRole)
  const [rememberMe, setRememberMe] = useState(true)

  // Forgot password specific state
  const [forgotSuccess, setForgotSuccess] = useState(false)

  // Sync mode if initialMode changes
  useEffect(() => {
    setMode(initialMode)
    setError('')
    setUseOtp(false)
    setForgotSuccess(false)
  }, [initialMode])

  // Post-auth redirect / callback handler
  const handleAuthComplete = (payload) => {
    if (onSuccess) {
      onSuccess(payload)
      if (onClose) onClose()
      return
    }

    if (onClose) onClose()

    if (redirectUrl) {
      navigate(redirectUrl)
      return
    }

    const hasAddress = Array.isArray(payload?.savedAddresses) && payload.savedAddresses.length > 0
    const needsOnboarding = !!payload?.isNewUser || !hasAddress
    navigate(needsOnboarding ? '/onboarding' : '/')
  }

  // Google Login / Signup
  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      setError('')
      try {
        const payload = await googleSignIn(null, tokenResponse.access_token, mode === 'signup' ? role : undefined)
        toast.success(`Welcome${payload?.name ? `, ${payload.name}` : ''}!`)
        handleAuthComplete(payload)
      } catch (err) {
        console.error('Google Auth Error:', err)
        const msg = err?.message || 'Google Authentication failed'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    onError: (err) => {
      console.error('Google login error:', err)
      setError('Google login failed or was cancelled')
      toast.error('Google login failed')
    }
  })

  // Email + Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const payload = await signIn({ email, password })
      toast.success('Signed in successfully!')
      handleAuthComplete(payload)
    } catch (err) {
      console.error('Login error:', err)
      const msg = err?.message || 'Invalid email or password'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Account Creation (Signup)
  const handleSignup = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email || !password) {
      setError('Please complete all required fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const payload = await signUp({ name: name.trim(), email, password, role })
      toast.success('Account created successfully!')
      handleAuthComplete(payload)
    } catch (err) {
      console.error('Signup error:', err)
      const msg = err?.message || 'Failed to create account. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Forgot Password Request
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your registered email address.')
      return
    }
    setError('')
    setLoading(true)

    try {
      await forgotPassword(email)
      setForgotSuccess(true)
      toast.success('Password reset link sent!')
    } catch (err) {
      console.error('Forgot password error:', err)
      const msg = err?.message || 'Failed to send reset link'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`auth-card-glass-panel ${isModal ? 'auth-card-modal-mode' : ''}`}>
      {/* Top Bar: Brand & Tab Switcher */}
      <div className="auth-panel-topbar">
        <Link to="/" className="auth-brand-badge" onClick={onClose}>
          <div className="brand-emblem">
            <span>K</span>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">KripaConnect</span>
            <span className="brand-tag">Electronics & Wholesale</span>
          </div>
        </Link>

        {mode !== 'forgot' && (
          <div className="auth-segmented-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-segmented-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login')
                setError('')
                setUseOtp(false)
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-segmented-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup')
                setError('')
                setUseOtp(false)
              }}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      {/* Title & Subtitle */}
      <div className="auth-header-block">
        <h2 className="auth-header-title">
          {mode === 'login'
            ? (title || 'Welcome Back')
            : mode === 'signup'
            ? 'Create New Account'
            : 'Recover Your Access'}
        </h2>
        <p className="auth-header-subtitle">
          {mode === 'login'
            ? (description || 'Enter your credentials to access electronics orders & live logistics.')
            : mode === 'signup'
            ? 'Choose your account tier and unlock direct wholesale B2B pricing.'
            : 'Provide your registered email to receive an instant recovery link.'}
        </p>
      </div>

      {/* Error Callout Banner */}
      {error && (
        <div className="cyber-alert-box" role="alert">
          <svg className="cyber-alert-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. LOGIN MODE                                        */}
      {/* ==================================================== */}
      {mode === 'login' && (
        <>
          {!useOtp ? (
            <form onSubmit={handlePasswordLogin} className="auth-form-stack">
              <div className="cyber-input-group">
                <label className="cyber-input-label" htmlFor="login-email">
                  <span>Email Address</span>
                </label>
                <div className="cyber-input-wrapper">
                  <svg className="cyber-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="login-email"
                    className="cyber-input"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="cyber-input-group">
                <label className="cyber-input-label" htmlFor="login-password">
                  <span>Password</span>
                </label>
                <div className="cyber-input-wrapper">
                  <svg className="cyber-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="login-password"
                    className="cyber-input has-toggle"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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

              <div className="cyber-form-extras">
                <label className="cyber-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>

                <button
                  type="button"
                  className="cyber-forgot-btn"
                  onClick={() => {
                    setMode('forgot')
                    setError('')
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button className="cyber-submit-btn" type="submit" disabled={loading}>
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>

              <button
                type="button"
                className="cyber-secondary-btn"
                onClick={() => {
                  setUseOtp(true)
                  setError('')
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Passwordless OTP Instant Login</span>
              </button>
            </form>
          ) : (
            <div>
              <OtpLogin onSuccess={handleAuthComplete} />
              <button
                type="button"
                className="cyber-secondary-btn"
                style={{ marginTop: '12px' }}
                onClick={() => {
                  setUseOtp(false)
                  setError('')
                }}
              >
                ← Return to Password Login
              </button>
            </div>
          )}

          {!useOtp && (
            <>
              <div className="cyber-divider">
                <span>or authenticate via</span>
              </div>

              <button
                type="button"
                className="cyber-google-btn"
                onClick={() => handleGoogleAuth()}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}
        </>
      )}

      {/* ==================================================== */}
      {/* 2. SIGNUP MODE                                       */}
      {/* ==================================================== */}
      {mode === 'signup' && (
        <form onSubmit={handleSignup} className="auth-form-stack">
          {/* Account Role Selector */}
          <div className="cyber-role-section">
            <span className="cyber-input-label">Select Account Tier</span>
            <div className="cyber-role-grid">
              <button
                type="button"
                className={`cyber-role-card ${role === 'customer' ? 'active' : ''}`}
                onClick={() => setRole('customer')}
              >
                <div className="role-header-row">
                  <span className="role-badge-pill">Personal</span>
                  <div className="role-radio-mark">✓</div>
                </div>
                <div className="role-title">Customer</div>
                <div className="role-desc">Personal orders, flash drops & doorstep delivery</div>
              </button>

              <button
                type="button"
                className={`cyber-role-card ${role === 'retailer' ? 'active role-b2b' : ''}`}
                onClick={() => setRole('retailer')}
              >
                <div className="role-header-row">
                  <span className="role-badge-pill b2b">Wholesale</span>
                  <div className="role-radio-mark">✓</div>
                </div>
                <div className="role-title">Retailer B2B</div>
                <div className="role-desc">Bulk price tiers, automated GST credit & invoice tools</div>
              </button>
            </div>
          </div>

          <div className="cyber-input-group">
            <label className="cyber-input-label" htmlFor="signup-name">Full Name</label>
            <div className="cyber-input-wrapper">
              <svg className="cyber-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="signup-name"
                className="cyber-input"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="cyber-input-group">
            <label className="cyber-input-label" htmlFor="signup-email">Work or Personal Email</label>
            <div className="cyber-input-wrapper">
              <svg className="cyber-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="signup-email"
                className="cyber-input"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="cyber-input-group">
            <label className="cyber-input-label" htmlFor="signup-password">Create Strong Password</label>
            <div className="cyber-input-wrapper">
              <svg className="cyber-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="signup-password"
                className="cyber-input has-toggle"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <PasswordStrengthMeter
            password={password}
            visible={password.length > 0}
            title="Password Security Rating"
          />

          <button
            className={`cyber-submit-btn ${role === 'retailer' ? 'b2b-gradient' : ''}`}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Launch {role === 'retailer' ? 'Retailer B2B' : 'Customer'} Account</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>

          <p className="cyber-legal-text">
            By creating an account, you agree to our{' '}
            <Link to="/terms" onClick={onClose}>Terms of Service</Link> &{' '}
            <Link to="/privacy" onClick={onClose}>Privacy Policy</Link>.
          </p>

          <div className="cyber-divider">
            <span>or sign up with</span>
          </div>

          <button
            type="button"
            className="cyber-google-btn"
            onClick={() => handleGoogleAuth()}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Quick Sign Up via Google</span>
          </button>
        </form>
      )}

      {/* ==================================================== */}
      {/* 3. FORGOT PASSWORD MODE                              */}
      {/* ==================================================== */}
      {mode === 'forgot' && (
        <div>
          {forgotSuccess ? (
            <div className="cyber-success-pane">
              <div className="cyber-success-emblem">✓</div>
              <h3>Check Your Email</h3>
              <p>
                We have transmitted a secure reset token to <strong>{email}</strong>. This token expires in 15 minutes.
              </p>
              <button
                type="button"
                className="cyber-submit-btn"
                onClick={() => {
                  setMode('login')
                  setForgotSuccess(false)
                }}
              >
                Return to Portal Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="auth-form-stack">
              <div className="cyber-input-group">
                <label className="cyber-input-label" htmlFor="forgot-email">
                  Registered Account Email
                </label>
                <div className="cyber-input-wrapper">
                  <svg className="cyber-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    id="forgot-email"
                    className="cyber-input"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button className="cyber-submit-btn" type="submit" disabled={loading}>
                {loading ? 'Transmitting Link...' : 'Send Recovery Link'}
              </button>

              <button
                type="button"
                className="cyber-secondary-btn"
                onClick={() => {
                  setMode('login')
                  setError('')
                }}
              >
                ← Back to Portal Login
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
