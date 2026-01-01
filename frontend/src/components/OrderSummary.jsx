export default function OrderSummary({ items, purchaseMode = 'customer' }) {
  const isRetailerBulk = purchaseMode === 'retailer'
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  const discountTotal = items.reduce((sum, i) => {
    const reg = Number(i.regularPrice)
    const unit = Number(i.price)
    if (!Number.isFinite(reg) || !Number.isFinite(unit)) return sum
    const diff = Math.max(0, reg - unit)
    return sum + diff * (Number(i.qty) || 0)
  }, 0)
  
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Order Summary</div>
        <span
          style={{
            padding: '4px 8px',
            backgroundColor: 'rgba(var(--kc-primary-rgb), 0.12)',
            color: 'var(--primary)',
            border: '1px solid rgba(var(--kc-primary-rgb), 0.25)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          {isRetailerBulk ? 'Retailer Bulk' : 'Customer'}
        </span>
      </div>

      {items.map(i => {
        const unit = Number(i.price) || 0
        const qty = Number(i.qty) || 0
        const lineTotal = unit * qty

        const reg = Number(i.regularPrice)
        const canDiscount = isRetailerBulk && Number.isFinite(reg)
        const unitDiscount = canDiscount ? Math.max(0, reg - unit) : 0
        const lineDiscount = unitDiscount * qty

        return (
          <div key={i.productId} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {i.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  ₹{unit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}/unit • Qty {qty}
                </div>
                {lineDiscount > 0 && (
                  <div style={{ fontSize: '12px', color: '#16a34a', marginTop: 2 }}>
                    Bulk discount: -₹{lineDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 700 }}>
                ₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )
      })}

      {discountTotal > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '13px' }}>
          <span style={{ color: '#64748b' }}>Total bulk discount</span>
          <span style={{ color: '#16a34a', fontWeight: 700 }}>
            -₹{discountTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <hr style={{ margin: '12px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 800, fontSize: '18px' }}>
        <span>Total</span>
        <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  )
}

