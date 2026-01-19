import { apiFetch } from './api'

// Analytics & Stats
export async function getOverview(token) {
  const res = await apiFetch('/api/analytics/overview', { token })
  return res.data
}

export async function getRevenueStats(token) {
  const res = await apiFetch('/api/analytics/revenue', { token })
  // Backend returns { success: true, data: [...] }
  // apiFetch returns { ok: true, data: { success: true, data: [...] } }
  return (res.data && res.data.data) || (Array.isArray(res.data) ? res.data : [])
}

export async function getOrderStats(token) {
  const res = await apiFetch('/api/analytics/orders', { token })
  return (res.data && res.data.data) || (Array.isArray(res.data) ? res.data : [])
}

export async function getTopProducts(token) {
  const res = await apiFetch('/api/analytics/top-products', { token })
  return res.data || []
}

export async function getLowStock(token) {
  const res = await apiFetch('/api/analytics/low-stock', { token })
  // Backend returns { success: true, data: [...] }
  // apiFetch returns { ok: true, data: { success: true, data: [...] } }
  return (res.data && res.data.data) || (Array.isArray(res.data) ? res.data : [])
}

// User Management
export async function getAllUsers(token) {
  const res = await apiFetch('/api/admin/users', { token })
  return res.data?.data || []
}

export async function toggleBlockUser(userId, token) {
  const res = await apiFetch(`/api/admin/users/block/${userId}`, { method: 'PUT', token })
  return res.data
}

export async function updateUserRole(userId, role, token) {
  const res = await apiFetch(`/api/admin/users/role/${userId}`, { method: 'PUT', body: { role }, token })
  return res.data
}

export async function deleteUser(userId, token) {
  const res = await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE', token })
  return res.data
}

// Order Management
export async function getAllOrdersAdmin(token) {
  const res = await apiFetch('/api/admin/orders', { token })
  return res.data?.data || []
}

export async function getOrderByIdAdmin(orderId, token) {
  const res = await apiFetch(`/api/admin/orders/${orderId}`, { token })
  return res.data?.data ? res.data : { data: res.data }
}

export async function updateOrderStatus(orderId, status, token) {
  const res = await apiFetch(`/api/admin/orders/status/${orderId}`, { method: 'PUT', body: { status }, token })
  return res.data
}

export async function deleteOrderAdmin(orderId, token) {
  const res = await apiFetch(`/api/admin/orders/${orderId}`, { method: 'DELETE', token })
  return res.data
}

// Product Management (using existing product routes with admin auth)
export async function createProductAdmin(productData, images, token) {
  const formData = new FormData()
  
  Object.keys(productData).forEach(key => {
    if (productData[key] !== undefined && productData[key] !== null) {
      if (Array.isArray(productData[key])) {
        formData.append(key, JSON.stringify(productData[key]))
      } else {
        formData.append(key, productData[key])
      }
    }
  })
  
  if (images && images.length > 0) {
    images.forEach(file => {
      formData.append('images', file)
    })
  }
  
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  })
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Failed to create product' }))
    const error = new Error(data.message || 'Failed to create product')
    error.status = res.status
    throw error
  }
  
  return { ok: true, data: await res.json() }
}

export async function updateProductAdmin(productId, productData, images, token) {
  const formData = new FormData()
  
  Object.keys(productData).forEach(key => {
    if (productData[key] !== undefined && productData[key] !== null) {
      if (Array.isArray(productData[key])) {
        formData.append(key, JSON.stringify(productData[key]))
      } else {
        formData.append(key, productData[key])
      }
    }
  })
  
  if (images && images.length > 0) {
    images.forEach(file => {
      formData.append('images', file)
    })
  }
  
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  })
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Failed to update product' }))
    const error = new Error(data.message || 'Failed to update product')
    error.status = res.status
    throw error
  }
  
  return { ok: true, data: await res.json() }
}

export async function deleteProductAdmin(productId, token) {
  const res = await apiFetch(`/api/products/${productId}`, { method: 'DELETE', token })
  return res.data
}

export async function removeProductImage(productId, publicId, token) {
  const res = await apiFetch(`/api/products/${productId}/image/${publicId}`, { method: 'DELETE', token })
  return res.data
}

// Review Management
export async function getAllReviews(token) {
  const res = await apiFetch('/api/reviews/all', { token })
  return res.data?.data || []
}

export async function deleteReview(reviewId, token) {
  const res = await apiFetch(`/api/reviews/${reviewId}`, { method: 'DELETE', token })
  return res.data
}

// Category Management (admin)
export async function listCategoriesAdmin(token) {
  const res = await apiFetch('/api/admin/categories', { token })
  return res.data || []
}

export async function createCategoryAdmin(categoryData, logoFile, token) {
  const formData = new FormData()

  Object.keys(categoryData).forEach(key => {
    if (categoryData[key] !== undefined && categoryData[key] !== null) {
      formData.append(key, categoryData[key])
    }
  })

  if (logoFile) {
    formData.append('logo', logoFile)
  }

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  const res = await fetch(`${BASE_URL}/api/admin/categories`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Failed to create category' }))
    const error = new Error(data.message || 'Failed to create category')
    error.status = res.status
    throw error
  }

  return { ok: true, data: await res.json() }
}

export async function updateCategoryStatusAdmin(categoryId, status, token) {
  const res = await apiFetch(`/api/admin/categories/${categoryId}/status`, {
    method: 'PATCH',
    body: { status },
    token
  })
  return res.data
}

export async function updateCategoryAdmin(categoryId, categoryData, logoFile, token) {
  const formData = new FormData()

  Object.keys(categoryData).forEach(key => {
    if (categoryData[key] !== undefined && categoryData[key] !== null && categoryData[key] !== '') {
      formData.append(key, categoryData[key])
    }
  })

  if (logoFile) {
    formData.append('logo', logoFile)
  }

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  const res = await fetch(`${BASE_URL}/api/admin/categories/${categoryId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Failed to update category' }))
    const error = new Error(data.message || 'Failed to update category')
    error.status = res.status
    throw error
  }

  return { ok: true, data: await res.json() }
}

// Subcategory Management (admin)
export async function listSubcategoriesAdmin(token, params = {}) {
  const query = new URLSearchParams(params).toString()
  const res = await apiFetch(`/api/admin/subcategories${query ? `?${query}` : ''}`, { token })
  return res.data || []
}

export async function createSubcategoryAdmin(subcategoryData, logoFile, token) {
  const formData = new FormData()

  Object.keys(subcategoryData).forEach(key => {
    if (subcategoryData[key] !== undefined && subcategoryData[key] !== null) {
      formData.append(key, subcategoryData[key])
    }
  })

  if (logoFile) {
    formData.append('logo', logoFile)
  }

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  const res = await fetch(`${BASE_URL}/api/admin/subcategories`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Failed to create subcategory' }))
    const error = new Error(data.message || 'Failed to create subcategory')
    error.status = res.status
    throw error
  }

  return { ok: true, data: await res.json() }
}

export async function updateSubcategoryAdmin(subcategoryId, subcategoryData, logoFile, token) {
  const formData = new FormData()

  Object.keys(subcategoryData).forEach(key => {
    if (subcategoryData[key] !== undefined && subcategoryData[key] !== null && subcategoryData[key] !== '') {
      formData.append(key, subcategoryData[key])
    }
  })

  if (logoFile) {
    formData.append('logo', logoFile)
  }

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  const res = await fetch(`${BASE_URL}/api/admin/subcategories/${subcategoryId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Failed to update subcategory' }))
    const error = new Error(data.message || 'Failed to update subcategory')
    error.status = res.status
    throw error
  }

  return { ok: true, data: await res.json() }
}

