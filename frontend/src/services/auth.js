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
  return apiFetch('/api/auth/refresh', { method: 'POST', noThrow: true, credentials: 'include' })
}

export async function googleLogin(credential, accessToken, role) {
  return apiFetch('/api/auth/google', { method: 'POST', body: { credential, accessToken, role } })
}

export async function profile(token) {
  return apiFetch('/api/auth/profile', { token })
}

export async function updateProfile(data, token) {
  return apiFetch('/api/auth/profile', { method: 'PUT', body: data, token })
}

export async function uploadProfilePhoto(file, token) {
  const formData = new FormData()
  formData.append('photo', file)
  
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  const res = await fetch(`${BASE_URL}/api/auth/profile/photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    mode: 'cors',
    body: formData,
  })
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Upload failed' }))
    const error = new Error(data.message || 'Upload failed')
    error.status = res.status
    throw error
  }
  
  return { ok: true, status: res.status, data: await res.json() }
}

// Password Reset
export async function forgotPassword(email) {
  return apiFetch('/api/auth/forgot-password', { method: 'POST', body: { email } })
}

export async function resetPassword(token, newPassword) {
  return apiFetch('/api/auth/reset-password', { method: 'POST', body: { token, newPassword } })
}

// OTP Login
export async function requestOtp(email) {
  return apiFetch('/api/auth/login-otp/request', { method: 'POST', body: { email } })
}

export async function verifyOtp(email, otp) {
  return apiFetch('/api/auth/login-otp/verify', { method: 'POST', body: { email, otp } })
}
