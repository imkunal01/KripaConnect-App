import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiUser, FiShoppingBag, FiCheck, FiArrowRight, FiMapPin } from 'react-icons/fi'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AddressForm from '../components/AddressForm.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { profile, updateProfile } from '../services/auth'
import toast from 'react-hot-toast'

export default function OnboardingPage() {
  const { token, user, refreshMe } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const addressOnly = location.pathname === '/address-setup'

  const [step, setStep] = useState(addressOnly ? 2 : 1)
  const [role, setRole] = useState('customer')
  const [address, setAddress] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams(location.search || '')
  const next = params.get('next')

  const addressDone = useMemo(() => {
    const a = address || {}
    return !!(
      a.name?.trim() &&
      a.phone?.trim() &&
      a.addressLine?.trim()
    )
  }, [address])

  const stepCount = addressOnly ? 1 : 2
  const currentStep = addressOnly ? 1 : step
  let progressPct = 100
  if (!addressOnly) {
    progressPct = step === 1 ? 50 : 100
  }

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    async function load() {
      try {
        setLoading(true)
        const me = user?._id ? user : (await profile(token)).data

        if (me?.role === 'retailer' && !addressOnly) setRole('retailer')
        else setRole('customer')

        const list = Array.isArray(me?.savedAddresses) ? me.savedAddresses : []
        const def = list.find(a => a?.default) || list[0] || {}
        setAddress({
          name: def.name || me?.name || '',
          phone: def.phone || me?.phone || '',
          addressLine: def.addressLine || '',
          city: def.city || 'Indore',
          state: def.state || 'Madhya Pradesh',
          pincode: def.pincode || '452001',
        })
      } catch {
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  async function handleSave() {
    if (!token) return
    setSaving(true)
    try {
      const normalizedAddress = {
        name: (address.name || user?.name || '').trim(),
        phone: (address.phone || user?.phone || '').trim(),
        addressLine: (address.addressLine || '').trim(),
        city: (address.city || 'Indore').trim(),
        state: (address.state || 'Madhya Pradesh').trim(),
        pincode: (address.pincode || '452001').trim(),
        default: true
      }

      if (!normalizedAddress.name || !normalizedAddress.phone || !normalizedAddress.addressLine) {
        toast.error('Please enter name, phone, and delivery address')
        setSaving(false)
        return
      }

      const res = await updateProfile(
        {
          role,
          name: normalizedAddress.name,
          phone: normalizedAddress.phone,
          savedAddress: normalizedAddress,
        },
        token
      )

      const newToken = res?.data?.token
      if (newToken) {
        await refreshMe?.(newToken)
      } else {
        await refreshMe?.(token)
      }

      toast.success('Address saved successfully!')
      navigate(next || '/checkout', { replace: true })
    } catch (e) {
      toast.error(e?.message || 'Failed to save address details')
    } finally {
      setSaving(false)
    }
  }

  function handleSkip() {
    navigate(next || '/', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary, #f8fafc)', display: 'flex', flexDirection: 'column', paddingTop: 100 }}>
      <Navbar />

      <main style={{ maxWidth: 840, margin: '0 auto', padding: '24px 20px 80px', width: '100%', flex: 1 }}>
        <div style={{ background: '#ffffff', borderRadius: 24, border: '1px solid var(--border-color, #e2e8f0)', padding: 36, boxShadow: '0 10px 30px rgba(15,23,42,0.04)' }}>
          {/* Progress Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 750, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase' }}>
            <span>Step {currentStep} of {stepCount}</span>
            <span>{progressPct}% Completed</span>
          </div>
          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', marginTop: 10, marginBottom: 24 }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--primary, #FF3D3D)', borderRadius: 999, transition: 'width 0.3s ease' }} />
          </div>

          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 850, color: 'var(--text-primary, #0f172a)' }}>
            {addressOnly ? 'Add Delivery Destination' : 'Complete Your Profile'}
          </h1>
          <p style={{ margin: '0 0 28px 0', color: 'var(--text-secondary, #64748b)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {addressOnly
              ? 'Enter your shipping address to proceed with instant doorstep delivery.'
              : 'Configure your customer or retailer account and save your delivery address.'}
          </p>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontWeight: 700 }}>Loading…</div>
          ) : (
            <>
              {!addressOnly && step === 1 && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Select your account mode:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div
                      onClick={() => setRole('customer')}
                      style={{
                        padding: 24,
                        borderRadius: 18,
                        border: role === 'customer' ? '2px solid var(--primary, #FF3D3D)' : '1px solid #e2e8f0',
                        background: role === 'customer' ? 'rgba(var(--kc-primary-rgb, 255, 61, 61), 0.04)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transition: 'all 0.2s ease',
                        boxShadow: role === 'customer' ? '0 4px 16px rgba(var(--kc-primary-rgb, 255, 61, 61), 0.12)' : 'none'
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--kc-primary-rgb, 255, 61, 61), 0.1)', color: 'var(--primary, #FF3D3D)', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>
                        <FiUser />
                      </div>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>Individual Customer</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Buy products at standard retail rates with express delivery.</span>
                    </div>

                    <div
                      onClick={() => setRole('retailer')}
                      style={{
                        padding: 24,
                        borderRadius: 18,
                        border: role === 'retailer' ? '2px solid var(--primary, #2563eb)' : '1px solid #e2e8f0',
                        background: role === 'retailer' ? 'rgba(37, 99, 235, 0.04)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transition: 'all 0.2s ease',
                        boxShadow: role === 'retailer' ? '0 4px 16px rgba(37, 99, 235, 0.12)' : 'none'
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>
                        <FiShoppingBag />
                      </div>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>Retailer / Business</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Access wholesale bulk tier rates with commercial GST invoices.</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={handleSkip}
                      style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', fontWeight: 750, cursor: 'pointer' }}
                    >
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'var(--primary, #FF3D3D)', color: '#ffffff', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      <span>Continue to Address</span> <FiArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {(addressOnly || step === 2) && (
                <div>
                  {!addressOnly && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '0.88rem', fontWeight: 750, cursor: 'pointer', marginBottom: 20 }}
                    >
                      ← Back to role selection
                    </button>
                  )}

                  <AddressForm value={address} onChange={setAddress} disabled={saving} />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                    {!addressOnly && (
                      <button
                        type="button"
                        onClick={handleSkip}
                        style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', fontWeight: 750, cursor: 'pointer' }}
                      >
                        Skip for now
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!addressDone || saving}
                      style={{
                        padding: '14px 28px',
                        borderRadius: 14,
                        border: 'none',
                        background: 'var(--primary, #FF3D3D)',
                        color: '#ffffff',
                        fontWeight: 850,
                        fontSize: '0.98rem',
                        cursor: (!addressDone || saving) ? 'not-allowed' : 'pointer',
                        opacity: (!addressDone || saving) ? 0.6 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 16px rgba(var(--kc-primary-rgb, 255, 61, 61), 0.35)'
                      }}
                    >
                      <FiCheck />
                      <span>{saving ? 'Saving Address…' : 'Save & Proceed'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
