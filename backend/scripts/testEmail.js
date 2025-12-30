/**
 * Email Configuration Test Script
 *
 * Usage:
 *   npm run test:email
 *
 * What it does:
 * 1) Validates required env vars
 * 2) Prints which transport config is being used
 * 3) Runs nodemailer transporter.verify()
 * 4) Sends a test email to EMAIL_TEST_TO (or EMAIL_USER)
 */

require('dotenv').config()
const nodemailer = require('nodemailer')

function isTruthy(value) {
  if (value === true) return true
  const v = String(value || '').toLowerCase().trim()
  return v === '1' || v === 'true' || v === 'yes'
}

function mask(value, keepStart = 4, keepEnd = 2) {
  const s = String(value || '')
  if (!s) return '(not set)'
  if (s.length <= keepStart + keepEnd) return '*'.repeat(s.length)
  return `${s.slice(0, keepStart)}${'*'.repeat(Math.max(3, s.length - keepStart - keepEnd))}${s.slice(-keepEnd)}`
}

function normalizeUrl(u) {
  return String(u || '').trim().replace(/\/$/, '')
}

function buildTransportConfig() {
  const hasSmtpHost = !!process.env.EMAIL_HOST

  if (hasSmtpHost) {
    const port = Number(process.env.EMAIL_PORT || (isTruthy(process.env.EMAIL_SECURE) ? 465 : 587))
    const secure = isTruthy(process.env.EMAIL_SECURE) || port === 465

    return {
      kind: 'smtp',
      config: {
        host: process.env.EMAIL_HOST,
        port,
        secure,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    }
  }

  const provider = (process.env.EMAIL_PROVIDER || process.env.EMAIL_SERVICE || 'gmail').toLowerCase().trim()
  if (provider === 'gmail') {
    return {
      kind: 'gmail',
      config: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    }
  }

  return { kind: provider || 'unknown', config: null }
}

function validateEnv({ kind }) {
  const missing = []

  // Required for reset links
  if (!process.env.FRONTEND_URL) missing.push('FRONTEND_URL')

  if (kind === 'smtp') {
    if (!process.env.EMAIL_HOST) missing.push('EMAIL_HOST')
    if (!process.env.EMAIL_USER) missing.push('EMAIL_USER')
    if (!process.env.EMAIL_PASS) missing.push('EMAIL_PASS')
    // EMAIL_PORT optional, defaulted.
  } else if (kind === 'gmail') {
    if (!process.env.EMAIL_USER) missing.push('EMAIL_USER')
    if (!process.env.EMAIL_PASS) missing.push('EMAIL_PASS')
  } else {
    missing.push('EMAIL_HOST (SMTP) OR EMAIL_PROVIDER=gmail')
  }

  return missing
}

async function main() {
  console.log('\n🔍 Testing Email Configuration...\n')

  const { kind, config } = buildTransportConfig()

  console.log('1) Transport selection:')
  console.log(`   Provider: ${kind}`)

  console.log('\n2) Environment variables:')
  console.log(`   FRONTEND_URL: ${normalizeUrl(process.env.FRONTEND_URL) || '(not set)'}`)
  console.log(`   EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER || process.env.EMAIL_SERVICE || '(not set -> defaults to gmail)'}`)
  console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || '(not set)'}`)
  console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || '(not set)'}`)
  console.log(`   EMAIL_SECURE: ${process.env.EMAIL_SECURE || '(not set)'}`)
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? mask(process.env.EMAIL_USER, 3, 10) : '(not set)'}`)
  console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? mask(process.env.EMAIL_PASS, 2, 2) : '(not set)'}`)
  console.log(`   EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME || '(not set)'}`)
  console.log(`   EMAIL_FROM_EMAIL: ${process.env.EMAIL_FROM_EMAIL ? mask(process.env.EMAIL_FROM_EMAIL, 3, 10) : '(not set)'}`)

  const missing = validateEnv({ kind })
  if (missing.length) {
    console.error('\n❌ Missing required env vars:')
    for (const m of missing) console.error(`   - ${m}`)

    if (kind === 'gmail') {
      console.error('\n💡 Gmail note: EMAIL_PASS must be a Google App Password (2FA enabled), not your normal Gmail password.')
    }

    process.exit(1)
  }

  if (!config) {
    console.error('\n❌ Could not build nodemailer config. Check EMAIL_PROVIDER/EMAIL_HOST settings.')
    process.exit(1)
  }

  console.log('\n3) Transport config preview:')
  if (kind === 'smtp') {
    console.log(`   host: ${config.host}`)
    console.log(`   port: ${config.port}`)
    console.log(`   secure: ${config.secure}`)
    console.log(`   auth.user: ${mask(config.auth?.user, 3, 10)}`)
    console.log('   auth.pass: (hidden)')
  } else {
    console.log('   service: gmail')
    console.log(`   auth.user: ${mask(config.auth?.user, 3, 10)}`)
    console.log('   auth.pass: (hidden)')
  }

  console.log('\n4) Verifying SMTP connection (transporter.verify)...')
  const transporter = nodemailer.createTransport(config)

  try {
    await transporter.verify()
    console.log('   ✅ verify() OK')
  } catch (e) {
    console.error(`   ❌ verify() failed: ${e?.message || e}`)
    if (e?.code === 'EAUTH' || e?.responseCode === 535) {
      console.error('   💡 SMTP auth failed. If using Gmail, you must use an App Password.')
    }
    process.exit(1)
  }

  console.log('\n5) Sending a test email...')
  const to = process.env.EMAIL_TEST_TO || process.env.EMAIL_USER
  const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER
  const fromName = process.env.EMAIL_FROM_NAME || 'SKE'

  try {
    const info = await transporter.sendMail({
      from: fromEmail ? `"${fromName}" <${fromEmail}>` : undefined,
      to,
      subject: 'SKE Email Test (Production Setup)',
      html: `<div><p>Email test successful.</p><p><b>FRONTEND_URL</b>: ${normalizeUrl(process.env.FRONTEND_URL)}</p><p><b>Time</b>: ${new Date().toISOString()}</p></div>`,
    })

    console.log('   ✅ sendMail() OK')
    console.log(`   messageId: ${info?.messageId || '?'}`)
    console.log(`   accepted: ${(info?.accepted || []).join(', ') || '(none)'}`)
    console.log(`   rejected: ${(info?.rejected || []).join(', ') || '(none)'}`)

    console.log('\n✅ Email setup looks good.\n')
  } catch (e) {
    console.error(`   ❌ sendMail() failed: ${e?.message || e}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('❌ Unexpected error:', e?.message || e)
  process.exit(1)
})
