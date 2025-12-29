import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig)
  }
  return getApps()[0]
}

export function getFirebaseAuth() {
  const app = getFirebaseApp()
  return getAuth(app)
}

export function ensureRecaptcha(containerId = 'recaptcha-container') {
  const auth = getFirebaseAuth()

  // Clear existing verifier if present
  if (window.__otpRecaptchaVerifier) {
    try {
      window.__otpRecaptchaVerifier.clear()
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Create new verifier with proper callbacks
  window.__otpRecaptchaVerifier = new RecaptchaVerifier(
    auth,
    containerId,
    {
      size: 'normal', // Changed from 'invisible' to 'normal' for better reliability
      callback: (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber
        console.log('reCAPTCHA verified')
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again
        console.log('reCAPTCHA expired')
      }
    }
  )

  return window.__otpRecaptchaVerifier
}

export async function sendOtp(phoneE164) {
  const auth = getFirebaseAuth()
  const verifier = ensureRecaptcha()
  return signInWithPhoneNumber(auth, phoneE164, verifier)
}
