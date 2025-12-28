import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaUserAlt, FaStore } from 'react-icons/fa'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AddressForm from '../components/AddressForm.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { profile, updateProfile } from '../services/auth'

export default function OnboardingPage() {
  const { token, user, refreshMe } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState(1)
  const [role, setRole] = useState('customer')
  const [address, setAddress] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const progressPct = step === 1 ? 50 : 100

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

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    async function load() {
      try {
        setLoading(true)
        const me = user?._id ? user : (await profile(token)).data

        // Prefill role from existing user (default is customer)
        if (me?.role === 'retailer') setRole('retailer')
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

      const params = new URLSearchParams(location.search || '')
      const next = params.get('next')
      navigate(next || '/', { replace: true })
    } catch (e) {
      alert(e?.message || 'Failed to save details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <Navbar />

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#71717a' }}>
            <span>Step {step} of 2</span>
            <span>{progressPct}%</span>
          </div>
          <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: '#ef4444' }} />
          </div>

          <h1 style={{ margin: '14px 0 6px' }}>Complete your profile</h1>
          <p style={{ marginTop: 0, color: '#555' }}>
            Choose your role and save your delivery address. Checkout will auto-fill this later.
          </p>

          {loading ? (
            <div style={{ padding: 12 }}>Loading…</div>
          ) : step === 1 ? (
            <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
              <div style={{ fontWeight: 700 }}>I am a:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setRole('customer')}
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
                  onClick={() => setRole('retailer')}
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
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#111',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'transparent', border: 'none', padding: 0, color: '#71717a', cursor: 'pointer' }}
                >
                  ← Back to role
                </button>
              </div>

              <AddressForm value={address} onChange={setAddress} disabled={saving} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={!addressDone || saving}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#111',
                    color: '#fff',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: !addressDone || saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Save & Continue'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
