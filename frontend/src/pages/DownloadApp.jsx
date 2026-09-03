import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import Logo from '../assets/newLogo3.png'
import toast from 'react-hot-toast'
import './DownloadApp.css'

import {
  LuDownload,
  LuShieldCheck,
  LuZap,
  LuBell,
  LuLayers,
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuSmartphone,
  LuShare2,
  LuCpu,
  LuLock,
  LuFileCheck,
  LuExternalLink
} from 'react-icons/lu'
import { FaAndroid, FaGooglePlay } from 'react-icons/fa'

export default function DownloadApp() {
  const [downloadCount, setDownloadCount] = useState(12840)
  const [activeFaq, setActiveFaq] = useState(null)
  const [copied, setCopied] = useState(false)

  const apkUrl = `${window.location.origin}/kripaconnect.apk`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    apkUrl
  )}&bgcolor=ffffff&color=111827&margin=2`

  const handleDownload = () => {
    setDownloadCount(prev => prev + 1)
    toast.success('Starting APK download...', {
      icon: '⬇️',
      duration: 3500
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Download KripaConnect Android App',
          text: 'Get KripaConnect on Android for 10-15 min electronics delivery & wholesale pricing!',
          url: window.location.href
        })
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Download page link copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const faqs = [
    {
      q: 'Why does Android show "File might be harmful" warning when downloading?',
      a: 'This is standard security behavior on Android for any application downloaded directly from a web browser instead of the Google Play Store. KripaConnect APK is fully signed, 100% genuine, malware-free, and safe for your device. Simply tap "Download anyway" to proceed.'
    },
    {
      q: 'How do I install the APK after downloading?',
      a: 'Once the download finishes, tap the notification or open your device’s "Downloads" folder. Tap on "kripaconnect.apk". If prompted, enable "Allow from this source" in your settings, then tap "Install". The app will be ready in seconds.'
    },
    {
      q: 'Will my existing cart, addresses, and orders sync in the app?',
      a: 'Yes! Simply sign in with your existing KripaConnect mobile number or Google account. All your order history, active carts, saved addresses, and B2B wholesale verified tier sync seamlessly in real time.'
    },
    {
      q: 'What are the minimum device requirements?',
      a: 'The KripaConnect app requires Android 8.0 (Oreo) or higher. Because the package is ultra-lightweight (~1.8 MB), it consumes negligible storage and runs smoothly even on entry-level smartphones.'
    },
    {
      q: 'How do I get future updates for the app?',
      a: 'The KripaConnect app includes automated in-app update checks. Whenever a new feature or release is launched, you will receive an in-app prompt to update seamlessly without losing your data.'
    }
  ]

  return (
    <div className="download-page-wrapper">
      <SEO
        title="Download KripaConnect Android App (Official APK) | Express Electronics"
        description="Download the official KripaConnect Android App (v3.0 APK). Enjoy 10-15 min express delivery on electronics, B2B wholesale prices, live order tracking, and instant alerts."
      />
      <Navbar />

      <main className="download-main-container">
        {/* Background Ambient Glows */}
        <div className="download-ambient-glow glow-1" aria-hidden="true" />
        <div className="download-ambient-glow glow-2" aria-hidden="true" />

        {/* HERO SECTION */}
        <section className="download-hero-section">
          <div className="download-hero-content">
            <div className="download-badge-chip">
              <span className="badge-pulse-dot" />
              <FaAndroid className="badge-android-icon" />
              <span>Official Android Release v3.0</span>
            </div>

            <h1 className="download-hero-title">
              Power Your Electronics Shopping With The{' '}
              <span className="text-gradient-red">KripaConnect App</span>
            </h1>

            <p className="download-hero-subtitle">
              Instant 10-15 minute delivery, live GPS tracking, exclusive wholesale B2B pricing,
              and seamless one-tap checkout — packaged into an ultra-light <strong>1.8 MB</strong> app.
            </p>

            {/* Quick Specs Pill Strip */}
            <div className="download-specs-bar">
              <div className="spec-pill">
                <span className="spec-label">Version</span>
                <strong className="spec-value">3.0 (Latest)</strong>
              </div>
              <div className="spec-divider" />
              <div className="spec-pill">
                <span className="spec-label">Size</span>
                <strong className="spec-value">~1.8 MB</strong>
              </div>
              <div className="spec-divider" />
              <div className="spec-pill">
                <span className="spec-label">Platform</span>
                <strong className="spec-value">Android 8.0+</strong>
              </div>
              <div className="spec-divider" />
              <div className="spec-pill">
                <span className="spec-label">Security</span>
                <strong className="spec-value text-emerald">
                  <LuShieldCheck /> Play Protect Safe
                </strong>
              </div>
            </div>

            {/* Actions */}
            <div className="download-cta-group">
              <a
                id="btn-download-apk-hero"
                href="/kripaconnect.apk"
                download="KripaConnect.apk"
                onClick={handleDownload}
                className="btn-download-primary"
              >
                <div className="btn-icon-circle">
                  <LuDownload />
                </div>
                <div className="btn-text-content">
                  <span className="btn-subtext">Direct Download</span>
                  <span className="btn-maintext">Download APK (1.8 MB)</span>
                </div>
              </a>

              <button
                id="btn-share-app"
                type="button"
                onClick={handleShare}
                className="btn-share-secondary"
                aria-label="Share App Link"
              >
                {copied ? <LuCheck /> : <LuShare2 />}
                <span>{copied ? 'Link Copied' : 'Share App'}</span>
              </button>
            </div>

            <div className="download-trust-notes">
              <div className="trust-note-item">
                <LuLock className="trust-icon" />
                <span>SSL Encrypted & Genuine Build</span>
              </div>
              <div className="trust-note-item">
                <LuFileCheck className="trust-icon" />
                <span>No Third-Party Bloatware</span>
              </div>
              <div className="trust-note-item">
                <FaAndroid className="trust-icon" />
                <span>Over {downloadCount.toLocaleString()}+ Downloads</span>
              </div>
            </div>
          </div>

          {/* HERO RIGHT: Interactive Phone Showcase & Desktop QR */}
          <div className="download-hero-visual">
            <div className="phone-mockup-wrapper">
              <div className="phone-frame">
                <div className="phone-notch">
                  <div className="phone-speaker" />
                  <div className="phone-camera" />
                </div>
                <div className="phone-screen">
                  {/* Status Bar */}
                  <div className="screen-statusbar">
                    <span>9:41</span>
                    <div className="screen-status-icons">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* App Mini Header */}
                  <div className="mini-app-header">
                    <img src={Logo} alt="KripaConnect" className="mini-app-logo" />
                    <span className="mini-app-badge">10 MIN DELIVERY</span>
                  </div>

                  {/* Mini Banner */}
                  <div className="mini-app-banner">
                    <span className="mini-banner-tag">⚡ MEGA ELECTRONICS SALE</span>
                    <h4>Up to 40% OFF Smart TVs & BLDC Fans</h4>
                  </div>

                  {/* Mini Product Cards */}
                  <div className="mini-app-feed">
                    <div className="mini-product-card">
                      <div className="mini-p-icon">⚡</div>
                      <div className="mini-p-info">
                        <strong>Smart BLDC Ceiling Fan</strong>
                        <span>₹2,499 • Dispatched in 10m</span>
                      </div>
                      <span className="mini-p-btn">Add</span>
                    </div>

                    <div className="mini-product-card">
                      <div className="mini-p-icon">📺</div>
                      <div className="mini-p-info">
                        <strong>43" 4K UHD Smart TV</strong>
                        <span>₹18,990 • Genuine Warranty</span>
                      </div>
                      <span className="mini-p-btn">Add</span>
                    </div>
                  </div>

                  {/* Live Tracking Floating Pill */}
                  <div className="mini-floating-tracker">
                    <div className="tracker-pulsing-dot" />
                    <div className="tracker-text">
                      <strong>Order #KC-8924 Out For Delivery</strong>
                      <span>Rider arriving in 7 mins</span>
                    </div>
                  </div>

                  {/* Mini Bottom Nav */}
                  <div className="mini-app-dock">
                    <span className="mini-dock-item active">Home</span>
                    <span className="mini-dock-item">Categories</span>
                    <span className="mini-dock-item">Cart</span>
                    <span className="mini-dock-item">Account</span>
                  </div>
                </div>
              </div>

              {/* QR Code Floating Card for Desktop Users */}
              <div className="qr-code-floating-card">
                <div className="qr-card-header">
                  <LuSmartphone className="qr-phone-icon" />
                  <div>
                    <strong>Scan to Download</strong>
                    <p>Point phone camera to install</p>
                  </div>
                </div>
                <div className="qr-image-box">
                  <img
                    src={qrCodeUrl}
                    alt="Scan QR code to download KripaConnect APK"
                    className="qr-image"
                    width="140"
                    height="140"
                    loading="lazy"
                  />
                </div>
                <span className="qr-card-footer">Direct APK link</span>
              </div>
            </div>
          </div>
        </section>

        {/* WHY THE APP SECTION */}
        <section className="download-features-section">
          <div className="section-header-centered">
            <span className="section-kicker">WHY INSTALL THE APP?</span>
            <h2 className="section-heading">Built for Maximum Speed & Unbeatable Convenience</h2>
            <p className="section-description">
              Experience electronics shopping tailored specifically for high performance on Android devices.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper bg-red-gradient">
                <LuZap />
              </div>
              <h3>Ultra-Fast 10-15 Min Delivery</h3>
              <p>
                Get urgent electrical spares, fans, cables, and home appliances dispatched from the nearest local hub straight to your doorstep.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper bg-blue-gradient">
                <LuBell />
              </div>
              <h3>Live Real-Time Order Alerts</h3>
              <p>
                Stay updated every second with push notifications as your order is packed, dispatched, and delivered by our riders.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper bg-emerald-gradient">
                <LuLayers />
              </div>
              <h3>Exclusive Wholesale & B2B Hub</h3>
              <p>
                Instant access to bulk distributor tiers, tax invoice downloads with full GST input credit, and multi-quantity discounts.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper bg-purple-gradient">
                <LuCpu />
              </div>
              <h3>Lightweight & Battery Optimized</h3>
              <p>
                At less than 2 MB, the app consumes virtually no phone memory, uses minimal background battery, and loads instantly.
              </p>
            </div>
          </div>
        </section>

        {/* 4-STEP INSTALLATION GUIDE */}
        <section className="download-guide-section" id="installation-guide">
          <div className="section-header-centered">
            <span className="section-kicker">SIMPLE 4-STEP SETUP</span>
            <h2 className="section-heading">How to Install KripaConnect APK on Android</h2>
            <p className="section-description">
              Follow these simple steps to install the app directly on your Android phone in under 60 seconds.
            </p>
          </div>

          <div className="guide-steps-grid">
            <div className="guide-step-card">
              <div className="step-number-badge">01</div>
              <div className="step-icon-box">
                <LuDownload />
              </div>
              <h4>Download APK</h4>
              <p>
                Tap the <strong>Download APK</strong> button above. If prompted with “File might be harmful”, tap <strong>Download anyway</strong>.
              </p>
            </div>

            <div className="guide-step-card">
              <div className="step-number-badge">02</div>
              <div className="step-icon-box">
                <LuSmartphone />
              </div>
              <h4>Open Download</h4>
              <p>
                Once finished, tap the download complete notification or navigate to your phone’s <strong>Files / Downloads</strong> folder.
              </p>
            </div>

            <div className="guide-step-card">
              <div className="step-number-badge">03</div>
              <div className="step-icon-box">
                <LuShieldCheck />
              </div>
              <h4>Allow Unknown Sources</h4>
              <p>
                If Android requests permission, tap <strong>Settings</strong> and toggle on <strong>"Allow from this source"</strong> for your browser.
              </p>
            </div>

            <div className="guide-step-card">
              <div className="step-number-badge">04</div>
              <div className="step-icon-box">
                <LuCheck />
              </div>
              <h4>Tap Install & Enjoy</h4>
              <p>
                Press <strong>Install</strong>. Once complete, tap <strong>Open</strong> to start shopping with express 10-15 minute delivery!
              </p>
            </div>
          </div>

          {/* Quick Action in guide */}
          <div className="guide-action-box">
            <div className="guide-action-text">
              <strong>Ready to upgrade your shopping experience?</strong>
              <span>Download the latest verified build v3.0 now.</span>
            </div>
            <a
              id="btn-download-apk-guide"
              href="/kripaconnect.apk"
              download="KripaConnect.apk"
              onClick={handleDownload}
              className="btn-download-primary small"
            >
              <LuDownload />
              <span>Download APK (1.8 MB)</span>
            </a>
          </div>
        </section>

        {/* SECURITY & TRUST VERIFICATION */}
        <section className="download-security-section">
          <div className="security-card">
            <div className="security-icon">
              <LuShieldCheck />
            </div>
            <div className="security-text">
              <h3>100% Safe, Signed & Verified Package</h3>
              <p>
                Our release build is cryptographically signed with our verified release keystore (`app.vercel.kripa_connect_app.twa`).
                It is tested against Google Play Protect and contains no adware, tracking bloat, or invasive background services.
              </p>
            </div>
            <div className="security-meta">
              <div className="security-badge-item">
                <strong>Package ID</strong>
                <span>app.vercel.kripa_connect_app.twa</span>
              </div>
              <div className="security-badge-item">
                <strong>Target SDK</strong>
                <span>Android 14 (API 34)</span>
              </div>
              <div className="security-badge-item">
                <strong>Status</strong>
                <span className="text-emerald">Verified Release</span>
              </div>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="download-faq-section">
          <div className="section-header-centered">
            <span className="section-kicker">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="section-heading">Got Questions About the APK?</h2>
          </div>

          <div className="faq-accordion-list">
            {faqs.map((item, index) => {
              const isOpen = activeFaq === index
              return (
                <div
                  key={index}
                  className={`faq-item-card ${isOpen ? 'active' : ''}`}
                  onClick={() => toggleFaq(index)}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    {isOpen ? <LuChevronUp className="faq-chevron" /> : <LuChevronDown className="faq-chevron" />}
                  </button>
                  {isOpen && (
                    <div className="faq-answer-content">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* BOTTOM FINAL BANNER */}
        <section className="download-bottom-banner">
          <div className="bottom-banner-card">
            <div className="bottom-banner-glow" />
            <div className="bottom-banner-content">
              <h2>Install KripaConnect on Your Phone Today</h2>
              <p>Join thousands of happy customers who get electronics delivered in 10-15 minutes.</p>
              <div className="bottom-banner-actions">
                <a
                  id="btn-download-apk-footer"
                  href="/kripaconnect.apk"
                  download="KripaConnect.apk"
                  onClick={handleDownload}
                  className="btn-download-primary"
                >
                  <LuDownload />
                  <span>Download Free APK (1.8 MB)</span>
                </a>
                <Link to="/" className="btn-explore-web">
                  Continue Browsing Online
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
