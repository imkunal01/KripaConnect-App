# Firebase Phone OTP Setup Guide

## Step 1: Create/Access Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** (or select existing project)
3. Enter project name → Click **Continue**
4. (Optional) Enable Google Analytics → Click **Continue**
5. Click **Create project**

---

## Step 2: Register Your Web App

1. In Firebase Console, click the **web icon** `</>` to add a web app
2. Enter an **App nickname** (e.g., "SKE Frontend")
3. **Do NOT** check "Set up Firebase Hosting" (you're using Vercel/Render)
4. Click **Register app**
5. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  appId: "1:123456789:web:abcdef123456"
};
```

6. Copy these values → Click **Continue to console**

---

## Step 3: Enable Phone Authentication

1. In Firebase Console left sidebar, click **Build** → **Authentication**
2. Click **Get started** (if first time)
3. Go to **Sign-in method** tab
4. Click **Phone** in the provider list
5. Toggle **Enable** switch to ON
6. Click **Save**

---

## Step 4: Add Authorized Domains

Firebase only allows OTP from authorized domains (for security).

1. Still in **Authentication** → **Settings** tab
2. Scroll to **Authorized domains** section
3. By default, `localhost` is already authorized (for local dev)
4. Click **Add domain** and add:
   - Your Vercel frontend domain (e.g., `your-app.vercel.app`)
   - Any custom domains
5. Click **Add**

---

## Step 5: Generate Service Account JSON (for Backend)

Your backend needs Firebase Admin SDK credentials.

1. In Firebase Console, click the **gear icon** ⚙️ (top left) → **Project settings**
2. Go to **Service accounts** tab
3. Click **Generate new private key**
4. Confirm by clicking **Generate key**
5. A JSON file will download (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

**⚠️ KEEP THIS FILE SECURE - Never commit to git!**

---

## Step 6: Configure Environment Variables

### Frontend `.env` (Vite)

Create/update `frontend/.env`:

```env
VITE_API_BASE_URL=https://kripaconnect-app.onrender.com

# Firebase Web SDK Config (from Step 2)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Your existing Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend Environment Variables (Render)

You need to add the service account JSON as an environment variable.

**Option A: Base64 Encode (Recommended for Render)**

Open PowerShell/terminal:

```powershell
# Navigate to where you downloaded the JSON
cd ~/Downloads

# Convert to base64
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("your-project-firebase-adminsdk-xxxxx.json")) | Set-Clipboard
```

The base64 string is now in your clipboard.

In **Render Dashboard**:
1. Go to your backend service
2. Click **Environment** tab
3. Add variable:
   - Key: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Value: Paste the base64 string
4. Click **Save Changes**

**Option B: Raw JSON (Alternative)**

Copy the entire contents of the JSON file (minified, no newlines):

```json
{"type":"service_account","project_id":"your-project",...}
```

In **Render Environment**:
- Key: `FIREBASE_SERVICE_ACCOUNT_JSON`
- Value: Paste the entire JSON string (one line)

---

## Step 7: Test Phone Numbers (Optional - for Development)

If you want to test without real SMS:

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Scroll to **Phone** provider → Click to expand
3. Scroll down to **Phone numbers for testing**
4. Click **Add phone number**
5. Add test numbers with codes (e.g., `+919999999999` → code `123456`)
6. Click **Save**

These numbers will skip SMS and always accept the test code.

---

## Step 8: Understanding reCAPTCHA

Firebase Phone Auth uses invisible reCAPTCHA to prevent abuse.

- **Development (localhost)**: Works automatically
- **Production**: Make sure your domain is in **Authorized domains** (Step 4)

If you see reCAPTCHA errors:
- Check browser console for specific error
- Verify domain is authorized in Firebase
- Ensure `firebaseConfig` values are correct

---

## Step 9: Deploy & Test

### Local Testing

```bash
# Frontend
cd frontend
npm run dev

# Backend (in another terminal)
cd backend
npm start
```

1. Open `http://localhost:5173/login`
2. Scroll to "or use phone OTP"
3. Enter phone: `+919876543210` (or test number)
4. Click **Send OTP**
5. Check your phone for SMS (or use test code if configured)
6. Enter OTP → Click **Verify & Continue**

### Production Testing

After deploying frontend to Vercel and backend to Render:

1. Visit your Vercel frontend URL
2. Go to Login page
3. Test Phone OTP flow with a real number
4. Verify you can login/signup successfully

---

## Troubleshooting

### Error: "auth/invalid-app-credential"
- Check `VITE_FIREBASE_API_KEY` is correct
- Verify `VITE_FIREBASE_PROJECT_ID` matches your project

### Error: "auth/unauthorized-domain"
- Add your domain to Firebase **Authorized domains** (Step 4)
- For localhost, ensure port matches (default: `localhost`)

### Error: "Firebase: Error (auth/too-many-requests)"
- Too many OTP requests from same number
- Wait 10-15 minutes or use test phone numbers

### Backend Error: "Missing FIREBASE_SERVICE_ACCOUNT_JSON"
- Check env var is set in Render
- If using base64, verify encoding is correct
- If using raw JSON, ensure it's valid JSON (no newlines/formatting)

### Error: "Invalid Firebase token"
- Token expired (Firebase ID tokens expire after 1 hour)
- User might need to re-authenticate

---

## Security Notes

1. **Never commit** `firebase-adminsdk-*.json` to git
2. Add to `.gitignore`:
   ```
   *firebase-adminsdk*.json
   ```
3. Rotate service account keys periodically (Firebase Console → Service accounts)
4. Use test phone numbers for development (avoid SMS costs)
5. Consider rate limiting on backend `/api/auth/phone/firebase` endpoint

---

## Cost Considerations

- **Phone Authentication**: Free for first 10K verifications/month, then $0.06/verification
- **Service Account usage**: Free
- **reCAPTCHA**: Free

Check [Firebase Pricing](https://firebase.google.com/pricing) for latest details.

---

## Next Steps

Once setup is complete:

1. Test locally with a real phone number
2. Test with test phone numbers (if configured)
3. Deploy both frontend and backend
4. Test on production domains
5. Consider adding rate limiting middleware
6. Add analytics/logging for OTP success rates

---

## Quick Reference: Environment Variables Checklist

### Frontend (`frontend/.env`)
- ✅ `VITE_FIREBASE_API_KEY`
- ✅ `VITE_FIREBASE_AUTH_DOMAIN`
- ✅ `VITE_FIREBASE_PROJECT_ID`
- ✅ `VITE_FIREBASE_APP_ID`

### Backend (Render Environment)
- ✅ `FIREBASE_SERVICE_ACCOUNT_JSON` (base64 or raw JSON)
- ✅ `JWT_SECRET` (existing)
- ✅ `JWT_REFRESH_SECRET` (existing)
- ✅ All other existing env vars

### Firebase Console
- ✅ Phone Auth enabled
- ✅ Authorized domains added (Vercel, localhost)
- ✅ (Optional) Test phone numbers configured

---

**Questions?** Check Firebase [Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth) for more details.
