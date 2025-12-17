import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

let toastIdCounter = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((type, message, options = {}) => {
    const id = toastIdCounter++
    const duration = options.duration ?? 3000
    setToasts((prev) => [...prev, { id, type, message }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
    return id
  }, [removeToast])

  const value = useMemo(() => ({
    show,
    success: (msg, opts) => show('success', msg, opts),
    error: (msg, opts) => show('error', msg, opts),
    info: (msg, opts) => show('info', msg, opts),
  }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: '320px',
      }}>
        {toasts.map((toast) => {
          const colors = toast.type === 'success'
            ? { bg: '#ecfdf3', border: '#22c55e', text: '#166534' }
            : toast.type === 'error'
              ? { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' }
              : { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' }
          return (
            <div
              key={toast.id}
              style={{
                backgroundColor: colors.bg,
                borderLeft: `4px solid ${colors.border}`,
                color: colors.text,
                padding: '8px 12px',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                fontSize: 14,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <span style={{ marginTop: 2 }}>
                {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ'}
              </span>
              <div style={{ flex: 1 }}>{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: colors.text,
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: 4,
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}


