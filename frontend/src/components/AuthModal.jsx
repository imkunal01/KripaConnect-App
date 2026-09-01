import { useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import AuthCard from './AuthCard.jsx'
import './AuthModal.css'

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, authModalOptions, closeAuthModal } = useAuth()

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      closeAuthModal()
    }
  }, [closeAuthModal])

  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAuthModalOpen, handleKeyDown])

  if (!isAuthModalOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Close Button */}
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Close authentication window"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <AuthCard
          isModal={true}
          initialMode={authModalMode || 'login'}
          initialRole={authModalOptions?.role || 'customer'}
          onSuccess={authModalOptions?.onSuccess}
          onClose={closeAuthModal}
          redirectUrl={authModalOptions?.redirectUrl}
          title={authModalOptions?.title}
          description={authModalOptions?.description}
        />
      </div>
    </div>
  )
}
