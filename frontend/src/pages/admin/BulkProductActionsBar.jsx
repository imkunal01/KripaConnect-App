import { useState } from 'react'
import {
  FiCheck,
  FiEye,
  FiEyeOff,
  FiPackage,
  FiDollarSign,
  FiFolder,
  FiTag,
  FiDownload,
  FiTrash2,
  FiX,
  FiSliders,
  FiPercent
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { bulkProductAction, bulkExportProducts } from '../../services/admin'
import './BulkProductActionsBar.css'

export default function BulkProductActionsBar({
  selectedIds,
  onClearSelection,
  onSuccess,
  token,
  categories = [],
  subcategories = []
}) {
  const [loadingAction, setLoadingAction] = useState(false)
  const [activeDialog, setActiveDialog] = useState(null) // 'stock' | 'pricing' | 'category' | 'tags' | 'delete'

  // Stock Dialog State
  const [stockMode, setStockMode] = useState('set') // 'set' | 'adjust'
  const [stockValue, setStockValue] = useState('')

  // Pricing Dialog State
  const [pricingType, setPricingType] = useState('percentage') // 'percentage' | 'fixed'
  const [pricingValue, setPricingValue] = useState('')
  const [pricingTarget, setPricingTarget] = useState('both') // 'price' | 'retailer_price' | 'both'

  // Category Dialog State
  const [selectedCat, setSelectedCat] = useState('')
  const [selectedSub, setSelectedSub] = useState('')

  // Tags Dialog State
  const [tagMode, setTagMode] = useState('add') // 'add' | 'remove'
  const [tagInput, setTagInput] = useState('')

  if (!selectedIds || selectedIds.length === 0) return null

  const count = selectedIds.length

  async function executeAction(action, payload = {}) {
    try {
      setLoadingAction(true)
      const res = await bulkProductAction(selectedIds, action, payload, token)
      toast.success(res.message || 'Action completed successfully!')
      setActiveDialog(null)
      onClearSelection()
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error(err.message || 'Operation failed')
    } finally {
      setLoadingAction(false)
    }
  }

  async function handleExport() {
    try {
      setLoadingAction(true)
      await bulkExportProducts(selectedIds, token)
      toast.success(`Exported ${count} product(s) to CSV!`)
    } catch (err) {
      toast.error(err.message || 'Export failed')
    } finally {
      setLoadingAction(false)
    }
  }

  // Submit Handlers for dialogs
  function handleStockSubmit(e) {
    e.preventDefault()
    if (stockValue === '') {
      toast.error('Please enter a valid stock number')
      return
    }
    if (stockMode === 'set') {
      executeAction('setStock', { stock: Number(stockValue) })
    } else {
      executeAction('adjustStock', { delta: Number(stockValue) })
    }
  }

  function handlePricingSubmit(e) {
    e.preventDefault()
    if (pricingValue === '') {
      toast.error('Please enter a price adjustment value')
      return
    }
    executeAction('updatePrice', {
      type: pricingType,
      value: Number(pricingValue),
      target: pricingTarget
    })
  }

  function handleCategorySubmit(e) {
    e.preventDefault()
    if (!selectedCat) {
      toast.error('Please select a category')
      return
    }
    executeAction('setCategory', {
      categoryId: selectedCat,
      subcategoryId: selectedSub || null
    })
  }

  function handleTagSubmit(e) {
    e.preventDefault()
    const tags = tagInput
      .split(/[,|]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

    if (tags.length === 0) {
      toast.error('Please enter at least one tag')
      return
    }
    if (tagMode === 'add') {
      executeAction('addTags', { tags })
    } else {
      executeAction('removeTags', { tags })
    }
  }

  return (
    <>
      {/* Floating Action Bar */}
      <div className="bulk-bar-container" role="toolbar" aria-label="Bulk actions bar">
        <div className="bulk-count-pill">
          <span className="bulk-count-badge">{count}</span>
          <span>selected</span>
        </div>

        <div className="bulk-actions-group">
          {/* Quick Visibility */}
          <button
            type="button"
            className="bulk-btn active-action"
            onClick={() => executeAction('setActive', { active: true })}
            disabled={loadingAction}
            title="Make active / publish to store"
          >
            <FiEye /> Active
          </button>

          <button
            type="button"
            className="bulk-btn"
            onClick={() => executeAction('setActive', { active: false })}
            disabled={loadingAction}
            title="Make inactive / hide from store"
          >
            <FiEyeOff /> Inactive
          </button>

          {/* Quick Stock */}
          <button
            type="button"
            className="bulk-btn"
            onClick={() => executeAction('setOutOfStock')}
            disabled={loadingAction}
            title="Set stock to 0 (Mark Out of Stock)"
          >
            <FiPackage /> Out of Stock
          </button>

          {/* Stock Dialog Button */}
          <button
            type="button"
            className="bulk-btn"
            onClick={() => {
              setStockValue('')
              setActiveDialog('stock')
            }}
            disabled={loadingAction}
          >
            <FiSliders /> Stock
          </button>

          {/* Price Dialog Button */}
          <button
            type="button"
            className="bulk-btn"
            onClick={() => {
              setPricingValue('')
              setActiveDialog('pricing')
            }}
            disabled={loadingAction}
          >
            <FiPercent /> Price
          </button>

          {/* Category Dialog Button */}
          <button
            type="button"
            className="bulk-btn"
            onClick={() => {
              setSelectedCat('')
              setSelectedSub('')
              setActiveDialog('category')
            }}
            disabled={loadingAction}
          >
            <FiFolder /> Category
          </button>

          {/* Tags Dialog Button */}
          <button
            type="button"
            className="bulk-btn"
            onClick={() => {
              setTagInput('')
              setActiveDialog('tags')
            }}
            disabled={loadingAction}
          >
            <FiTag /> Tags
          </button>

          <div className="bulk-divider" />

          {/* Export CSV */}
          <button
            type="button"
            className="bulk-btn"
            onClick={handleExport}
            disabled={loadingAction}
            title="Export selected items to CSV"
          >
            <FiDownload /> Export
          </button>

          {/* Delete Dialog Button */}
          <button
            type="button"
            className="bulk-btn danger-action"
            onClick={() => setActiveDialog('delete')}
            disabled={loadingAction}
            title="Delete selected products"
          >
            <FiTrash2 /> Delete
          </button>
        </div>

        <button
          type="button"
          className="bulk-close-btn"
          onClick={onClearSelection}
          title="Deselect all"
        >
          <FiX />
        </button>
      </div>

      {/* Stock Dialog */}
      {activeDialog === 'stock' && (
        <div className="bulk-modal-overlay" onClick={() => setActiveDialog(null)}>
          <div className="bulk-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="bulk-dialog-header">
              <h3 className="bulk-dialog-title">
                <FiPackage style={{ color: 'var(--primary)' }} /> Bulk Stock Adjustment ({count} items)
              </h3>
              <button className="csv-close-btn" onClick={() => setActiveDialog(null)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleStockSubmit}>
              <div className="bulk-dialog-body">
                <div className="bulk-radio-group">
                  <label className="bulk-radio-label">
                    <input
                      type="radio"
                      name="stockMode"
                      checked={stockMode === 'set'}
                      onChange={() => setStockMode('set')}
                    />
                    Set Exact Quantity
                  </label>
                  <label className="bulk-radio-label">
                    <input
                      type="radio"
                      name="stockMode"
                      checked={stockMode === 'adjust'}
                      onChange={() => setStockMode('adjust')}
                    />
                    Adjust (+ / -)
                  </label>
                </div>
                <div>
                  <label className="adminLabel">
                    {stockMode === 'set' ? 'New Stock Count for all selected items' : 'Quantity to Add / Subtract (e.g. +10 or -5)'}
                  </label>
                  <input
                    type="number"
                    className="bulk-input-field"
                    placeholder={stockMode === 'set' ? 'e.g. 50' : 'e.g. 10 or -5'}
                    value={stockValue}
                    onChange={(e) => setStockValue(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="bulk-dialog-footer">
                <button type="button" className="csv-btn-secondary" onClick={() => setActiveDialog(null)}>
                  Cancel
                </button>
                <button type="submit" className="csv-btn-primary" disabled={loadingAction}>
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Dialog */}
      {activeDialog === 'pricing' && (
        <div className="bulk-modal-overlay" onClick={() => setActiveDialog(null)}>
          <div className="bulk-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="bulk-dialog-header">
              <h3 className="bulk-dialog-title">
                <FiDollarSign style={{ color: 'var(--primary)' }} /> Bulk Price Adjustment ({count} items)
              </h3>
              <button className="csv-close-btn" onClick={() => setActiveDialog(null)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handlePricingSubmit}>
              <div className="bulk-dialog-body">
                <div className="bulk-radio-group">
                  <label className="bulk-radio-label">
                    <input
                      type="radio"
                      name="pricingType"
                      checked={pricingType === 'percentage'}
                      onChange={() => setPricingType('percentage')}
                    />
                    % Percentage Discount/Markup
                  </label>
                  <label className="bulk-radio-label">
                    <input
                      type="radio"
                      name="pricingType"
                      checked={pricingType === 'fixed'}
                      onChange={() => setPricingType('fixed')}
                    />
                    Flat Exact Price (₹)
                  </label>
                </div>

                <div>
                  <label className="adminLabel">Target Price Field</label>
                  <select
                    className="adminSelect"
                    value={pricingTarget}
                    onChange={(e) => setPricingTarget(e.target.value)}
                  >
                    <option value="both">Both Retail & Wholesale Price</option>
                    <option value="price">Retail Price Only</option>
                    <option value="retailer_price">Retailer Wholesale Price Only</option>
                  </select>
                </div>

                <div>
                  <label className="adminLabel">
                    {pricingType === 'percentage'
                      ? 'Percentage Change (e.g. -10 for 10% OFF, 15 for +15% Markup)'
                      : 'Flat Price Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="bulk-input-field"
                    placeholder={pricingType === 'percentage' ? 'e.g. -10 or 15' : 'e.g. 999'}
                    value={pricingValue}
                    onChange={(e) => setPricingValue(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="bulk-dialog-footer">
                <button type="button" className="csv-btn-secondary" onClick={() => setActiveDialog(null)}>
                  Cancel
                </button>
                <button type="submit" className="csv-btn-primary" disabled={loadingAction}>
                  Apply Price Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Reassignment Dialog */}
      {activeDialog === 'category' && (
        <div className="bulk-modal-overlay" onClick={() => setActiveDialog(null)}>
          <div className="bulk-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="bulk-dialog-header">
              <h3 className="bulk-dialog-title">
                <FiFolder style={{ color: 'var(--primary)' }} /> Move Category ({count} items)
              </h3>
              <button className="csv-close-btn" onClick={() => setActiveDialog(null)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="bulk-dialog-body">
                <div>
                  <label className="adminLabel">New Category *</label>
                  <select
                    className="adminSelect"
                    value={selectedCat}
                    onChange={(e) => {
                      setSelectedCat(e.target.value)
                      setSelectedSub('')
                    }}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="adminLabel">New Subcategory (Optional)</label>
                  <select
                    className="adminSelect"
                    value={selectedSub}
                    onChange={(e) => setSelectedSub(e.target.value)}
                    disabled={!selectedCat}
                  >
                    <option value="">Select Subcategory (None)</option>
                    {subcategories
                      .filter((s) => String(s.category_id?._id || s.category_id) === String(selectedCat))
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="bulk-dialog-footer">
                <button type="button" className="csv-btn-secondary" onClick={() => setActiveDialog(null)}>
                  Cancel
                </button>
                <button type="submit" className="csv-btn-primary" disabled={loadingAction || !selectedCat}>
                  Move Products
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tags Dialog */}
      {activeDialog === 'tags' && (
        <div className="bulk-modal-overlay" onClick={() => setActiveDialog(null)}>
          <div className="bulk-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="bulk-dialog-header">
              <h3 className="bulk-dialog-title">
                <FiTag style={{ color: 'var(--primary)' }} /> Manage Tags ({count} items)
              </h3>
              <button className="csv-close-btn" onClick={() => setActiveDialog(null)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleTagSubmit}>
              <div className="bulk-dialog-body">
                <div className="bulk-radio-group">
                  <label className="bulk-radio-label">
                    <input
                      type="radio"
                      name="tagMode"
                      checked={tagMode === 'add'}
                      onChange={() => setTagMode('add')}
                    />
                    Add Tags
                  </label>
                  <label className="bulk-radio-label">
                    <input
                      type="radio"
                      name="tagMode"
                      checked={tagMode === 'remove'}
                      onChange={() => setTagMode('remove')}
                    />
                    Remove Tags
                  </label>
                </div>
                <div>
                  <label className="adminLabel">Tags (comma-separated)</label>
                  <input
                    type="text"
                    className="bulk-input-field"
                    placeholder="e.g. clearance, festive-deal, trending"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    autoFocus
                    required
                  />
                  <div className="adminHelp" style={{ marginTop: 4 }}>
                    {tagMode === 'add'
                      ? 'These tags will be appended to all selected products without duplicates.'
                      : 'These tags will be removed from all selected products.'}
                  </div>
                </div>
              </div>
              <div className="bulk-dialog-footer">
                <button type="button" className="csv-btn-secondary" onClick={() => setActiveDialog(null)}>
                  Cancel
                </button>
                <button type="submit" className="csv-btn-primary" disabled={loadingAction}>
                  {tagMode === 'add' ? 'Add Tags' : 'Remove Tags'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {activeDialog === 'delete' && (
        <div className="bulk-modal-overlay" onClick={() => setActiveDialog(null)}>
          <div className="bulk-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="bulk-dialog-header">
              <h3 className="bulk-dialog-title" style={{ color: '#dc2626' }}>
                <FiTrash2 /> Delete {count} Product{count > 1 ? 's' : ''}?
              </h3>
              <button className="csv-close-btn" onClick={() => setActiveDialog(null)}>
                <FiX />
              </button>
            </div>
            <div className="bulk-dialog-body">
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>{count} selected product(s)</strong>? This action cannot be undone and will remove them from all customer carts and catalogs.
              </p>
            </div>
            <div className="bulk-dialog-footer">
              <button type="button" className="csv-btn-secondary" onClick={() => setActiveDialog(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="csv-btn-primary"
                style={{ background: '#dc2626' }}
                onClick={() => executeAction('delete')}
                disabled={loadingAction}
              >
                {loadingAction ? 'Deleting…' : `Yes, Delete ${count} Items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
