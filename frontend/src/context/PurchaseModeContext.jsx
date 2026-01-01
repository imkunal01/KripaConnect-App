import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import AuthContext from './AuthContext.jsx'

const PurchaseModeContext = createContext(null)

const STORAGE_KEY = 'kc_purchase_mode'

function normalizeMode(value) {
  return value === 'retailer' ? 'retailer' : 'customer'
}

function loadStoredMode() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeMode(raw)
  } catch {
    return null
  }
}

function saveStoredMode(mode) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, normalizeMode(mode))
  } catch {
    // ignore storage errors
  }
}

export function PurchaseModeProvider({ children }) {
  const { token, role } = useContext(AuthContext)

  const [mode, setModeState] = useState(() => loadStoredMode() || 'customer')
  const syncTimer = useRef(null)

  // Enforce defaults based on auth/role (Phase 1: no side effects beyond mode state)
  useEffect(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current)

    syncTimer.current = setTimeout(() => {
      if (!token) {
        setModeState('customer')
        return
      }

      if (role !== 'retailer') {
        setModeState('customer')
        return
      }

      const stored = loadStoredMode()
      setModeState(stored || 'customer')
    }, 0)

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
    }
  }, [token, role])

  // Persist only for retailers
  useEffect(() => {
    if (role === 'retailer') saveStoredMode(mode)
  }, [mode, role])

  // Expose mode to CSS (visual-only)
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.purchaseMode = mode
  }, [mode])

  const setMode = useCallback(
    (nextMode) => {
      if (role !== 'retailer') return
      setModeState(normalizeMode(nextMode))
    },
    [role]
  )

  const value = useMemo(
    () => ({
      mode,
      setMode,
      canSwitchMode: role === 'retailer',
    }),
    [mode, setMode, role]
  )

  return <PurchaseModeContext.Provider value={value}>{children}</PurchaseModeContext.Provider>
}

export default PurchaseModeContext
