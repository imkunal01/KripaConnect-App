import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { profile, updateProfile, uploadProfilePhoto, requestRetailerRole } from '../services/auth'
import AddressForm from '../components/AddressForm.jsx'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './ProfilePage.css'

/* eslint-disable react/prop-types */

function getDefaultAddress(user) {
  const list = Array.isArray(user?.savedAddresses) ? user.savedAddresses : []
  return list.find(a => a?.default) || list[0] || null
}

function hasAnyAddressField(a) {
  const v = a || {}
  return !!(
    v.name ||
    v.phone ||
    v.addressLine ||
    v.city ||
    v.state ||
    v.pincode
  )
}

function isAddressComplete(a) {
  const v = a || {}
  return !!(v.name && v.phone && v.addressLine && v.city && v.state && v.pincode)
}

function RetailerRequestPanel({ user, requestingRetailer, onRequestRetailerRole }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    shopName: '', ownerName: '', phone: '', shopAddress: '', businessProof: ''
  })

  if (user?.role !== 'customer') return null

  const isCooldown = user.retailerRequestCooldown && new Date() < new Date(user.retailerRequestCooldown)

  const handleSubmit = (e) => {
    e.preventDefault()
    onRequestRetailerRole(formData)
  }

  return (
    <div style={{ marginBottom: 10, width: '100%' }}>
      {user.retailerRequestStatus === 'pending' ? (
        <span className="adminBadge adminBadge--ok">Retailer request pending review</span>
      ) : isCooldown ? (
        <span className="adminBadge adminBadge--danger">
          Request rejected. You can apply again in {Math.round((new Date(user.retailerRequestCooldown) - new Date()) / 60000)} mins
        </span>
      ) : !showForm ? (
        <button className="btn-edit-mode" onClick={() => setShowForm(true)} disabled={requestingRetailer}>
          Request Retailer Access
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 16 }}>
          <h4 style={{ gridColumn: '1 / -1', margin: '0 0 10px', color: 'var(--profile-text)' }}>Apply for Retailer Role</h4>
          <div className="form-group">
            <label>Shop Name</label>
            <input className="input-modern" required placeholder="Enter shop name" value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Owner Name</label>
            <input className="input-modern" required placeholder="Enter owner name" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input className="input-modern" required placeholder="Enter shop phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Business Proof (URL/GST)</label>
            <input className="input-modern" placeholder="Enter business proof" value={formData.businessProof} onChange={e => setFormData({...formData, businessProof: e.target.value})} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Shop Address</label>
            <textarea className="input-modern" required rows={3} placeholder="Full shop address" value={formData.shopAddress} onChange={e => setFormData({...formData, shopAddress: e.target.value})} />
          </div>
          <div className="edit-actions" style={{ gridColumn: '1 / -1', marginTop: 8 }}>
            <button type="submit" className="btn-save" disabled={requestingRetailer}>
              {requestingRetailer ? 'Submitting...' : 'Submit Request'}
            </button>
            <button type="button" className="btn-cancel" onClick={() => setShowForm(false)} disabled={requestingRetailer}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function ProfileQuickActions({ user, navigate, signOut, requestingRetailer, onRequestRetailerRole }) {
  return (
    <div className="actions-section">
      <h3>Quick Actions</h3>
      <div className="action-cards">
        <button className="action-card" onClick={() => navigate('/orders')}>
          <span className="ac-icon">📦</span>
          <div className="ac-text">
            <strong>My Orders</strong>
            <small>Track & Return</small>
          </div>
          <span className="ac-arrow">&rarr;</span>
        </button>

        <RetailerRequestPanel
          user={user}
          requestingRetailer={requestingRetailer}
          onRequestRetailerRole={onRequestRetailerRole}
        />

        <button className="action-card logout" onClick={() => signOut()}>
          <span className="ac-icon">🚪</span>
          <div className="ac-text">
            <strong>Logout</strong>
            <small>Sign out of device</small>
          </div>
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { token, signOut } = useAuth()
  const navigate = useNavigate()
  
  // Refs for cleaner DOM manipulation
  const fileInputRef = useRef(null)

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Feedback states
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form Data
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [addressData, setAddressData] = useState({})
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [requestingRetailer, setRequestingRetailer] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadProfile()
  }, [token, navigate])

  async function loadProfile() {
    try {
      setLoading(true)
      const res = await profile(token)
      const userData = res.data
      setUser(userData)
      setFormData({ name: userData.name || '', phone: userData.phone || '' })
      setPhotoPreview(userData.profilePhoto || null)

      const def = getDefaultAddress(userData)
      setAddressData({
        name: def?.name || userData.name || '',
        phone: def?.phone || userData.phone || '',
        addressLine: def?.addressLine || '',
        city: def?.city || '',
        state: def?.state || '',
        pincode: def?.pincode || '',
      })
    } catch (err) {
      console.error(err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Keep address phone in sync with profile phone
    if (name === 'phone') {
      setAddressData(prev => ({ ...prev, phone: value }))
    }
  }

  function handleAddressChange(next) {
    setAddressData(next)
    // Keep profile phone in sync with address phone
    if (next?.phone !== undefined) {
      setFormData(prev => ({ ...prev, phone: next.phone }))
    }
  }

  // Handle File Selection
  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)

    // Trigger upload immediately (optional, or wait for save)
    // Here we stick to your logic: explicit upload action or auto-upload?
    // Let's keep it simple: Select -> Button appears to confirm upload, or auto upload.
    // For better UX: We'll set the file to state, but let the user click "Save" to finalize everything,
    // OR keep the separate upload button if that's the backend requirement.
    // Based on your previous code, let's auto-upload on selection for a snappy feel? 
    // Actually, sticking to your previous "Upload" button logic is safer for errors, 
    // but let's make it smoother:
    handlePhotoUpload(file) 
  }

  async function handlePhotoUpload(file) {
    try {
      setUploadingPhoto(true)
      setError('')
      const res = await uploadProfilePhoto(file, token)
      setUser(res.data)
      setPhotoPreview(res.data.profilePhoto)
      setSuccess('Photo updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to upload photo')
      // Revert preview if failed
      setPhotoPreview(user.profilePhoto)
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError('')

      const payload = { ...formData }
      if (hasAnyAddressField(addressData)) {
        if (!isAddressComplete(addressData)) {
          throw new Error('Please complete all address fields (name, phone, address, city, state, pincode).')
        }
        payload.savedAddress = addressData
      }

      const res = await updateProfile(payload, token)
      const updated = res.data
      setUser(updated)
      setFormData({ name: updated.name || '', phone: updated.phone || '' })
      const def = getDefaultAddress(updated)
      setAddressData({
        name: def?.name || updated.name || '',
        phone: def?.phone || updated.phone || '',
        addressLine: def?.addressLine || '',
        city: def?.city || '',
        state: def?.state || '',
        pincode: def?.pincode || '',
      })
      setEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleRequestRetailerRole(payload) {
    try {
      setRequestingRetailer(true)
      setError('')
      const res = await requestRetailerRole(payload, token)
      setUser(res.data)
      setSuccess('Retailer request submitted!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to submit retailer request')
    } finally {
      setRequestingRetailer(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setFormData({ name: user.name || '', phone: user.phone || '' })
    setPhotoPreview(user.profilePhoto || null)
    const def = getDefaultAddress(user)
    setAddressData({
      name: def?.name || user.name || '',
      phone: def?.phone || user.phone || '',
      addressLine: def?.addressLine || '',
      city: def?.city || '',
      state: def?.state || '',
      pincode: def?.pincode || '',
    })
    setError('')
  }

  if (loading) return <div className="profile-loading"><div className="spinner"></div></div>

  return (
    <div className="profile-page-modern">
      <Navbar />
      
      <main className="profile-layout">
        
        {/* Banner Section */}
        <div className="profile-banner">
          <div className="banner-overlay" />
        </div>

        <div className="profile-container">
          
          {/* Main Card */}
          <div className="profile-card-modern">
            
            {/* Header: Avatar & Main Info */}
            <div className="profile-header-modern">
              <div className="avatar-wrapper">
                <img
                  src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
                  alt="Profile"
                  className="avatar-img"
                />
                
                {/* Photo Edit Trigger */}
                {editing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      hidden
                    />
                    <button 
                      className="avatar-edit-btn" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? '⏳' : '📷'}
                    </button>
                  </>
                )}
              </div>

              <div className="header-info" aria-label="User Information">
                <div className="header-top">
                  <h1 className="user-name">{user.name}</h1>
                  <span className={`role-badge ${user.role === 'retailer' ? 'badge-gold' : 'badge-blue'}`}>
                    {user.role === 'retailer' ? 'Retailer' : 'Customer'}
                  </span>
                </div>
                <p className="user-email">{user.email}</p>
                <RetailerRequestPanel user={user} requestingRetailer={requestingRetailer} onRequestRetailerRole={handleRequestRetailerRole} />
                {success && <div className="alert-toast success">✓ {success}</div>}
                {error && <div className="alert-toast error">⚠ {error}</div>}
              </div>

              <div className="header-actions">
                {editing ? (
                  <div className="edit-actions">
                    <button className="btn-cancel" onClick={handleCancel} disabled={saving}>
                      Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <button className="btn-edit-mode" onClick={() => setEditing(true)}>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            <hr className="divider" />

            {/* Content Grid */}
            <div className="profile-content-grid">
              
              {/* Left: Personal Details Form */}
              <div className="details-section">
                <h3>Account Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="profile-name">Full Name</label>
                    {editing ? (
                      <input
                        id="profile-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input-modern"
                      />
                    ) : (
                      <div className="value-display">{user.name || 'Not set'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="profile-phone">Phone Number</label>
                    {editing ? (
                      <input
                        id="profile-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91..."
                        className="input-modern"
                      />
                    ) : (
                      <div className="value-display">{user.phone || 'Not provided'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="adminLabel">Email Address</div>
                    <div className="value-display disabled">{user.email}</div>
                  </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <h3>Delivery Address</h3>

                  {editing ? (
                    <AddressForm value={addressData} onChange={handleAddressChange} disabled={saving} />
                  ) : (
                    <div className="value-display">
                      {isAddressComplete(addressData) ? (
                        <>
                          {addressData.name}<br />
                          {addressData.phone}<br />
                          {addressData.addressLine}<br />
                          {addressData.city}, {addressData.state} - {addressData.pincode}
                        </>
                      ) : (
                        'Not set'
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Quick Actions & Stats */}
              <ProfileQuickActions user={user} navigate={navigate} signOut={signOut} requestingRetailer={requestingRetailer} onRequestRetailerRole={handleRequestRetailerRole} />

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}