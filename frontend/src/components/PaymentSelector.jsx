export default function PaymentSelector({ method, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="radio" name="pay" value="COD" checked={method === 'COD'} onChange={() => onChange('COD')} />
        <span>Cash on Delivery</span>
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="radio" name="pay" value="razorpay" checked={method === 'razorpay'} onChange={() => onChange('razorpay')} />
        <span>UPI (Razorpay)</span>
      </label>
    </div>
  )
}

