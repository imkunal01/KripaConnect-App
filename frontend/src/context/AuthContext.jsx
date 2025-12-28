import { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { login as apiLogin, signup as apiSignup, logout as apiLogout, refresh as apiRefresh, profile as apiProfile, googleLogin as apiGoogleLogin, phoneFirebaseLogin as apiPhoneFirebaseLogin } from '../services/auth'

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

const AuthContext = createContext(null)

const STORAGE_KEY = 'auth'

function loadStoredAuth() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveStoredAuth(auth) {
  if (typeof window === 'undefined') return
  try {
    if (!auth || !auth.token) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    }
  } catch {
    // ignore storage errors (Safari private mode, etc.)
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshTimer = useRef(null)
  const initialized = useRef(false)

  async function refreshMe(accessToken = token) {
    if (!accessToken) return null
    if (accessToken !== token) {
      setToken(accessToken)
      await scheduleRefresh(accessToken)
    }

    const meRes = await apiProfile(accessToken)
    const me = meRes?.data || null
    setUser(me)
    const storedRole = parseJwt(accessToken)?.role || role || null
    setRole(storedRole)
    saveStoredAuth({ token: accessToken, user: me, role: storedRole })
    return me
  }

  async function scheduleRefresh(accessToken) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    
    const payload = parseJwt(accessToken)
    if (!payload) return

    setRole(payload.role)
    
    // Check expiry
    const exp = payload.exp ? payload.exp * 1000 : Date.now() + 15 * 60 * 1000
    const now = Date.now()
    const timeLeft = exp - now
    
    // Refresh 1 minute before expiry, or immediately if close
    const delay = Math.max(1000, timeLeft - 60 * 1000)
    
    console.log(`[Auth] Token check: Expires in ${Math.round(timeLeft/1000)}s. Next refresh in ${Math.round(delay/1000)}s`)
    refreshTimer.current = setTimeout(refreshAccess, delay)
  }

  async function refreshAccess() {
    // catch network errors
    const res = await apiRefresh().catch((err) => {
      console.error("Token refresh network error:", err)
      return null
    })

    // 1. Success case
    const accessToken = res?.data?.token
    if (accessToken) {
      setToken(accessToken)
      scheduleRefresh(accessToken)
      const meRes = await apiProfile(accessToken)
      setUser(meRes?.data || null)
      const storedRole = parseJwt(accessToken)?.role || null
      setRole(storedRole)
      saveStoredAuth({
        token: accessToken,
        user: meRes?.data || null,
        role: storedRole,
      })
      return true
    }

    // 2. Failure cases
    // If res is null (network error) or status is 5xx, we might want to preserve the local session
    // if it's still valid (e.g. not expired).
    // However, if status is 401/403, it means the refresh token is invalid/expired -> Logout.
    
    if (res && (res.status === 401 || res.status === 403)) {
      console.log("Session expired or invalid, logging out.")
      setToken(null)
      setUser(null)
      setRole(null)
      saveStoredAuth(null)
      return false
    }

    // For other errors (network, 500), we keep the current state (from localStorage)
    // assuming the access token might still be valid.
    console.warn("Token refresh failed but not strictly unauthorized. Keeping local session if exists.", res?.status)
    return false
  }

  async function signIn({ email, password }) {
    const res = await apiLogin({ email, password })
    const payload = res?.data || {}
    setToken(payload.token)
    setUser({ _id: payload._id, name: payload.name, email: payload.email, role: payload.role, savedAddresses: payload.savedAddresses })
    setRole(payload.role)
    await scheduleRefresh(payload.token)
    saveStoredAuth({
      token: payload.token,
      user: { _id: payload._id, name: payload.name, email: payload.email, role: payload.role, savedAddresses: payload.savedAddresses },
      role: payload.role,
    })

    // Immediately hydrate full profile (includes phone + savedAddresses)
    await refreshMe(payload.token).catch(() => {})
    return payload
  }

  async function signUp({ name, email, password, role }) {
    const res = await apiSignup({ name, email, password, role })
    const payload = res?.data || {}
    setToken(payload.token)
    setUser({ _id: payload._id, name: payload.name, email: payload.email, role: payload.role, savedAddresses: payload.savedAddresses })
    setRole(payload.role)
    await scheduleRefresh(payload.token)
    saveStoredAuth({
      token: payload.token,
      user: { _id: payload._id, name: payload.name, email: payload.email, role: payload.role, savedAddresses: payload.savedAddresses },
      role: payload.role,
    })

    await refreshMe(payload.token).catch(() => {})
    return payload
  }

  async function googleSignIn(credential, accessToken, role) {
    const res = await apiGoogleLogin(credential, accessToken, role)
    const payload = res?.data || {}
    setToken(payload.token)
    setUser({ _id: payload._id, name: payload.name, email: payload.email, role: payload.role, savedAddresses: payload.savedAddresses })
    setRole(payload.role)
    await scheduleRefresh(payload.token)
    saveStoredAuth({
      token: payload.token,
      user: { _id: payload._id, name: payload.name, email: payload.email, role: payload.role, savedAddresses: payload.savedAddresses },
      role: payload.role,
    })

    await refreshMe(payload.token).catch(() => {})
    return payload
  }

  async function phoneOtpSignIn(firebaseIdToken) {
    const res = await apiPhoneFirebaseLogin(firebaseIdToken)
    const payload = res?.data || {}

    setToken(payload.token)
    setUser({ _id: payload._id, name: payload.name, email: payload.email, role: payload.role, savedAddresses: payload.savedAddresses })
    setRole(payload.role)
    await scheduleRefresh(payload.token)
    saveStoredAuth({
      token: payload.token,
      user: { _id: payload._id, name: payload.name, email: payload.email, role: payload.role, savedAddresses: payload.savedAddresses },
      role: payload.role,
    })

    await refreshMe(payload.token).catch(() => {})
    return payload
  }

  async function signOut() {
    await apiLogout().catch(() => {})
    setToken(null)
    setUser(null)
    setRole(null)
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
     saveStoredAuth(null)
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    // 1) Synchronously hydrate from localStorage so deep links don't
    //    immediately redirect on hard refresh.
    const stored = loadStoredAuth()
    if (stored?.token) {
      setToken(stored.token)
      setUser(stored.user || null)
      setRole(stored.role || null)
      scheduleRefresh(stored.token)
    }

    // 2) Then validate/refresh token from backend.
    //    Until this finishes, `loading` stays true and ProtectedRoute
    //    will show a loading screen instead of redirecting.
    refreshAccess().finally(() => setLoading(false))
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current) }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null)
      setUser(null)
      setRole(null)
      saveStoredAuth(null)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const value = useMemo(() => ({ token, user, role, loading, signIn, signUp, signOut, googleSignIn, phoneOtpSignIn, refreshMe }), [token, user, role, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export default AuthContext
