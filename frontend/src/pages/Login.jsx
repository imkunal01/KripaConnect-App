import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useGoogleLogin } from '@react-oauth/google'
import PhoneOtpLogin from '../components/PhoneOtpLogin.jsx'
import './FormStyles.css'

export default function Login() {
  const { signIn, googleSignIn } = useAuth()
  const navigate = useNavigate()
  
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
        alert("Google Login Failed");
      }
    },
    onError: () => {
      console.log('Login Failed');
      alert("Google Login Failed");
    }
  });

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = await signIn({ email, password })
      const hasAddress = Array.isArray(payload?.savedAddresses) && payload.savedAddresses.length > 0
      navigate(hasAddress ? '/' : '/onboarding')
    } catch (err) {
      alert("Login failed")
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
          <div className="brand">KARC</div>
          <div className="auth-toggle">
            <Link to="/login" className="toggle-btn active">Log In</Link>
            <Link to="/signup" className="toggle-btn">Sign Up</Link>
          </div>
        </header>

        <div className="welcome-text">
          <h1>Hello!</h1>
          <p>Welcome back to the community</p>
        </div>

        <form onSubmit={handleLogin} className="form-stack">
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
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div className="form-extras">
            <label style={{display:'flex', gap:'8px', alignItems:'center', color:'#71717a', cursor:'pointer'}}>
              <input type="checkbox" style={{width:'16px', height:'16px'}} /> Remember me
            </label>
            <Link to="/forgot-password" className="link-reset">Forgot Password?</Link>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Log In'}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <button className="btn-google" onClick={() => loginWithGoogle()}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" alt="Google" />
          Google
        </button>

        <div className="divider">or use phone OTP</div>

        <PhoneOtpLogin
          onDone={(payload) => {
            const hasAddress = Array.isArray(payload?.savedAddresses) && payload.savedAddresses.length > 0
            const needsOnboarding = !!payload?.isNewUser || !hasAddress
            navigate(needsOnboarding ? '/onboarding' : '/')
          }}
        />
      </div>

      {/* RIGHT: Visual Section */}
      <div className="auth-right">
        <div className="visual-content">
          <h2>Discover hidden gems.</h2>
          <p>Join a community of explorers and creators sharing unique perspectives from around the globe.</p>
        </div>
      </div>
    </div>
  )
}
