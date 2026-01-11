import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useGoogleLogin } from '@react-oauth/google'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.jsx'
import './FormStyles.css'

export default function Signup() {
  const { signUp, googleSignIn } = useAuth()
  const navigate = useNavigate()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const payload = await googleSignIn(null, tokenResponse.access_token);
        const hasAddress = Array.isArray(payload?.savedAddresses) && payload.savedAddresses.length > 0
        const needsOnboarding = !!payload?.isNewUser || !hasAddress
        navigate(needsOnboarding ? '/onboarding' : '/');
      } catch (e) {
        console.error(e);
        alert("Google Signup Failed");
      }
    },
    onError: () => {
      console.log('Signup Failed');
      alert("Google Signup Failed");
    }
  });

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp({ name, email, password })
      navigate('/onboarding')
    } catch (err) {
      alert("Signup failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    try {
      if (window.history.length > 1) navigate(-1)
      else navigate('/')
    } catch {
      navigate('/')
    }
  }

  return (
    <div className="auth-wrapper">
      {/* LEFT: Form Section */}
      <div className="auth-left">
        <button type="button" className="auth-back-btn" onClick={goBack}>
          ← Back
        </button>

        <header className="auth-header">
          <div className="brand">KripaConnect</div>
          <div className="auth-toggle">
            <Link to="/login" className="toggle-btn">Log In</Link>
            <Link to="/signup" className="toggle-btn active">Sign Up</Link>
          </div>
        </header>

        <div className="welcome-text">
          <h1>Create Account</h1>
          <p>Enter your details to create your account.</p>
        </div>

        <form onSubmit={handleSignup} className="form-stack">
          <input
            className="input-field"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="input-field"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input-field"
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <PasswordStrengthMeter
            password={password}
            visible={true}
            title="Password requirements"
          />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <button className="btn-google" onClick={() => loginWithGoogle()}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" alt="Google" />
          Google
        </button>
      </div>

      {/* RIGHT: Visual Section (Hidden on Mobile) */}
      <div className="auth-right">
        <div className="visual-content">
          <h2>Start your journey.</h2>
          <p>Create an account to unlock exclusive features, track your orders, and join our global community.</p>
        </div>
      </div>
    </div>
  )
}
