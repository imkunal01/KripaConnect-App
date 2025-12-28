import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AddressForm from '../components/AddressForm.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { profile, updateProfile } from '../services/auth'

export default function AddressSetupPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  // Kept for backwards compatibility; the real flow lives at /onboarding
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    navigate('/onboarding', { replace: true })
  }, [token, navigate])

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
      } catch (e) {
        // If profile fetch fails, send to login
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
      await updateProfile(
        {
          name: address?.name,
          phone: address?.phone,
          savedAddress: address,
        },
        token
      )
      await refreshMe?.(token)
      navigate('/', { replace: true })
    } catch (e) {
      alert(e?.message || 'Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  return null
}
