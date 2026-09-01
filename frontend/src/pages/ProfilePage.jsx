import React, { useState, useEffect, useRef, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePurchaseMode } from '../hooks/usePurchaseMode'
import ShopContext from '../context/ShopContext.jsx'
import { profile, updateProfile, uploadProfilePhoto, requestRetailerRole } from '../services/auth'
import AddressForm from '../components/AddressForm.jsx'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SEO from '../components/SEO'
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCamera,
  FiEdit2,
  FiCheck,
  FiX,
  FiShoppingBag,
  FiShield,
  FiLogOut,
  FiBriefcase,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiTrash2,
  FiStar
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import './ProfilePage.css'

export default function ProfilePage() {
  const { token, signOut, refreshMe } = useAuth()
  const { mode, setMode, canSwitchMode } = usePurchaseMode()
  const { wipeCart } = useContext(ShopContext)
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [modeSwitchBusy, setModeSwitchBusy] = useState(false)

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  // Tabs: 'details' | 'addresses' | 'retailer'
  const [activeTab, setActiveTab] = useState('details')

  // Form State
  const [formData, setFormData] = useState({ name: '', phone: '' })

  // Address Modal/Editor State
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState({})
  const [savingAddress, setSavingAddress] = useState(false)

  // Retailer Application Form
  const [retailerForm, setRetailerForm] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    shopAddress: '',
    businessProof: ''
  })
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
    } catch (err) {
      console.error(err)
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    try {
      setUploadingPhoto(true)
      const res = await uploadProfilePhoto(file, token)
      setUser(res.data)
      toast.success('Profile avatar updated!')
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      const res = await updateProfile(formData, token)
      setUser(res.data)
      setEditingProfile(false)
      await refreshMe?.(token)
      toast.success('Profile details updated!')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Address Actions
  const handleOpenAddAddress = () => {
    setEditingAddress({
      name: user?.name || '',
      phone: user?.phone || '',
      addressLine: '',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      default: (user?.savedAddresses?.length || 0) === 0
    })
    setAddressModalOpen(true)
  }

  const handleOpenEditAddress = (addr) => {
    setEditingAddress({ ...addr })
    setAddressModalOpen(true)
  }

  const handleSaveAddressModal = async () => {
    if (!editingAddress.name?.trim() || !editingAddress.phone?.trim() || !editingAddress.addressLine?.trim()) {
      toast.error('Please enter name, phone, and street address')
      return
    }

    setSavingAddress(true)
    try {
      const normalized = {
        _id: editingAddress._id,
        name: editingAddress.name.trim(),
        phone: editingAddress.phone.trim(),
        addressLine: editingAddress.addressLine.trim(),
        city: (editingAddress.city || 'Indore').trim(),
        state: (editingAddress.state || 'Madhya Pradesh').trim(),
        pincode: (editingAddress.pincode || '452001').trim(),
        default: !!editingAddress.default
      }

      const res = await updateProfile({ savedAddress: normalized }, token)
      setUser(res.data)
      await refreshMe?.(token)
      setAddressModalOpen(false)
      toast.success(editingAddress._id ? 'Address updated!' : 'New address added!')
    } catch (err) {
      toast.error(err.message || 'Failed to save address')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this delivery address?')) return
    try {
      const res = await updateProfile({ deleteAddressId: addressId }, token)
      setUser(res.data)
      await refreshMe?.(token)
      toast.success('Address deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete address')
    }
  }

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const res = await updateProfile({ setDefaultAddressId: addressId }, token)
      setUser(res.data)
      await refreshMe?.(token)
      toast.success('Default delivery address updated!')
    } catch (err) {
      toast.error(err.message || 'Failed to set default address')
    }
  }

  const handleRetailerSubmit = async (e) => {
    e.preventDefault()
    try {
      setRequestingRetailer(true)
      const res = await requestRetailerRole(retailerForm, token)
      setUser(res.data)
      toast.success('Retailer application submitted for verification!')
    } catch (err) {
      toast.error(err.message || 'Failed to submit retailer request')
    } finally {
      setRequestingRetailer(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-loading-screen">Loading Profile…</div>
        <Footer />
      </div>
    )
  }

  const isRetailer = user?.role === 'retailer'
  const isCooldown = user?.retailerRequestCooldown && new Date() < new Date(user.retailerRequestCooldown)
  const savedAddresses = Array.isArray(user?.savedAddresses) ? user.savedAddresses : []

  return (
    <div className="profile-page">
      <SEO
        title="Account Settings & Saved Addresses | KripaConnect"
        description="Manage your KripaConnect account settings, delivery addresses, security, and wholesale permissions."
        canonical="/profile"
        robots="noindex, nofollow"
      />
      <Navbar />

      <main className="profile-container">
        {/* Profile Hero Header Card */}
        <section className="profile-hero-card">
          <div className="profile-hero-avatar-wrap">
            <img
              src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=FF3D3D&color=fff&size=200`}
              alt={user?.name || 'User Profile'}
              className="profile-avatar-img"
            />
            <button
              type="button"
              className="profile-avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Change Profile Photo"
            >
              <FiCamera />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <div className="profile-hero-info">
            <div className="profile-name-row">
              <h1 className="profile-name">{user?.name || 'Customer'}</h1>
              {isRetailer ? (
                <span className="profile-role-badge is-retailer">
                  <FiBriefcase /> Retailer B2B Partner
                </span>
              ) : (
                <span className="profile-role-badge is-customer">
                  <FiShield /> Verified Customer
                </span>
              )}
            </div>
            <div className="profile-email-row">
              <FiMail /> {user?.email}
              {user?.phone && <span>• <FiPhone /> {user.phone}</span>}
            </div>
          </div>

          <div className="profile-hero-actions">
            {isRetailer && (
              <button
                type="button"
                className="profile-quick-btn profile-quick-btn--b2b"
                onClick={() => navigate('/b2b')}
              >
                <FiBriefcase /> B2B Wholesale Hub
              </button>
            )}
            <button
              type="button"
              className="profile-quick-btn"
              onClick={() => navigate('/orders')}
            >
              <FiShoppingBag /> My Orders
            </button>
            <button
              type="button"
              className="profile-quick-btn profile-quick-btn--logout"
              onClick={() => {
                signOut()
                toast.success('Signed out successfully')
              }}
            >
              <FiLogOut /> Sign Out
            </button>
          </div>
        </section>

        {/* Prominent Purchase Mode Changer Card */}
        <section className="profile-mode-spotlight-card">
          <div className="profile-mode-spotlight-left">
            <div className="profile-mode-badge-wrap">
              <span className={`profile-mode-indicator ${mode === 'retailer' ? 'is-bulk' : 'is-cust'}`}>
                {mode === 'retailer' ? <FiBriefcase /> : <FiShield />}
                <strong>{mode === 'retailer' ? 'Retailer Bulk Mode Active' : 'Customer Mode Active'}</strong>
              </span>
            </div>
            <h3 className="profile-mode-spotlight-title">Store Pricing & Sourcing Mode</h3>
            <p className="profile-mode-spotlight-desc">
              {mode === 'retailer'
                ? 'Browsing with wholesale master carton pricing, bulk quantity tiers, and GST ITC credit invoices enabled.'
                : 'Browsing individual consumer products with standard retail pricing and 10-15 minute doorstep delivery.'}
            </p>
            {mode === 'retailer' && (
              <div style={{ marginTop: '10px' }}>
                <Link to="/b2b" className="profile-mode-open-portal-link">
                  <FiBriefcase /> Open B2B Wholesale Portal & Invoices →
                </Link>
              </div>
            )}
          </div>

          <div className="profile-mode-spotlight-right">
            {canSwitchMode ? (
              <div className="profile-mode-btn-group">
                <button
                  type="button"
                  className={`profile-mode-choice-btn ${mode === 'customer' ? 'active' : ''}`}
                  onClick={async () => {
                    if (mode === 'customer' || modeSwitchBusy) return
                    if (window.confirm('Switch to Customer Mode? Your cart will be cleared to prevent mixed-tier orders.')) {
                      setModeSwitchBusy(true)
                      try {
                        await wipeCart()
                        setMode('customer')
                        toast.success('Switched to Customer Mode')
                      } finally {
                        setModeSwitchBusy(false)
                      }
                    }
                  }}
                  disabled={modeSwitchBusy}
                >
                  <FiShield />
                  <span>Customer (Retail)</span>
                </button>

                <button
                  type="button"
                  className={`profile-mode-choice-btn is-retail-btn ${mode === 'retailer' ? 'active' : ''}`}
                  onClick={async () => {
                    if (mode === 'retailer' || modeSwitchBusy) return
                    if (window.confirm('Switch to Retailer B2B Mode? Your cart will be cleared to prevent mixed-tier orders.')) {
                      setModeSwitchBusy(true)
                      try {
                        await wipeCart()
                        setMode('retailer')
                        toast.success('Switched to Retailer B2B Wholesale Mode')
                      } finally {
                        setModeSwitchBusy(false)
                      }
                    }
                  }}
                  disabled={modeSwitchBusy}
                >
                  <FiBriefcase />
                  <span>Retailer (Bulk B2B)</span>
                </button>
              </div>
            ) : (
              <div className="profile-mode-upgrade-box">
                <button
                  type="button"
                  className="profile-mode-apply-btn"
                  onClick={() => setActiveTab('retailer')}
                >
                  <FiBriefcase />
                  <span>Apply for B2B Retailer Access →</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Tab Navigation */}
        <nav className="profile-tab-nav" role="tablist">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'details' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('details')}
            role="tab"
          >
            <FiUser /> Personal Details
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'addresses' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('addresses')}
            role="tab"
          >
            <FiMapPin /> Saved Addresses ({savedAddresses.length})
          </button>
          {!isRetailer && (
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'retailer' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('retailer')}
              role="tab"
            >
              <FiBriefcase /> Retailer B2B Access
            </button>
          )}
        </nav>

        {/* TAB 1: Personal Details */}
        {activeTab === 'details' && (
          <div className="profile-card fade-in">
            <div className="profile-card-top">
              <div>
                <h2 className="profile-card-title">Personal Profile Information</h2>
                <p className="profile-card-sub">Update your primary contact details.</p>
              </div>

              {!editingProfile ? (
                <button
                  type="button"
                  className="profile-btn-edit"
                  onClick={() => setEditingProfile(true)}
                >
                  <FiEdit2 /> Edit Details
                </button>
              ) : (
                <div className="profile-edit-actions">
                  <button
                    type="button"
                    className="profile-btn-cancel"
                    onClick={() => setEditingProfile(false)}
                    disabled={savingProfile}
                  >
                    <FiX /> Cancel
                  </button>
                  <button
                    type="button"
                    className="profile-btn-save"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    <FiCheck /> {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <div className="profile-fields-grid">
              <div className="profile-field-group">
                <label>Full Name</label>
                {editingProfile ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="profile-input"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="profile-field-static">{user?.name || 'Not provided'}</div>
                )}
              </div>

              <div className="profile-field-group">
                <label>Email Address</label>
                <div className="profile-field-static is-readonly">
                  {user?.email} <span className="profile-readonly-pill">Fixed ID</span>
                </div>
              </div>

              <div className="profile-field-group">
                <label>Contact Phone Number</label>
                {editingProfile ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="profile-input"
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                  />
                ) : (
                  <div className="profile-field-static">{user?.phone || 'Not provided'}</div>
                )}
              </div>
            </div>

            {/* Shopping & Purchase Mode Setting */}
            {canSwitchMode && (
              <div className="profile-purchase-mode-card">
                <div className="profile-mode-text">
                  <h3>Purchase & Shopping Mode</h3>
                  <p>Choose whether to browse store at retail prices or wholesale master carton bulk rates.</p>
                </div>

                <div className="profile-mode-selector-row">
                  <button
                    type="button"
                    className={`profile-mode-toggle-btn ${mode === 'customer' ? 'is-active' : ''}`}
                    onClick={async () => {
                      if (mode === 'customer' || modeSwitchBusy) return
                      if (window.confirm('Switch to Customer Mode? Your cart will be cleared to avoid mixed pricing.')) {
                        setModeSwitchBusy(true)
                        try {
                          await wipeCart()
                          setMode('customer')
                          toast.success('Switched to Customer Mode')
                        } finally {
                          setModeSwitchBusy(false)
                        }
                      }
                    }}
                    disabled={modeSwitchBusy}
                  >
                    <FiShield />
                    <span>Customer Mode (Individual)</span>
                  </button>

                  <button
                    type="button"
                    className={`profile-mode-toggle-btn is-retailer-btn ${mode === 'retailer' ? 'is-active' : ''}`}
                    onClick={async () => {
                      if (mode === 'retailer' || modeSwitchBusy) return
                      if (window.confirm('Switch to Retailer B2B Mode? Your cart will be cleared to avoid mixed pricing.')) {
                        setModeSwitchBusy(true)
                        try {
                          await wipeCart()
                          setMode('retailer')
                          toast.success('Switched to Retailer B2B Mode')
                        } finally {
                          setModeSwitchBusy(false)
                        }
                      }
                    }}
                    disabled={modeSwitchBusy}
                  >
                    <FiBriefcase />
                    <span>Retailer Mode (Bulk / ITC GST)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Multiple Saved Addresses Manager */}
        {activeTab === 'addresses' && (
          <div className="profile-card fade-in">
            <div className="profile-card-top">
              <div>
                <h2 className="profile-card-title">Delivery Addresses</h2>
                <p className="profile-card-sub">Save multiple home, office, or depot addresses for instant checkout.</p>
              </div>

              <button
                type="button"
                className="profile-btn-add-addr"
                onClick={handleOpenAddAddress}
              >
                <FiPlus /> Add New Address
              </button>
            </div>

            {savedAddresses.length === 0 ? (
              <div className="profile-no-address">
                <FiMapPin className="profile-no-address-icon" />
                <p>You have no saved addresses yet.</p>
                <button
                  type="button"
                  className="profile-btn-save"
                  onClick={handleOpenAddAddress}
                >
                  <FiPlus /> Add Your First Delivery Address
                </button>
              </div>
            ) : (
              <div className="profile-address-cards-grid">
                {savedAddresses.map((addr, idx) => (
                  <div key={addr._id || idx} className={`profile-addr-card ${addr.default ? 'is-default' : ''}`}>
                    <div className="profile-addr-card-top">
                      <div className="profile-addr-card-name-row">
                        <strong>{addr.name}</strong>
                        {addr.default && (
                          <span className="profile-addr-default-badge">
                            <FiStar /> Default Address
                          </span>
                        )}
                      </div>

                      <div className="profile-addr-card-actions">
                        <button
                          type="button"
                          className="profile-addr-action-btn"
                          onClick={() => handleOpenEditAddress(addr)}
                          title="Edit address"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          className="profile-addr-action-btn is-delete"
                          onClick={() => handleDeleteAddress(addr._id)}
                          title="Delete address"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    <div className="profile-addr-card-body">
                      <div>{addr.addressLine}</div>
                      <div>{addr.city}, {addr.state} - <strong>{addr.pincode}</strong></div>
                      <div className="profile-addr-card-phone">📞 {addr.phone}</div>
                    </div>

                    {!addr.default && (
                      <div className="profile-addr-card-footer">
                        <button
                          type="button"
                          className="profile-btn-set-default"
                          onClick={() => handleSetDefaultAddress(addr._id)}
                        >
                          Set as Default
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Retailer B2B Application */}
        {activeTab === 'retailer' && !isRetailer && (
          <div className="profile-card fade-in">
            <div className="profile-card-top">
              <div>
                <h2 className="profile-card-title">Apply for Retailer Wholesale Access</h2>
                <p className="profile-card-sub">
                  Unlock Tier-1 wholesale bulk pricing, live dealer margins, and priority freight consignments.
                </p>
              </div>
            </div>

            {user?.retailerRequestStatus === 'pending' ? (
              <div className="profile-retailer-status-box is-pending">
                <FiClock className="profile-status-icon" />
                <div>
                  <strong>Application Under Review</strong>
                  <p>Our business verification team is evaluating your application. You will be notified shortly.</p>
                </div>
              </div>
            ) : isCooldown ? (
              <div className="profile-retailer-status-box is-rejected">
                <FiAlertCircle className="profile-status-icon" />
                <div>
                  <strong>Application Rejected</strong>
                  <p>You may submit a revised application once the cooldown window has elapsed.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRetailerSubmit} className="profile-retailer-form">
                <div className="profile-form-grid">
                  <div className="profile-field-group">
                    <label>Retail Shop / Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sharma Electronics & Appliances"
                      value={retailerForm.shopName}
                      onChange={(e) => setRetailerForm({ ...retailerForm, shopName: e.target.value })}
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-field-group">
                    <label>Proprietor / Owner Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={retailerForm.ownerName}
                      onChange={(e) => setRetailerForm({ ...retailerForm, ownerName: e.target.value })}
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-field-group">
                    <label>Business Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={retailerForm.phone}
                      onChange={(e) => setRetailerForm({ ...retailerForm, phone: e.target.value })}
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-field-group">
                    <label>GSTIN or Business Registration (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 23AAAAA0000A1Z5"
                      value={retailerForm.businessProof}
                      onChange={(e) => setRetailerForm({ ...retailerForm, businessProof: e.target.value })}
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Commercial Shop Address *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Full shop / warehouse address"
                      value={retailerForm.shopAddress}
                      onChange={(e) => setRetailerForm({ ...retailerForm, shopAddress: e.target.value })}
                      className="profile-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="profile-btn-save"
                  disabled={requestingRetailer}
                  style={{ marginTop: 20 }}
                >
                  {requestingRetailer ? 'Submitting Application…' : 'Submit Retailer Application'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Address Modal */}
      {addressModalOpen && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal-card">
            <div className="profile-modal-header">
              <h3>{editingAddress._id ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h3>
              <button
                type="button"
                className="profile-modal-close-btn"
                onClick={() => setAddressModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <AddressForm
              value={editingAddress}
              onChange={setEditingAddress}
              disabled={savingAddress}
            />

            <div className="profile-modal-footer">
              <button
                type="button"
                className="profile-btn-cancel"
                onClick={() => setAddressModalOpen(false)}
                disabled={savingAddress}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-btn-save"
                onClick={handleSaveAddressModal}
                disabled={savingAddress}
              >
                {savingAddress ? 'Saving…' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}