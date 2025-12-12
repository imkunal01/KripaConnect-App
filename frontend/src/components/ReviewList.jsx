export default function ReviewList({ items }) {
  if (!items || items.length === 0) return <div>No reviews yet</div>
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map(r => (
        <div key={r._id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600 }}>{r.user?.name || 'User'}</div>
            <div>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
          </div>
          <div style={{ marginTop: 6 }}>{r.text}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  )
}

