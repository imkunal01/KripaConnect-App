import { useEffect, useState } from 'react'
import './SearchBar.css'   // 

export default function SearchBar({
  value,
  onChange,
  onInputChange,
  suggestions = [],
  loadingSuggestions = false,
  onSelectSuggestion,
  debounce = 400
}) {
  const [text, setText] = useState(value || '')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setText(value || '')
  }, [value])

  useEffect(() => {
    const t = setTimeout(() => onChange(text), debounce)
    return () => clearTimeout(t)
  }, [text, onChange, debounce])

  const showSuggestions = open && text.trim().length > 1

  return (
    <div className="search-wrap">
      <span className="search-icon">🔍</span>

      <input
        className="search-input"
        value={text}
        onChange={e => {
          const next = e.target.value
          setText(next)
          onInputChange?.(next)
        }}
        placeholder="Search products"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />

      {text && (
        <button
          className="search-clear"
          onClick={() => {
            setText('')
            onInputChange?.('')
          }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}

      {showSuggestions && (
        <div className="search-suggestions" role="listbox">
          {loadingSuggestions && (
            <div className="search-suggestion-loading">Searching…</div>
          )}
          {!loadingSuggestions && suggestions.length === 0 && (
            <div className="search-suggestion-empty">No suggestions</div>
          )}
          {!loadingSuggestions && suggestions.map(item => (
            <button
              key={item._id}
              type="button"
              className="search-suggestion-item"
              onMouseDown={e => e.preventDefault()}
              onClick={() => onSelectSuggestion?.(item)}
              role="option"
            >
              <img
                src={item.images?.[0]?.url || 'https://via.placeholder.com/40'}
                alt={item.name}
                className="search-suggestion-thumb"
              />
              <div className="search-suggestion-meta">
                <div className="search-suggestion-title">{item.name}</div>
                {typeof item.price !== 'undefined' && (
                  <div className="search-suggestion-price">₹{Number(item.price).toLocaleString('en-IN')}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
