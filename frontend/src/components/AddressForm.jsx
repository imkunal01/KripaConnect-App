export default function AddressForm({ value, onChange, disabled }) {
  const v = value || {}
  function set(k, val) { onChange({ ...v, [k]: val }) }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input placeholder="Full Name" value={v.name || ''} onChange={e => set('name', e.target.value)} disabled={disabled} />
      <input placeholder="Phone" value={v.phone || ''} onChange={e => set('phone', e.target.value)} disabled={disabled} />
      <input placeholder="Address Line" value={v.addressLine || ''} onChange={e => set('addressLine', e.target.value)} disabled={disabled} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input placeholder="City" value={v.city || ''} onChange={e => set('city', e.target.value)} disabled={disabled} />
        <input placeholder="State" value={v.state || ''} onChange={e => set('state', e.target.value)} disabled={disabled} />
      </div>
      <input placeholder="Pincode" value={v.pincode || ''} onChange={e => set('pincode', e.target.value)} disabled={disabled} />
    </div>
  )
}

