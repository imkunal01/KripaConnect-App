const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const NETWORK_OFFLINE_EVENT = 'network:offline-request'
const NETWORK_RETRY_EVENT = 'network:retrying-requests'
const inFlightSafeRequests = new Map()

// Common production misconfig: forgetting to set VITE_API_BASE_URL on Vercel/Netlify.
// This silently points the app to localhost in production, breaking login/OTP/reset.
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.warn(
    '[Config] VITE_API_BASE_URL is not set. Falling back to http://localhost:5000 (this will break in production).'
  )
}

function isBrowserOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

function isSafeRetryMethod(method) {
  const normalized = String(method || 'GET').toUpperCase()
  return normalized === 'GET' || normalized === 'HEAD'
}

function getRequestKey(path, { method, token, credentials }) {
  return [
    String(method || 'GET').toUpperCase(),
    path,
    token ? `auth:${token.slice(-12)}` : 'anon',
    credentials || 'include',
  ].join('|')
}

function emitNetworkEvent(name) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(name))
}

function waitForOnline() {
  if (typeof window === 'undefined' || !isBrowserOffline()) {
    return Promise.resolve()
  }

  emitNetworkEvent(NETWORK_OFFLINE_EVENT)

  return new Promise(resolve => {
    window.addEventListener('online', resolve, { once: true })
  })
}

function makeOfflineError() {
  const error = new Error('No internet connection. Please reconnect and try again.')
  error.code = 'OFFLINE'
  return error
}

async function runFetch(path, { method, body, token, headers, credentials }) {
  return fetch(`${BASE_URL}${path}`, {
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
}

async function apiFetch(path, { method = 'GET', body, token, headers = {}, credentials = 'include', noThrow = false } = {}) {
  const retryWhenOnline = isSafeRetryMethod(method)
  const canShareRequest = retryWhenOnline && !body

  if (canShareRequest) {
    const key = getRequestKey(path, { method, token, credentials })
    const existing = inFlightSafeRequests.get(key)
    if (existing) return existing

    const requestPromise = performApiFetch(path, { method, body, token, headers, credentials, noThrow, retryWhenOnline })
      .finally(() => {
        inFlightSafeRequests.delete(key)
      })

    inFlightSafeRequests.set(key, requestPromise)
    return requestPromise
  }

  return performApiFetch(path, { method, body, token, headers, credentials, noThrow, retryWhenOnline })
}

async function performApiFetch(path, { method, body, token, headers, credentials, noThrow, retryWhenOnline }) {
  if (isBrowserOffline()) {
    if (!retryWhenOnline) {
      const offlineError = makeOfflineError()
      if (noThrow) return { ok: false, status: 0, data: { message: offlineError.message } }
      throw offlineError
    }

    await waitForOnline()
    emitNetworkEvent(NETWORK_RETRY_EVENT)
  }

  let res

  try {
    res = await runFetch(path, { method, body, token, headers, credentials })
  } catch (err) {
    if (retryWhenOnline && isBrowserOffline()) {
      await waitForOnline()
      emitNetworkEvent(NETWORK_RETRY_EVENT)
      res = await runFetch(path, { method, body, token, headers, credentials })
    } else {
      if (noThrow) return { ok: false, status: 0, data: { message: err?.message || 'Network request failed' } }
      throw err
    }
  }

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
    const message =
      typeof data === 'string'
        ? data
        : data?.detail
          ? `${data?.message || 'Request failed'} (${data.detail})`
          : data?.message || 'Request failed'
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }
  return { ok: true, status: res.status, data }
}

export { BASE_URL, apiFetch }
