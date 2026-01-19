import { apiFetch } from './api'

export async function listSubcategories(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
  })
  const res = await apiFetch(`/api/subcategories${qs.toString() ? `?${qs.toString()}` : ''}`)
  return res.data
}
