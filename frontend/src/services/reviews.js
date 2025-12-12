import { apiFetch } from './api'

export async function listProductReviews(productId) {
  const res = await apiFetch(`/api/reviews/product/${productId}`)
  return res.data?.data || []
}

export async function createProductReview(productId, payload, token) {
  return apiFetch(`/api/reviews/product/${productId}`, { method: 'POST', body: payload, token })
}

