import { apiFetch } from './api'

export async function signup(payload) {
  return apiFetch('/api/auth/register', { method: 'POST', body: payload })
}

export async function login(payload) {
  return apiFetch('/api/auth/login', { method: 'POST', body: payload })
}

export async function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' })
}

export async function refresh() {
  return apiFetch('/api/auth/refresh', { method: 'POST', noThrow: true })
}

export async function profile(token) {
  return apiFetch('/api/auth/profile', { token })
}
