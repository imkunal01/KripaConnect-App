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

/* ===============================
   🔧 Brand / Tag Sanitizer
   =============================== */
function cleanBrand(value) {
  if (!value) return []

  // Convert anything to string first
  let v = String(value).trim()

  // Try parsing JSON once
  try {
    const parsed = JSON.parse(v)
    if (Array.isArray(parsed)) {
      return parsed.flatMap(cleanBrand)
    }
    if (typeof parsed === 'string') {
      v = parsed
    }
  } catch {
    // ignore JSON errors
  }

  // Remove wrapping quotes
  v = v.replace(/^["']+|["']+$/g, '').trim()

  // Split comma-separated strings
  return v
    ? v.split(',').map(x => x.trim()).filter(Boolean)
    : []
}

export default function Products() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  /* ===============================
     URL Params
     =============================== */
  const search = params.get('search') || ''
  const category = params.get('category') || ''
  const subcategory = params.get('subcategory') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const sort = params.get('sort') || ''
  const brand = params.get('brand') || ''
  const availability = params.get('availability') || ''

  /* ===============================
     Data Fetching
     =============================== */
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await listProducts({
          search,
          category,
          subcategory,
          minPrice,
          maxPrice,
          sort,
          brand,
          availability,
          limit: 24,
        })
        setItems(data.items || [])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(t)
  }, [search, category, subcategory, minPrice, maxPrice, sort, brand, availability])

  /* ===============================
     ✅ FIXED Brand Options
     =============================== */
  const brandOptions = useMemo(() => {
    const brands = items.flatMap(p => cleanBrand(p.tags))
    return Array.from(new Set(brands))
  }, [items])

  /* ===============================
     Helper: Update URL Params
     =============================== */
  function updateParams(next) {
    const merged = new URLSearchParams(params)
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') merged.delete(k)
      else merged.set(k, v)
    })
    setParams(merged)
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">Explore Collection</h1>
          <p className="page-subtitle">
            Curated premium electronics for your workspace.
          </p>
        </div>
      </header>

      <div className="container main-layout">
        {/* Sidebar (Desktop) */}
        <aside className="sidebar-desktop">
          <div className="sticky-wrapper">
            <FiltersSidebar
              params={{ category, subcategory, min: minPrice, max: maxPrice, availability, brand }}
              onChange={updateParams}
              brandOptions={brandOptions}
            />
          </div>
        </aside>

        {/* Product Feed */}
        <main className="product-feed">
          {/* Controls */}
          <div className="controls-bar">
            <button
              className="btn-filter-mobile"
              onClick={() => setFiltersOpen(true)}
            >
              <span>Filters</span>
            </button>

            <div className="search-container">
              <SearchBar
                value={search}
                onChange={(val) => updateParams({ search: val })}
              />
            </div>

            <div className="sort-container">
              <SortBar
                value={sort}
                onChange={(val) => updateParams({ sort: val })}
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Loading products...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No matches found</h3>
              <p>Try adjusting your search or filters.</p>
              <button className="btn-reset" onClick={() => setParams({})}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <ProductGrid items={items} />
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      <div
        className={`drawer-overlay ${filtersOpen ? 'open' : ''}`}
        onClick={() => setFiltersOpen(false)}
      >
        <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <h3>Filters</h3>
            <button className="btn-close" onClick={() => setFiltersOpen(false)}>
              ✕
            </button>
          </div>

          <div className="drawer-content">
            <FiltersSidebar
              params={{ category, subcategory, min: minPrice, max: maxPrice, availability, brand }}
              onChange={updateParams}
              brandOptions={brandOptions}
            />
          </div>

          <div className="drawer-footer">
            <button className="btn-apply" onClick={() => setFiltersOpen(false)}>
              Show Results
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
