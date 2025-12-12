import { apiFetch } from './api'

export async function listFavorites(token) {
  const res = await apiFetch('/api/favorites', { token })
  return res.data?.data || []
}

export async function addFavorite(productId, token) {
  return apiFetch('/api/favorites/add', { method: 'POST', body: { productId }, token })
}

export async function removeFavorite(productId, token) {
  return apiFetch(`/api/favorites/remove/${productId}`, { method: 'DELETE', token })
}

