/*
  SendGrid Email Test Script

  Sends a real email via SendGrid API.

  Required env vars:
    SENDGRID_API_KEY=<your sendgrid api key>
    EMAIL_FROM_EMAIL=<a verified sender email in SendGrid>
    TEST_EMAIL_TO=<recipient>

  Optional:
    EMAIL_FROM_NAME="Smart E-Commerce"
    TEST_EMAIL_SUBJECT="Hello"
    TEST_EMAIL_TEXT="Plain text"
    TEST_EMAIL_HTML="<b>Hello</b>"

  Usage (PowerShell):
    $env:SENDGRID_API_KEY = "SG.xxx"
    $env:EMAIL_FROM_EMAIL = "no-reply@yourdomain.com"
    $env:TEST_EMAIL_TO = "you@gmail.com"
    node scripts/testSendgridEmail.js
*/

require('dotenv').config()

const { sendMail } = require('../src/services/emailService')

async function main() {
  const to = process.env.TEST_EMAIL_TO
  if (!to) throw new Error('Missing TEST_EMAIL_TO env var')

  const subject = process.env.TEST_EMAIL_SUBJECT || 'Test Email (SendGrid)'
  const text = process.env.TEST_EMAIL_TEXT || 'If you received this, SendGrid email is working.'
  const html = process.env.TEST_EMAIL_HTML || `<p>${text}</p>`

  const result = await sendMail({ to, subject, text, html })
  console.log('✅ Email sent:', result)
}

main().catch((err) => {
  console.error('❌ Failed to send email:', err)
  process.exit(1)
})
