# Build: PWA + Android TWA (Internal APK)

This repo supports a **Trusted Web Activity (TWA)** wrapper for the website, producing an APK that launches **without an address bar** when Digital Asset Links verification succeeds.

Scope: **internal sharing only** (no Play Store steps).

## 0) Prereqs

- Website must be **HTTPS** and publicly reachable.
- Android device (Android 8+) with **Chrome installed**.
- Windows machine with:
  - Node.js 18+ (for `npx`)
  - USB drivers + ADB access (Bubblewrap can install Android SDK)

## 1) PWA readiness (repo changes already added)

These files exist in the frontend and are required for TWA “app-like” mode:

- Manifest: [frontend/public/manifest.json](frontend/public/manifest.json)
- Service worker entrypoint: [frontend/public/sw.js](frontend/public/sw.js)
- Service worker implementation: [frontend/public/service-worker.js](frontend/public/service-worker.js)
- Offline fallback: [frontend/public/offline.html](frontend/public/offline.html)
- Asset Links template: [frontend/public/.well-known/assetlinks.json](frontend/public/.well-known/assetlinks.json)

### Notes

- The app registers `sw.js` in [frontend/src/main.jsx](frontend/src/main.jsx#L1).
- `manifest.json` includes `start_url` = `/?source=twa` and `scope` = `/`.
- Icons are generated to `frontend/public/icons/icon-192.png` and `frontend/public/icons/icon-512.png`.

If you need to regenerate icons after changing `theme_color`, run:

- `node frontend/scripts/generatePwaIcons.mjs`

## 2) Host Digital Asset Links (required for no address bar)

TWA verification requires:

- `https://YOUR_DOMAIN.com/.well-known/assetlinks.json`

In this repo, the file is located at:

- [frontend/public/.well-known/assetlinks.json](frontend/public/.well-known/assetlinks.json)

You must deploy it to your web host so it is publicly accessible at the URL above.

Important: **The certificate fingerprint in `assetlinks.json` must match the keystore used to sign the APK**.

## 3) Configure TWA variables

Edit:

- [twa-app/twa.vars.cmd](twa-app/twa.vars.cmd)

Set at least:

- `TWA_DOMAIN`
- `TWA_PACKAGE_NAME` (e.g. `com.yourcompany.yourapp`)
- `TWA_APP_NAME`
- `TWA_LAUNCHER_NAME`
- `TWA_THEME_COLOR`

## 4) Validate the website is TWA-ready

From repo root:

- `npx --yes @bubblewrap/cli validate --url=https://YOUR_DOMAIN.com/`

If you see an error like HTTP `429` from the PageSpeed Insights API, it’s rate limiting.
In that case:

- Wait a few minutes and retry, or
- Run Lighthouse locally in Chrome DevTools (Application + Lighthouse) and confirm:
   - Manifest loads
   - Service worker is registered
   - Offline works
   - HTTPS is valid

Fix any reported issues before building.

## 5) Build the internal APK (Bubblewrap)

Scripts are in:

- [twa-app/](twa-app/)

Run in order:

1) Configure environment / install Bubblewrap deps:
   - `twa-app\01_config.cmd`

2) Initialize the TWA project + generate keystore + update fingerprint:
   - `twa-app\02_init.cmd`

   Output:
   - Generates keystore at `twa-app\keystore\twa-release.jks`
   - Prints **SHA-256** fingerprint
   - Updates [frontend/public/.well-known/assetlinks.json](frontend/public/.well-known/assetlinks.json)

3) Deploy the updated `assetlinks.json` to your website:
   - `https://YOUR_DOMAIN.com/.well-known/assetlinks.json`

4) Build APK:
   - `twa-app\03_build.cmd`

5) Copy newest APK into `twa-app\dist\`:
   - `twa-app\05_package_apk.cmd`

## 6) Install on a device (internal testing)

- Enable Developer options + USB debugging
- Connect device via USB and authorize

Install:

- `twa-app\04_install.cmd`

## 7) Confirm “no address bar”

On first launch, check:

- If Digital Asset Links are correct (package + SHA-256 match), the app opens as **Trusted Web Activity** (no browser UI).
- If the fingerprint or package name is wrong, Chrome falls back to a Custom Tab and it looks like a browser.

Common causes of fallback:

- `assetlinks.json` not reachable at `/.well-known/assetlinks.json`
- Wrong `package_name`
- Wrong `sha256_cert_fingerprints` (APK signed with a different keystore)
- Website redirects outside the declared `scope`

Also ensure the live site actually serves:

- `https://YOUR_DOMAIN.com/sw.js` (must not be 404)

## What we intentionally skipped

- Play Store publishing
- Play App Signing / upload key flows
- Store listing assets
