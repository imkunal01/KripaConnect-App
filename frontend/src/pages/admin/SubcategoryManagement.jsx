import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { createSubcategoryAdmin, updateSubcategoryAdmin, listSubcategoriesAdmin, listCategoriesAdmin } from '../../services/admin'

function getStatusLabel(status) {
  return status === 'inactive' ? 'Inactive' : 'Active'
}

export default function SubcategoryManagement() {
  const { token } = useAuth()
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({ name: '', slug: '', category_id: '', status: 'active' })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [errors, setErrors] = useState({})
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  function makeSlug(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  useEffect(() => {
    loadData()
  }, [token])

  useEffect(() => {
    if (!logoFile) return undefined
    const url = URL.createObjectURL(logoFile)
    setLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  async function loadData() {
    try {
      setLoading(true)
      const [cats, subs] = await Promise.all([
        listCategoriesAdmin(token),
        listSubcategoriesAdmin(token)
      ])
      setCategories(Array.isArray(cats) ? cats : [])
      setSubcategories(Array.isArray(subs) ? subs : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({ name: '', slug: '', category_id: '', status: 'active' })
    setLogoFile(null)
    setLogoPreview('')
    setErrors({})
    setActionError('')
    setSlugManuallyEdited(false)
  }

  function validateForm() {
    const nextErrors = {}
    if (!formData.name.trim()) nextErrors.name = 'Subcategory name is required'
    if (!formData.category_id) nextErrors.category_id = 'Select a category'
    if (!editingSubcategory && !logoFile) nextErrors.logo = 'Logo is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setActionError('')
      setSuccessMessage('')
      const payload = {
        name: formData.name.trim(),
        category_id: formData.category_id,
        status: formData.status
      }
      if (formData.slug.trim()) payload.slug = formData.slug.trim()

      if (editingSubcategory) {
        await updateSubcategoryAdmin(editingSubcategory._id, payload, logoFile, token)
        setSuccessMessage('Subcategory updated successfully')
      } else {
        await createSubcategoryAdmin(payload, logoFile, token)
        setSuccessMessage('Subcategory created successfully')
      }
      setShowForm(false)
      setEditingSubcategory(null)
      resetForm()
      loadData()
    } catch (err) {
      setActionError(err.message || (editingSubcategory ? 'Failed to update subcategory' : 'Failed to create subcategory'))
    }
  }

  function handleEdit(sub) {
    setEditingSubcategory(sub)
    setFormData({
      name: sub.name || '',
      slug: sub.slug || '',
      category_id: sub.category_id?._id || sub.category_id || '',
      status: sub.status || 'active'
    })
    setLogoFile(null)
    setLogoPreview(sub.logo || '')
    setErrors({})
    setActionError('')
    setSuccessMessage('')
    setSlugManuallyEdited(sub.slug && sub.slug !== makeSlug(sub.name))
    setShowForm(true)
  }

  const filtered = useMemo(() => {
    if (!search) return subcategories
    const s = search.toLowerCase()
    return subcategories.filter(sub => (
      sub.name?.toLowerCase().includes(s) ||
      sub.slug?.toLowerCase().includes(s) ||
      sub.category_id?.name?.toLowerCase().includes(s)
    ))
  }, [subcategories, search])

  if (loading) return <div className="adminEmpty">Loading…</div>

  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Subcategory Management</h1>
          <p className="adminPageHeader__subtitle">Create subcategories linked to categories</p>
        </div>
        <div className="adminActions">
          <button
            type="button"
            className="adminBtn adminBtnPrimary"
            onClick={() => {
              setEditingSubcategory(null)
              setSuccessMessage('')
              resetForm()
              setShowForm(true)
            }}
          >
            + Add Subcategory
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="adminCard" style={{ marginBottom: 16 }}>
          <div className="adminCard__section">
            <div className="adminHelp" style={{ color: 'var(--secondary)', fontWeight: 700 }}>{successMessage}</div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="adminModalOverlay" role="dialog" aria-modal="true">
          <div className="adminCard adminModal">
            <div className="adminModal__header">
              <h2 className="adminModal__title">{editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}</h2>
              <button
                type="button"
                className="adminBtn adminBtnGhost adminBtn--sm"
                onClick={() => {
                  setShowForm(false)
                  setEditingSubcategory(null)
                  setSuccessMessage('')
                  resetForm()
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
                    onChange={e => {
                      const nextName = e.target.value
                      setFormData(prev => ({
                        ...prev,
                        name: nextName,
                        slug: slugManuallyEdited ? prev.slug : makeSlug(nextName)
                      }))
                    }}
                    required
                  />
                  {errors.name && <div className="adminHelp" style={{ color: 'var(--danger)' }}>{errors.name}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Slug</label>
                  <input
                    className="adminInput"
                    type="text"
                    value={formData.slug}
                    onChange={e => {
                      setSlugManuallyEdited(true)
                      setFormData({ ...formData, slug: e.target.value })
                    }}
                    placeholder="auto-generated"
                  />
                  <div className="adminHelp">Updates automatically with name unless edited.</div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Category *</label>
                  <select
                    className="adminSelect"
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    disabled={!!editingSubcategory}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <div className="adminHelp" style={{ color: 'var(--danger)' }}>{errors.category_id}</div>}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label className="adminLabel">Logo {editingSubcategory ? '(optional)' : '*'}</label>
                  <input
                    className="adminInput"
                    type="file"
                    accept="image/*"
                    onChange={e => setLogoFile(e.target.files?.[0] || null)}
                  />
                  {errors.logo && <div className="adminHelp" style={{ color: 'var(--danger)' }}>{errors.logo}</div>}
                  {logoPreview && (
                    <div style={{ marginTop: 10 }}>
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="adminMobileThumb"
                        style={{ width: 72, height: 72 }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 4 }}>
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

                {actionError && (
                  <div className="adminHelp" style={{ color: 'var(--danger)', marginTop: 10 }}>{actionError}</div>
                )}
                {successMessage && (
                  <div className="adminHelp" style={{ color: 'var(--secondary)', marginTop: 10, fontWeight: 700 }}>{successMessage}</div>
                )}
              </div>

              <div className="adminModal__footer">
                <button type="submit" className="adminBtn adminBtnPrimary adminBtn--full">Create Subcategory</button>
                <button
                  type="button"
                  className="adminBtn adminBtn--full"
                  onClick={() => {
                    setShowForm(false)
                    setEditingSubcategory(null)
                    setSuccessMessage('')
                    resetForm()
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
          <label className="adminLabel">Search subcategories</label>
          <input
            className="adminInput"
            type="text"
            placeholder="Search by name, slug, or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {actionError && (
            <div className="adminHelp" style={{ color: 'var(--danger)', marginTop: 8 }}>{actionError}</div>
          )}
        </div>
      </div>

      <div className="adminCard">
        <div className="adminOnlyDesktop">
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub._id}>
                    <td>
                      <img
                        src={sub.logo || 'https://via.placeholder.com/52'}
                        alt={sub.name}
                        className="adminMobileThumb"
                      />
                    </td>
                    <td style={{ fontWeight: 800 }}>{sub.name}</td>
                    <td>{sub.category_id?.name || '—'}</td>
                    <td>
                      <span className={`adminBadge ${sub.status === 'inactive' ? 'adminBadge--danger' : 'adminBadge--ok'}`}>
                        {getStatusLabel(sub.status)}
                      </span>
                    </td>
                    <td>
                      <div className="adminActions">
                        <button type="button" className="adminBtn adminBtnPrimary adminBtn--sm" onClick={() => handleEdit(sub)}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="adminEmpty">No subcategories found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="adminOnlyMobile">
          <div className="adminMobileList">
            {filtered.map(sub => (
              <div key={sub._id} className="adminMobileCard">
                <div className="adminMobileCardHeader">
                  <div>
                    <div className="adminMobileCardTitle">{sub.name}</div>
                    <div className="adminMobileCardSub">{sub.category_id?.name || '—'}</div>
                  </div>
                  <img src={sub.logo || 'https://via.placeholder.com/52'} alt={sub.name} className="adminMobileThumb" />
                </div>
                <div className="adminMobileCardBody">
                  <div className="adminMobileMetaRow">
                    <span className="adminHelp">Status</span>
                    <span className={`adminBadge ${sub.status === 'inactive' ? 'adminBadge--danger' : 'adminBadge--ok'}`}>
                      {getStatusLabel(sub.status)}
                    </span>
                  </div>
                  <div className="adminMobileActions">
                    <button type="button" className="adminBtn adminBtnPrimary adminBtn--sm" onClick={() => handleEdit(sub)}>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!filtered.length && <div className="adminEmpty">No subcategories found</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
