import { useState, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { usePurchaseMode } from '../hooks/usePurchaseMode.js'
import ShopContext from '../context/ShopContext.jsx'
import Logo from '../assets/newLogo3.png'
import './Navbar.css'

// Clean Vector Icons (No Emojis)
import {
  LuSearch,
  LuHouse,
  LuLayoutGrid,
  LuHeart,
  LuShoppingBag,
  LuUser,
  LuBriefcase,
  LuX
} from 'react-icons/lu'

export default function Navbar() {
  const { user, role, openAuthModal } = useAuth()
  const { mode } = usePurchaseMode()
  const { cart, favorites } = useContext(ShopContext)
  const [q, setQ] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Calc totals
  const cartCount = Array.isArray(cart) ? cart.reduce((n, i) => n + Number(i.qty || 0), 0) : 0
  const favoritesCount = Array.isArray(favorites) ? favorites.length : 0

  function onSearch(e) {
    e.preventDefault()
    if (q.trim().length > 0) {
      navigate(`/products?search=${encodeURIComponent(q.trim())}`)
      setMobileSearchOpen(false)
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* =======================
          MOBILE SEARCH FULLSCREEN MODAL
      ======================== */}
      <div className={`mobile-search-overlay ${mobileSearchOpen ? 'open' : ''}`}>
        <div className="mobile-search-inner">
          <div className="mobile-search-header">
            <h3 className="mobile-search-title">Search Store</h3>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="mobile-search-close"
              aria-label="Close search"
            >
              <LuX />
            </button>
          </div>
          <form onSubmit={onSearch} className="mobile-search-form">
            <input 
              className="mobile-search-input" 
              placeholder="Search products, fans, TVs, appliances..." 
              value={q} 
              onChange={e => setQ(e.target.value)}
              autoFocus={mobileSearchOpen}
            />
          </form>
        </div>
      </div>

      {/* =======================
          MOBILE BOTTOM DOCK (High Utility, Zero Obstruction)
      ======================== */}
      <nav className="mobile-dock" aria-label="Mobile Navigation">
        <Link to="/" className={`dock-item ${isActive('/') ? 'active' : ''}`} aria-label="Home">
          <LuHouse />
          <span className="dock-label">Home</span>
        </Link>
        
        {role === 'retailer' && mode === 'retailer' ? (
          <Link to="/b2b" className={`dock-item ${isActive('/b2b') ? 'active' : ''}`} aria-label="Wholesale Hub">
            <LuBriefcase />
            <span className="dock-label">Wholesale</span>
          </Link>
        ) : (
          <Link to="/products" className={`dock-item ${isActive('/products') ? 'active' : ''}`} aria-label="Products">
            <LuLayoutGrid />
            <span className="dock-label">Categories</span>
          </Link>
        )}
        
        <button 
          type="button"
          onClick={() => setMobileSearchOpen(true)} 
          className="dock-item" 
          aria-label="Search"
        >
          <LuSearch />
          <span className="dock-label">Search</span>
        </button>

        <Link to="/favorites" className={`dock-item ${isActive('/favorites') ? 'active' : ''}`} aria-label="Favorites">
          <div className="dock-icon-wrap">
            <LuHeart />
            {favoritesCount > 0 && <span className="dock-badge-dot" />}
          </div>
          <span className="dock-label">Wishlist</span>
        </Link>

        <Link to="/cart" className={`dock-item ${isActive('/cart') ? 'active' : ''}`} aria-label="Cart">
          <div className="dock-icon-wrap">
            <LuShoppingBag />
            {cartCount > 0 && <span className="dock-badge-count">{cartCount}</span>}
          </div>
          <span className="dock-label">Cart</span>
        </Link>
        
        {user ? (
          <Link to="/profile" className={`dock-item ${isActive('/profile') ? 'active' : ''}`} aria-label="My Account">
            <LuUser />
            <span className="dock-label">Account</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="dock-item"
            aria-label="Sign In"
          >
            <LuUser />
            <span className="dock-label">Sign In</span>
          </button>
        )}
      </nav>

      {/* =======================
          DESKTOP HEADER (Clean Red Accent Design)
      ======================== */}
      <header className="desktop-header">
        <div className="header-inner">
          {/* Left: Logo */}
          <Link to="/" className="desk-logo" aria-label="KripaConnect Home">
            <img src={Logo} alt="KripaConnect" className="logo-image" />
          </Link>

          {/* Center: Search */}
          <form onSubmit={onSearch} className="desk-search-wrapper">
            <div className="search-icon-wrapper">
              <LuSearch />
            </div>
            <input 
              className="desk-search-input" 
              placeholder='Search for "Smart TV", "BLDC Fan", "Mixer", "Surge Strip"...' 
              value={q} 
              onChange={e => setQ(e.target.value)} 
            />
            <button type="submit" className="search-btn-red" aria-label="Search">
              <LuSearch />
            </button>
          </form>

          {/* Right: Navigation Links & Actions */}
          <div className="desk-actions">
            <nav className="nav-links">
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
              <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>Products</Link>
              {role === 'retailer' && mode === 'retailer' && (
                <Link to="/b2b" className={`nav-link ${isActive('/b2b') ? 'active' : ''}`}>Wholesale Hub</Link>
              )}
            </nav>

            <div className="action-divider" />

            <Link to="/favorites" className="icon-btn" title="Saved Wishlist" aria-label="Wishlist">
              <LuHeart />
              {favoritesCount > 0 && <span className="badge-dot-red" />}
            </Link>

            <Link to="/cart" className="icon-btn" title="Shopping Cart" aria-label="Cart">
              <LuShoppingBag />
              {cartCount > 0 && <span className="cart-badge-pill">{cartCount}</span>}
            </Link>
            
            {user ? (
              <Link to={role === 'admin' ? '/admin' : '/profile'} className="btn-primary-red">
                {role === 'admin' ? 'Admin Panel' : 'My Account'}
              </Link>
            ) : (
              <div className="auth-buttons">
                <button type="button" onClick={() => openAuthModal('login')} className="btn-text">
                  Sign In
                </button>
                <button type="button" onClick={() => openAuthModal('signup')} className="btn-primary-red">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}