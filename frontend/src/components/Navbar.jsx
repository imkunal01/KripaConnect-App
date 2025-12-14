import { useState, useContext, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import ShopContext from '../context/ShopContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { user, role, signOut } = useAuth()
  const { cart, favorites } = useContext(ShopContext)
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)
  const cartCount = Array.isArray(cart) ? cart.reduce((n, i) => n + Number(i.qty || 0), 0) : 0
  const favoritesCount = Array.isArray(favorites) ? favorites.length : 0

  function onSearch(e) {
    e.preventDefault()
    const query = q.trim()
    if (query.length > 0) navigate(`/products?search=${encodeURIComponent(query)}`)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileDropdownOpen])

  async function handleLogout() {
    await signOut()
    navigate('/login')
    setProfileDropdownOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-full">Kripa Connect</span>
          <span className="navbar-logo-short">KC</span>
        </Link>

        {/* Center Navigation - Desktop */}
        <div className="navbar-center-nav">
          <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/products" className={`navbar-link ${isActive('/products') ? 'active' : ''}`}>
            Products
          </Link>
          <Link to="/categories" className={`navbar-link ${isActive('/categories') ? 'active' : ''}`}>
            Categories
          </Link>
          {role === 'retailer' && (
            <Link to="/b2b" className={`navbar-link ${isActive('/b2b') ? 'active' : ''}`}>
              B2B
            </Link>
          )}
        </div>

        {/* Search Bar - Desktop */}
        <form onSubmit={onSearch} className="navbar-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="navbar-search-input"
          />
          <span className="navbar-search-icon">🔍</span>
        </form>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* Wishlist Icon */}
          <Link to="/favorites" className="navbar-icon-link">
            <span className="navbar-icon">♡</span>
            {favoritesCount > 0 && (
              <span className="navbar-badge">
                {favoritesCount > 9 ? '9+' : favoritesCount}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <Link to="/cart" className="navbar-icon-link">
            <span className="navbar-icon">🛒</span>
            {cartCount > 0 && (
              <span className="navbar-badge blue">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Profile Avatar / Login */}
          {user ? (
            <div ref={profileRef} className="navbar-profile">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="navbar-profile-button"
              >
                <div className="navbar-profile-avatar">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="navbar-profile-name">
                  {user.name?.split(' ')[0] || 'User'}
                </span>
                <span className="navbar-profile-name">▼</span>
              </button>

              {profileDropdownOpen && (
                <div className="navbar-profile-dropdown">
                  <div className="navbar-profile-header">
                    <div className="navbar-profile-header-name">{user.name}</div>
                    <div className="navbar-profile-header-email">{user.email}</div>
                  </div>
                  <Link
                    to="/orders"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="navbar-profile-menu-item"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="navbar-profile-menu-item"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="navbar-profile-menu-item logout"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="navbar-auth-link login">
                Login
              </Link>
              <Link to="/signup" className="navbar-auth-link signup">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="navbar-mobile-toggle"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={`navbar-mobile-menu ${menuOpen ? 'open' : ''}`}>
          <form onSubmit={onSearch} style={{ marginBottom: '0.5rem' }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                minHeight: '44px'
              }}
            />
          </form>
          <Link to="/" onClick={() => setMenuOpen(false)} className="navbar-mobile-menu-item">
            Home
          </Link>
          <Link to="/products" onClick={() => setMenuOpen(false)} className="navbar-mobile-menu-item">
            Products
          </Link>
          <Link to="/categories" onClick={() => setMenuOpen(false)} className="navbar-mobile-menu-item">
            Categories
          </Link>
          {role === 'retailer' && (
            <Link to="/b2b" onClick={() => setMenuOpen(false)} className="navbar-mobile-menu-item">
              B2B Portal
            </Link>
          )}
          {role === 'admin' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="navbar-mobile-menu-item">
              Admin Panel
            </Link>
          )}
          {!user && (
            <>
              <div className="navbar-mobile-menu-divider" />
              <Link to="/login" onClick={() => setMenuOpen(false)} className="navbar-mobile-menu-item primary">
                Login
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="navbar-mobile-menu-item button">
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
