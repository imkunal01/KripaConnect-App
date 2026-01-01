import { apiFetch } from './api'

export async function getCart(token, purchaseMode) {
  const qs = purchaseMode ? `?purchaseMode=${encodeURIComponent(purchaseMode)}` : ''
  const res = await apiFetch(`/api/cart${qs}`, { token })
  return res.data?.data || []
}

export async function addToCart(productId, qty, token, purchaseMode) {
  return apiFetch('/api/cart/add', { method: 'POST', body: { productId, qty, purchaseMode }, token })
}

export async function updateCartItem(productId, qty, token, purchaseMode) {
  return apiFetch(`/api/cart/item/${productId}`, { method: 'PUT', body: { qty, purchaseMode }, token })
}

export async function removeCartItem(productId, token) {
  return apiFetch(`/api/cart/item/${productId}`, { method: 'DELETE', token })
}

