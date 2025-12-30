const sgMail = require('@sendgrid/mail')

function readEnvTrimmed(key) {
  const value = process.env[key]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

function getFromAddress() {
  const fromEmail = readEnvTrimmed('EMAIL_FROM_EMAIL')
  const fromName = readEnvTrimmed('EMAIL_FROM_NAME') || 'Smart E-Commerce'
  if (!fromEmail) {
    throw new Error('Missing EMAIL_FROM_EMAIL env var (SendGrid requires a verified sender).')
  }
  return { email: fromEmail, name: fromName }
}

/**
 * SendGrid email sender (production-safe on Render).
 *
 * This sends email directly via SendGrid API.
 * Required env vars:
 *  - SENDGRID_API_KEY
 *  - EMAIL_FROM_EMAIL (verified sender in SendGrid)
 */
async function sendMail({ to, subject, html, text, cc, bcc, replyTo }) {
  if (!to) throw new Error('Missing email recipient (to)')
  if (!subject) throw new Error('Missing email subject')
  if (!html && !text) throw new Error('Missing email body (html or text)')

  const apiKey = readEnvTrimmed('SENDGRID_API_KEY')
  if (!apiKey) {
    throw new Error('Missing SENDGRID_API_KEY env var')
  }

  sgMail.setApiKey(apiKey)

  const from = getFromAddress()

  const msg = {
    to,
    from,
    subject,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
    ...(replyTo ? { replyTo } : {}),
    ...(cc ? { cc } : {}),
    ...(bcc ? { bcc } : {}),
  }

  try {
    const [result] = await sgMail.send(msg)

    if (process.env.NODE_ENV === 'production') {
      const status = result?.statusCode
      console.log(`[Email] sent to=${Array.isArray(to) ? to.join(',') : to} status=${status}`)
    }

    return { statusCode: result?.statusCode }
  } catch (err) {
    const statusCode = err?.code || err?.response?.statusCode
    const sendgridErrors = err?.response?.body?.errors
    const detailMessage = Array.isArray(sendgridErrors)
      ? sendgridErrors.map((e) => e?.message).filter(Boolean).join(' | ')
      : undefined

    console.error('[SendGrid] send failed', {
      statusCode,
      detailMessage,
      sendgridErrors,
    })

    const e = new Error(detailMessage || 'SendGrid rejected the email request')
    e.statusCode = statusCode
    e.provider = 'sendgrid'
    e.providerErrors = sendgridErrors
    throw e
  }
}

/**
 * Send password reset email with reset link
 */
async function sendPasswordResetEmail(email, resetToken, userName = 'User') {
  const resetUrl = `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p><strong>This link will expire in 15 minutes.</strong></p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Smart E-Commerce. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail({
    to: email,
    subject: 'Password Reset Request',
    html,
    text: `Hi ${userName},\n\nReset your password using this link (expires in 15 minutes):\n${resetUrl}\n\nIf you didn't request a reset, ignore this email.`
  });
}

/**
 * Send OTP email for passwordless login
 */
async function sendOtpEmail(email, otp, userName = 'User') {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Login OTP</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Use the following One-Time Password (OTP) to log in to your account:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
          <p>You have 3 attempts to enter the correct OTP.</p>
          <p>If you didn't request this OTP, please ignore this email and secure your account.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Smart E-Commerce. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail({
    to: email,
    subject: 'Your Login OTP Code',
    html,
    text: `Hi ${userName},\n\nYour login OTP is: ${otp}\n\nThis OTP expires in 5 minutes. If you didn't request it, ignore this email.`
  });
}

module.exports = { sendMail, sendPasswordResetEmail, sendOtpEmail };
