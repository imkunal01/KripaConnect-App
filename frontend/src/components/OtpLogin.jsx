import { useState, useEffect, useRef } from 'react'
import { requestOtp, verifyOtp } from '../services/auth'

export default function OtpLogin({ onSuccess }) {
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
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await verifyOtp(email, otp)
      const payload = res?.data || {}
      onSuccess?.(payload)
    } catch (err) {
      setError(err.message || 'Invalid OTP')
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
      <form onSubmit={handleRequestOtp} className="form-stack">
        {error && (
          <div style={{ 
            padding: '12px', 
            background: '#fee2e2', 
            border: '1px solid #dc2626', 
            borderRadius: '6px', 
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '1rem'
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
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOtp} className="form-stack">
      {error && (
        <div style={{ 
          padding: '12px', 
          background: '#fee2e2', 
          border: '1px solid #dc2626', 
          borderRadius: '6px', 
          color: '#dc2626',
          fontSize: '14px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem', textAlign: 'center', color: '#6b7280' }}>
        OTP sent to <strong>{email}</strong>
      </div>

      <input 
        className="input-field" 
        type="text" 
        placeholder="Enter 6-digit OTP" 
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
        maxLength={6}
        style={{ 
          fontSize: '24px', 
          textAlign: 'center', 
          letterSpacing: '8px',
          fontFamily: 'monospace'
        }}
      />

      {timeLeft > 0 && (
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginTop: '0.5rem' }}>
          Code expires in <strong style={{ color: '#dc2626' }}>{formatTime(timeLeft)}</strong>
        </div>
      )}
      
      <button className="btn-primary" type="submit" disabled={loading || otp.length !== 6}>
        {loading ? 'Verifying...' : 'Verify & Login'}
      </button>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button
          type="button"
          className="btn-google"
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
          className="btn-google"
          onClick={handleResend}
          disabled={loading || !canResend}
          style={{ flex: 1 }}
        >
          {canResend ? 'Resend OTP' : 'Resend'}
        </button>
      </div>
    </form>
  )
}
