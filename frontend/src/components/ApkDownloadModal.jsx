import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../assets/newLogo3.png'
import toast from 'react-hot-toast'
import './ApkDownloadModal.css'

import {
  LuDownload,
  LuX,
  LuShieldCheck,
  LuZap,
  LuBell,
  LuExternalLink,
  LuCheck
} from 'react-icons/lu'
import { FaAndroid } from 'react-icons/fa'

const DISMISS_KEY = 'kc_apk_popup_dismissed_until'
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export default function ApkDownloadModal() {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback((persistDismissal = true) => {
    setIsOpen(false)
    if (persistDismissal) {
      const expiry = Date.now() + DISMISS_DURATION_MS
      try {
        localStorage.setItem(DISMISS_KEY, expiry.toString())
      } catch {
        // Ignore localStorage error in private browsing
      }
    }
  }, [])

  useEffect(() => {
    // Expose global helper for triggering anywhere
    window.openApkModal = () => {
      openModal()
    }

    const handleCustomOpen = () => {
      openModal()
    }
    window.addEventListener('open-apk-modal', handleCustomOpen)

    // Check auto-open eligibility
    let isDismissed = false
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY)
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        isDismissed = true
      }
    } catch {
      isDismissed = false
    }

    // Auto trigger after a pleasant delay if not recently dismissed
    let timerId
    if (!isDismissed) {
      timerId = setTimeout(() => {
        // Only open if not already on the dedicated /download page
        if (!window.location.pathname.startsWith('/download')) {
          setIsOpen(true)
        }
      }, 3000)
    }

    return () => {
      window.removeEventListener('open-apk-modal', handleCustomOpen)
      if (timerId) clearTimeout(timerId)
    }
  }, [openModal])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeModal])

  const handleDirectDownload = () => {
    toast.success('Downloading KripaConnect APK (v3.0)...', {
      icon: '🚀',
      duration: 3500
    })
    closeModal(true)
  }

  if (!isOpen) return null

  return (
    <div className="apk-modal-overlay" onClick={() => closeModal(true)} role="dialog" aria-modal="true">
      <div className="apk-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Icon Button */}
        <button
          id="btn-close-apk-modal"
          type="button"
          onClick={() => closeModal(true)}
          className="apk-modal-close"
          aria-label="Close popup"
        >
          <LuX />
        </button>

        {/* Decorative Top Accent Glow */}
        <div className="apk-modal-glow" aria-hidden="true" />

        {/* Modal Header */}
        <div className="apk-modal-header">
          <div className="apk-modal-badge">
            <FaAndroid className="android-green-icon" />
            <span>Android App • v3.0</span>
          </div>

          <div className="apk-modal-app-info">
            <div className="apk-app-icon-wrapper">
              <img src={Logo} alt="KripaConnect" className="apk-app-logo" />
              <div className="apk-pulse-indicator" />
            </div>
            <div className="apk-app-titles">
              <h3 className="apk-modal-title">Get KripaConnect App</h3>
              <p className="apk-modal-subtitle">Official Android APK (v3.0 Release)</p>
            </div>
          </div>
        </div>

        {/* Specs Pill Bar */}
        <div className="apk-modal-specs">
          <span className="spec-tag">⚡ 1.8 MB Ultra-light</span>
          <span className="spec-tag">📱 Android 8.0+</span>
          <span className="spec-tag safe-tag">
            <LuShieldCheck /> Play Protect Safe
          </span>
        </div>

        {/* Feature Highlights */}
        <div className="apk-modal-benefits">
          <div className="benefit-item">
            <div className="benefit-icon red">
              <LuZap />
            </div>
            <div className="benefit-text">
              <strong>10-15 Min Express Delivery</strong>
              <span>Instant local hub dispatch with real-time GPS tracking.</span>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon blue">
              <LuBell />
            </div>
            <div className="benefit-text">
              <strong>Live Alerts & Wholesale Deals</strong>
              <span>Instant push notifications on flash sales & B2B discounts.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="apk-modal-actions">
          <a
            id="btn-apk-modal-download"
            href="/kripaconnect.apk"
            download="KripaConnect.apk"
            onClick={handleDirectDownload}
            className="apk-btn-primary"
          >
            <LuDownload />
            <span>Download APK (1.8 MB)</span>
          </a>

          <Link
            to="/download"
            onClick={() => closeModal(false)}
            className="apk-btn-secondary"
          >
            <span>Installation Guide & QR</span>
            <LuExternalLink />
          </Link>
        </div>

        {/* Footer note */}
        <div className="apk-modal-footer">
          <button
            type="button"
            onClick={() => closeModal(true)}
            className="apk-btn-dismiss"
          >
            Maybe Later
          </button>
          <span className="apk-trust-text">
            <LuShieldCheck /> 100% Genuine & Malware-free
          </span>
        </div>
      </div>
    </div>
  )
}
