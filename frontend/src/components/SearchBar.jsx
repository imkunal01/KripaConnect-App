import { useEffect, useState } from 'react'
import './SearchBar.css'   // 

export default function SearchBar({ value, onChange, debounce = 400 }) {
  const [text, setText] = useState(value || '')

  useEffect(() => {
    const t = setTimeout(() => onChange(text), debounce)
    return () => clearTimeout(t)
  }, [text, onChange, debounce])

  return (
    <div className="search-wrap">
      <span className="search-icon">🔍</span>

      <input
        className="search-input"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Search products"
      />

      {text && (
        <button
          className="search-clear"
          onClick={() => setText('')}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}
