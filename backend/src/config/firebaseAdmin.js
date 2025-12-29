const admin = require('firebase-admin')

let initialized = false

function loadServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error(
      'Missing FIREBASE_SERVICE_ACCOUNT_JSON env var (stringified JSON or base64-encoded JSON).'
    )
  }

  const trimmed = raw.trim()

  // If it looks like JSON, parse directly.
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed)
  }

  // Otherwise treat as base64.
  const decoded = Buffer.from(trimmed, 'base64').toString('utf8')
  return JSON.parse(decoded)
}

function initFirebaseAdmin() {
  if (initialized) return admin

  const serviceAccount = loadServiceAccountFromEnv()

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  initialized = true
  return admin
}

module.exports = {
  initFirebaseAdmin,
  getFirebaseAdmin: () => {
    if (!initialized) initFirebaseAdmin()
    return admin
  }
}
