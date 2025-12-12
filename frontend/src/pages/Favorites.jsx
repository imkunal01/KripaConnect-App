import { useContext, useEffect, useState } from 'react'
import ShopContext from '../context/ShopContext.jsx'
import AuthContext from '../context/AuthContext.jsx'
import { listFavorites } from '../services/favorites'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Favorites() {
  const { token } = useContext(AuthContext)
  const { addToCart, toggleFavorite, favorites } = useContext(ShopContext)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        if (token) {
          const data = await listFavorites(token)
          if (active) setItems(data)
        } else {
          setItems([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [token, favorites])

  return (
    <div>
      <Navbar />
      <div style={{ padding: 24 }}>
        <h2>Favorites</h2>
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div>No favorites yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {items.map(p => (
              <div key={p._id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#fff' }}>
                <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}>
                  <img src={p.images?.[0]?.url} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ marginTop: 8, fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: '#333' }}>₹{p.price}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="nav-btn signup-btn" onClick={() => addToCart(p, 1)}>Add to Cart</button>
                  <button className="nav-btn" onClick={() => toggleFavorite(p._id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
