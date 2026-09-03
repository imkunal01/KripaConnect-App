import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listProducts } from '../../services/products'
import {
  deleteProductAdmin,
  listSubcategoriesAdmin,
  listCategoriesAdmin,
} from '../../services/admin'
import { AdminTableSkeleton } from '../../components/SkeletonLoader'
import Pagination from '../../components/Pagination'
import CsvImportModal from './CsvImportModal'
import BulkProductActionsBar from './BulkProductActionsBar'
import ProductFormModal from './ProductFormModal'
import {
  FiUploadCloud,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiBox,
  FiFilter,
  FiCheck,
  FiCheckCircle,
  FiEyeOff,
  FiAlertTriangle
} from 'react-icons/fi'
import toast from 'react-hot-toast'

function getMongoObjectIdTimeMs(id) {
  if (typeof id !== 'string' || id.length < 8) return 0
  const tsHex = id.slice(0, 8)
  const seconds = Number.parseInt(tsHex, 16)
  return Number.isFinite(seconds) ? seconds * 1000 : 0
}

function getDocCreatedTimeMs(doc) {
  const createdAt = doc?.createdAt || doc?.created_at || doc?.createdOn
  const t = createdAt ? Date.parse(createdAt) : NaN
  if (Number.isFinite(t)) return t
  return getMongoObjectIdTimeMs(doc?._id)
}

export default function ProductManagement() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal States
  const [showStudioModal, setShowStudioModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showCsvModal, setShowCsvModal] = useState(false)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock'

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Batch Selection State
  const [selectedIds, setSelectedIds] = useState([])
  const selectAllRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [token])

  async function loadData() {
    try {
      setLoading(true)
      const [prods, cats, subs] = await Promise.all([
        listProducts({ limit: 1000, active: 'all', includeInactive: true }),
        listCategoriesAdmin(token),
        listSubcategoriesAdmin(token),
      ])
      const items = prods?.items || []
      const sorted = Array.isArray(items)
        ? items.slice().sort((a, b) => getDocCreatedTimeMs(b) - getDocCreatedTimeMs(a))
        : []
      setProducts(sorted)
      setCategories(Array.isArray(cats) ? cats : [])
      setSubcategories(Array.isArray(subs) ? subs : [])
    } catch (err) {
      console.error('Failed to load products:', err)
      toast.error('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenAddProduct() {
    setEditingProduct(null)
    setShowStudioModal(true)
  }

  function handleOpenEditProduct(product) {
    setEditingProduct(product)
    setShowStudioModal(true)
  }

  async function handleDelete(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    try {
      await deleteProductAdmin(productId, token)
      toast.success('Product deleted successfully')
      loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete product')
    }
  }

  // Calculate status counts for filter pills
  const statusCounts = useMemo(() => {
    let total = products.length
    let active = 0
    let inactive = 0
    let lowStock = 0
    let outOfStock = 0

    products.forEach((p) => {
      const stock = Number(p.stock) || 0
      if (p.active !== false) active++
      else inactive++

      if (stock === 0) outOfStock++
      else if (stock < 10) lowStock++
    })

    return { total, active, inactive, lowStock, outOfStock }
  }, [products])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search text filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = p.name?.toLowerCase().includes(q)
        const matchCat = p.Category?.name?.toLowerCase().includes(q)
        const matchTag = Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(q))
        if (!matchName && !matchCat && !matchTag) return false
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const catId = p.Category?._id || p.Category || p.category_id
        if (String(catId) !== String(categoryFilter)) return false
      }

      // Status filter
      const stockNum = Number(p.stock) || 0
      if (statusFilter === 'active' && p.active === false) return false
      if (statusFilter === 'inactive' && p.active !== false) return false
      if (statusFilter === 'low_stock' && (stockNum >= 10 || stockNum === 0)) return false
      if (statusFilter === 'out_of_stock' && stockNum > 0) return false

      return true
    })
  }, [products, search, categoryFilter, statusFilter])

  // Reset page to 1 on filter changes
  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter, statusFilter, pageSize])

  // Paginated Slicing
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, page, pageSize])

  // Checkbox Indeterminate & Selection State
  const currentPageIds = useMemo(() => paginatedProducts.map(p => p._id), [paginatedProducts])
  const isAllCurrentSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id))

  useEffect(() => {
    if (!selectAllRef.current) return
    const numSelectedInCurrentPage = currentPageIds.filter(id => selectedIds.includes(id)).length
    if (numSelectedInCurrentPage > 0 && numSelectedInCurrentPage < currentPageIds.length) {
      selectAllRef.current.indeterminate = true
    } else {
      selectAllRef.current.indeterminate = false
    }
  }, [selectedIds, currentPageIds])

  function handleToggleSelectPage() {
    if (isAllCurrentSelected) {
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])))
    }
  }

  function handleToggleRow(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Instant Inline Stock Stepper (Zero Friction)
  async function handleInlineStockChange(productId, delta) {
    const targetProduct = products.find(p => p._id === productId)
    if (!targetProduct) return
    const currentStock = Number(targetProduct.stock) || 0
    const newStock = Math.max(0, currentStock + delta)

    // Optimistic local update
    setProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: newStock } : p))

    try {
      await updateProductAdmin(productId, { stock: newStock }, null, token)
      toast.success(`Stock: ${newStock} units`, { duration: 1200, id: `stock-${productId}` })
    } catch (err) {
      toast.error(err.message || 'Failed to update stock')
      loadData()
    }
  }

  // Instant Inline Active/Inactive Toggle
  async function handleInlineToggleActive(productId) {
    const targetProduct = products.find(p => p._id === productId)
    if (!targetProduct) return
    const newActive = targetProduct.active === false ? true : false

    // Optimistic local update
    setProducts(prev => prev.map(p => p._id === productId ? { ...p, active: newActive } : p))

    try {
      await updateProductAdmin(productId, { active: newActive }, null, token)
      toast.success(newActive ? 'Product is now Active' : 'Product is now Hidden', { duration: 1200, id: `active-${productId}` })
    } catch (err) {
      toast.error(err.message || 'Failed to toggle product status')
      loadData()
    }
  }

  return (
    <div className="adminPage">
      {/* Header */}
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Product Management</h1>
          <p className="adminPageHeader__subtitle">
            Manage catalog inventory, multi-tier pricing, product statuses, and bulk imports
          </p>
        </div>
        <div className="adminActions">
          <button
            type="button"
            className="adminBtn"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onClick={() => setShowCsvModal(true)}
          >
            <FiUploadCloud style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
            <span>Bulk Import CSV</span>
          </button>
          <button
            type="button"
            className="adminBtn adminBtnPrimary"
            onClick={handleOpenAddProduct}
          >
            <FiPlus style={{ fontSize: '1.1rem' }} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* CSV Bulk Import Modal */}
      <CsvImportModal
        token={token}
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onSuccess={loadData}
      />

      {/* Modern Product Studio Modal (Add / Edit) */}
      <ProductFormModal
        isOpen={showStudioModal}
        onClose={() => {
          setShowStudioModal(false)
          setEditingProduct(null)
        }}
        product={editingProduct}
        categories={categories}
        subcategories={subcategories}
        token={token}
        onSuccess={loadData}
      />

      {/* Filter & Search Toolbar */}
      <div className="adminToolbarCard">
        <div className="adminToolbarRow">
          {/* Search Box */}
          <div className="adminSearchWrapper">
            <FiSearch className="adminSearchIcon" />
            <input
              className="adminSearchInput"
              type="text"
              placeholder="Search by product name, category, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="adminFilterSelect"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Scroll Pills (Mobile First) */}
        {categories.length > 0 && (
          <div className="adminStatusPills" style={{ paddingTop: 2 }}>
            <button
              type="button"
              className={`adminStatusPill ${categoryFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              <span>All Categories</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                type="button"
                className={`adminStatusPill ${categoryFilter === cat._id ? 'is-active' : ''}`}
                onClick={() => setCategoryFilter(cat._id)}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="adminStatusPills">
          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <FiBox />
            <span>All</span>
            <span className="adminStatusPillCount">{statusCounts.total}</span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'active' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <FiCheckCircle />
            <span>Active</span>
            <span className="adminStatusPillCount">{statusCounts.active}</span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'inactive' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            <FiEyeOff />
            <span>Inactive</span>
            <span className="adminStatusPillCount">{statusCounts.inactive}</span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'low_stock' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('low_stock')}
          >
            <FiAlertTriangle />
            <span>Low Stock (&lt;10)</span>
            <span className="adminStatusPillCount">{statusCounts.lowStock}</span>
          </button>

          <button
            type="button"
            className={`adminStatusPill ${statusFilter === 'out_of_stock' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('out_of_stock')}
          >
            <FiAlertTriangle />
            <span>Out of Stock</span>
            <span className="adminStatusPillCount">{statusCounts.outOfStock}</span>
          </button>
        </div>
      </div>

      {/* Main Inventory Card */}
      <div className="adminCard">
        {loading ? (
          <AdminTableSkeleton rows={8} />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="adminOnlyDesktop">
              <div className="adminTableWrap">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th style={{ width: 44, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          ref={selectAllRef}
                          checked={isAllCurrentSelected}
                          onChange={handleToggleSelectPage}
                          className="bulk-row-checkbox"
                          aria-label="Select all products on page"
                        />
                      </th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price (₹)</th>
                      <th>Retailer B2B (₹)</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="adminEmpty">
                          <FiBox style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.5 }} />
                          <div>No products found matching your search or filters.</div>
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((product) => {
                        const isSelected = selectedIds.includes(product._id)
                        const stockNumber = Number(product.stock) || 0

                        return (
                          <tr
                            key={product._id}
                            className={isSelected ? 'is-row-selected' : ''}
                          >
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleRow(product._id)}
                                className="bulk-row-checkbox"
                                aria-label={`Select ${product.name}`}
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img
                                  src={product.images?.[0]?.url || 'https://via.placeholder.com/50?text=No+Image'}
                                  alt={product.name}
                                  className="adminMobileThumb"
                                  style={{ width: 44, height: 44 }}
                                />
                                <div>
                                  <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {product.name}
                                  </div>
                                  <div className="adminHelp" style={{ fontSize: '0.75rem' }}>
                                    SKU: {product.sku || product._id.slice(-6).toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="adminBadge">
                                {product.Category?.name || 'Uncategorized'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 800 }}>
                              ₹{product.price?.toLocaleString('en-IN')}
                            </td>
                            <td style={{ fontWeight: 800, color: '#2563eb' }}>
                              ₹{product.retailer_price?.toLocaleString('en-IN') || '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className="adminStockStepper">
                                  <button
                                    type="button"
                                    className="adminStockStepper__btn"
                                    onClick={() => handleInlineStockChange(product._id, -1)}
                                    disabled={stockNumber <= 0}
                                    title="Decrease stock"
                                  >
                                    -
                                  </button>
                                  <span className="adminStockStepper__val">{stockNumber}</span>
                                  <button
                                    type="button"
                                    className="adminStockStepper__btn"
                                    onClick={() => handleInlineStockChange(product._id, 1)}
                                    title="Increase stock"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`adminBadge ${product.active !== false ? 'adminBadge--ok' : 'adminBadge--danger'}`}
                                onClick={() => handleInlineToggleActive(product._id)}
                                title="Click to toggle status"
                                style={{ cursor: 'pointer', border: 'none' }}
                              >
                                {product.active !== false ? <FiCheck /> : <FiEyeOff />}
                                <span style={{ marginLeft: 4 }}>{product.active !== false ? 'Active' : 'Inactive'}</span>
                              </button>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="adminActions">
                                <button
                                  type="button"
                                  className="adminBtn adminBtnPrimary adminBtn--sm"
                                  onClick={() => handleOpenEditProduct(product)}
                                  title="Edit Product Details"
                                >
                                  <FiEdit2 />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  className="adminBtn adminBtnDanger adminBtn--sm"
                                  onClick={() => handleDelete(product._id)}
                                  title="Delete Product"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View (Zero Friction) */}
            <div className="adminOnlyMobile">
              {filteredProducts.length === 0 ? (
                <div className="adminEmpty">
                  <FiBox style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.5 }} />
                  <div>No products found matching your filters.</div>
                </div>
              ) : (
                <div className="adminMobileList">
                  {paginatedProducts.map((product) => {
                    const isSelected = selectedIds.includes(product._id)
                    const stockNumber = Number(product.stock) || 0

                    return (
                      <div
                        key={product._id}
                        className={`adminMobileCard ${isSelected ? 'is-card-selected' : ''}`}
                        style={{
                          borderLeft: product.active === false
                            ? '4px solid #ef4444'
                            : stockNumber === 0
                            ? '4px solid #f59e0b'
                            : '4px solid #10b981'
                        }}
                      >
                        {/* Card Header */}
                        <div className="adminMobileCardHeader">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(product._id)}
                              className="bulk-row-checkbox"
                              aria-label={`Select ${product.name}`}
                            />
                            <img
                              src={product.images?.[0]?.url || 'https://via.placeholder.com/50?text=No+Image'}
                              alt={product.name}
                              className="adminMobileThumb"
                            />
                            <div style={{ minWidth: 0 }}>
                              <div className="adminMobileCardTitle" title={product.name}>
                                {product.name}
                              </div>
                              <div className="adminMobileCardSub">
                                {product.Category?.name || 'Uncategorized'}
                              </div>
                            </div>
                          </div>

                          {/* 1-Tap Active Toggle Switch */}
                          <button
                            type="button"
                            className={`adminBadge ${product.active !== false ? 'adminBadge--ok' : 'adminBadge--danger'}`}
                            onClick={() => handleInlineToggleActive(product._id)}
                            title="Tap to toggle visibility"
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            {product.active !== false ? <FiCheck /> : <FiEyeOff />}
                            <span style={{ marginLeft: 3 }}>
                              {product.active !== false ? 'Active' : 'Hidden'}
                            </span>
                          </button>
                        </div>

                        {/* Card Body */}
                        <div className="adminMobileCardBody">
                          <div className="adminMobileMetaRow">
                            <span className="adminHelp">Selling Price</span>
                            <span className="adminMobileMetaValue">
                              ₹{product.price?.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {product.retailer_price && (
                            <div className="adminMobileMetaRow">
                              <span className="adminHelp">Retailer B2B</span>
                              <span className="adminMobileMetaValue" style={{ color: '#2563eb' }}>
                                ₹{product.retailer_price?.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                          <div className="adminMobileMetaRow" style={{ alignItems: 'center' }}>
                            <span className="adminHelp">Stock Level</span>
                            {/* Instant Inline Stock Stepper */}
                            <div className="adminStockStepper">
                              <button
                                type="button"
                                className="adminStockStepper__btn"
                                onClick={() => handleInlineStockChange(product._id, -1)}
                                disabled={stockNumber <= 0}
                              >
                                -
                              </button>
                              <span
                                className="adminStockStepper__val"
                                style={{
                                  color: stockNumber === 0 ? '#ef4444' : stockNumber < 10 ? '#d97706' : '#0f172a'
                                }}
                              >
                                {stockNumber}
                              </span>
                              <button
                                type="button"
                                className="adminStockStepper__btn"
                                onClick={() => handleInlineStockChange(product._id, 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="adminMobileActions">
                          <button
                            type="button"
                            className="adminBtn adminBtnPrimary adminBtn--sm"
                            onClick={() => handleOpenEditProduct(product)}
                          >
                            <FiEdit2 />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="adminBtn adminBtnDanger adminBtn--sm"
                            onClick={() => handleDelete(product._id)}
                          >
                            <FiTrash2 />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div style={{ padding: '0 20px 16px' }}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  pageSize={pageSize}
                  onPageChange={(p) => {
                    setPage(p)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize)
                    setPage(1)
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                  showPageSize={true}
                  showTotal={true}
                  itemLabel="products"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Batch Actions Bar */}
      <BulkProductActionsBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onSuccess={loadData}
        token={token}
        categories={categories}
        subcategories={subcategories}
      />
    </div>
  )
}
