import { useEffect, useState } from 'react'
import { listCategories } from '../services/categories'
import { listSubcategories } from '../services/subcategories'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './Categories.css'

export default function Categories() {
  const [items, setItems] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function run() {
      setLoading(true)
      try {
        const [cats, subs] = await Promise.all([
          listCategories(),
          listSubcategories()
        ])
        setItems(Array.isArray(cats) ? cats : [])
        setSubcategories(Array.isArray(subs) ? subs : [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const subByCategory = subcategories.reduce((acc, sub) => {
    const key = sub.category_id
    if (!acc[key]) acc[key] = []
    acc[key].push(sub)
    return acc
  }, {})

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
              <div key={c._id} className="category-card">
                <Link to={`/products?category=${c._id}`} className="category-link">
                  {c.logo ? (
                    <img className="category-logo" src={c.logo} alt={c.name} />
                  ) : (
                    <div className="category-icon">📦</div>
                  )}
                  <div className="category-name">{c.name}</div>
                </Link>
                <div className="subcategory-list">
                  {(subByCategory[c._id] || []).map(sub => (
                    <Link
                      key={sub._id}
                      to={`/products?category=${c._id}&subcategory=${sub._id}`}
                      className="subcategory-chip"
                    >
                      {sub.logo ? (
                        <img className="subcategory-logo" src={sub.logo} alt={sub.name} />
                      ) : (
                        <span className="subcategory-dot" aria-hidden="true">•</span>
                      )}
                      <span>{sub.name}</span>
                    </Link>
                  ))}
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
