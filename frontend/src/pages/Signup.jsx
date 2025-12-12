import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaStore, FaUserAlt } from 'react-icons/fa'
import { useAuth } from '../hooks/useAuth.js'
import AuthLayout from '../components/AuthLayout.jsx'
import './FormStyles.css'

function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }
function passwordChecks(pwd) {
  return {
    length: pwd.length >= 8,
    lower: /[a-z]/.test(pwd),
    upper: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    symbol: /[\W_]/.test(pwd),
  }
}

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const checks = passwordChecks(password)
  const valid = name && validateEmail(email) && Object.values(checks).every(Boolean)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp({ name, email, password, role })
      navigate(from)
    } catch (err) {
      setError(err?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={onSubmit} noValidate className="auth-form">
        <div className="input-group">
          <label>I am a</label>
          <div className="role-select-container">
            <div 
              className={`role-card ${role === 'customer' ? 'active' : ''}`}
              onClick={() => setRole('customer')}
            >
              <FaUserAlt className="role-icon" />
              <span className="role-label">Customer</span>
            </div>
            <div 
              className={`role-card ${role === 'retailer' ? 'active' : ''}`}
              onClick={() => setRole('retailer')}
            >
              <FaStore className="role-icon" />
              <span className="role-label">Retailer</span>
            </div>
          </div>
        </div>

        <div className="input-group">
          <label>Full Name</label>
          <div className="input-wrapper">
            <FaUser className="input-icon" />
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="John Doe" 
            />
          </div>
        </div>

        <div className="input-group">
          <label>Email Address</label>
          <div className="input-wrapper">
            <FaEnvelope className="input-icon" />
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com" 
            />
          </div>
          {!validateEmail(email) && email.length > 0 && <span className="error-text">Enter a valid email</span>}
        </div>

        <div className="input-group">
          <label>Password</label>
          <div className="input-wrapper">
            <FaLock className="input-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
            />
            <button 
              type="button" 
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {/* Password Strength Indicators */}
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <span style={{ color: checks.length ? '#22c55e' : '#94a3b8' }}>• 8+ chars</span>
              <span style={{ color: checks.lower ? '#22c55e' : '#94a3b8' }}>• Lowercase</span>
              <span style={{ color: checks.upper ? '#22c55e' : '#94a3b8' }}>• Uppercase</span>
              <span style={{ color: checks.number ? '#22c55e' : '#94a3b8' }}>• Number</span>
              <span style={{ color: checks.symbol ? '#22c55e' : '#94a3b8' }}>• Symbol</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
           <label className="checkbox-container">
            <input type="checkbox" />
            <span className="checkmark"></span>
            I agree to Terms & Policy
          </label>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <button className="submit-btn" type="submit" disabled={!valid || loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  )
}
