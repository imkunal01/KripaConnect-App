import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Footer.css'

export default function Footer() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }))

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="arch-footer">
      {/* Top Row: Brand & Newsletter */}
      <div className="arch-grid-row top-row">
        <div className="arch-cell brand-cell">
          <h2 className="arch-logo">BizLink®</h2>
          <span className="tech-font">EST. 2024 — SYSTEM_V.0.9</span>
        </div>
        
        <div className="arch-cell newsletter-cell">
          <label className="tech-font">NEWSLETTER_LINK</label>
          <div className="minimal-input-wrapper">
            <input type="email" placeholder="Enter coordinates..." />
            <button className="btn-arrow">→</button>
          </div>
        </div>
      </div>

      {/* Middle Row: Links & Socials */}
      <div className="arch-grid-row links-row">
        {/* Col 1 */}
        <div className="arch-cell">
          <span className="cell-header">DIRECTORY</span>
          <nav className="arch-nav">
            <Link to="/products">01. Products</Link>
            <Link to="/new">02. New Arrivals</Link>
            <Link to="/deals">03. Restocks</Link>
            <Link to="/about">04. About</Link>
          </nav>
        </div>

        {/* Col 2 */}
        <div className="arch-cell">
          <span className="cell-header">LEGAL_DOCS</span>
          <nav className="arch-nav">
            <Link to="/privacy">Privacy Pol.</Link>
            <Link to="/terms">Terms of Use</Link>
            <Link to="/returns">Return Ref.</Link>
          </nav>
        </div>

        {/* Col 3: Socials (New) */}
        <div className="arch-cell">
          <span className="cell-header">NETWORK_NODES</span>
          <div className="social-stack">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-link">
              <svg className="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              <span>INSTAGRAM</span>
              <span className="arrow-diag">↗</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-link">
              <svg className="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
              <span>X / TWITTER</span>
              <span className="arrow-diag">↗</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-link">
              <svg className="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              <span>LINKEDIN</span>
              <span className="arrow-diag">↗</span>
            </a>
          </div>
        </div>

        {/* Col 4: Interactive Scroll */}
        <div className="arch-cell interactive-cell" onClick={scrollToTop}>
          <span className="cell-header">FUNCTION</span>
          <div className="up-arrow-container">
            <span className="tech-font">RETURN_TOP</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          </div>
        </div>
      </div>

      {/* Bottom Row: Status */}
      <div className="arch-grid-row bottom-row">
        <div className="arch-cell tech-data">
          <span className="dot online"></span>
          <span className="tech-font">SERVER: STABLE</span>
        </div>
        <div className="arch-cell tech-data center-data">
          <span className="tech-font">T: {time}</span>
        </div>
        <div className="arch-cell tech-data right-data">
          <span className="tech-font">SECURE_AES_256</span>
        </div>
      </div>
    </footer>
  )
}