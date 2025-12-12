import { useEffect, useMemo, useState } from 'react'
import { listCategories } from '../services/categories'

export default function FiltersSidebar({ params, onChange, brandOptions }) {
  const [cats, setCats] = useState([])
  useEffect(() => { listCategories().then(setCats).catch(() => setCats([])) }, [])

  const [min, setMin] = useState(params.min || '')
  const [max, setMax] = useState(params.max || '')
  const [availability, setAvailability] = useState(params.availability || '')
  const [category, setCategory] = useState(params.category || '')
  const [brands, setBrands] = useState(params.brand ? params.brand.split(',') : [])


  const brandList = useMemo(() => Array.from(new Set(brandOptions || [])).slice(0, 12), [brandOptions])

  function apply() {
    onChange({ category, min, max, availability, brand: brands.join(',') })
  }

  return (
    <div style={{ width: 280, borderRight: '1px solid #e2e8f0', paddingRight: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Category</div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <option value="">All</option>
          {cats.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Price Range</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Brand</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          {brandList.map(b => (
            <label key={b} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={brands.includes(b)} onChange={(e) => {
                const checked = e.target.checked
                setBrands(prev => checked ? [...prev, b] : prev.filter(x => x !== b))
              }} />
              <span>{b}</span>
            </label>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Availability</div>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <option value="">All</option>
          <option value="in">In Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>
      <button className="nav-btn signup-btn" onClick={apply}>Apply Filters</button>
    </div>
  )
}
