const User = require('../models/User')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const { sendPasswordResetEmail, sendOtpEmail } = require('../services/firebaseEmailService')
const generateToken = require('../utils/generateToken')
const generateRefreshToken = require('../utils/generateRefreshToken')

// Helper for cookie options (reuse from authController)
const getCookieOptions = (req) => {
  if (process.env.RENDER || process.env.NODE_ENV === 'production') {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }
  
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}

/**
 * Request password reset - generates token and sends email
 * POST /api/auth/forgot-password
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Find user but DON'T reveal if email exists (security best practice)
    const user = await User.findOne({ email })

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If that email exists, a password reset link has been sent.' })
    }

    // Generate secure random token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex')

    // Hash token before saving (never store plaintext tokens)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Save hashed token and expiry (15 minutes)
    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000 // 15 minutes
    await user.save()

    // Send email with plaintext token (only user has access to this)
    await sendPasswordResetEmail(email, resetToken, user.name)

    res.json({ message: 'If that email exists, a password reset link has been sent.' })
  } catch (error) {
    console.error('[Forgot Password]', error)
    res.status(500).json({ message: 'Failed to process password reset request' })
  }
}

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() } // Token not expired
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    
    // Invalidate all refresh tokens for security
    user.tokenVersion += 1
    
    await user.save()

    res.json({ message: 'Password reset successful. You can now log in with your new password.' })
  } catch (error) {
    console.error('[Reset Password]', error)
    res.status(500).json({ message: 'Failed to reset password' })
  }
}

/**
 * Request OTP for passwordless login
 * POST /api/auth/login-otp/request
 */
const requestLoginOtp = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Find user (DON'T reveal if email exists)
    const user = await User.findOne({ email })

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If that email exists, an OTP has been sent.' })
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()

    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10)

    // Save hashed OTP, expiry (5 minutes), and reset attempts
    user.loginOtp = hashedOtp
    user.loginOtpExpires = Date.now() + 5 * 60 * 1000 // 5 minutes
    user.loginOtpAttempts = 0 // Reset attempts counter
    await user.save()

    // Send OTP email
    await sendOtpEmail(email, otp, user.name)

    res.json({ message: 'If that email exists, an OTP has been sent.' })
  } catch (error) {
    console.error('[Request OTP]', error)
    res.status(500).json({ message: 'Failed to send OTP' })
  }
}

/**
 * Verify OTP and login
 * POST /api/auth/login-otp/verify
 */
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' })
    }

    // Find user with valid OTP
    const user = await User.findOne({
      email,
      loginOtpExpires: { $gt: Date.now() } // OTP not expired
    })

    if (!user || !user.loginOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    // Check if too many attempts (max 3)
    if (user.loginOtpAttempts >= 3) {
      // Invalidate OTP after max attempts
      user.loginOtp = undefined
      user.loginOtpExpires = undefined
      user.loginOtpAttempts = 0
      await user.save()
      
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new OTP.' })
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, user.loginOtp)

    if (!isValid) {
      // Increment attempts
      user.loginOtpAttempts += 1
      await user.save()
      
      const remainingAttempts = 3 - user.loginOtpAttempts
      return res.status(400).json({ 
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` 
      })
    }

    // OTP is valid - clear it and log user in
    user.loginOtp = undefined
    user.loginOtpExpires = undefined
    user.loginOtpAttempts = 0
    await user.save()

    // Issue JWT tokens (same as regular login)
    const access = generateToken(user._id, user.role, user.tokenVersion)
    const refresh = generateRefreshToken(user._id, user.tokenVersion)
    
    res.cookie('refreshToken', refresh, getCookieOptions(req))
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      savedAddresses: user.savedAddresses,
      token: access,
    })
  } catch (error) {
    console.error('[Verify OTP]', error)
    res.status(500).json({ message: 'Failed to verify OTP' })
  }
}

module.exports = {
  requestPasswordReset,
  resetPassword,
  requestLoginOtp,
  verifyLoginOtp,
}
