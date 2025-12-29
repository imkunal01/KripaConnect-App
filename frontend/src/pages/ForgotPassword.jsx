import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '../services/auth'
import './FormStyles.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    try {
      if (window.history.length > 1) navigate(-1)
      else navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  if (success) {
    return (
      <div className="auth-wrapper">
        <div className="auth-left">
          <button type="button" className="auth-back-btn" onClick={() => navigate('/login')}>
            ← Back to Login
          </button>

          <header className="auth-header">
            <div className="brand">KARC</div>
          </header>

          <div className="welcome-text">
            <h1>Check Your Email</h1>
            <p style={{ marginTop: '20px', color: '#059669' }}>
              ✓ If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
            </p>
            <p style={{ marginTop: '15px', color: '#6b7280' }}>
              The link will expire in 15 minutes for security reasons.
            </p>
            <p style={{ marginTop: '15px', color: '#6b7280' }}>
              Didn't receive it? Check your spam folder or <button 
                onClick={() => setSuccess(false)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#2563eb', 
                  textDecoration: 'underline', 
                  cursor: 'pointer' 
                }}
              >
                try again
              </button>.
            </p>
          </div>
        </div>

        <div className="auth-right">
          <div className="visual-content">
            <h2>Secure password reset.</h2>
            <p>We've sent you a secure link to reset your password. Click the link in your email to continue.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <button type="button" className="auth-back-btn" onClick={goBack}>
          ← Back
        </button>

        <header className="auth-header">
          <div className="brand">KARC</div>
        </header>

        <div className="welcome-text">
          <h1>Forgot Password?</h1>
          <p>No worries! Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          {error && (
            <div style={{ 
              padding: '12px', 
              background: '#fee2e2', 
              border: '1px solid #dc2626', 
              borderRadius: '6px', 
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <input 
            className="input-field" 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>

      <div className="auth-right">
        <div className="visual-content">
          <h2>Reset your password.</h2>
          <p>Enter your email address and we'll send you a secure link to reset your password.</p>
        </div>
      </div>
    </div>
  )
}
