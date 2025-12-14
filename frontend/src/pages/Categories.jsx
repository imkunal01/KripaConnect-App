import { useEffect, useState } from 'react'
import { listCategories } from '../services/categories'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './Categories.css'

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
    <div className="categories-page">
      <Navbar />
      <div className="categories-container">
        <div className="categories-header">
          <h1 className="categories-title">Categories</h1>
          <p className="categories-subtitle">Browse products by category</p>
        </div>

        {loading ? (
          <div className="categories-loading">
            <div className="categories-loading-icon">⏳</div>
            <p style={{ color: '#6b7280' }}>Loading categories...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="categories-empty-state">
            <div className="categories-empty-icon">📂</div>
            <h2 className="categories-empty-title">No categories found</h2>
            <p className="categories-empty-text">Categories will appear here when available</p>
          </div>
        ) : (
          <div className="categories-grid">
            {items.map(c => (
              <Link key={c._id} to={`/products?category=${c._id}`} className="category-card">
                <div className="category-icon">📦</div>
                <div className="category-name">{c.name}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
