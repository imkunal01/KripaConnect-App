import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listProducts } from '../../services/products'
import { listCategories } from '../../services/categories'
import { createProductAdmin, updateProductAdmin, deleteProductAdmin } from '../../services/admin'

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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    retailer_price: '',
    price_bulk: '',
    min_bulk_qty: '',
    stock: '',
    tags: '',
    active: true
  })
  const [images, setImages] = useState([])

  useEffect(() => {
    loadData()
  }, [token])

  async function loadData() {
    try {
      setLoading(true)
      const [prods, cats] = await Promise.all([
        listProducts({ limit: 1000 }),
        listCategories()
      ])
      const items = prods.items || []
      const sorted = Array.isArray(items)
        ? items.slice().sort((a, b) => getDocCreatedTimeMs(b) - getDocCreatedTimeMs(a))
        : []
      setProducts(sorted)
      setCategories(cats || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(product) {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: product.Category?._id || '',
      price: product.price || '',
      retailer_price: product.retailer_price || '',
      price_bulk: product.price_bulk || '',
      min_bulk_qty: product.min_bulk_qty || '',
      stock: product.stock || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      active: product.active !== false
    })
    setImages([])
    setShowForm(true)
  }

  function handleDelete(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductAdmin(productId, token).then(() => loadData())
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const productPayload = {
        ...formData,
        price: Number(formData.price),
        retailer_price: Number(formData.retailer_price),
        price_bulk: formData.price_bulk ? Number(formData.price_bulk) : undefined,
        min_bulk_qty: formData.min_bulk_qty ? Number(formData.min_bulk_qty) : undefined,
        stock: Number(formData.stock),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        category: formData.category || undefined
      }

      if (editingProduct) {
        await updateProductAdmin(editingProduct._id, productPayload, images, token)
      } else {
        await createProductAdmin(productPayload, images, token)
      }
      setShowForm(false)
      setEditingProduct(null)
      setFormData({
        name: '', description: '', category: '', price: '', retailer_price: '',
        price_bulk: '', min_bulk_qty: '', stock: '', tags: '', active: true
      })
      setImages([])
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to save product')
    }
  }

  if (loading) return <div className="adminEmpty">Loading…</div>

  const filteredProducts = products.filter(p => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(s) ||
      p.Category?.name?.toLowerCase().includes(s)
    )
  })

  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Product Management</h1>
          <p className="adminPageHeader__subtitle">Manage products, inventory, and pricing</p>
        </div>
        <div className="adminActions">
          <button
            type="button"
            className="adminBtn adminBtnPrimary"
            onClick={() => {
              setEditingProduct(null)
              setFormData({
                name: '', description: '', category: '', price: '', retailer_price: '',
                price_bulk: '', min_bulk_qty: '', stock: '', tags: '', active: true
              })
              setImages([])
              setShowForm(true)
            }}
          >
            + Add Product
          </button>
        </div>
      </div>

      {showForm && (
        <div className="adminModalOverlay" role="dialog" aria-modal="true">
          <div className="adminCard adminModal">
            <div className="adminModal__header">
              <h2 className="adminModal__title">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button
                type="button"
                className="adminBtn adminBtnGhost adminBtn--sm"
                onClick={() => {
                  setShowForm(false)
                  setEditingProduct(null)
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="adminModal__body">
                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Name *</label>
                  <input
                    className="adminInput"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Description</label>
                  <textarea
                    className="adminTextarea"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Category</label>
                  <select
                    className="adminSelect"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="adminFieldRow adminFieldRow--2" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="adminLabel">Price *</label>
                    <input
                      className="adminInput"
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="adminLabel">Retailer Price *</label>
                    <input
                      className="adminInput"
                      type="number"
                      value={formData.retailer_price}
                      onChange={e => setFormData({ ...formData, retailer_price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="adminFieldRow adminFieldRow--2" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="adminLabel">Bulk Price</label>
                    <input
                      className="adminInput"
                      type="number"
                      value={formData.price_bulk}
                      onChange={e => setFormData({ ...formData, price_bulk: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="adminLabel">Min Bulk Qty</label>
                    <input
                      className="adminInput"
                      type="number"
                      value={formData.min_bulk_qty}
                      onChange={e => setFormData({ ...formData, min_bulk_qty: e.target.value })}
                    />
                  </div>
                </div>

                <div className="adminFieldRow adminFieldRow--2" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="adminLabel">Stock *</label>
                    <input
                      className="adminInput"
                      type="number"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="adminLabel">Tags</label>
                    <input
                      className="adminInput"
                      type="text"
                      value={formData.tags}
                      onChange={e => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="comma separated"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Images</label>
                  <input
                    className="adminInput"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e => setImages(Array.from(e.target.files))}
                  />
                  <div className="adminHelp" style={{ marginTop: 6 }}>You can upload multiple images.</div>
                </div>

                <div style={{ marginBottom: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    />
                    <span className="adminHelp" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Active</span>
                    <span className="adminHelp">(visible to customers)</span>
                  </label>
                </div>
              </div>

              <div className="adminModal__footer">
                <button type="submit" className="adminBtn adminBtnPrimary adminBtn--full">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  className="adminBtn adminBtn--full"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="adminCard" style={{ marginBottom: 16 }}>
        <div className="adminCard__section">
          <label className="adminLabel">Search products</label>
          <input
            className="adminInput"
            type="text"
            placeholder="Search by product name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="adminCard">
        <div className="adminOnlyDesktop">
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const stockNumber = typeof product.stock === 'number' ? product.stock : Number(product.stock)
                  const stockColor = stockNumber < 10 ? 'var(--danger)' : stockNumber < 50 ? 'var(--text-secondary)' : 'var(--secondary)'
                  return (
                    <tr key={product._id}>
                      <td>
                        <img
                          src={product.images?.[0]?.url || 'https://via.placeholder.com/50'}
                          alt={product.name}
                          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border-color)' }}
                        />
                      </td>
                      <td style={{ fontWeight: 800 }}>{product.name}</td>
                      <td>₹{product.price?.toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{ color: stockColor, fontWeight: 900 }}>{product.stock}</span>
                      </td>
                      <td>
                        <span className={`adminBadge ${product.active ? 'adminBadge--ok' : 'adminBadge--danger'}`}>
                          {product.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="adminActions">
                          <button type="button" className="adminBtn adminBtnPrimary adminBtn--sm" onClick={() => handleEdit(product)}>
                            Edit
                          </button>
                          <button type="button" className="adminBtn adminBtnDanger adminBtn--sm" onClick={() => handleDelete(product._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && <div className="adminEmpty">No products found</div>}
        </div>

        <div className="adminOnlyMobile">
          {filteredProducts.length === 0 ? (
            <div className="adminEmpty">No products found</div>
          ) : (
            <div className="adminMobileList">
              {filteredProducts.map(product => (
                <div key={product._id} className="adminMobileCard">
                  <div className="adminMobileCardHeader">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <img
                        src={product.images?.[0]?.url || 'https://via.placeholder.com/50'}
                        alt={product.name}
                        className="adminMobileThumb"
                      />
                      <div style={{ minWidth: 0 }}>
                        <div className="adminMobileCardTitle" title={product.name}>{product.name}</div>
                        <div className="adminMobileCardSub" title={product.Category?.name || ''}>
                          {product.Category?.name || 'Uncategorized'}
                        </div>
                      </div>
                    </div>
                    <span className={`adminBadge ${product.active ? 'adminBadge--ok' : 'adminBadge--danger'}`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="adminMobileCardBody">
                    <div className="adminMobileMetaRow">
                      <span className="adminHelp">Price</span>
                      <span className="adminMobileMetaValue">₹{product.price?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="adminMobileMetaRow">
                      <span className="adminHelp">Stock</span>
                      <span className="adminMobileMetaValue">{product.stock}</span>
                    </div>
                  </div>

                  <div className="adminMobileActions">
                    <button type="button" className="adminBtn adminBtnPrimary adminBtn--sm" onClick={() => handleEdit(product)}>
                      Edit
                    </button>
                    <button type="button" className="adminBtn adminBtnDanger adminBtn--sm" onClick={() => handleDelete(product._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

