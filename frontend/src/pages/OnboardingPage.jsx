import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaUserAlt, FaStore } from 'react-icons/fa'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AddressForm from '../components/AddressForm.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { profile, updateProfile } from '../services/auth'

/* eslint-disable react/prop-types */

function OnboardingActionButton({ children, onClick, type = 'button', variant = 'primary', disabled = false, style = {} }) {
  const isPrimary = variant === 'primary'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: isPrimary ? 'none' : '1px solid #e5e7eb',
        background: isPrimary ? '#111' : '#fff',
        color: isPrimary ? '#fff' : '#111',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function RoleStep({ role, onChooseCustomer, onChooseRetailer, onContinue, onSkip }) {
  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
      <div style={{ fontWeight: 700 }}>I am a:</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button
          type="button"
          onClick={onChooseCustomer}
          style={{
            height: 56,
            borderRadius: 12,
            border: role === 'customer' ? '2px solid #ef4444' : '1px solid #e5e7eb',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <FaUserAlt /> Customer
        </button>
        <button
          type="button"
          onClick={onChooseRetailer}
          style={{
            height: 56,
            borderRadius: 12,
            border: role === 'retailer' ? '2px solid #ef4444' : '1px solid #e5e7eb',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <FaStore /> Retailer
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
        <OnboardingActionButton onClick={onSkip} variant="secondary" style={{ marginRight: 10 }}>
          Skip for now
        </OnboardingActionButton>
        <OnboardingActionButton onClick={onContinue}>Continue</OnboardingActionButton>
      </div>
    </div>
  )
}

function AddressStep({ address, addressDone, saving, hideBack, allowSkip, onBack, onChange, onSave, onSkip }) {
  return (
    <>
      {!hideBack && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={onBack}
            style={{ background: 'transparent', border: 'none', padding: 0, color: '#71717a', cursor: 'pointer' }}
          >
            ← Back to role
          </button>
        </div>
      )}

      <AddressForm value={address} onChange={onChange} disabled={saving} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        {allowSkip ? (
          <OnboardingActionButton onClick={onSkip} variant="secondary" style={{ marginRight: 10 }}>
            Skip for now
          </OnboardingActionButton>
        ) : null}
        <OnboardingActionButton onClick={onSave} disabled={!addressDone || saving}>
          {saving ? 'Saving…' : 'Save & Continue'}
        </OnboardingActionButton>
      </div>
    </>
  )
}

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
    return (
      a.name &&
      a.phone &&
      a.addressLine &&
      a.city &&
      a.state &&
      a.pincode
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

        // Prefill role from existing user unless this is address-only checkout setup.
        if (me?.role === 'retailer' && !addressOnly) setRole('retailer')
        else setRole('customer')

        // Prefill address if it exists (default/first)
        const list = Array.isArray(me?.savedAddresses) ? me.savedAddresses : []
        const def = list.find(a => a?.default) || list[0] || {}
        setAddress({
          name: def.name || me?.name || '',
          phone: def.phone || me?.phone || '',
          addressLine: def.addressLine || '',
          city: def.city || '',
          state: def.state || '',
          pincode: def.pincode || '',
        })

        // If user already has an address and role, no need to stay here
        if (list.length > 0 && (me?.role === 'customer' || me?.role === 'retailer')) {
          // Keep page available for edits, but don't force it.
        }
      } catch {
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleSave() {
    if (!token) return
    setSaving(true)
    try {
      const res = await updateProfile(
        {
          role,
          name: address?.name,
          phone: address?.phone,
          savedAddress: address,
        },
        token
      )

      // If backend returns a new token (when role changed), refresh auth with it
      const newToken = res?.data?.token
      if (newToken) {
        await refreshMe?.(newToken)
      } else {
        await refreshMe?.(token)
      }

      navigate(next || '/', { replace: true })
    } catch (e) {
      alert(e?.message || 'Failed to save details')
    } finally {
      setSaving(false)
    }
  }

  function handleSkip() {
    navigate(next || '/', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <Navbar />

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#71717a' }}>
            <span>Step {currentStep} of {stepCount}</span>
            <span>{progressPct}%</span>
          </div>
          <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: '#ef4444' }} />
          </div>

          <h1 style={{ margin: '14px 0 6px' }}>{addressOnly ? 'Add your delivery details' : 'Complete your profile'}</h1>
          <p style={{ marginTop: 0, color: '#555' }}>
            {addressOnly
              ? 'Add your contact information and delivery address to continue checkout.'
              : 'Choose your role and save your delivery address. Checkout will auto-fill this later.'}
          </p>

          {loading ? (
            <div style={{ padding: 12 }}>Loading…</div>
          ) : null}
          {!loading && !addressOnly && step === 1 ? (
            <RoleStep
              role={role}
              onChooseCustomer={() => setRole('customer')}
              onChooseRetailer={() => setRole('retailer')}
              onContinue={() => setStep(2)}
              onSkip={handleSkip}
            />
          ) : null}
          {!loading && (addressOnly || step === 2) ? (
            <AddressStep
              address={address}
              addressDone={addressDone}
              saving={saving}
              hideBack={addressOnly}
              allowSkip={!addressOnly}
              onBack={() => setStep(1)}
              onChange={setAddress}
              onSave={handleSave}
              onSkip={handleSkip}
            />
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  )
}
