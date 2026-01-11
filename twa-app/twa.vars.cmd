@echo off
REM Copy/edit this file with your real values.
REM These defaults match the placeholders from the task description.

set "TWA_DOMAIN=kripa-connect-app.vercel.app"
set "TWA_BASE_URL=https://%TWA_DOMAIN%"
set "TWA_MANIFEST_URL=%TWA_BASE_URL%/manifest.json"
set "TWA_SW_URL=%TWA_BASE_URL%/sw.js"

set "TWA_PACKAGE_NAME=com.kripaconnect.app"
set "TWA_APP_NAME=KripaConnect"
set "TWA_LAUNCHER_NAME=KripaConnect"
set "TWA_START_URL=/?source=twa"
set "TWA_SCOPE=/"
set "TWA_THEME_COLOR=#E63946"

REM Signing (local/internal distribution)
set "TWA_KEYSTORE_PATH=%~dp0keystore\twa-release.jks"
set "TWA_KEY_ALIAS=twa"
set "TWA_KEYSTORE_PASSWORD=changeit"
set "TWA_KEY_PASSWORD=changeit"

REM Optional: point to an explicit JDK/SDK if you don't want Bubblewrap-managed ones.
REM Leave empty to let Bubblewrap use its own installs under %USERPROFILE%\.bubblewrap
set "TWA_JAVA_HOME="
set "TWA_ANDROID_SDK_ROOT="
