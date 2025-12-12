import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listProducts } from '../services/products'
import FiltersSidebar from '../components/FiltersSidebar.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SortBar from '../components/SortBar.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
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
    <div>
      <Navbar />
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, padding: 24 }}>
        <FiltersSidebar params={{ category, min: minPrice, max: maxPrice, availability, brand }} onChange={updateParams} brandOptions={brandOptions} />
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1 }}><SearchBar value={search} onChange={(val) => updateParams({ search: val })} /></div>
            <SortBar value={sort} onChange={(val) => updateParams({ sort: val })} />
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div>No products found</div>
          ) : (
            <ProductGrid items={filteredItems} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
