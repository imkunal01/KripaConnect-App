import { useMemo, useRef, useState } from 'react'
import { sendOtp, getFirebaseAuth } from '../services/firebaseClient'
import { useAuth } from '../hooks/useAuth'

export default function PhoneOtpLogin({ onDone }) {
  const { phoneOtpSignIn } = useAuth()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // phone | otp
  const [loading, setLoading] = useState(false)

  const confirmationRef = useRef(null)

  const phoneE164 = useMemo(() => {
    const raw = (phone || '').trim()
    // Simple helper: if user enters 10-digit India number, auto-prefix +91
    if (/^\d{10}$/.test(raw)) return `+91${raw}`
    return raw
  }, [phone])

  const handleSend = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await sendOtp(phoneE164)
      confirmationRef.current = result
      setStep('otp')
    } catch (err) {
      alert('Failed to send OTP. Please check phone number and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!confirmationRef.current) throw new Error('OTP session not found')
      await confirmationRef.current.confirm(otp)

      // After confirm(), Firebase considers the user signed-in.
      // We DO NOT use Firebase sessions for app auth.
      // We only use the Firebase ID token as verification proof.
      const auth = getFirebaseAuth()
      const idToken = await auth.currentUser.getIdToken(true)

      const payload = await phoneOtpSignIn(idToken)

      // Optional cleanup: sign out from Firebase (keeps Firebase as verification-only layer)
      await auth.signOut().catch(() => {})

      onDone?.(payload)
    } catch (err) {
      alert('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Required for Firebase RecaptchaVerifier */}
      <div id="recaptcha-container" />

      {step === 'phone' ? (
        <form onSubmit={handleSend} className="form-stack">
          <input
            className="input-field"
            type="tel"
            placeholder="Phone number (e.g. +9198xxxxxx or 10 digits)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="form-stack">
          <input
            className="input-field"
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>

          <button
            type="button"
            className="btn-google"
            onClick={() => {
              setStep('phone')
              setOtp('')
            }}
            disabled={loading}
          >
            Change phone
          </button>
        </form>
      )}
    </div>
  )
}
