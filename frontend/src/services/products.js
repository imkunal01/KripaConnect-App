import { apiFetch } from './api'

export async function listProducts(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
  })
  const res = await apiFetch(`/api/products?${qs.toString()}`)
  return res.data
}

export async function getProduct(id) {
  const res = await apiFetch(`/api/products/${id}`)
  return res.data
}
