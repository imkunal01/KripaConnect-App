import { useState, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import ShopContext from '../context/ShopContext.jsx'
import Logo from '../assets/Logo.png'
import './Navbar.css'

// (Keep your Icons object exactly as it is)
const Icons = {
  Search: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Home: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Grid: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Heart: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Cart: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>,
  User: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Briefcase: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
  X: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
}

export default function Navbar() {
  const { user, role } = useAuth()
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
          MOBILE TOP BAR
      ======================== */}
      <nav className="navbar-top">
        <Link to="/" className="brand-logo">
          KC<div className="brand-dot"/>
        </Link>
        <Link to="/cart" style={{ position: 'relative', color: '#0f172a', display: 'flex' }}>
          <Icons.Cart />
          {cartCount > 0 && <span className="badge-dot" />}
        </Link>
      </nav>

      {/* =======================
          MOBILE SEARCH FULLSCREEN
      ======================== */}
      <div className={`mobile-search-overlay ${mobileSearchOpen ? 'open' : ''}`}>
        <div className="mobile-search-inner">
          <div className="mobile-search-header">
             <h3 className="mobile-search-title">Search</h3>
             <button type="button" onClick={() => setMobileSearchOpen(false)} className="mobile-search-close">
                <Icons.X />
             </button>
          </div>
          <form onSubmit={onSearch} className="mobile-search-form">
            <input 
              className="mobile-search-input" 
              placeholder="Search products..." 
              value={q} 
              onChange={e => setQ(e.target.value)}
              autoFocus={mobileSearchOpen}
            />
          </form>
        </div>
      </div>

      {/* =======================
          MOBILE FLOATING DOCK
      ======================== */}
      <nav className="mobile-dock">
        <Link to="/" className={`dock-item ${isActive('/') ? 'active' : ''}`}>
          <Icons.Home />
        </Link>
        
        <Link to="/products" className={`dock-item ${isActive('/products') ? 'active' : ''}`}>
          <Icons.Grid />
        </Link>
        
        {/* Search Toggle */}
        <button 
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)} 
          className={`dock-item ${mobileSearchOpen ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Icons.Search />
        </button>

        <Link to="/favorites" className={`dock-item ${isActive('/favorites') ? 'active' : ''}`}>
            <Icons.Heart />
            {favoritesCount > 0 && <span className="badge-dot" />}
        </Link>
        
        <Link to={user ? "/profile" : "/login"} className={`dock-item ${isActive('/profile') ? 'active' : ''}`}>
          <Icons.User />
        </Link>

        {role === 'retailer' && (
          <Link to="/b2b" className={`dock-item ${isActive('/b2b') ? 'active' : ''}`}>
            <Icons.Briefcase />
          </Link>
        )}
      </nav>

      {/* =======================
          DESKTOP (Redesigned)
      ======================== */}
      <header className="desktop-header">
        <div className="header-inner">
          
          {/* Left: Logo */}
          <Link to="/" className="desk-logo">
            <img src={Logo} alt="Kripa Connect" className="logo-image" />
            KC
          </Link>

          {/* Center: Search */}
          <form onSubmit={onSearch} className="desk-search-wrapper">
             <div className="search-icon-wrapper">
               <Icons.Search />
             </div>
             <input 
               className="desk-search-input" 
               placeholder="Search here..." 
               value={q} 
               onChange={e => setQ(e.target.value)} 
             />
             <button type="submit" className="search-btn-red">
               <Icons.Search />
             </button>
          </form>

          {/* Right: Actions */}
          <div className="desk-actions">
            
            <nav className="nav-links">
               <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
               <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>Products</Link>
               {role === 'retailer' && (
                 <Link to="/b2b" className={`nav-link ${isActive('/b2b') ? 'active' : ''}`}>B2B</Link>
               )}
            </nav>

            <div className="action-divider"></div>

            <Link to="/favorites" className="icon-btn" title="Favorites">
              <Icons.Heart />
              {favoritesCount > 0 && <span className="badge-dot" />}
            </Link>

            <Link to="/cart" className="icon-btn" title="Cart">
              <Icons.Cart />
              {cartCount > 0 && <span className="badge-dot" />}
            </Link>
            
            {user ? (
              <Link to={role === 'admin' ? '/admin' : '/profile'} className="btn-primary-red">
                {role === 'admin' ? 'Admin Panel' : 'My Account'}
              </Link>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-text">Sign In</Link>
                <Link to="/signup" className="btn-primary-red">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}