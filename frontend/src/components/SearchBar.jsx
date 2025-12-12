import { useEffect, useState } from 'react'

export default function SearchBar({ value, onChange, debounce = 400 }) {
  const [text, setText] = useState(value || '')
  useEffect(() => {
    const t = setTimeout(() => onChange(text), debounce)
    return () => clearTimeout(t)
  }, [text, onChange, debounce])
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Search products"
      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}
    />
  )
}
