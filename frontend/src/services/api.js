const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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
