import { useEffect, useState } from 'react'
import { apiFetch } from '../services/api'
import { useAuth } from '../hooks/useAuth.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function B2B() {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function run() {
      setLoading(true)
      try {
        const res = await apiFetch('/api/retailer/products', { token })
        const data = res?.data?.data || []
        setItems(data)
      } finally { setLoading(false) }
    }
    run()
  }, [token])

  return (
    <div>
      <Navbar />
      <div style={{ padding: 24 }}>
        <h2>B2B Wholesale</h2>
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div>No products</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {items.map(p => (
              <div key={p._id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#fff' }}>
                <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 8 }}>
                  <img src={p.images?.[0]?.url} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ marginTop: 8, fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: '#333' }}>Retailer Price: ₹{p.retailer_price}</div>
                {p.price_bulk && <div style={{ color: '#64748b' }}>Bulk: ₹{p.price_bulk} (min {p.min_bulk_qty})</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
