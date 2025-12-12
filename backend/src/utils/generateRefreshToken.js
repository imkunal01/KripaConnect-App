const jwt = require('jsonwebtoken')

function generateRefreshToken(id, tokenVersion = 0) {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

module.exports = generateRefreshToken
