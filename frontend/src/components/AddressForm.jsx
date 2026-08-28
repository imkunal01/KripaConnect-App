import { useEffect, useRef } from 'react'
import './AddressForm.css'

const INDORE_AREAS = [
  'Vijay Nagar',
  'Palasia',
  'Bhawarkua',
  'Rajwada',
  'Sudama Nagar',
  'Annapurna',
  'Bicholi Mardana',
  'Rau',
  'Super Corridor',
  'Geeta Bhawan'
]

export default function AddressForm({ value, onChange, disabled }) {
  const v = value || {}
  const addressInputRef = useRef(null)

  function setField(key, val) {
    onChange({ ...v, [key]: val })
  }

  // Pre-fill city and state defaults for single-city Indore operation
  useEffect(() => {
    const updates = {}
    if (!v.city) updates.city = 'Indore'
    if (!v.state) updates.state = 'Madhya Pradesh'
    if (Object.keys(updates).length > 0) {
      onChange({ ...v, ...updates })
    }
  }, [])

  // Optional Google Places Autocomplete if API Key is configured in environment
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey || typeof window === 'undefined') return

    if (!window.google?.maps?.places) {
      const scriptId = 'google-maps-places-script'
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script')
        script.id = scriptId
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.onload = initPlacesAutocomplete
        document.head.appendChild(script)
      }
    } else {
      initPlacesAutocomplete()
    }

    function initPlacesAutocomplete() {
      if (!addressInputRef.current || !window.google?.maps?.places) return
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'in' },
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place?.formatted_address) {
          onChange({
            ...v,
            addressLine: place.formatted_address,
            city: v.city || 'Indore',
            state: v.state || 'Madhya Pradesh',
          })
        }
      })
    }
  }, [onChange, v])

  function handleQuickArea(area) {
    const current = v.addressLine || ''
    if (!current) {
      setField('addressLine', area)
    } else if (!current.includes(area)) {
      setField('addressLine', `${current}, ${area}`)
    }
  }

  return (
    <div className="address-form">
      <div className="city-delivery-badge">
        <span className="badge-dot" />
        <span>Delivering across <strong>Indore, Madhya Pradesh</strong></span>
      </div>

      <div className="field">
        <label>Full Name</label>
        <input
          value={v.name || ''}
          onChange={e => setField('name', e.target.value)}
          disabled={disabled}
          placeholder="e.g. Rahul Sharma"
        />
      </div>

      <div className="field">
        <label>Phone Number</label>
        <input
          value={v.phone || ''}
          onChange={e => setField('phone', e.target.value)}
          disabled={disabled}
          placeholder="e.g. 9876543210"
          type="tel"
        />
      </div>

      <div className="field">
        <label>Delivery Address / Street / Building</label>
        <input
          ref={addressInputRef}
          value={v.addressLine || ''}
          onChange={e => setField('addressLine', e.target.value)}
          disabled={disabled}
          placeholder="Flat / House No., Landmark, Street"
        />
      </div>

      <div className="quick-areas">
        <span className="quick-areas-label">Popular Localities:</span>
        <div className="quick-areas-chips">
          {INDORE_AREAS.map(area => (
            <button
              key={area}
              type="button"
              className={`area-chip ${v.addressLine?.includes(area) ? 'active' : ''}`}
              onClick={() => handleQuickArea(area)}
              disabled={disabled}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>City</label>
          <input
            value={v.city || 'Indore'}
            onChange={e => setField('city', e.target.value)}
            disabled={disabled}
            placeholder="Indore"
          />
        </div>

        <div className="field">
          <label>State</label>
          <input
            value={v.state || 'Madhya Pradesh'}
            onChange={e => setField('state', e.target.value)}
            disabled={disabled}
            placeholder="Madhya Pradesh"
          />
        </div>
      </div>
    </div>
  )
}
