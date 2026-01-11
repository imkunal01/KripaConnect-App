# KripaConnect - Trusted Web Activity Android App

<div align="center">

![Android](https://img.shields.io/badge/Android-5.0%2B-green)
![APK Size](https://img.shields.io/badge/APK%20Size-1.2MB-blue)
![Status](https://img.shields.io/badge/Status-Ready-success)
![Version](https://img.shields.io/badge/Version-1.0-orange)

**Native Android app powered by Trusted Web Activity (TWA)**

[📱 Install APK](#installation) • [📚 Documentation](BUILD_DOCUMENTATION.md) • [🔧 Rebuild Instructions](BUILD_DOCUMENTATION.md#rebuilding-the-apk)

</div>

---

## 🎯 What is This?

This is a **Trusted Web Activity (TWA)** Android app that wraps the KripaConnect website (`https://kripa-connect-app.vercel.app/`) into a native Android experience. The app:

✅ Opens in **fullscreen mode** with NO browser UI  
✅ Supports **push notifications**, **location access**, and **storage**  
✅ Feels like a **native Android app**  
✅ Can be distributed **without Play Store**  
✅ Uses **official Google technology** (Bubblewrap CLI)  

---

## 📦 What's Included

| File | Description | Status |
|------|-------------|--------|
| **KripaConnect-v1.apk** | Signed release APK ready for installation | ✅ Ready |
| **assetlinks.json** | Digital Asset Links for TWA verification | ⚠️ Must upload to website |
| **android.keystore** | Signing keystore (BACKUP THIS!) | 🔐 Secure |
| **BUILD_DOCUMENTATION.md** | Complete build documentation | 📚 Available |
| **UPLOAD_INSTRUCTIONS.md** | Quick setup guide for assetlinks.json | 📤 Available |
| **twa-manifest.json** | App configuration | ⚙️ Configured |

---

## 🚀 Quick Start

### 1️⃣ Upload Digital Asset Links (CRITICAL!)

**You MUST do this for the app to work in fullscreen mode.**

The `assetlinks.json` file has already been copied to:
```
frontend/public/.well-known/assetlinks.json
```

Now deploy it:

```bash
cd C:\Users\Kunal\Desktop\Projects\SKE\frontend
git add public/.well-known/assetlinks.json
git commit -m "Add TWA Digital Asset Links"
git push
```

After deployment, verify it's accessible:
```
https://kripa-connect-app.vercel.app/.well-known/assetlinks.json
```

📖 **Full instructions:** [UPLOAD_INSTRUCTIONS.md](UPLOAD_INSTRUCTIONS.md)

### 2️⃣ Install the APK

**Option A: Via USB (Recommended)**
```bash
adb install KripaConnect-v1.apk
```

**Option B: Transfer to Device**
1. Copy `KripaConnect-v1.apk` to your Android device
2. Open the file and tap Install
3. Enable "Install from unknown sources" if prompted

### 3️⃣ Test the App

Open KripaConnect on your Android device and verify:
- [ ] No browser UI (address bar, navigation buttons)
- [ ] Fullscreen mode
- [ ] All website features work
- [ ] Permissions (location, notifications) prompt correctly

---

## 📊 App Details

| Property | Value |
|----------|-------|
| **App Name** | KripaConnect |
| **Package Name** | app.vercel.kripa_connect_app.twa |
| **Website** | https://kripa-connect-app.vercel.app/ |
| **Version** | 1.0 (Code: 1) |
| **Min Android** | 5.0 (API 21) |
| **Theme Color** | #E63946 |
| **Orientation** | Portrait |
| **Build Tool** | Bubblewrap CLI |

---

## 🔐 Security Information

### Keystore Details

- **File:** `android.keystore`
- **Alias:** `android`
- **Password:** `KripaConnect2026!`
- **SHA-256 Fingerprint:** `93:A4:49:E2:6D:2C:39:5C:30:EF:9D:FA:43:87:52:08:63:71:F5:A9:34:61:D3:9A:FD:8D:55:19:B0:38:EB:17`

### ⚠️ IMPORTANT

1. **BACKUP the keystore file** - You cannot update the app without it
2. **NEVER commit keystore to Git** - Keep it secure
3. **Store password safely** - Use a password manager

---

## 🔄 Updating the App

### For Website Content Changes

**No rebuild needed!** The app loads the live website, so changes are instant.

### For App Configuration Changes

If you need to change:
- App icon
- Theme colors
- Permissions
- Package name

Follow the rebuild instructions in [BUILD_DOCUMENTATION.md](BUILD_DOCUMENTATION.md#rebuilding-the-apk)

---

## ✅ Features Supported

| Feature | Status | Notes |
|---------|--------|-------|
| **Push Notifications** | ✅ Enabled | Via service worker |
| **Location Access** | ✅ Enabled | Requires user permission |
| **Storage** | ✅ Enabled | localStorage, IndexedDB, Cache |
| **Camera/Microphone** | ✅ Supported | Via browser APIs |
| **File Upload/Download** | ✅ Supported | Native Android file picker |
| **Offline Support** | ✅ Supported | Via service worker |
| **Fullscreen Mode** | ✅ Enabled | No browser UI |
| **Orientation Lock** | ✅ Portrait | Configurable |

---

## 🧪 Testing Checklist

Before distributing to users, test these:

- [ ] App launches in fullscreen (no browser UI)
- [ ] All pages and navigation work
- [ ] Login/authentication works
- [ ] Shopping cart persists
- [ ] Location permission prompts
- [ ] Push notifications work
- [ ] Images and assets load
- [ ] Offline mode works (if implemented)
- [ ] Back button behaves correctly
- [ ] App doesn't crash

---

## 📚 Documentation

- **[BUILD_DOCUMENTATION.md](BUILD_DOCUMENTATION.md)** - Complete build guide, testing checklist, troubleshooting
- **[UPLOAD_INSTRUCTIONS.md](UPLOAD_INSTRUCTIONS.md)** - Quick guide for uploading assetlinks.json
- **[twa-manifest.json](twa-manifest.json)** - App configuration file

### External Resources

- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap)
- [Trusted Web Activities Guide](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)

---

## 🐛 Troubleshooting

### App shows browser UI instead of fullscreen

**Solution:** Digital Asset Links not configured correctly.

1. Verify `assetlinks.json` is accessible at:
   ```
   https://kripa-connect-app.vercel.app/.well-known/assetlinks.json
   ```
2. Wait 10 minutes for Google to cache the verification
3. Clear app data and reinstall

### App won't install

**Solution:** Enable installation from unknown sources.

1. Settings → Security → Unknown Sources → Enable
2. Or: Settings → Apps → Special Access → Install Unknown Apps → Enable for File Manager

### Features not working

**Solution:** Check permissions.

1. Settings → Apps → KripaConnect → Permissions
2. Enable required permissions (Location, Notifications, etc.)

---

## 📈 Distribution

### Current: Direct APK Distribution

✅ No Play Store account needed  
✅ No review process  
✅ Instant distribution  
❌ Manual updates required  

**How to distribute:**
1. Share `KripaConnect-v1.apk` file
2. Provide installation instructions
3. Direct users to enable "Unknown sources"

### Future: Google Play Store

To publish on Play Store:
1. Create Play Console account ($25 one-time)
2. Upload APK with screenshots and description
3. Set content rating
4. Submit for review (1-3 days)

---

## 📞 Support

For build issues, refer to:
- [BUILD_DOCUMENTATION.md](BUILD_DOCUMENTATION.md)
- [Official Bubblewrap GitHub](https://github.com/GoogleChromeLabs/bubblewrap/issues)

For app functionality issues:
- Test the website directly in Chrome
- Check browser console for errors
- Verify service worker is registered

---

## 📝 Project Info

**Built:** January 11, 2026  
**Build Tool:** Bubblewrap CLI (Official Google Tool)  
**Technology:** Trusted Web Activity (TWA)  
**Build Status:** ✅ Success  

---

<div align="center">

**Made with ❤️ using Google's Bubblewrap CLI**

</div>
