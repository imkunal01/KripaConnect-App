import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaSlidersH } from 'react-icons/fa'
import { listProducts } from '../services/products'
import { listBanners } from '../services/banners'
import { listCategories } from '../services/categories'
import FiltersSidebar from '../components/FiltersSidebar.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SortBar from '../components/SortBar.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import ProductHeroCarousel from '../components/ProductHeroCarousel.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './Products.css'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [banners, setBanners] = useState([])
  const [dealProducts, setDealProducts] = useState([])
  const [categories, setCategories] = useState([])

  /* ===============================
     URL Params
     =============================== */
  const search = params.get('search') || ''
  const category = params.get('category') || ''
  const subcategory = params.get('subcategory') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const sort = params.get('sort') || ''
  const availability = params.get('availability') || ''

  useEffect(() => {
    setSearchDraft(search)
  }, [search])

  useEffect(() => {
    Promise.all([
      listBanners().catch(() => []),
      listProducts({ brand: 'discount,sale,featured,offer', limit: 6 }).catch(() => ({ items: [] })),
      listCategories().catch(() => []),
    ]).then(([bannerItems, dealData, categoryItems]) => {
      setBanners(Array.isArray(bannerItems) ? bannerItems : [])
      setDealProducts(dealData.items || [])
      setCategories(Array.isArray(categoryItems) ? categoryItems : [])
    })
  }, [])

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
          availability,
          limit: 24,
        })
        setItems(data.items || [])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(t)
  }, [search, category, subcategory, minPrice, maxPrice, sort, availability])

  useEffect(() => {
    const q = searchDraft.trim()
    if (q.length < 2) {
      setSuggestions([])
      setSuggestLoading(false)
      return
    }
    setSuggestLoading(true)
    const t = setTimeout(async () => {
      try {
        const data = await listProducts({ search: q, limit: 6 })
        setSuggestions(data.items || [])
      } catch {
        setSuggestions([])
      } finally {
        setSuggestLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [searchDraft])

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

      <div className="container main-layout">
        {/* Sidebar (Desktop) */}
        <aside className="sidebar-desktop">
          <div className="sticky-wrapper">
            <FiltersSidebar
              params={{ category, subcategory, minPrice, maxPrice, availability }}
              onChange={updateParams}
            />
          </div>
        </aside>

        {/* Product Feed */}
        <main className="product-feed">
          <ProductHeroCarousel banners={banners} fallbackProducts={dealProducts} />

          {categories.length > 0 && (
            <div className="category-strip" aria-label="Product categories">
              <button
                type="button"
                className={`category-strip__item ${!category ? 'is-active' : ''}`}
                onClick={() => updateParams({ category: '', subcategory: '' })}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  type="button"
                  className={`category-strip__item ${category === cat._id ? 'is-active' : ''}`}
                  onClick={() => updateParams({ category: cat._id, subcategory: '' })}
                >
                  {cat.logo && <img src={cat.logo} alt="" />}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="controls-bar">
            <button
              className="btn-filter-mobile"
              onClick={() => setFiltersOpen(true)}
              type="button"
              aria-label="Open filters"
            >
              <FaSlidersH aria-hidden="true" />
              <span>Filters</span>
            </button>

            <div className="search-container">
              <SearchBar
                value={searchDraft}
                onChange={(val) => updateParams({ search: val })}
                onInputChange={(val) => setSearchDraft(val)}
                suggestions={suggestions}
                loadingSuggestions={suggestLoading}
                onSelectSuggestion={(item) => navigate(`/product/${item._id}`)}
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
              params={{ category, subcategory, minPrice, maxPrice, availability }}
              onChange={updateParams}
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
