import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaSlidersH } from 'react-icons/fa'
import { listProducts } from '../services/products'
import { listBanners } from '../services/banners'
import { listCategories } from '../services/categories'
import { listSubcategories } from '../services/subcategories'
import FiltersSidebar from '../components/FiltersSidebar.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SortBar from '../components/SortBar.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import ProductHeroCarousel from '../components/ProductHeroCarousel.jsx'
import { ProductGridSkeleton } from '../components/SkeletonLoader.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import SEO from '../components/SEO.jsx'
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
  const [subcategories, setSubcategories] = useState([])

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

  const activeFilters = useMemo(
    () => ({ category, subcategory, minPrice, maxPrice, availability }),
    [category, subcategory, minPrice, maxPrice, availability]
  )

  useEffect(() => {
    setSearchDraft(search)
  }, [search])

  useEffect(() => {
    Promise.all([
      listBanners().catch(() => []),
      listProducts({ brand: 'discount,sale,featured,offer', limit: 6 }).catch(() => ({ items: [] })),
      listCategories().catch(() => []),
      listSubcategories().catch(() => []),
    ]).then(([bannerItems, dealData, categoryItems, subcategoryItems]) => {
      setBanners(Array.isArray(bannerItems) ? bannerItems : [])
      setDealProducts(dealData.items || [])
      setCategories(Array.isArray(categoryItems) ? categoryItems : [])
      setSubcategories(Array.isArray(subcategoryItems) ? subcategoryItems : [])
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
    }, 300)
    return () => clearTimeout(t)
  }, [searchDraft])

  /* ===============================
     Callbacks
     =============================== */
  const updateParams = useCallback((newParams) => {
    const next = new URLSearchParams(params)
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === '' || v === undefined || v === null) {
        next.delete(k)
      } else {
        next.set(k, String(v))
      }
    })
    setParams(next)
  }, [params, setParams])

  const handleSearchChange = useCallback((val) => updateParams({ search: val || '' }), [updateParams])
  const handleSearchInputChange = useCallback((val) => setSearchDraft(val), [])
  const handleSuggestionSelect = useCallback((item) => navigate(`/product/${item._id}`), [navigate])
  const handleSortChange = useCallback((val) => updateParams({ sort: val }), [updateParams])
  const handleFiltersOpen = useCallback(() => setFiltersOpen(true), [])
  const handleFiltersClose = useCallback(() => setFiltersOpen(false), [])

  const selectedCategoryObj = categories.find((c) => c._id === category)
  const pageTitle = selectedCategoryObj
    ? `${selectedCategoryObj.name} | Buy Online | KripaConnect`
    : search
      ? `"${search}" - Electronics Search Results | KripaConnect`
      : 'Electronics & Appliances Catalog | KripaConnect'

  const pageDescription = selectedCategoryObj
    ? `Browse ${selectedCategoryObj.name} at KripaConnect. Great prices, verified quality, and fast shipping across India.`
    : 'Explore our wide collection of consumer electronics, home and kitchen appliances. Filter by category, price, and brand with instant delivery.'

  const catalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: selectedCategoryObj ? selectedCategoryObj.name : 'Products Catalog',
    description: pageDescription,
    url: `https://kripaconnect.in/products${category ? `?category=${category}` : ''}`,
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
          name: 'Products',
          item: 'https://kripaconnect.in/products',
        },
        ...(selectedCategoryObj
          ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: selectedCategoryObj.name,
              item: `https://kripaconnect.in/products?category=${selectedCategoryObj._id}`,
            },
          ]
          : []),
      ],
    },
  }

  const activeFiltersCount = [
    category,
    subcategory,
    minPrice,
    maxPrice,
    availability,
  ].filter(Boolean).length

  return (
    <div className="page-wrapper">
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={`/products${category ? `?category=${category}` : ''}`}
        keywords="electronics catalog, appliances store, KripaConnect products, TV, refrigerator, mixer grinder, air conditioner"
        schema={catalogSchema}
      />
      <Navbar />

      <div className="container main-layout">
        {/* Sidebar (Desktop) */}
        <aside className="sidebar-desktop" aria-label="Product filters">
          <div className="sticky-wrapper">
            <FiltersSidebar
              key={`desktop-${category}-${subcategory}-${minPrice}-${maxPrice}-${availability}`}
              params={activeFilters}
              onChange={updateParams}
              categories={categories}
              subcategories={subcategories}
            />
          </div>
        </aside>

        {/* Product Feed */}
        <main className="product-feed">
          <h1 className="sr-only">
            {selectedCategoryObj ? `${selectedCategoryObj.name} Products` : 'Electronics & Home Appliances Catalog'}
          </h1>

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
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  className={`category-strip__item ${category === cat._id ? 'is-active' : ''}`}
                  onClick={() => updateParams({ category: cat._id, subcategory: '' })}
                >
                  {cat.logo && <img src={cat.logo} alt={`${cat.name} icon`} loading="lazy" decoding="async" />}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="controls-bar">
            <button
              className="btn-filter-mobile"
              onClick={handleFiltersOpen}
              type="button"
              aria-label="Open filters"
            >
              <FaSlidersH aria-hidden="true" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filter-count-badge" aria-label={`${activeFiltersCount} active filters`}>
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="search-container">
              <SearchBar
                value={searchDraft}
                onChange={handleSearchChange}
                onInputChange={handleSearchInputChange}
                suggestions={suggestions}
                loadingSuggestions={suggestLoading}
                onSelectSuggestion={handleSuggestionSelect}
              />
            </div>

            <div className="sort-container">
              <SortBar
                value={sort}
                onChange={handleSortChange}
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h2>No matches found</h2>
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
        onClick={handleFiltersClose}
      >
        <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <h2>Filters</h2>
            <button className="btn-close" onClick={handleFiltersClose} aria-label="Close filters">
              ✕
            </button>
          </div>

          <div className="drawer-content">
            <FiltersSidebar
              key={`drawer-${category}-${subcategory}-${minPrice}-${maxPrice}-${availability}`}
              params={activeFilters}
              onChange={updateParams}
              categories={categories}
              subcategories={subcategories}
            />
          </div>

          <div className="drawer-footer">
            <button className="btn-apply" onClick={handleFiltersClose}>
              Show Results
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
