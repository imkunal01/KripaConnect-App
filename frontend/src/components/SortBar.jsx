export default function SortBar({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <option value="">Sort</option>
      <option value="price">Price: Low → High</option>
      <option value="-price">Price: High → Low</option>
      <option value="name">Name: A → Z</option>
      <option value="-name">Name: Z → A</option>
      <option value="-createdAt">Newest First</option>
    </select>
  )
}

