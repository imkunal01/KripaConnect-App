const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Common production misconfig: forgetting to set VITE_API_BASE_URL on Vercel/Netlify.
// This silently points the app to localhost in production, breaking login/OTP/reset.
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Config] VITE_API_BASE_URL is not set. Falling back to http://localhost:5000 (this will break in production).'
  )
}

async function apiFetch(path, { method = 'GET', body, token, headers = {}, credentials = 'include', noThrow = false } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials,
    mode: 'cors',
  })
  let data
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }
  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    if (noThrow) return { ok: false, status: res.status, data }
    const message = typeof data === 'string' ? data : data?.message || 'Request failed'
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }
  return { ok: true, status: res.status, data }
}

export { BASE_URL, apiFetch }
