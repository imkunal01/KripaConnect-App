import React, { useEffect, useMemo, useState } from 'react'
import { listCategories } from '../services/categories'
import { listSubcategories } from '../services/subcategories'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
import { CategoryGridSkeleton } from '../components/SkeletonLoader.jsx'
import { FiGrid, FiArrowRight, FiLayers } from 'react-icons/fi'
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

  const subByCategory = useMemo(() => {
    return subcategories.reduce((acc, sub) => {
      const key = sub.category_id?._id || sub.category_id
      if (!acc[key]) acc[key] = []
      acc[key].push(sub)
      return acc
    }, {})
  }, [subcategories])

  return (
    <div className="categories-page">
      <SEO
        title="Explore Product Categories | KripaConnect"
        description="Browse consumer electronics, smart appliances, entertainment, and cooling devices categorized for your home and business."
        canonical="/categories"
      />
      <Navbar />

      <main className="categories-container">
        {/* Header */}
        <header className="categories-header">
          <div>
            <span className="categories-eyebrow">Product Catalog Directory</span>
            <h1 className="categories-title">Shop by Categories</h1>
            <p className="categories-subtitle">Explore our diverse collections of home electronics, major appliances, and accessories.</p>
          </div>
          <span className="categories-count-badge">
            {items.length} {items.length === 1 ? 'Category' : 'Categories'}
          </span>
        </header>

        {loading ? (
          <CategoryGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <div className="categories-empty-card">
            <FiLayers className="categories-empty-icon" />
            <h2>No categories found</h2>
            <p>Categories will appear here once configured.</p>
          </div>
        ) : (
          <div className="categories-grid">
            {items.map(c => {
              const subs = subByCategory[c._id] || []

              return (
                <article key={c._id} className="category-card">
                  <Link to={`/products?category=${c._id}`} className="category-top-link">
                    <div className="category-logo-wrap">
                      {c.logo ? (
                        <img className="category-logo" src={c.logo} alt={c.name} loading="lazy" />
                      ) : (
                        <div className="category-icon-fallback">📦</div>
                      )}
                    </div>
                    <div className="category-name-row">
                      <h2 className="category-name">{c.name}</h2>
                      <FiArrowRight className="category-arrow" />
                    </div>
                  </Link>

                  {/* Subcategories Rail */}
                  {subs.length > 0 && (
                    <div className="category-subs-rail">
                      {subs.slice(0, 4).map(sub => (
                        <Link
                          key={sub._id}
                          to={`/products?subcategory=${sub._id}`}
                          className="category-sub-pill"
                        >
                          {sub.name}
                        </Link>
                      ))}
                      {subs.length > 4 && (
                        <Link to={`/products?category=${c._id}`} className="category-sub-more">
                          +{subs.length - 4} more
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
