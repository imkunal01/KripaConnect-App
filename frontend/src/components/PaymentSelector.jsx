import React from 'react'
import { FiCreditCard, FiDollarSign, FiCheck, FiShield } from 'react-icons/fi'
import { FaGooglePay, FaAmazonPay } from 'react-icons/fa'

export default function PaymentSelector({ method, onChange }) {
  return (
    <div className="payment-selector-grid">
      {/* Option 1: Razorpay Online Payment */}
      <div
        className={`payment-option-card ${method === 'razorpay' ? 'is-selected' : ''}`}
        onClick={() => onChange('razorpay')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onChange('razorpay')
          }
        }}
      >
        <div className="payment-option-header">
          <div className="payment-radio-indicator">
            <div className="payment-radio-dot" />
          </div>
          <div className="payment-option-title-group">
            <div className="payment-option-title">UPI / Cards / Net Banking (Razorpay)</div>
            <div className="payment-option-sub">Instant payment via GPay, PhonePe, Paytm, Cards & UPI</div>
          </div>
          <span className="payment-badge-recommended">Instant & Secure</span>
        </div>

        <div className="payment-option-icons">
          <span className="payment-sub-pill">UPI</span>
          <span className="payment-sub-pill">GPay</span>
          <span className="payment-sub-pill">PhonePe</span>
          <span className="payment-sub-pill">Cards</span>
          <span className="payment-sub-pill">NetBanking</span>
        </div>
      </div>

      {/* Option 2: Cash on Delivery */}
      <div
        className={`payment-option-card ${method === 'COD' ? 'is-selected' : ''}`}
        onClick={() => onChange('COD')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onChange('COD')
          }
        }}
      >
        <div className="payment-option-header">
          <div className="payment-radio-indicator">
            <div className="payment-radio-dot" />
          </div>
          <div className="payment-option-title-group">
            <div className="payment-option-title">Cash on Delivery (COD)</div>
            <div className="payment-option-sub">Pay in cash or UPI directly upon doorstep delivery</div>
          </div>
        </div>
      </div>
    </div>
  )
}
