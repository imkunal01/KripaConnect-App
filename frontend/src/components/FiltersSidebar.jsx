import { useEffect, useMemo, useState } from 'react'
import { listCategories } from '../services/categories'
import './FiltersSidebar.css'

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
    <div className="filters-sidebar">
      <div className="filters-group">
        <div className="filters-label">Category</div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="filters-select"
        >
          <option value="">All</option>
          {cats.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
        </select>
      </div>
      <div className="filters-group">
        <div className="filters-label">Price Range</div>
        <div className="filters-price-inputs">
          <input
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="Min"
            type="number"
            className="filters-price-input"
          />
          <input
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Max"
            type="number"
            className="filters-price-input"
          />
        </div>
      </div>
      <div className="filters-group">
        <div className="filters-label">Brand</div>
        <div className="filters-brands-list">
          {brandList.map(b => (
            <label key={b} className="filters-brand-item">
              <input
                type="checkbox"
                checked={brands.includes(b)}
                onChange={(e) => {
                  const checked = e.target.checked
                  setBrands(prev => checked ? [...prev, b] : prev.filter(x => x !== b))
                }}
                className="filters-brand-checkbox"
              />
              <span className="filters-brand-label">{b}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="filters-group">
        <div className="filters-label">Availability</div>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="filters-select"
        >
          <option value="">All</option>
          <option value="in">In Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>
      <button onClick={apply} className="filters-apply-button">
        Apply Filters
      </button>
    </div>
  )
}
