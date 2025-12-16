import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { profile, updateProfile, uploadProfilePhoto } from '../services/auth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './ProfilePage.css'

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
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

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
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
      const res = await updateProfile(formData, token)
      setUser(res.data)
      setEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setFormData({ name: user.name || '', phone: user.phone || '' })
    setPhotoPreview(user.profilePhoto || null)
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

              <div className="header-info">
                <div className="header-top">
                  <h1 className="user-name">{user.name}</h1>
                  <span className={`role-badge ${user.role === 'retailer' ? 'badge-gold' : 'badge-blue'}`}>
                    {user.role === 'retailer' ? 'Retailer' : 'Customer'}
                  </span>
                </div>
                <p className="user-email">{user.email}</p>
                {success && <div className="alert-toast success">✓ {success}</div>}
                {error && <div className="alert-toast error">⚠ {error}</div>}
              </div>

              <div className="header-actions">
                {!editing ? (
                  <button className="btn-edit-mode" onClick={() => setEditing(true)}>
                    Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="btn-cancel" onClick={handleCancel} disabled={saving}>
                      Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
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
                    <label>Full Name</label>
                    {editing ? (
                      <input
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
                    <label>Phone Number</label>
                    {editing ? (
                      <input
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
                    <label>Email Address</label>
                    <div className="value-display disabled">{user.email}</div>
                  </div>
                </div>
              </div>

              {/* Right: Quick Actions & Stats */}
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

                  <button className="action-card logout" onClick={() => signOut()}>
                    <span className="ac-icon">🚪</span>
                    <div className="ac-text">
                      <strong>Logout</strong>
                      <small>Sign out of device</small>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}