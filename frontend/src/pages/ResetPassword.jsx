import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/auth'
import './FormStyles.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (!tokenFromUrl) {
      setError('Invalid reset link. Please request a new password reset.')
    } else {
      setToken(tokenFromUrl)
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    
    try {
      await resetPassword(token, newPassword)
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-wrapper">
        <div className="auth-left">
          <header className="auth-header">
            <div className="brand">BizLink</div>
          </header>

          <div className="welcome-text">
            <h1>Password Reset Successful!</h1>
            <p style={{ marginTop: '20px', color: '#059669' }}>
              ✓ Your password has been reset successfully.
            </p>
            <p style={{ marginTop: '15px', color: '#6b7280' }}>
              Redirecting to login page...
            </p>
            <div style={{ marginTop: '30px' }}>
              <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Go to Login
              </Link>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="visual-content">
            <h2>You're all set!</h2>
            <p>Your password has been reset. You can now log in with your new password.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <header className="auth-header">
          <div className="brand">BizLink</div>
        </header>

        <div className="welcome-text">
          <h1>Reset Your Password</h1>
          <p>Enter your new password below.</p>
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
            type="password" 
            placeholder="New Password (min 6 characters)" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />

          <input 
            className="input-field" 
            type="password" 
            placeholder="Confirm New Password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          
          <button 
            className="btn-primary" 
            type="submit" 
            disabled={loading || !token}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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
          <h2>Create a strong password.</h2>
          <p>Choose a secure password that you haven't used before. Make it at least 6 characters long.</p>
        </div>
      </div>
    </div>
  )
}
