import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  FiPackage,
  FiDollarSign,
  FiUploadCloud,
  FiX,
  FiLayers,
  FiTag,
  FiEye,
  FiInfo,
  FiCheck,
  FiAlertTriangle,
  FiPercent,
  FiImage
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { createProductAdmin, updateProductAdmin, removeProductImage } from '../../services/admin'
import './ProductModal.css'

const PRESET_TAGS = [
  'Featured',
  'Best Seller',
  'New Arrival',
  'Trending',
  'Hot Deal',
  'Discount',
  'Sale',
  'Top Rated'
]

function makeSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ProductFormModal({
  isOpen,
  onClose,
  product = null,
  categories = [],
  subcategories = [],
  token,
  onSuccess
}) {
  const isEditing = Boolean(product)

  // Form States
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [price, setPrice] = useState('')
  const [retailerPrice, setRetailerPrice] = useState('')
  const [priceBulk, setPriceBulk] = useState('')
  const [minBulkQty, setMinBulkQty] = useState('')
  const [stock, setStock] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [active, setActive] = useState(true)

  // Image States
  const [existingImages, setExistingImages] = useState([])
  const [newImageFiles, setNewImageFiles] = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // UI States
  const [submitting, setSubmitting] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState(null)

  // Initialize or reset form when modal opens / product changes
  useEffect(() => {
    if (!isOpen) return

    if (product) {
      setName(product.name || '')
      setDescription(product.description || '')
      setCategory(product.Category?._id || product.category_id || '')
      setSubcategory(product.subcategory_id?._id || product.subcategory_id || '')
      setPrice(product.price !== undefined ? String(product.price) : '')
      setRetailerPrice(product.retailer_price !== undefined ? String(product.retailer_price) : '')
      setPriceBulk(product.price_bulk !== undefined && product.price_bulk !== null ? String(product.price_bulk) : '')
      setMinBulkQty(product.min_bulk_qty !== undefined && product.min_bulk_qty !== null ? String(product.min_bulk_qty) : '')
      setStock(product.stock !== undefined ? String(product.stock) : '')
      setTags(Array.isArray(product.tags) ? product.tags : typeof product.tags === 'string' ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
      setActive(product.active !== false)
      setExistingImages(Array.isArray(product.images) ? product.images : [])
    } else {
      setName('')
      setDescription('')
      setCategory('')
      setSubcategory('')
      setPrice('')
      setRetailerPrice('')
      setPriceBulk('')
      setMinBulkQty('')
      setStock('')
      setTags([])
      setActive(true)
      setExistingImages([])
    }

    setNewImageFiles([])
    setNewImagePreviews([])
    setTagInput('')
  }, [isOpen, product])

  // Cleanup object URLs on unmount or file change
  useEffect(() => {
    return () => {
      newImagePreviews.forEach(p => URL.revokeObjectURL(p))
    }
  }, [newImagePreviews])

  // Computed Values
  const slug = useMemo(() => makeSlug(name), [name])

  const filteredSubcategories = useMemo(() => {
    if (!category) return []
    return subcategories.filter(sub => {
      const parentId = sub.category_id?._id || sub.category_id
      return String(parentId) === String(category)
    })
  }, [category, subcategories])

  const selectedCategoryObj = useMemo(() => {
    return categories.find(c => String(c._id) === String(category))
  }, [category, categories])

  const numPrice = Number(price) || 0
  const numRetailerPrice = Number(retailerPrice) || 0
  const retailerMargin = numPrice > 0 && numRetailerPrice > 0 ? numPrice - numRetailerPrice : 0
  const retailerMarginPercent = numPrice > 0 ? Math.round((retailerMargin / numPrice) * 100) : 0

  const stockNum = Number(stock) || 0
  const stockStatus = isNaN(Number(stock)) || stock === '' ? null : stockNum === 0 ? 'out' : stockNum < 10 ? 'low' : 'ok'

  // Image Upload Handlers
  const handleFilesAdded = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (validFiles.length === 0) return

    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setNewImageFiles(prev => [...prev, ...validFiles])
    setNewImagePreviews(prev => [...prev, ...newPreviews])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files)
    }
  }

  const handleRemoveNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index])
    setNewImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = async (img) => {
    if (!product?._id || !img.public_id) {
      setExistingImages(prev => prev.filter(item => item !== img))
      return
    }

    if (!confirm('Are you sure you want to permanently delete this image?')) return

    try {
      setDeletingImageId(img.public_id)
      await removeProductImage(product._id, img.public_id, token)
      setExistingImages(prev => prev.filter(item => item.public_id !== img.public_id))
      toast.success('Image removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove image')
    } finally {
      setDeletingImageId(null)
    }
  }

  // Tag Handlers
  const handleAddTag = (newTag) => {
    const trimmed = String(newTag || '').trim()
    if (!trimmed) return
    if (!tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags(prev => [...prev, trimmed])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(prev => prev.filter(t => t !== tagToRemove))
  }

  const handleTogglePresetTag = (preset) => {
    if (tags.some(t => t.toLowerCase() === preset.toLowerCase())) {
      handleRemoveTag(preset)
    } else {
      handleAddTag(preset)
    }
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag(tagInput)
    }
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Product name is required')
      return
    }
    if (!price || Number(price) <= 0) {
      toast.error('Please enter a valid selling price')
      return
    }
    if (!retailerPrice || Number(retailerPrice) <= 0) {
      toast.error('Please enter a valid retailer price')
      return
    }
    if (stock === '' || Number(stock) < 0) {
      toast.error('Please enter a valid stock quantity')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category: category || undefined,
        category_id: category || undefined,
        subcategory_id: subcategory || undefined,
        price: Number(price),
        retailer_price: Number(retailerPrice),
        price_bulk: priceBulk ? Number(priceBulk) : undefined,
        min_bulk_qty: minBulkQty ? Number(minBulkQty) : undefined,
        stock: Number(stock),
        tags,
        active
      }

      if (isEditing) {
        await updateProductAdmin(product._id, payload, newImageFiles, token)
        toast.success('Product updated successfully!')
      } else {
        await createProductAdmin(payload, newImageFiles, token)
        toast.success('Product created successfully!')
      }

      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const allPreviewImages = [
    ...existingImages.map(img => img.url),
    ...newImagePreviews
  ]

  const primaryImage = allPreviewImages[0] || null

  return (
    <div
      className="productStudioOverlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div className="productStudioModal">
        {/* Modal Header */}
        <header className="productStudioHeader">
          <div className="productStudioHeader__left">
            <div className="productStudioHeader__icon" aria-hidden="true">
              <FiPackage />
            </div>
            <div>
              <h2 className="productStudioHeader__title">
                {isEditing ? 'Edit Product Studio' : 'Create New Product'}
                <span className="productStudioHeader__badge">
                  {isEditing ? 'Editing Mode' : 'New Catalog Item'}
                </span>
              </h2>
              <p className="productStudioHeader__subtitle">
                {isEditing
                  ? `Updating SKU details for "${name || product.name}"`
                  : 'Configure product attributes, multi-tier pricing, inventory, and media assets'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="productStudioCloseBtn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close Studio"
          >
            <FiX />
          </button>
        </header>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="productStudioBody">
          <div className="productStudioGrid">
            {/* Left Column: Form Sections */}
            <div className="productStudioColumn">
              {/* Section 1: Basic Info */}
              <div className="productStudioCard">
                <div className="productStudioCard__header">
                  <h3 className="productStudioCard__title">
                    <FiInfo className="productStudioCard__icon" /> Basic Details
                  </h3>
                </div>

                <div className="studioFormGroup">
                  <label className="studioLabel">
                    <span>Product Name <span className="requiredStar">*</span></span>
                    <span className="studioCharCounter">{name.length}/120</span>
                  </label>
                  <input
                    type="text"
                    className="studioInput"
                    placeholder="e.g., Ultra Silent 1200mm Ceiling Fan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    required
                  />
                  {slug && (
                    <div className="studioSlugPreview">
                      <span>URL Slug:</span>
                      <span className="studioSlugCode">/product/{slug}</span>
                    </div>
                  )}
                </div>

                <div className="studioFormGroup">
                  <label className="studioLabel">
                    <span>Description & Specifications</span>
                    <span className="studioCharCounter">{description.length}/1000</span>
                  </label>
                  <textarea
                    className="studioTextarea"
                    placeholder="Describe key features, warranty details, power ratings, package contents..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                  />
                </div>
              </div>

              {/* Section 2: Taxonomy & Classification */}
              <div className="productStudioCard">
                <div className="productStudioCard__header">
                  <h3 className="productStudioCard__title">
                    <FiLayers className="productStudioCard__icon" /> Category & Taxonomy
                  </h3>
                </div>

                <div className="studioFormRow">
                  <div className="studioFormGroup">
                    <label className="studioLabel">
                      <span>Category</span>
                    </label>
                    <select
                      className="studioSelect"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value)
                        setSubcategory('')
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="studioFormGroup">
                    <label className="studioLabel">
                      <span>Subcategory</span>
                    </label>
                    <select
                      className="studioSelect"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      disabled={!category || filteredSubcategories.length === 0}
                    >
                      <option value="">
                        {!category
                          ? 'Select Category First'
                          : filteredSubcategories.length === 0
                            ? 'No subcategories available'
                            : 'Select Subcategory'}
                      </option>
                      {filteredSubcategories.map(sub => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="studioFormGroup">
                  <label className="studioLabel">
                    <span>Tags & Badges</span>
                    <span className="studioCharCounter">Press Enter or comma to add</span>
                  </label>

                  {/* Preset Tags */}
                  <div className="studioTagPresets">
                    {PRESET_TAGS.map(preset => {
                      const isSelected = tags.some(t => t.toLowerCase() === preset.toLowerCase())
                      return (
                        <button
                          key={preset}
                          type="button"
                          className={`studioTagPresetBtn ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleTogglePresetTag(preset)}
                        >
                          {isSelected ? <FiCheck style={{ marginRight: 4 }} /> : '+ '}
                          {preset}
                        </button>
                      )
                    })}
                  </div>

                  {/* Tag Chips Input */}
                  <div className="studioTagChipsContainer">
                    {tags.map(tag => (
                      <span key={tag} className="studioTagChip">
                        {tag}
                        <button
                          type="button"
                          className="studioTagChipRemove"
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Remove tag ${tag}`}
                        >
                          <FiX />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className="studioTagInput"
                      placeholder={tags.length === 0 ? "Type custom tag and press Enter..." : "Add tag..."}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => {
                        if (tagInput.trim()) handleAddTag(tagInput)
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Pricing & Wholesale Margin Strategy */}
              <div className="productStudioCard">
                <div className="productStudioCard__header">
                  <h3 className="productStudioCard__title">
                    <FiDollarSign className="productStudioCard__icon" /> Pricing & Wholesale Tiers
                  </h3>
                </div>

                <div className="studioFormRow">
                  <div className="studioFormGroup">
                    <label className="studioLabel">
                      <span>Regular Customer Price <span className="requiredStar">*</span></span>
                    </label>
                    <div className="studioInputWrapper">
                      <span className="studioInputPrefix">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="studioInput studioInputWithPrefix"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="studioFormGroup">
                    <label className="studioLabel">
                      <span>Retailer B2B Price <span className="requiredStar">*</span></span>
                    </label>
                    <div className="studioInputWrapper">
                      <span className="studioInputPrefix">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="studioInput studioInputWithPrefix"
                        placeholder="0.00"
                        value={retailerPrice}
                        onChange={(e) => setRetailerPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Retailer Margin Banner */}
                {numPrice > 0 && numRetailerPrice > 0 && (
                  <div className={`studioMarginBadge ${retailerMargin < 0 ? 'is-negative' : ''}`}>
                    <span>
                      Retailer Margin: <strong>₹{retailerMargin.toLocaleString('en-IN')}</strong> per unit
                    </span>
                    <span>
                      {retailerMarginPercent >= 0 ? `${retailerMarginPercent}% Retailer Profit` : 'Warning: Loss'}
                    </span>
                  </div>
                )}

                <div className="studioFormRow" style={{ marginTop: 16 }}>
                  <div className="studioFormGroup">
                    <label className="studioLabel">
                      <span>Bulk Tier Price</span>
                    </label>
                    <div className="studioInputWrapper">
                      <span className="studioInputPrefix">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="studioInput studioInputWithPrefix"
                        placeholder="Optional bulk rate"
                        value={priceBulk}
                        onChange={(e) => setPriceBulk(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="studioFormGroup">
                    <label className="studioLabel">
                      <span>Min Bulk Quantity</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="studioInput"
                      placeholder="e.g., 10 units"
                      value={minBulkQty}
                      onChange={(e) => setMinBulkQty(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Inventory & Availability */}
              <div className="productStudioCard">
                <div className="productStudioCard__header">
                  <h3 className="productStudioCard__title">
                    <FiPackage className="productStudioCard__icon" /> Inventory & Visibility
                  </h3>
                </div>

                <div className="studioFormRow">
                  <div className="studioFormGroup">
                    <label className="studioLabel">
                      <span>Stock Quantity <span className="requiredStar">*</span></span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="studioInput"
                      placeholder="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                    />
                    {stockStatus && (
                      <div>
                        {stockStatus === 'out' && (
                          <span className="studioStockHealth out-stock">
                            <FiAlertTriangle /> Out of Stock (0 units)
                          </span>
                        )}
                        {stockStatus === 'low' && (
                          <span className="studioStockHealth low-stock">
                            <FiAlertTriangle /> Low Stock Alert ({stockNum} units remaining)
                          </span>
                        )}
                        {stockStatus === 'ok' && (
                          <span className="studioStockHealth in-stock">
                            <FiCheck /> Healthy Inventory ({stockNum} units)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="studioFormGroup">
                    <label className="studioLabel">
                      <span>Storefront Visibility</span>
                    </label>
                    <div
                      className={`studioToggleCard ${active ? 'is-active' : ''}`}
                      onClick={() => setActive(prev => !prev)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault()
                          setActive(prev => !prev)
                        }
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: active ? '#059669' : '#64748b' }}>
                          {active ? 'Active & Published' : 'Hidden / Inactive'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {active ? 'Visible to shoppers' : 'Hidden from catalog'}
                        </div>
                      </div>
                      <div className={`studioToggleSwitch ${active ? 'is-checked' : ''}`}>
                        <div className="studioToggleSwitchHandle" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Media Studio & Live Customer Preview */}
            <div className="productStudioColumn">
              {/* Media Studio */}
              <div className="productStudioCard">
                <div className="productStudioCard__header">
                  <h3 className="productStudioCard__title">
                    <FiImage className="productStudioCard__icon" /> Product Images
                  </h3>
                  <span className="studioCharCounter">
                    {allPreviewImages.length} image{allPreviewImages.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Dropzone */}
                <div
                  className={`studioDropzone ${isDragOver ? 'is-drag-over' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <FiUploadCloud className="studioDropzone__icon" />
                  <div className="studioDropzone__title">Click to upload or drag & drop</div>
                  <div className="studioDropzone__hint">PNG, JPG, WEBP up to 5MB each</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files) handleFilesAdded(e.target.files)
                    }}
                  />
                </div>

                {/* Image Thumbnails */}
                {allPreviewImages.length > 0 && (
                  <div className="studioImageGrid">
                    {existingImages.map((img, idx) => (
                      <div
                        key={img.public_id || img.url || idx}
                        className={`studioImageItem ${idx === 0 ? 'is-primary' : ''}`}
                      >
                        <img src={img.url} alt="Product preview" className="studioImageThumb" />
                        {idx === 0 && <span className="studioImagePrimaryBadge">Cover</span>}
                        <button
                          type="button"
                          className="studioImageRemoveBtn"
                          onClick={() => handleRemoveExistingImage(img)}
                          disabled={deletingImageId === img.public_id}
                          title="Delete image"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}

                    {newImagePreviews.map((previewUrl, idx) => {
                      const overallIndex = existingImages.length + idx
                      return (
                        <div
                          key={previewUrl}
                          className={`studioImageItem ${overallIndex === 0 ? 'is-primary' : ''}`}
                        >
                          <img src={previewUrl} alt="New upload preview" className="studioImageThumb" />
                          {overallIndex === 0 && <span className="studioImagePrimaryBadge">Cover</span>}
                          <button
                            type="button"
                            className="studioImageRemoveBtn"
                            onClick={() => handleRemoveNewImage(idx)}
                            title="Remove image"
                          >
                            <FiX />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Live Customer Preview */}
              <div className="productStudioCard" style={{ position: 'sticky', top: 20 }}>
                <div className="productStudioCard__header">
                  <h3 className="productStudioCard__title">
                    <FiEye className="productStudioCard__icon" /> Storefront Preview
                  </h3>
                  <span className="studioCharCounter">Live view</span>
                </div>

                <div className="studioLivePreviewCard">
                  <div className="studioLivePreviewImageWrap">
                    {primaryImage ? (
                      <img src={primaryImage} alt={name || 'Preview'} className="studioLivePreviewImage" />
                    ) : (
                      <div className="studioLivePreviewPlaceholder">
                        <FiImage style={{ fontSize: '2rem' }} />
                        <span>No image uploaded</span>
                      </div>
                    )}
                  </div>

                  <div className="studioLivePreviewContent">
                    <div className="studioLivePreviewCat">
                      {selectedCategoryObj?.name || 'Category Name'}
                    </div>
                    <div className="studioLivePreviewName">
                      {name || 'Your Product Title Goes Here'}
                    </div>

                    <div className="studioLivePreviewPricing">
                      <div className="studioLivePreviewPrice">
                        ₹{(numPrice || 0).toLocaleString('en-IN')}
                      </div>
                      {numRetailerPrice > 0 && (
                        <div className="studioLivePreviewRetailer">
                          B2B: ₹{numRetailerPrice.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>

                    <div className="studioLivePreviewBadges">
                      {stockNum > 0 ? (
                        <span className="studioLivePreviewBadge" style={{ background: '#ecfdf5', color: '#047857' }}>
                          In Stock ({stockNum})
                        </span>
                      ) : (
                        <span className="studioLivePreviewBadge" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                          Out of Stock
                        </span>
                      )}

                      {tags.slice(0, 3).map(t => (
                        <span key={t} className="studioLivePreviewBadge">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer Action Bar */}
        <footer className="productStudioFooter">
          <div className="productStudioFooter__info">
            {isEditing ? 'Changes will be saved immediately to catalog.' : 'New product will be saved to inventory.'}
          </div>
          <div className="productStudioFooter__actions">
            <button
              type="button"
              className="studioBtn studioBtn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="studioBtn studioBtn--primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="studioSpinner" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <>
                  <FiCheck />
                  <span>{isEditing ? 'Update Product' : 'Publish Product'}</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
