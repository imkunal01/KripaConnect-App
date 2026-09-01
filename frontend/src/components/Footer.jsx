import React from 'react'
import { Link } from 'react-router-dom'
import {
  LuTruck,
  LuShieldCheck,
  LuRefreshCw,
  LuHeadphones,
  LuMapPin,
  LuMail,
  LuPhone,
  LuArrowUp
} from 'react-icons/lu'
import { FaInstagram, FaLinkedin, FaTwitter, FaYoutube, FaFacebook } from 'react-icons/fa'
import './Footer.css'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="kc-shot-footer">
      {/* 4 Trust Highlights Strip */}
      <div className="kc-shot-footer__trust">
        <div className="kc-shot-footer__container">
          <div className="kc-shot-footer__trust-grid">
            <div className="kc-shot-footer__trust-item">
              <div className="kc-shot-footer__trust-icon-box">
                <LuTruck />
              </div>
              <div className="kc-shot-footer__trust-text">
                <strong>10-15 Min Express Delivery</strong>
                <span>Dispatched instantly from local hub</span>
              </div>
            </div>

            <div className="kc-shot-footer__trust-item">
              <div className="kc-shot-footer__trust-icon-box">
                <LuShieldCheck />
              </div>
              <div className="kc-shot-footer__trust-text">
                <strong>100% Genuine Brand Warranty</strong>
                <span>Direct OEM sourcing & guarantee</span>
              </div>
            </div>

            <div className="kc-shot-footer__trust-item">
              <div className="kc-shot-footer__trust-icon-box">
                <LuRefreshCw />
              </div>
              <div className="kc-shot-footer__trust-text">
                <strong>7-Day Easy Replacement</strong>
                <span>Hassle-free support & returns</span>
              </div>
            </div>

            <div className="kc-shot-footer__trust-item">
              <div className="kc-shot-footer__trust-icon-box">
                <LuHeadphones />
              </div>
              <div className="kc-shot-footer__trust-text">
                <strong>Dedicated Support Desk</strong>
                <span>Help via call & WhatsApp 7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Screenshot 1 Replica */}
      <div className="kc-shot-footer__main">
        <div className="kc-shot-footer__container kc-shot-footer__grid">

          {/* Column 1: SHOP CATALOG */}
          <div className="kc-shot-footer__col">
            <h4 className="kc-shot-footer__heading">
              <span>SHOP CATALOG</span>
              <span className="kc-shot-footer__red-bar" />
            </h4>
            <ul className="kc-shot-footer__links">
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/categories">Product Categories</Link></li>
              <li><Link to="/products?sort=-sold">Trending Best Sellers</Link></li>
              <li><Link to="/products?sort=price">Flash Deals & Offers</Link></li>
              <li><Link to="/favorites">Saved Wishlist</Link></li>
              <li><Link to="/b2b">Wholesale & B2B Portal</Link></li>
            </ul>
          </div>

          {/* Column 2: CUSTOMER CARE */}
          <div className="kc-shot-footer__col">
            <h4 className="kc-shot-footer__heading">
              <span>CUSTOMER CARE</span>
              <span className="kc-shot-footer__red-bar" />
            </h4>
            <ul className="kc-shot-footer__links">
              <li><Link to="/orders">My Orders & Tracking</Link></li>
              <li><Link to="/profile">Account Settings</Link></li>
              <li><Link to="/faq">Frequently Asked Questions</Link></li>
              <li><Link to="/contact">Contact Support</Link></li>
              <li><Link to="/returns">Returns & Refunds</Link></li>
              <li><Link to="/about">About KripaConnect</Link></li>
            </ul>
          </div>

          {/* Column 3: CONTACT & HELP */}
          <div className="kc-shot-footer__col">
            <h4 className="kc-shot-footer__heading">
              <span>CONTACT & HELP</span>
              <span className="kc-shot-footer__red-bar" />
            </h4>
            <div className="kc-shot-footer__contact-list">
              <div className="kc-shot-footer__contact-row">
                <LuMapPin className="kc-shot-footer__contact-ico" />
                <span>Indore, Madhya Pradesh, India</span>
              </div>
              <div className="kc-shot-footer__contact-row">
                <LuMail className="kc-shot-footer__contact-ico" />
                <a href="mailto:support@kripaconnect.in">support@kripaconnect.in</a>
              </div>
              <div className="kc-shot-footer__contact-row">
                <LuPhone className="kc-shot-footer__contact-ico" />
                <span>+91 98765 43210</span>
              </div>
            </div>

            <div className="kc-shot-footer__socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
                <FaYoutube />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="kc-shot-footer__bottom">
        <div className="kc-shot-footer__container kc-shot-footer__bottom-inner">
          <div className="kc-shot-footer__copy">
            © {new Date().getFullYear()} <strong>KripaConnect Electronics & Appliances</strong>. All rights reserved.
          </div>

          <button type="button" onClick={scrollToTop} className="kc-shot-footer__top-btn" aria-label="Back to top">
            <span>Back to top</span>
            <LuArrowUp />
          </button>
        </div>
      </div>
    </footer>
  )
}
