# SendGrid Setup Guide (Render + Node/Express)

This project uses SendGrid to send transactional emails (OTP, password reset, order confirmation).

## 1) Create a SendGrid account
1. Go to https://sendgrid.com/
2. Create an account and complete any required verification.

## 2) Verify a Sender
SendGrid will only allow sending from a verified sender.

Choose one:
- **Single Sender Verification** (quick)
- **Domain Authentication** (recommended for deliverability)

In SendGrid Dashboard:
1. Settings → Sender Authentication
2. Complete either Single Sender or Domain Authentication
3. Note the verified sender email you will use as `EMAIL_FROM_EMAIL`

## 3) Create an API Key
1. Settings → API Keys
2. Create API Key
3. Permission: **Full Access** or at least **Mail Send**
4. Copy the key once (you won’t see it again)

## 4) Configure Render Environment Variables
In Render → your backend service → Environment:

Required:
- `SENDGRID_API_KEY` = your SendGrid API key
- `EMAIL_FROM_EMAIL` = verified sender email (e.g. `no-reply@yourdomain.com`)

Recommended:
- `EMAIL_FROM_NAME` = `Smart E-Commerce`
- `FRONTEND_URL` = your deployed frontend URL (used in reset-password links)

## 5) Local testing
From the backend folder:

PowerShell example:
```powershell
$env:SENDGRID_API_KEY = "SG.xxxxxx"
$env:EMAIL_FROM_EMAIL = "no-reply@yourdomain.com"
$env:EMAIL_FROM_NAME = "Smart E-Commerce"
$env:FRONTEND_URL = "http://localhost:5173"
$env:TEST_EMAIL_TO = "you@example.com"

npm run test:email
```

## 6) Troubleshooting
- **403 / sender not verified**: verify `EMAIL_FROM_EMAIL` in SendGrid
- **401 / invalid API key**: regenerate API key, update `SENDGRID_API_KEY`
- **Emails go to spam**: prefer Domain Authentication + set SPF/DKIM, and use a real from-domain
