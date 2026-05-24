import { apiFetch } from './api'

export async function listBanners() {
  const res = await apiFetch('/api/banners')
  return res.data || []
}
