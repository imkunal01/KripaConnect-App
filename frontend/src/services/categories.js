import { apiFetch } from './api'

export async function listCategories() {
  const res = await apiFetch('/api/categories')
  return res.data
}

