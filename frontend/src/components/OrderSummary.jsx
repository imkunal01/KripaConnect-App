export default function OrderSummary({ items }) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Order Summary</div>
      {items.map(i => (
        <div key={i.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span>{i.name} × {i.qty}</span>
          <span>₹{(i.price * i.qty).toFixed(2)}</span>
        </div>
      ))}
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700 }}>
        <span>Total</span>
        <span>₹{subtotal.toFixed(2)}</span>
      </div>
    </div>
  )
}

