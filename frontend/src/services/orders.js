import { apiFetch } from './api'

export async function createOrder(payload, token) {
  return apiFetch('/api/orders', { method: 'POST', body: payload, token })
}

export async function getMyOrders(token) {
  const res = await apiFetch('/api/orders/my', { token })
  return res.data || []
}

export async function getOrderById(orderId, token) {
  const res = await apiFetch(`/api/orders/${orderId}`, { token })
  return res.data
}

export async function cancelOrder(orderId, token) {
  return apiFetch(`/api/orders/${orderId}/cancel`, { method: 'PUT', token })
}

export function getOrderInvoiceUrl(orderId, token) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
  return `${BASE_URL}/api/orders/${orderId}/invoice?token=${encodeURIComponent(token || '')}`
}

export async function downloadInvoicePdf(orderId, token) {
  const url = getOrderInvoiceUrl(orderId, token)
  window.open(url, '_blank')
}
