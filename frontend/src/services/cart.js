import { apiFetch } from './api'

export async function getCart(token) {
  const res = await apiFetch('/api/cart', { token })
  return res.data?.data || []
}

export async function addToCart(productId, qty, token) {
  return apiFetch('/api/cart/add', { method: 'POST', body: { productId, qty }, token })
}

export async function updateCartItem(productId, qty, token) {
  return apiFetch(`/api/cart/item/${productId}`, { method: 'PUT', body: { qty }, token })
}

export async function removeCartItem(productId, token) {
  return apiFetch(`/api/cart/item/${productId}`, { method: 'DELETE', token })
}

