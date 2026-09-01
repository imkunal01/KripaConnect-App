import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiHeadphones,
  FiMail,
  FiArrowRight,
  FiCheckCircle,
  FiPhone,
  FiMapPin,
  FiHeart,
  FiArrowUp,
  FiPackage,
  FiCheck
} from 'react-icons/fi'
import { FaInstagram, FaLinkedin, FaTwitter, FaYoutube, FaFacebook } from 'react-icons/fa'
import toast from 'react-hot-toast'
import './Footer.css'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    setSubscribed(true)
    toast.success('Thank you for subscribing to KripaConnect exclusive deals!', { icon: '✨' })
    setEmail('')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="kc-footer">
      {/* Dynamic Theme Glow Line */}
      <div className="kc-footer__glow-line" />

      {/* Trust Highlights Section */}
      <div className="kc-footer__trust-section">
        <div className="kc-footer__container">
          <div className="kc-footer__trust-grid">
            <div className="kc-footer__trust-card">
              <div className="kc-footer__trust-icon-wrap">
                <FiTruck className="kc-footer__trust-icon" />
              </div>
              <div className="kc-footer__trust-info">
                <h4>Free Express Delivery</h4>
                <p>Lightning fast doorstep dispatch across Indore & Madhya Pradesh</p>
              </div>
            </div>

            <div className="kc-footer__trust-card">
              <div className="kc-footer__trust-icon-wrap">
                <FiShield className="kc-footer__trust-icon" />
              </div>
              <div className="kc-footer__trust-info">
                <h4>100% Genuine Brands</h4>
                <p>Direct manufacturer warranty on all electronics & appliances</p>
              </div>
            </div>

            <div className="kc-footer__trust-card">
              <div className="kc-footer__trust-icon-wrap">
                <FiRefreshCw className="kc-footer__trust-icon" />
              </div>
              <div className="kc-footer__trust-info">
                <h4>7-Day Easy Returns</h4>
                <p>Zero questions asked replacement & refund guarantee</p>
              </div>
            </div>

            <div className="kc-footer__trust-card">
              <div className="kc-footer__trust-icon-wrap">
                <FiHeadphones className="kc-footer__trust-icon" />
              </div>
              <div className="kc-footer__trust-info">
                <h4>Dedicated Support</h4>
                <p>Expert local technical assistance 7 days a week</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="kc-footer__main">
        <div className="kc-footer__container kc-footer__grid">
          {/* Brand & Newsletter Column */}
          <div className="kc-footer__col kc-footer__col--brand">
            <Link to="/" className="kc-footer__brand-logo" onClick={scrollToTop}>
              <span className="kc-footer__logo-mark">K</span>
              <span className="kc-footer__logo-text">
                Kripa<span className="kc-footer__logo-accent">Connect</span>
              </span>
            </Link>

            <p className="kc-footer__tagline">
              Your premier electronics, appliances & wholesale B2B destination. Empowering households and retailers with genuine technology at unmatched prices.
            </p>

            <div className="kc-footer__newsletter-card">
              <div className="kc-footer__newsletter-header">
                <FiMail className="kc-footer__newsletter-icon" />
                <div>
                  <strong>Get VIP Price Drop Alerts</strong>
                  <p>Subscribe for weekly flash deals and coupons</p>
                </div>
              </div>

              <form onSubmit={handleSubscribe} className="kc-footer__newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="kc-footer__newsletter-input"
                  required
                />
                <button type="submit" className="kc-footer__newsletter-btn">
                  {subscribed ? <FiCheck /> : <span>Join VIP</span>}
                </button>
              </form>
            </div>
          </div>

          {/* Quicklinks: Shop Catalog */}
          <div className="kc-footer__col">
            <h4 className="kc-footer__col-title">Shop Catalog</h4>
            <ul className="kc-footer__nav-list">
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/categories">Product Categories</Link></li>
              <li><Link to="/products?sort=-sold">Trending Best Sellers</Link></li>
              <li><Link to="/products?sort=price">Flash Deals & Offers</Link></li>
              <li><Link to="/favorites">Saved Wishlist</Link></li>
              <li><Link to="/b2b">Wholesale & B2B Portal</Link></li>
            </ul>
          </div>

          {/* Quicklinks: Customer Care */}
          <div className="kc-footer__col">
            <h4 className="kc-footer__col-title">Customer Care</h4>
            <ul className="kc-footer__nav-list">
              <li><Link to="/orders">My Orders & Tracking</Link></li>
              <li><Link to="/profile">Account Settings</Link></li>
              <li><Link to="/faq">Frequently Asked Questions</Link></li>
              <li><Link to="/contact">Contact Support</Link></li>
              <li><Link to="/returns">Returns & Refunds</Link></li>
              <li><Link to="/about">About KripaConnect</Link></li>
            </ul>
          </div>

          {/* Quicklinks: Legal & Connect */}
          <div className="kc-footer__col">
            <h4 className="kc-footer__col-title">Contact & Help</h4>
            <div className="kc-footer__contact-box">
              <div className="kc-footer__contact-item">
                <FiMapPin className="kc-footer__contact-item-icon" />
                <span>Indore, Madhya Pradesh, India</span>
              </div>
              <div className="kc-footer__contact-item">
                <FiMail className="kc-footer__contact-item-icon" />
                <a href="mailto:support@kripaconnect.in">support@kripaconnect.in</a>
              </div>
              <div className="kc-footer__contact-item">
                <FiPhone className="kc-footer__contact-item-icon" />
                <span>+91 98765 43210</span>
              </div>
            </div>

            <h5 className="kc-footer__social-heading">Follow Our Community</h5>
            <div className="kc-footer__social-rail">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="kc-footer__social-link" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="kc-footer__social-link" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="kc-footer__social-link" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="kc-footer__social-link" aria-label="YouTube">
                <FaYoutube />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="kc-footer__bottom">
        <div className="kc-footer__container kc-footer__bottom-inner">
          <div className="kc-footer__copyright">
            © {new Date().getFullYear()} <strong>KripaConnect Electronics & Appliances</strong>. All rights reserved.
          </div>

          <div className="kc-footer__payment-gateways">
            <span className="kc-pay-pill">UPI</span>
            <span className="kc-pay-pill">Visa</span>
            <span className="kc-pay-pill">Mastercard</span>
            <span className="kc-pay-pill">RuPay</span>
            <span className="kc-pay-pill">Razorpay 256-Bit SSL</span>
            <span className="kc-pay-pill">Cash on Delivery</span>
          </div>

          <button type="button" onClick={scrollToTop} className="kc-footer__back-to-top" aria-label="Scroll back to top">
            <span>Back to top</span>
            <FiArrowUp />
          </button>
        </div>
      </div>
    </footer>
  )
}
