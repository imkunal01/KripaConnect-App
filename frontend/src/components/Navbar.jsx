import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import ShopContext from '../context/ShopContext.jsx'

export default function Navbar() {
  const { user, role, signOut } = useAuth()
  const { cart } = useContext(ShopContext)
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  function onSearch(e) {
    e.preventDefault()
    const query = q.trim()
    if (query.length > 0) navigate(`/products?search=${encodeURIComponent(query)}`)
  }

  return (
    <nav className="navbar">
      <div className="nav-brand"><Link to="/">Kripa Connect</Link></div>

      <form onSubmit={onSearch} style={{ display: 'flex', gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products"
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <button className="nav-btn" type="submit">Search</button>
      </form>

      <div className="nav-actions" style={{ gap: 12 }}>
        <button className="nav-btn" onClick={() => navigate(-1)}>Back</button>
        <Link className="nav-btn" to="/categories">Categories</Link>
        {role === 'retailer' && <Link className="nav-btn" to="/b2b">B2B</Link>}
        <Link className="nav-btn" to="/favorites">Favorites</Link>
        <Link className="nav-btn" to="/cart">Cart ({Array.isArray(cart) ? cart.reduce((n,i)=>n+Number(i.qty||0),0) : 0})</Link>
        <button className="nav-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        {user ? (
          <>
            <span className="welcome-text">Hi, {user.name}</span>
            <button className="nav-btn logout-btn" onClick={signOut}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn login-btn">Login</Link>
            <Link to="/signup" className="nav-btn signup-btn">Sign Up</Link>
          </>
        )}
      </div>

      {menuOpen && (
        <div style={{ position: 'absolute', top: 60, right: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/categories" onClick={() => setMenuOpen(false)}>Categories</Link>
            {role === 'retailer' && <Link to="/b2b" onClick={() => setMenuOpen(false)}>B2B Portal</Link>}
            <Link to="/favorites" onClick={() => setMenuOpen(false)}>Favorites</Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart</Link>
            <Link to="/checkout" onClick={() => setMenuOpen(false)}>Checkout</Link>
            {user ? (
              <button onClick={() => { setMenuOpen(false); signOut() }}>Logout</button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
