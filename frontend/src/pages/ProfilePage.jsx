import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { profile, updateProfile, uploadProfilePhoto } from '../services/auth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './ProfilePage.css'

export default function ProfilePage() {
  const { token, user: authUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handlePhotoChange(e) {
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

    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  async function handlePhotoUpload() {
    const fileInput = document.getElementById('photo-upload')
    const file = fileInput?.files?.[0]
    if (!file) {
      setError('Please select a photo')
      return
    }

    try {
      setUploadingPhoto(true)
      setError('')
      const res = await uploadProfilePhoto(file, token)
      setUser(res.data)
      setPhotoPreview(res.data.profilePhoto)
      setSuccess('Profile photo updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
      fileInput.value = ''
    } catch (err) {
      setError(err.message || 'Failed to upload photo')
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

  async function handleLogout() {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '40px', textAlign: 'center' }}>Failed to load profile</div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="profile-page">
      <Navbar />
      
      <main className="profile-main">
        <div className="profile-header">
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Manage your account settings and information</p>
        </div>

        {error && (
          <div className="profile-alert error">{error}</div>
        )}

        {success && (
          <div className="profile-alert success">{success}</div>
        )}

        <div className="profile-card">
          <div className="profile-header-section">
            <div className="profile-avatar-wrapper">
              <img
                src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=120&background=random`}
                alt="Profile"
                className="profile-avatar"
              />
              {editing && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ fontSize: '14px' }}
                  />
                  <button
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto || !photoPreview || photoPreview === user.profilePhoto}
                    style={{
                      marginTop: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                      opacity: (uploadingPhoto || !photoPreview || photoPreview === user.profilePhoto) ? 0.5 : 1
                    }}
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </button>
                </div>
              )}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{user.name}</h2>
              <p className="profile-email">{user.email}</p>
              <span className={`profile-role-badge ${user.role === 'retailer' ? 'retailer' : 'customer'}`}>
                {user.role === 'retailer' ? 'Retailer' : 'Customer'}
              </span>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="profile-form-group">
              <label className="profile-form-label">Name</label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="profile-form-input"
                />
              ) : (
                <div className="profile-form-display">{user.name || 'Not set'}</div>
              )}
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Email</label>
              <div className="profile-form-display" style={{ color: '#6b7280' }}>
                {user.email} <span style={{ fontSize: '12px' }}>(read-only)</span>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="profile-form-input"
                />
              ) : (
                <div className="profile-form-display">{user.phone || 'Not set'}</div>
              )}
            </div>
          </div>

          <div style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '0.875rem 1.5rem',
                    backgroundColor: saving ? '#9ca3af' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = '#1e40af'
                      e.currentTarget.style.transform = 'scale(1.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = '#2563eb'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData({ name: user.name || '', phone: user.phone || '' })
                    setPhotoPreview(user.profilePhoto || null)
                    setError('')
                  }}
                  disabled={saving}
                  style={{
                    padding: '0.875rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '0.875rem 1.5rem',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e40af'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  style={{
                    padding: '0.875rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#10b981'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  View Orders
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.875rem 1.5rem',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

