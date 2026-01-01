import { useMemo } from 'react'
import './QuantitySelector.css'   // ⭐ CSS import

export default function QuantitySelector({ value = 1, min = 1, max = 99, onChange }) {
  const qty = useMemo(() => {
    const raw = Number(value)
    const safe = Number.isFinite(raw) ? raw : min
    return Math.max(min, Math.min(safe, max))
  }, [value, min, max])

  function inc() {
    const next = Math.min(qty + 1, max)
    onChange?.(next)
  }

  function dec() {
    const next = Math.max(qty - 1, min)
    onChange?.(next)
  }

  function setNumber(v) {
    const n = Math.max(min, Math.min(Number(v) || min, max))
    onChange?.(n)
  }

  return (
    <div className="qty-box">
      <button
        className="qty-btn"
        onClick={dec}
        disabled={qty <= min}
      >
        –
      </button>

      <input
        value={qty}
        onChange={e => setNumber(e.target.value)}
        className="qty-input"
      />

      <button
        className="qty-btn"
        onClick={inc}
        disabled={qty >= max}
      >
        +
      </button>
    </div>
  )
}
