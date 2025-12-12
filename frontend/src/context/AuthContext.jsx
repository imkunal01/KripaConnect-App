import { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { login as apiLogin, signup as apiSignup, logout as apiLogout, refresh as apiRefresh, profile as apiProfile } from '../services/auth'

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

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshTimer = useRef(null)
  const initialized = useRef(false)

  async function scheduleRefresh(accessToken) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    // Access tokens expire in ~15m; refresh a bit earlier
    const fifteenMinutes = 15 * 60 * 1000
    refreshTimer.current = setTimeout(refreshAccess, Math.max(1, fifteenMinutes - 60 * 1000))
    const payload = parseJwt(accessToken)
    if (payload) setRole(payload.role)
  }

  async function refreshAccess() {
    const res = await apiRefresh().catch(() => null)
    const accessToken = res?.data?.token
    if (accessToken) {
      setToken(accessToken)
      scheduleRefresh(accessToken)
      const meRes = await apiProfile(accessToken)
      setUser(meRes?.data || null)
      return true
    }
    setToken(null)
    setUser(null)
    setRole(null)
    return false
  }

  async function signIn({ email, password }) {
    const res = await apiLogin({ email, password })
    const payload = res?.data || {}
    setToken(payload.token)
    setUser({ _id: payload._id, name: payload.name, email: payload.email, role: payload.role })
    setRole(payload.role)
    await scheduleRefresh(payload.token)
    return payload
  }

  async function signUp({ name, email, password, role }) {
    const res = await apiSignup({ name, email, password, role })
    const payload = res?.data || {}
    setToken(payload.token)
    setUser({ _id: payload._id, name: payload.name, email: payload.email, role: payload.role })
    setRole(payload.role)
    await scheduleRefresh(payload.token)
    return payload
  }

  async function signOut() {
    await apiLogout().catch(() => {})
    setToken(null)
    setUser(null)
    setRole(null)
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    refreshAccess().finally(() => setLoading(false))
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current) }
  }, [])

  const value = useMemo(() => ({ token, user, role, loading, signIn, signUp, signOut }), [token, user, role, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export default AuthContext
