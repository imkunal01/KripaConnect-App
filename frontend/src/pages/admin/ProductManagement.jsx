import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listProducts } from '../../services/products'
import { listCategories } from '../../services/categories'
import { createProductAdmin, updateProductAdmin, deleteProductAdmin, removeProductImage } from '../../services/admin'
import { apiFetch } from '../../services/api'

export default function ProductManagement() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
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
      setProducts(prods.items || [])
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

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Product Management</h1>
          <p style={{ color: '#6b7280' }}>Manage products, inventory, and pricing</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null)
            setFormData({
              name: '', description: '', category: '', price: '', retailer_price: '',
              price_bulk: '', min_bulk_qty: '', stock: '', tags: '', active: true
            })
            setImages([])
            setShowForm(true)
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#FF3D3D',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          + Add Product
        </button>
      </div>

      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label>Price *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label>Retailer Price *</label>
                  <input
                    type="number"
                    value={formData.retailer_price}
                    onChange={e => setFormData({ ...formData, retailer_price: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label>Bulk Price</label>
                  <input
                    type="number"
                    value={formData.price_bulk}
                    onChange={e => setFormData({ ...formData, price_bulk: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label>Min Bulk Qty</label>
                  <input
                    type="number"
                    value={formData.min_bulk_qty}
                    onChange={e => setFormData({ ...formData, min_bulk_qty: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label>Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label>Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => setImages(Array.from(e.target.files))}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Active (visible to customers)
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#FF3D3D',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Image</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Stock</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>
                    <img
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/50'}
                      alt={product.name}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                  </td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{product.name}</td>
                  <td style={{ padding: '12px' }}>₹{product.price?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      color: product.stock < 10 ? '#ef4444' : product.stock < 50 ? '#f59e0b' : '#10b981',
                      fontWeight: '600'
                    }}>
                      {product.stock}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: product.active ? '#d1fae5' : '#fee2e2',
                      color: product.active ? '#166534' : '#991b1b',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(product)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#FF3D3D',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

