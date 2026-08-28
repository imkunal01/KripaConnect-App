import { useEffect, useMemo, useState } from 'react'
import { listCategories } from '../services/categories'
import { listSubcategories } from '../services/subcategories'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
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

  const categoriesSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Product Categories',
    description: 'Browse all electronics, appliances, and home device categories at KripaConnect.',
    url: 'https://kripaconnect.in/categories',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://kripaconnect.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Categories',
          item: 'https://kripaconnect.in/categories',
        },
      ],
    },
  }), [])

  return (
    <div className="categories-page">
      <SEO
        title="Shop by Category | Consumer Electronics & Appliances | KripaConnect"
        description="Browse all product categories including Kitchen Appliances, Entertainment, Cooling, and Home Electronics. Find deals and explore subcategories."
        canonical="/categories"
        keywords="product categories, electronics categories, home appliances, kitchen appliances, KripaConnect catalog"
        schema={categoriesSchema}
      />
      <Navbar />

      <main className="categories-container">
        <header className="categories-header">
          <h1 className="categories-title">Product Categories</h1>
          <p className="categories-subtitle">Browse products and subcategories</p>
        </header>

        {loading ? (
          <div className="categories-loading" aria-busy="true" aria-live="polite">
            <div className="categories-loading-icon">⏳</div>
            <p style={{ color: '#6b7280' }}>Loading categories...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="categories-empty-state">
            <div className="categories-empty-icon">📂</div>
            <h2>No categories found</h2>
            <p className="categories-empty-text">Categories will appear here when available</p>
          </div>
        ) : (
          <section className="categories-grid" aria-label="Categories list">
            {items.map(c => (
              <div key={c._id} className="category-card">
                <Link to={`/products?category=${c._id}`} className="category-link">
                  {c.logo ? (
                    <img className="category-logo" src={c.logo} alt={`${c.name} category`} loading="lazy" decoding="async" />
                  ) : (
                    <div className="category-icon">📦</div>
                  )}
                  <h2 className="category-name">{c.name}</h2>
                </Link>
                <div className="subcategory-list" aria-label={`${c.name} subcategories`}>
                  {(subByCategory[c._id] || []).map(sub => (
                    <Link
                      key={sub._id}
                      to={`/products?category=${c._id}&subcategory=${sub._id}`}
                      className="subcategory-chip"
                    >
                      {sub.logo ? (
                        <img className="subcategory-logo" src={sub.logo} alt={`${sub.name} subcategory`} loading="lazy" decoding="async" />
                      ) : (
                        <span className="subcategory-dot" aria-hidden="true">•</span>
                      )}
                      <span>{sub.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
