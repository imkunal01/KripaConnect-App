import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listProducts } from '../../services/products'
import {
  createBannerAdmin,
  deleteBannerAdmin,
  listBannersAdmin,
  updateBannerAdmin,
} from '../../services/admin'

const emptyForm = {
  title: '',
  subtitle: '',
  badge: '',
  ctaLabel: 'Shop now',
  product: '',
  status: 'active',
  sortOrder: 0,
  startsAt: '',
  endsAt: '',
}

function dateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export default function BannerManagement() {
  const { token } = useAuth()
  const [banners, setBanners] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [image, setImage] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [token])

  async function loadData() {
    try {
      setLoading(true)
      const [bannerItems, productData] = await Promise.all([
        listBannersAdmin(token),
        listProducts({ limit: 1000 }),
      ])
      setBanners(Array.isArray(bannerItems) ? bannerItems : [])
      setProducts(productData.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingBanner(null)
    setFormData(emptyForm)
    setImage(null)
    setShowForm(true)
  }

  function openEdit(banner) {
    setEditingBanner(banner)
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      badge: banner.badge || '',
      ctaLabel: banner.ctaLabel || 'Shop now',
      product: banner.product?._id || banner.product || '',
      status: banner.status || 'active',
      sortOrder: banner.sortOrder || 0,
      startsAt: dateInputValue(banner.startsAt),
      endsAt: dateInputValue(banner.endsAt),
    })
    setImage(null)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        product: formData.product || '',
        sortOrder: Number(formData.sortOrder || 0),
      }

      if (editingBanner) {
        await updateBannerAdmin(editingBanner._id, payload, image, token)
      } else {
        await createBannerAdmin(payload, image, token)
      }

      setShowForm(false)
      setEditingBanner(null)
      setImage(null)
      setFormData(emptyForm)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to save banner')
    }
  }

  async function handleDelete(banner) {
    if (!confirm(`Delete banner "${banner.title}"?`)) return
    await deleteBannerAdmin(banner._id, token)
    loadData()
  }

  const filteredBanners = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return banners
    return banners.filter(banner => (
      banner.title?.toLowerCase().includes(s) ||
      banner.badge?.toLowerCase().includes(s) ||
      banner.product?.name?.toLowerCase().includes(s)
    ))
  }, [banners, search])

  if (loading) return <div className="adminEmpty">Loading...</div>

  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Featured Banners</h1>
          <p className="adminPageHeader__subtitle">Create product-linked sale slides for the product page</p>
        </div>
        <div className="adminActions">
          <button type="button" className="adminBtn adminBtnPrimary" onClick={openCreate}>
            + Add Banner
          </button>
        </div>
      </div>

      {showForm && (
        <div className="adminModalOverlay" role="dialog" aria-modal="true">
          <div className="adminCard adminModal">
            <div className="adminModal__header">
              <h2 className="adminModal__title">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h2>
              <button
                type="button"
                className="adminBtn adminBtnGhost adminBtn--sm"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="adminModal__body">
                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Title *</label>
                  <input
                    className="adminInput"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Subtitle</label>
                  <textarea
                    className="adminTextarea"
                    rows={3}
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>

                <div className="adminFieldRow adminFieldRow--2" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="adminLabel">Discount Label</label>
                    <input
                      className="adminInput"
                      value={formData.badge}
                      onChange={e => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Up to 40% off"
                    />
                  </div>
                  <div>
                    <label className="adminLabel">Button Label</label>
                    <input
                      className="adminInput"
                      value={formData.ctaLabel}
                      onChange={e => setFormData({ ...formData, ctaLabel: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Linked Discount Product</label>
                  <select
                    className="adminSelect"
                    value={formData.product}
                    onChange={e => setFormData({ ...formData, product: e.target.value })}
                  >
                    <option value="">No product link</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="adminFieldRow adminFieldRow--2" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="adminLabel">Status</label>
                    <select
                      className="adminSelect"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="adminLabel">Sort Order</label>
                    <input
                      className="adminInput"
                      type="number"
                      value={formData.sortOrder}
                      onChange={e => setFormData({ ...formData, sortOrder: e.target.value })}
                    />
                  </div>
                </div>

                <div className="adminFieldRow adminFieldRow--2" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="adminLabel">Starts At</label>
                    <input
                      className="adminInput"
                      type="date"
                      value={formData.startsAt}
                      onChange={e => setFormData({ ...formData, startsAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="adminLabel">Ends At</label>
                    <input
                      className="adminInput"
                      type="date"
                      value={formData.endsAt}
                      onChange={e => setFormData({ ...formData, endsAt: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Banner Image</label>
                  <input
                    className="adminInput"
                    type="file"
                    accept="image/*"
                    onChange={e => setImage(e.target.files?.[0] || null)}
                  />
                  <div className="adminHelp" style={{ marginTop: 6 }}>
                    Use a wide image. If left empty, the linked product image is used.
                  </div>
                </div>
              </div>

              <div className="adminModal__footer">
                <button type="submit" className="adminBtn adminBtnPrimary adminBtn--full">
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
                <button type="button" className="adminBtn adminBtn--full" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="adminCard" style={{ marginBottom: 16 }}>
        <div className="adminCard__section">
          <label className="adminLabel">Search banners</label>
          <input
            className="adminInput"
            placeholder="Search by title, label, or product..."
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
                  <th>Preview</th>
                  <th>Title</th>
                  <th>Product</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanners.map(banner => (
                  <tr key={banner._id}>
                    <td>
                      <img
                        src={banner.image?.url || banner.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}
                        alt={banner.title}
                        style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border-color)' }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 900 }}>{banner.title}</div>
                      <div className="adminHelp">{banner.badge || 'No discount label'}</div>
                    </td>
                    <td>{banner.product?.name || 'No linked product'}</td>
                    <td>{banner.sortOrder || 0}</td>
                    <td>
                      <span className={`adminBadge ${banner.status === 'active' ? 'adminBadge--ok' : 'adminBadge--danger'}`}>
                        {banner.status}
                      </span>
                    </td>
                    <td>
                      <div className="adminActions">
                        <button type="button" className="adminBtn adminBtnPrimary adminBtn--sm" onClick={() => openEdit(banner)}>
                          Edit
                        </button>
                        <button type="button" className="adminBtn adminBtnDanger adminBtn--sm" onClick={() => handleDelete(banner)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBanners.length === 0 && <div className="adminEmpty">No banners found</div>}
        </div>

        <div className="adminOnlyMobile">
          {filteredBanners.length === 0 ? (
            <div className="adminEmpty">No banners found</div>
          ) : (
            <div className="adminMobileList">
              {filteredBanners.map(banner => (
                <div key={banner._id} className="adminMobileCard">
                  <div className="adminMobileCardHeader">
                    <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
                      <img
                        src={banner.image?.url || banner.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}
                        alt={banner.title}
                        className="adminMobileThumb"
                      />
                      <div style={{ minWidth: 0 }}>
                        <div className="adminMobileCardTitle">{banner.title}</div>
                        <div className="adminMobileCardSub">{banner.product?.name || banner.badge || 'Banner'}</div>
                      </div>
                    </div>
                    <span className={`adminBadge ${banner.status === 'active' ? 'adminBadge--ok' : 'adminBadge--danger'}`}>
                      {banner.status}
                    </span>
                  </div>

                  <div className="adminMobileActions">
                    <button type="button" className="adminBtn adminBtnPrimary adminBtn--sm" onClick={() => openEdit(banner)}>
                      Edit
                    </button>
                    <button type="button" className="adminBtn adminBtnDanger adminBtn--sm" onClick={() => handleDelete(banner)}>
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
