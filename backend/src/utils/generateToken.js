const jwt = require('jsonwebtoken');

const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign({ id, role, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  })
}

module.exports = generateToken
