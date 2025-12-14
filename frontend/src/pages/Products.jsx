import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listProducts } from '../services/products'
import FiltersSidebar from '../components/FiltersSidebar.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SortBar from '../components/SortBar.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './Products.css'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const search = params.get('search') || ''
  const category = params.get('category') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const sort = params.get('sort') || ''
  const brand = params.get('brand') || ''
  const availability = params.get('availability') || ''

  useEffect(() => {
    const t = setTimeout(() => {
      ;(async () => {
        setLoading(true)
        try {
          const data = await listProducts({ search, category, minPrice, maxPrice, sort, brand, availability, limit: 24 })
          setItems(data.items || [])
        } finally {
          setLoading(false)
        }
      })()
    }, 400)
    return () => clearTimeout(t)
  }, [search, category, minPrice, maxPrice, sort, brand, availability])

  const brandOptions = useMemo(() => {
    const tags = items.flatMap(p => Array.isArray(p.tags) ? p.tags : [])
    return Array.from(new Set(tags))
  }, [items])

  const filteredItems = items

  function updateParams(next) {
    const merged = new URLSearchParams(params)
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') merged.delete(k)
      else merged.set(k, v)
    })
    setParams(merged)
  }

  return (
    <div className="products-page">
      <Navbar />
      <div className="products-container">
        {/* Mobile Filters Button */}
        <button
          onClick={() => setFiltersOpen(true)}
          className="mobile-filters-btn"
        >
          <span>🔍</span> Filters
        </button>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem'
        }} className="products-layout">
          {/* Desktop Sidebar */}
          <div className="desktop-filters">
            <FiltersSidebar params={{ category, min: minPrice, max: maxPrice, availability, brand }} onChange={updateParams} brandOptions={brandOptions} />
          </div>

          {/* Mobile Filters Overlay */}
          {filtersOpen && (
            <div
              onClick={() => setFiltersOpen(false)}
              className="mobile-filters-overlay"
            >
              <div
                className="mobile-filters-panel"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mobile-filters-header">
                  <h3 className="mobile-filters-title">Filters</h3>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="mobile-filters-close"
                  >
                    ✕
                  </button>
                </div>
                <FiltersSidebar params={{ category, min: minPrice, max: maxPrice, availability, brand }} onChange={updateParams} brandOptions={brandOptions} />
              </div>
            </div>
          )}

          <div className="products-main">
            <div className="products-controls">
              <div className="products-search-wrapper">
                <SearchBar value={search} onChange={(val) => updateParams({ search: val })} />
              </div>
              <SortBar value={sort} onChange={(val) => updateParams({ sort: val })} />
            </div>
            {loading ? (
              <div className="products-loading">
                <div className="products-loading-icon">⏳</div>
                <p style={{ color: '#6b7280' }}>Loading products...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="products-empty-state">
                <div className="products-empty-icon">🔍</div>
                <h2 className="products-empty-title">No products found</h2>
                <p className="products-empty-text">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <ProductGrid items={filteredItems} />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
