# TWA (Trusted Web Activity) Implementation — KripaConnect

> **What is a TWA?**  
> A Trusted Web Activity (TWA) is an Android packaging format that wraps an existing web app inside a native Android shell, using Chrome to render the content in full-screen mode — **no browser UI** (no address bar, no navigation buttons). It is the recommended Google-endorsed approach to ship a PWA as a Play Store or sideloaded Android app.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│             KripaConnect TWA Android App                │
│         (app.vercel.kripa_connect_app.twa)              │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │            LauncherActivity (TWA Shell)          │  │
│   │      (com.google.androidbrowserhelper)           │  │
│   └────────────────────┬────────────────────────────┘  │
│                        │  Verified via                  │
│                        │  Digital Asset Links           │
└────────────────────────┼────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│          React (Vite) Frontend — kripaconnect.in        │
│                                                         │
│   public/manifest.json          ← Web App Manifest      │
│   public/.well-known/           ← Digital Asset Links   │
│     assetlinks.json                                     │
│   index.html                    ← PWA meta tags         │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│            MERN Backend (Node.js / Express)             │
│                MongoDB / Redis / Kafka                  │
└─────────────────────────────────────────────────────────┘
```

The Android app is a **thin shell**. All business logic, UI, and data live in the MERN app. The TWA just gives it a native Android wrapper.

---

## 🗂️ Project Structure

```
SKE/
├── frontend/                        ← React (Vite) PWA
│   ├── public/
│   │   ├── manifest.json            ← Web App Manifest (PWA)
│   │   ├── .well-known/
│   │   │   └── assetlinks.json      ← Digital Asset Links
│   │   ├── icon-192.png             ← PWA Icons
│   │   ├── icon-512.png
│   │   └── kripaconnect.apk         ← APK served for download
│   └── index.html                   ← PWA meta tags
│
├── backend/                         ← Node.js/Express API
│
└── twa-kripa-connect/               ← Android TWA Project
    ├── twa-manifest.json            ← Bubblewrap config
    ├── android.keystore             ← Signing keystore ⚠️
    ├── assetlinks.json              ← DAL (source copy)
    ├── app/
    │   ├── build.gradle             ← Android build config
    │   └── src/main/
    │       └── AndroidManifest.xml  ← Android permissions & activities
    ├── build.gradle                 ← Root Gradle
    └── KripaConnect-v3.apk          ← Latest signed APK
```

---

## 🔧 Step-by-Step Implementation

### Step 1 — Make the Frontend a PWA

Before building a TWA, the React app had to be a valid **Progressive Web App**. This required two things:

#### 1a. Web App Manifest

The manifest is served at `https://kripaconnect.in/manifest.json` and describes the app to both browsers and the TWA builder.

```json
{
  "short_name": "KripaConnect",
  "name": "KripaConnect® - A B2B & B2C Platform",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "purpose": "any maskable" }
  ],
  "start_url": "/?source=pwa",
  "background_color": "#ffffff",
  "theme_color": "#FFFFFF",
  "display": "standalone",
  "orientation": "portrait"
}
```

Key fields:
- `display: "standalone"` — hides browser UI (required for TWA)
- `start_url` — distinguishes PWA installs (`?source=pwa`) from TWA installs (`?source=twa`)
- `icons` — need both 192x192 and 512x512 PNGs

#### 1b. PWA Meta Tags in index.html

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#FFFFFF" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<link rel="manifest" href="/manifest.json" />
```

The `viewport-fit=cover` ensures content fills the entire screen including notch areas — critical for a native-looking experience.

---

### Step 2 — Generate the Android Project with Bubblewrap

[Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap) is Google's official tool for generating TWA Android projects from a Web App Manifest.

#### Prerequisites installed:
- Node.js v25.2.1
- Java JDK 17.0.17
- Android SDK (`C:\Users\Kunal\AppData\Local\Android\Sdk`)
- Bubblewrap CLI (globally via `npm install -g @bubblewrap/cli`)

#### Initialization Command
```bash
bubblewrap init --manifest https://kripaconnect.in/manifest.json
```

This generated the entire `twa-kripa-connect/` Android project by reading the live manifest from the deployed site.

The CLI asked configuration questions which were answered to produce `twa-manifest.json`:

```json
{
  "packageId":    "app.vercel.kripa_connect_app.twa",
  "host":         "kripaconnect.in",
  "name":         "KripaConnect",
  "launcherName": "KripaConnect",
  "display":      "standalone",
  "themeColor":   "#FFFFFF",
  "startUrl":     "/?source=twa",
  "iconUrl":      "https://kripaconnect.in/icon-512.png",
  "enableNotifications": true,
  "fallbackType": "webview",
  "minSdkVersion": 21,
  "orientation":  "portrait-primary",
  "features": {
    "locationDelegation": { "enabled": true }
  }
}
```

Important decisions made:
- **`fallbackType: "webview"`** — if Chrome is unavailable (old Android), fall back to a WebView instead of Custom Tab
- **`enableNotifications: true`** — delegates push notifications from the web to the Android notification system
- **`locationDelegation: true`** — allows the web app's `navigator.geolocation` to work natively
- **`minSdkVersion: 21`** — Android 5.0+ (very wide coverage)
- **`startUrl: "/?source=twa"`** — app launches with this query param so the web app can detect it is running inside the TWA shell

---

### Step 3 — Set Up Digital Asset Links (The Critical Step)

This is what makes the app open in true TWA (fullscreen) mode vs. a Custom Tab (with browser UI). Without this, the TWA cannot verify the link between the domain and the app.

#### How It Works

The Android app tells Chrome: *"I want to open `kripaconnect.in`"*  
Chrome checks if `kripaconnect.in/.well-known/assetlinks.json` trusts this app's signing certificate.  
If yes → **full TWA mode** (no browser UI)  
If no → **Custom Tab mode** (browser UI visible)

#### The assetlinks.json File

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

This was placed at:
```
frontend/public/.well-known/assetlinks.json
```

Which Vercel serves at:
```
https://kripaconnect.in/.well-known/assetlinks.json
```

The SHA-256 fingerprint comes from the `android.keystore` file used to sign the APK. They **must match exactly**.

#### Vercel Routing for `.well-known`

Vercel needed explicit configuration in `vercel.json` to serve files from `.well-known/` (Vercel ignores dotfiles by default):

```json
{
  "headers": [
    {
      "source": "/.well-known/assetlinks.json",
      "headers": [{ "key": "Content-Type", "value": "application/json" }]
    }
  ]
}
```

---

### Step 4 — Configure the Android Project

Bubblewrap generated the Android project. The key files are:

#### app/build.gradle

All TWA configuration lives in a `twaManifest` map at the top:

```groovy
def twaManifest = [
    applicationId:    'app.vercel.kripa_connect_app.twa',
    hostName:         'kripaconnect.in',
    launchUrl:        '/?source=twa',
    name:             'KripaConnect',
    themeColor:       '#FFFFFF',
    navigationColor:  '#FFFFFF',
    backgroundColor:  '#FFFFFF',
    enableNotifications: true,
    fallbackType:     'webview',
    orientation:      'portrait-primary',
]
```

The `android {}` block uses these values as Android resources:
```groovy
resValue "string", "launchUrl", "https://" + twaManifest.hostName + twaManifest.launchUrl
resValue "color",  "colorPrimary", twaManifest.themeColor
resValue "bool",   "enableNotification", twaManifest.enableNotifications.toString()
```

Dependencies:
```groovy
implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.6.2'
implementation 'com.google.androidbrowserhelper:locationdelegation:1.1.2'
```

`androidbrowserhelper` is the core library that contains `LauncherActivity` — the TWA shell activity.  
`locationdelegation` bridges `navigator.geolocation` calls to Android's native location APIs.

#### AndroidManifest.xml

Key declarations:

```xml
<!-- Push notifications permission (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

<!-- Main TWA launcher activity -->
<activity android:name="LauncherActivity" android:exported="true">
    <meta-data android:name="android.support.customtabs.trusted.DEFAULT_URL"
               android:value="@string/launchUrl" />
    <meta-data android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR"
               android:resource="@color/colorPrimary" />

    <!-- Deep link intent filter — handles https://kripaconnect.in/* URLs -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="https" android:host="@string/hostName"/>
    </intent-filter>
</activity>

<!-- Notification delegation service -->
<service android:name=".DelegationService"
         android:enabled="@bool/enableNotification"
         android:exported="@bool/enableNotification">
    <intent-filter>
        <action android:name="android.support.customtabs.trusted.TRUSTED_WEB_ACTIVITY_SERVICE"/>
    </intent-filter>
</service>

<!-- Location permission bridge -->
<activity android:name="com.google.androidbrowserhelper.locationdelegation.PermissionRequestActivity"/>
```

The `intent-filter` with `autoVerify="true"` triggers Android's App Links verification against the `assetlinks.json` on launch.

---

### Step 5 — Generate the Signing Keystore

A keystore was created to sign the APK. The same keystore's SHA-256 fingerprint is embedded in `assetlinks.json`.

```bash
keytool -genkey -v -keystore android.keystore \
  -alias android \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Keystore details:

| Field | Value |
|-------|-------|
| File | `android.keystore` |
| Alias | `android` |
| Algorithm | RSA 2048-bit |
| Validity | 10,000 days |
| SHA-256 Fingerprint | `93:A4:49:E2:6D:2C:39:5C:30:EF:9D:FA:43:87:52:08:63:71:F5:A9:34:61:D3:9A:FD:8D:55:19:B0:38:EB:17` |

> **⚠️ CRITICAL:** The keystore is registered in `app/build.gradle` under `signingConfigs.release`. You **cannot update the app** (Play Store or sideloaded) without the original keystore. Treat it like a production secret.

---

### Step 6 — Build and Sign the APK

The APK build pipeline went through 3 stages:

#### 1. Compile unsigned APK
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release-unsigned.apk
```

#### 2. Align the APK (zipalign)
```powershell
zipalign.exe -v -p 4 app-release-unsigned.apk app-release-unsigned-aligned.apk
```
`zipalign` optimizes the APK so Android can memory-map resources directly, improving startup time.

#### 3. Sign the APK (apksigner)
```powershell
apksigner.jar sign \
  --ks android.keystore \
  --ks-key-alias android \
  --out KripaConnect-v3.apk \
  app-release-unsigned-aligned.apk
```

The signed APK (`KripaConnect-v3.apk`, ~2 MB) is the final distributable.

---

### Step 7 — Version History

| APK File | Version | Notes |
|----------|---------|-------|
| `KripaConnect-v1.apk` | 1.0 | Initial TWA build, Vercel domain |
| `KripaConnect-native-v1-final.apk` | 1.0 | Re-signed, same config |
| `KripaConnect-ready.apk` | — | Intermediate build |
| `KripaConnect-v2.apk` | 2.0 | Custom domain update |
| `KripaConnect-v3.apk` | **3.0** | **Current** — `kripaconnect.in` domain, full feature set |

To bump the version, edit `twa-manifest.json`:
```json
{ "appVersionName": "4.0", "appVersionCode": 4 }
```
Then run `bubblewrap update` and rebuild.

---

## 🔗 How TWA Connects to the MERN App

```
Android TWA Shell
       │
       │  HTTPS GET https://kripaconnect.in/?source=twa
       ▼
   Vercel CDN (React Frontend)
       │
       │  API calls to backend
       ▼
   Express.js API Server (Node.js)
       │
       ├── MongoDB (data)
       ├── Redis (caching / sessions)
       └── Kafka (event streaming)
```

The TWA has **no separate backend**. It is entirely powered by the same MERN stack:
- The React app detects `?source=twa` in the URL and can conditionally hide web-only UI (e.g., install prompts)
- All API calls go to the same Express backend
- Session/auth state persists across app opens via `localStorage` (same origin as the web)
- Push notifications flow: Web Push API → Service Worker → Android Notification system (via `DelegationService`)

---

## ✅ Features Enabled by the TWA

| Feature | How it's enabled |
|---------|-----------------|
| **Full-screen native feel** | `display: standalone` in manifest + DAL verification |
| **Push Notifications** | `enableNotifications: true` + `DelegationService` in AndroidManifest |
| **Location Access** | `locationdelegation` library + `PermissionRequestActivity` |
| **Offline Support** | Service Worker in the React app (Cache API) |
| **Persistent Storage** | Same-origin `localStorage` / `IndexedDB` |
| **Camera / Microphone** | Browser permission APIs (Chrome WebView) |
| **File Upload/Download** | `FileProvider` declared in AndroidManifest |
| **Deep Linking** | `intent-filter` with `autoVerify="true"` |
| **Splash Screen** | `SPLASH_IMAGE_DRAWABLE` + `SPLASH_SCREEN_FADE_OUT_DURATION` |
| **Dark Mode** | `themeColorDark` + `navigationColorDark` in config |

---

## 🔍 How to Verify TWA Mode is Working

1. Install the APK on an Android device
2. Open the app — if you see **no address bar or browser UI**, TWA mode is active ✅
3. If browser UI is visible, the DAL verification failed:
   - Confirm `https://kripaconnect.in/.well-known/assetlinks.json` is publicly accessible
   - Verify the SHA-256 fingerprint in the file matches the keystore used to sign the APK
   - Wait up to 10 minutes for Google's verification cache to update
   - Clear app data (`Settings → Apps → KripaConnect → Storage → Clear Data`) and reopen

Verify using Google's official tool:
```
https://developers.google.com/digital-asset-links/tools/generator
```
Enter domain `kripaconnect.in` and package `app.vercel.kripa_connect_app.twa`.

---

## 🔄 How to Rebuild the APK

```powershell
# 1. Navigate to TWA project
cd C:\Users\Kunal\Desktop\Projects\SKE\twa-kripa-connect

# 2. Set Android SDK path
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# 3. (Optional) Update from twa-manifest.json changes
bubblewrap update

# 4. Build
./gradlew assembleRelease

# 5. Align
$buildTools = "$env:LOCALAPPDATA\Android\Sdk\build-tools\34.0.0"
& "$buildTools\zipalign.exe" -v -p 4 `
    app\build\outputs\apk\release\app-release-unsigned.apk `
    app-release-unsigned-aligned.apk

# 6. Sign
$jdk = "C:\Users\Kunal\.bubblewrap\jdk\jdk-17.0.11+9\bin\java.exe"
& $jdk -jar "$buildTools\lib\apksigner.jar" sign `
    --ks android.keystore `
    --ks-key-alias android `
    --ks-pass pass:"KripaConnect2026!" `
    --key-pass pass:"KripaConnect2026!" `
    --out KripaConnect-v4.apk `
    app-release-unsigned-aligned.apk
```

---

## 🚀 Distribution

The APK is distributed **without the Play Store** (sideloading):

1. The signed APK is copied to `frontend/public/kripaconnect.apk`
2. Users download it directly from `https://kripaconnect.in/kripaconnect.apk`
3. Users install by enabling "Install from unknown sources"

> Future plan: Submit to Google Play Store (requires a $25 developer account). The same APK and keystore can be used.

---

## 📚 References

- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap) — TWA project generator
- [Trusted Web Activities Overview](https://developer.chrome.com/docs/android/trusted-web-activity/) — Google Chrome Developers
- [Digital Asset Links](https://developers.google.com/digital-asset-links) — verification protocol
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Web App Manifest spec](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

*Last updated: September 2026 | App Version: 3.0 | Domain: kripaconnect.in*
