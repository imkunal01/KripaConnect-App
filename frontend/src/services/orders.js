import { apiFetch } from './api'

export async function createOrder(payload, token) {
  return apiFetch('/api/orders', { method: 'POST', body: payload, token })
}

export async function getMyOrders(token) {
  const res = await apiFetch('/api/orders/my', { token })
  return res.data || []
}

