# ⚠️ CRITICAL: Upload This File to Your Website

## Quick Setup for Vercel

### Step 1: Copy assetlinks.json to Your Frontend Project

```bash
# Navigate to your frontend directory
cd C:\Users\Kunal\Desktop\Projects\SKE\frontend

# Create the .well-known directory
mkdir -p public/.well-known

# Copy the assetlinks.json file
copy C:\Users\Kunal\Desktop\Projects\SKE\twa-kripa-connect\assetlinks.json public\.well-known\assetlinks.json
```

### Step 2: Verify the File

Check that the file is in the correct location:
```
frontend/
└── public/
    └── .well-known/
        └── assetlinks.json
```

### Step 3: Deploy to Vercel

```bash
# Add the file to git
git add public/.well-known/assetlinks.json

# Commit
git commit -m "Add Digital Asset Links for TWA Android app"

# Push to trigger Vercel deployment
git push
```

### Step 4: Verify It's Accessible

After deployment (usually 1-2 minutes), open this URL in your browser:

```
https://kripa-connect-app.vercel.app/.well-known/assetlinks.json
```

You should see the JSON content. If you get a 404 error, the TWA will NOT work properly.

---

## Alternative: Manual Upload via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" or "Files" section
3. Upload `assetlinks.json` to `public/.well-known/` directory
4. Redeploy the project

---

## What This File Does

This file tells Android that your website **trusts** the KripaConnect app. Without it:

❌ App will open in a Custom Tab (with browser UI)  
❌ App will not be in fullscreen mode  
❌ Will not feel like a native app  

With it:

✅ App opens in fullscreen mode  
✅ No browser UI visible  
✅ Feels like a native Android app  

---

## The assetlinks.json Content

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.vercel.kripa_connect_app.twa",
    "sha256_cert_fingerprints": [
      "93:A4:49:E2:6D:2C:39:5C:30:EF:9D:FA:43:87:52:08:63:71:F5:A9:34:61:D3:9A:FD:8D:55:19:B0:38:EB:17"
    ]
  }
}]
```

**Important:** Do NOT modify this file. The SHA-256 fingerprint is tied to your signing keystore.

---

## Testing After Upload

1. **Wait 5-10 minutes** for Google to cache the verification
2. **Clear app data** on your Android device:
   - Settings → Apps → KripaConnect → Storage → Clear Data
3. **Uninstall and reinstall** the app
4. **Open the app** - it should now be in fullscreen mode with no browser UI

---

## Troubleshooting

**Still seeing browser UI?**

1. Check the URL is EXACTLY: `https://kripa-connect-app.vercel.app/.well-known/assetlinks.json`
2. Verify the content matches the JSON above
3. Check the response headers: `Content-Type: application/json`
4. Clear Android's Digital Asset Links cache:
   ```bash
   adb shell pm clear com.android.chrome
   ```
5. Wait 15 minutes and try again

**404 Error?**

- Make sure the file is in `public/.well-known/` not `src/.well-known/`
- Vercel serves files from `public/` directory at the root URL
- Check your Vercel build logs for any errors

---

**This is a ONE-TIME setup.** Once uploaded, you never need to change it unless you rebuild the app with a new keystore.
