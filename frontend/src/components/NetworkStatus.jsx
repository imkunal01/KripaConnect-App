import { useEffect, useRef, useState } from 'react'

const OFFLINE_EVENT = 'network:offline-request'
const RETRY_EVENT = 'network:retrying-requests'

function getInitialOnline() {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine !== false
}

export default function NetworkStatus() {
  const [online, setOnline] = useState(getInitialOnline)
  const [retrying, setRetrying] = useState(false)
  const [showRestored, setShowRestored] = useState(false)
  const restoreTimer = useRef(null)

  useEffect(() => {
    function clearRestoreTimer() {
      if (restoreTimer.current) clearTimeout(restoreTimer.current)
      restoreTimer.current = null
    }

    function handleOffline() {
      clearRestoreTimer()
      setOnline(false)
      setRetrying(false)
      setShowRestored(false)
    }

    function handleOnline() {
      setOnline(true)
      setRetrying(true)
      setShowRestored(true)
      clearRestoreTimer()
      restoreTimer.current = setTimeout(() => {
        setRetrying(false)
        setShowRestored(false)
      }, 3500)
    }

    function handleOfflineRequest() {
      setOnline(false)
      setRetrying(false)
      setShowRestored(false)
    }

    function handleRetrying() {
      setOnline(true)
      setRetrying(true)
      setShowRestored(true)
      clearRestoreTimer()
      restoreTimer.current = setTimeout(() => {
        setRetrying(false)
        setShowRestored(false)
      }, 3500)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    window.addEventListener(OFFLINE_EVENT, handleOfflineRequest)
    window.addEventListener(RETRY_EVENT, handleRetrying)

    return () => {
      clearRestoreTimer()
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener(OFFLINE_EVENT, handleOfflineRequest)
      window.removeEventListener(RETRY_EVENT, handleRetrying)
    }
  }, [])

  if (online && !showRestored) return null

  return (
    <div
      className={`network-banner ${online ? 'network-banner--online' : 'network-banner--offline'}`}
      role="status"
      aria-live="polite"
    >
      <div className="network-banner__dot" aria-hidden="true" />
      <div>
        <div className="network-banner__title">
          {online ? 'Back online' : 'No internet connection'}
        </div>
        <div className="network-banner__text">
          {online
            ? retrying
              ? 'Loading anything that could not load while offline.'
              : 'Connection restored.'
            : 'We will keep the page open and load pending data when you reconnect.'}
        </div>
      </div>
    </div>
  )
}
