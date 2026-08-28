import { useState, useEffect, useRef } from 'react'
import { requestOtp } from '../services/auth'
import { useAuth } from '../hooks/useAuth.js'

export default function OtpLogin({ onSuccess }) {
  const { signInWithOtp } = useAuth()
  const [step, setStep] = useState('email') // 'email' or 'otp'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [canResend, setCanResend] = useState(false)
  
  const timerRef = useRef(null)

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (timeLeft === 0 && step === 'otp') {
      setCanResend(true)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timeLeft, step])

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await requestOtp(email)
      setStep('otp')
      setTimeLeft(300) // 5 minutes
      setCanResend(false)
    } catch (err) {
      setError(err.message || 'Failed to send OTP code. Please check your email and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      if (typeof signInWithOtp !== 'function') {
        throw new Error('OTP login is unavailable. Please use password login.')
      }
      const payload = await signInWithOtp({ email, otp })
      onSuccess?.(payload)
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setLoading(true)
    setOtp('')
    
    try {
      await requestOtp(email)
      setTimeLeft(300)
      setCanResend(false)
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (step === 'email') {
    return (
      <form onSubmit={handleRequestOtp} className="cyber-otp-container">
        {error && (
          <div className="cyber-alert-box" role="alert">
            <svg className="cyber-alert-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="cyber-input-group">
          <label className="cyber-input-label" htmlFor="otp-email-input">
            Email for Passwordless Code
          </label>
          <div className="cyber-input-wrapper">
            <svg className="cyber-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <input 
              id="otp-email-input"
              className="cyber-input" 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>
        
        <button className="cyber-submit-btn" type="submit" disabled={loading}>
          {loading ? (
            <span>Sending Security Code...</span>
          ) : (
            <>
              <span>Send 6-Digit Code</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </>
          )}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOtp} className="cyber-otp-container">
      {error && (
        <div className="cyber-alert-box" role="alert">
          <svg className="cyber-alert-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="otp-instruction-card">
        <h3>Check Your Inbox</h3>
        <p>
          We dispatched a 6-digit access code to <strong>{email}</strong>
        </p>
      </div>

      <div className="cyber-input-group">
        <input 
          id="cyber-otp-pin"
          className="otp-pin-input" 
          type="text" 
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="••••••" 
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
        />
      </div>

      {timeLeft > 0 ? (
        <div className="otp-timer-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Code valid for {formatTime(timeLeft)}</span>
        </div>
      ) : (
        <div className="otp-timer-chip expired">
          <span>Code expired. Request a new code below.</span>
        </div>
      )}
      
      <button className="cyber-submit-btn" type="submit" disabled={loading || otp.length !== 6}>
        {loading ? 'Authenticating...' : 'Verify Code & Sign In'}
      </button>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          className="cyber-secondary-btn"
          onClick={() => {
            setStep('email')
            setOtp('')
            setTimeLeft(0)
            setError('')
          }}
          disabled={loading}
          style={{ flex: 1 }}
        >
          Change Email
        </button>

        <button
          type="button"
          className="cyber-secondary-btn"
          onClick={handleResend}
          disabled={loading || !canResend}
          style={{ flex: 1 }}
        >
          {canResend ? 'Resend Code' : 'Resend'}
        </button>
      </div>
    </form>
  )
}
