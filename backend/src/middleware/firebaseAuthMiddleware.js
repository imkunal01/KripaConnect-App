const { verifyFirebaseIdToken } = require('../config/firebaseAdmin')

function extractToken(req) {
  // 1) Authorization: Bearer <token>
  const auth = req.headers.authorization
  if (auth && typeof auth === 'string') {
    const [scheme, token] = auth.split(' ')
    if (scheme?.toLowerCase() === 'bearer' && token) return token
  }

  // 2) Custom header
  const headerToken = req.headers['x-firebase-token']
  if (headerToken && typeof headerToken === 'string') return headerToken

  // 3) Body
  const bodyToken = req.body?.firebaseIdToken
  if (bodyToken && typeof bodyToken === 'string') return bodyToken

  return null
}

async function verifyFirebasePhoneToken(req, res, next) {
  try {
    const idToken = extractToken(req)
    if (!idToken) return res.status(400).json({ message: 'Missing firebaseIdToken' })

    const decoded = await verifyFirebaseIdToken(idToken)

    // Firebase phone auth ID tokens include phone_number when phone auth is used.
    const phone = decoded?.phone_number
    if (!phone) return res.status(401).json({ message: 'Token does not include verified phone number' })

    req.firebase = decoded
    req.verifiedPhoneNumber = phone
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Invalid Firebase token' })
  }
}

module.exports = {
  verifyFirebasePhoneToken,
}
