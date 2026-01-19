import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { createCategoryAdmin, updateCategoryAdmin, updateCategoryStatusAdmin, listCategoriesAdmin } from '../../services/admin'

function getStatusLabel(status) {
  return status === 'inactive' ? 'Inactive' : 'Active'
}

export default function CategoryManagement() {
  const { token } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({ name: '', slug: '', status: 'active' })
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
      const data = await listCategoriesAdmin(token)
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({ name: '', slug: '', status: 'active' })
    setLogoFile(null)
    setLogoPreview('')
    setErrors({})
    setActionError('')
    setSlugManuallyEdited(false)
  }

  function validateForm() {
    const nextErrors = {}
    if (!formData.name.trim()) nextErrors.name = 'Category name is required'
    if (!editingCategory && !logoFile) nextErrors.logo = 'Logo is required'
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
        status: formData.status
      }
      if (formData.slug.trim()) payload.slug = formData.slug.trim()

      if (editingCategory) {
        await updateCategoryAdmin(editingCategory._id, payload, logoFile, token)
        setSuccessMessage('Category updated successfully')
      } else {
        await createCategoryAdmin(payload, logoFile, token)
        setSuccessMessage('Category created successfully')
      }
      setShowForm(false)
      setEditingCategory(null)
      resetForm()
      loadData()
    } catch (err) {
      setActionError(err.message || (editingCategory ? 'Failed to update category' : 'Failed to create category'))
    }
  }

  function handleEdit(category) {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      status: category.status || 'active'
    })
    setLogoFile(null)
    setLogoPreview(category.logo || '')
    setErrors({})
    setActionError('')
    setSuccessMessage('')
    setSlugManuallyEdited(category.slug && category.slug !== makeSlug(category.name))
    setShowForm(true)
  }

  async function toggleStatus(category) {
    setActionError('')
    try {
      const next = category.status === 'active' ? 'inactive' : 'active'
      await updateCategoryStatusAdmin(category._id, next, token)
      loadData()
    } catch (err) {
      setActionError(err.message || 'Failed to update status')
    }
  }

  const filtered = useMemo(() => {
    if (!search) return categories
    const s = search.toLowerCase()
    return categories.filter(cat => (
      cat.name?.toLowerCase().includes(s) ||
      cat.slug?.toLowerCase().includes(s)
    ))
  }, [categories, search])

  if (loading) return <div className="adminEmpty">Loading…</div>

  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <div>
          <h1 className="adminPageHeader__title">Category Management</h1>
          <p className="adminPageHeader__subtitle">Create categories and manage visibility</p>
        </div>
        <div className="adminActions">
          <button
            type="button"
            className="adminBtn adminBtnPrimary"
            onClick={() => {
              setEditingCategory(null)
              setSuccessMessage('')
              resetForm()
              setShowForm(true)
            }}
          >
            + Add Category
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
              <h2 className="adminModal__title">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button
                type="button"
                className="adminBtn adminBtnGhost adminBtn--sm"
                onClick={() => {
                  setShowForm(false)
                  setEditingCategory(null)
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
                  <label className="adminLabel">Logo {editingCategory ? '(optional)' : '*'}</label>
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
                <button type="submit" className="adminBtn adminBtnPrimary adminBtn--full">Create Category</button>
                <button
                  type="button"
                  className="adminBtn adminBtn--full"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCategory(null)
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
          <label className="adminLabel">Search categories</label>
          <input
            className="adminInput"
            type="text"
            placeholder="Search by name or slug…"
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
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cat => (
                  <tr key={cat._id}>
                    <td>
                      <img
                        src={cat.logo || 'https://via.placeholder.com/52'}
                        alt={cat.name}
                        className="adminMobileThumb"
                      />
                    </td>
                    <td style={{ fontWeight: 800 }}>{cat.name}</td>
                    <td>{cat.slug}</td>
                    <td>
                      <span className={`adminBadge ${cat.status === 'inactive' ? 'adminBadge--danger' : 'adminBadge--ok'}`}>
                        {getStatusLabel(cat.status)}
                      </span>
                    </td>
                    <td>
                      <div className="adminActions">
                        <button
                          type="button"
                          className="adminBtn adminBtn--sm"
                          onClick={() => toggleStatus(cat)}
                        >
                          {cat.status === 'inactive' ? 'Enable' : 'Disable'}
                        </button>
                        <button
                          type="button"
                          className="adminBtn adminBtnPrimary adminBtn--sm"
                          onClick={() => handleEdit(cat)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="adminEmpty">No categories found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="adminOnlyMobile">
          <div className="adminMobileList">
            {filtered.map(cat => (
              <div key={cat._id} className="adminMobileCard">
                <div className="adminMobileCardHeader">
                  <div>
                    <div className="adminMobileCardTitle">{cat.name}</div>
                    <div className="adminMobileCardSub">{cat.slug}</div>
                  </div>
                  <img src={cat.logo || 'https://via.placeholder.com/52'} alt={cat.name} className="adminMobileThumb" />
                </div>
                <div className="adminMobileCardBody">
                  <div className="adminMobileMetaRow">
                    <span className="adminHelp">Status</span>
                    <span className={`adminBadge ${cat.status === 'inactive' ? 'adminBadge--danger' : 'adminBadge--ok'}`}>
                      {getStatusLabel(cat.status)}
                    </span>
                  </div>
                  <div className="adminMobileActions">
                    <button type="button" className="adminBtn adminBtn--sm" onClick={() => toggleStatus(cat)}>
                      {cat.status === 'inactive' ? 'Enable' : 'Disable'}
                    </button>
                    <button type="button" className="adminBtn adminBtnPrimary adminBtn--sm" onClick={() => handleEdit(cat)}>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!filtered.length && <div className="adminEmpty">No categories found</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
