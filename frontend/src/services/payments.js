import { apiFetch } from './api'

export async function createRazorpayOrder(orderId, token) {
  return apiFetch('/api/payments/create-order', { method: 'POST', body: { orderId }, token })
}

export async function verifyPayment(payload, token) {
  return apiFetch('/api/payments/verify', { method: 'POST', body: payload, token })
}

