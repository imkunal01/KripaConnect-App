import { useEffect, useState } from 'react'
import { listCategories } from '../services/categories'
import { listSubcategories } from '../services/subcategories'
import './FiltersSidebar.css'

export default function FiltersSidebar({ params, onChange }) {
  const [cats, setCats] = useState([])
  const [subs, setSubs] = useState([])
  useEffect(() => {
    listCategories().then(setCats).catch(() => setCats([]))
    listSubcategories().then(setSubs).catch(() => setSubs([]))
  }, [])

  const [min, setMin] = useState(params.minPrice || '')
  const [max, setMax] = useState(params.maxPrice || '')
  const [availability, setAvailability] = useState(params.availability || '')
  const [category, setCategory] = useState(params.category || '')
  const [subcategory, setSubcategory] = useState(params.subcategory || '')

  function apply() {
    onChange({ category, subcategory, minPrice: min, maxPrice: max, availability })
  }

  function clearAll() {
    setCategory('')
    setSubcategory('')
    setMin('')
    setMax('')
    setAvailability('')
    onChange({ category: '', subcategory: '', minPrice: '', maxPrice: '', availability: '' })
  }

  return (
    <div className="filters-sidebar">
      <div className="filters-group">
        <div className="filters-label">Category</div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setSubcategory('')
          }}
          className="filters-select"
        >
          <option value="">All</option>
          {cats.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
        </select>
      </div>
      <div className="filters-group">
        <div className="filters-label">Subcategory</div>
        <select
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          className="filters-select"
          disabled={!category}
        >
          <option value="">All</option>
          {subs
            .filter(s => String(s.category_id) === String(category))
            .map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
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
      <div className="filters-actions">
        <button onClick={apply} className="filters-apply-button">
          Apply Filters
        </button>
        <button onClick={clearAll} className="filters-clear-button">
          Clear All
        </button>
      </div>
    </div>
  )
}
