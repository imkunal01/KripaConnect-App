import { useAuth } from '../hooks/useAuth.js'

export default function OrderSummary({ items }) {
  const { role } = useAuth()
  const isRetailer = role === 'retailer'
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const hasBulkItems = items.some(i => i.isBulkPrice)
  
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Order Summary</div>
        {isRetailer && (
          <span style={{ 
            padding: '4px 8px', 
            backgroundColor: '#fee2e2', 
            color: '#991b1b', 
            borderRadius: '6px', 
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {hasBulkItems ? 'Bulk Order' : 'Wholesale'}
          </span>
        )}
      </div>
      {items.map(i => (
        <div key={i.productId} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontWeight: 500 }}>{i.name} × {i.qty}</span>
            <span style={{ fontWeight: 600 }}>₹{(i.price * i.qty).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          {isRetailer && i.isBulkPrice && (
            <div style={{ fontSize: '11px', color: '#10b981', marginLeft: '4px' }}>
              ✓ Bulk pricing applied (₹{i.price?.toLocaleString('en-IN')}/unit)
            </div>
          )}
        </div>
      ))}
      <hr style={{ margin: '12px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700, fontSize: '18px' }}>
        <span>Total</span>
        <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  )
}

