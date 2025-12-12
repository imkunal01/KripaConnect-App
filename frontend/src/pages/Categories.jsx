import { useEffect, useState } from 'react'
import { listCategories } from '../services/categories'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Categories() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function run() {
      setLoading(true)
      try {
        const data = await listCategories()
        setItems(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div>
      <Navbar />
      <div style={{ padding: 24 }}>
        <h2>Categories</h2>
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div>No categories found</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {items.map(c => (
              <Link key={c._id} to={`/products?category=${c._id}`} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, background: '#fff' }}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
