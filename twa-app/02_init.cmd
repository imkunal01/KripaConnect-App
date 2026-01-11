@echo off
setlocal enabledelayedexpansion

call "%~dp0twa.vars.cmd"

if "%TWA_DOMAIN%"=="YOUR_DOMAIN.com" (
  echo Edit %~dp0twa.vars.cmd first (TWA_DOMAIN, names, colors, package).
  exit /b 2
)

REM 1) Generate keystore if missing.
if not exist "%~dp0keystore" mkdir "%~dp0keystore"

REM Resolve keytool.exe (PATH -> JAVA_HOME -> Bubblewrap JDK)
set "KEYTOOL_EXE="

for /f "delims=" %%K in ('where keytool 2^>nul') do (
  if "!KEYTOOL_EXE!"=="" set "KEYTOOL_EXE=%%K"
)

if "!KEYTOOL_EXE!"=="" if not "%JAVA_HOME%"=="" if exist "%JAVA_HOME%\bin\keytool.exe" (
  set "KEYTOOL_EXE=%JAVA_HOME%\bin\keytool.exe"
)

if "!KEYTOOL_EXE!"=="" (
  for /f "usebackq delims=" %%K in (`powershell -NoProfile -Command "$root=Join-Path $env:USERPROFILE '.bubblewrap\\jdk'; if(Test-Path $root){ Get-ChildItem -Path $root -Recurse -Filter keytool.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName }"`) do (
    if "!KEYTOOL_EXE!"=="" set "KEYTOOL_EXE=%%K"
  )
)

if "!KEYTOOL_EXE!"=="" (
  echo ERROR: keytool.exe not found.
  echo - Run 01_config.cmd first (Bubblewrap can install JDK), OR
  echo - Set TWA_JAVA_HOME in twa.vars.cmd to your JDK 17+.
  exit /b 1
)

if not exist "%TWA_KEYSTORE_PATH%" (
  echo Generating keystore: %TWA_KEYSTORE_PATH%
  echo.
  "!KEYTOOL_EXE!" -genkeypair -v -storetype JKS -keystore "%TWA_KEYSTORE_PATH%" -alias "%TWA_KEY_ALIAS%" ^
    -keyalg RSA -keysize 2048 -validity 10000 ^
    -storepass "%TWA_KEYSTORE_PASSWORD%" -keypass "%TWA_KEY_PASSWORD%" ^
    -dname "CN=%TWA_APP_NAME%, OU=Internal, O=YourCompany, L=NA, S=NA, C=US"
  if errorlevel 1 (
    echo Keystore generation failed. Ensure JDK keytool is available (run 01_config.cmd first).
    exit /b 1
  )
)

echo.
echo === SHA-256 fingerprint (use in assetlinks.json) ===
for /f "usebackq tokens=*" %%F in (`"!KEYTOOL_EXE!" -list -v -keystore "%TWA_KEYSTORE_PATH%" -alias "%TWA_KEY_ALIAS%" -storepass "%TWA_KEYSTORE_PASSWORD%" ^| findstr /i "SHA256"`) do (
  echo %%F
)
echo.

REM 2) Update local assetlinks template in repo (frontend/public/.well-known/assetlinks.json).
set "ASSETLINKS_PATH=%~dp0..\frontend\public\.well-known\assetlinks.json"
if exist "%ASSETLINKS_PATH%" (
  echo Updating assetlinks template at: %ASSETLINKS_PATH%
  powershell -NoProfile -Command "$p='%ASSETLINKS_PATH%'; $j=Get-Content $p -Raw | ConvertFrom-Json; $j[0].target.package_name='%TWA_PACKAGE_NAME%'; $kt='!KEYTOOL_EXE!'; $sha=(& $kt -list -v -keystore '%TWA_KEYSTORE_PATH%' -alias '%TWA_KEY_ALIAS%' -storepass '%TWA_KEYSTORE_PASSWORD%' | Select-String -Pattern 'SHA256:' | ForEach-Object { $_.Line.Split(':',2)[1].Trim() }); if ($sha) { $j[0].target.sha256_cert_fingerprints=@($sha) }; $j | ConvertTo-Json -Depth 10 | Set-Content $p -Encoding UTF8"
) else (
  echo NOTE: assetlinks.json template not found at %ASSETLINKS_PATH%
)

echo.
echo 3) Bubblewrap init (interactive). Answer prompts with values from twa.vars.cmd.
echo    Manifest URL: %TWA_MANIFEST_URL%
echo    Package name: %TWA_PACKAGE_NAME%
echo    App name: %TWA_APP_NAME%
echo    Launcher name: %TWA_LAUNCHER_NAME%
echo    Start URL: %TWA_START_URL%
echo.

if exist "%~dp0app" (
  echo Removing existing %~dp0app
  rmdir /s /q "%~dp0app"
)
mkdir "%~dp0app"

pushd "%~dp0app"
npx --yes @bubblewrap/cli init --manifest="%TWA_MANIFEST_URL%" --directory="%~dp0app"
if errorlevel 1 (
  echo Bubblewrap init failed.
  popd
  exit /b 1
)
popd

REM 4) Post-init tweaks: disable site settings shortcut; set startUrl/scope/theme color; configure signing.
set "TWA_MANIFEST_FILE=%~dp0app\twa-manifest.json"
if exist "%TWA_MANIFEST_FILE%" (
  powershell -NoProfile -Command "$p='%TWA_MANIFEST_FILE%'; $j=Get-Content $p -Raw | ConvertFrom-Json; $j.packageId='%TWA_PACKAGE_NAME%'; $j.name='%TWA_APP_NAME%'; $j.launcherName='%TWA_LAUNCHER_NAME%'; $j.startUrl='%TWA_START_URL%'; $j.scope='%TWA_SCOPE%'; $j.themeColor='%TWA_THEME_COLOR%'; $j.enableSiteSettingsShortcut=$false; $j.hostName='%TWA_DOMAIN%'; $j.manifestUrl='%TWA_MANIFEST_URL%'; $j | ConvertTo-Json -Depth 20 | Set-Content $p -Encoding UTF8"
) else (
  echo WARN: %TWA_MANIFEST_FILE% not found; cannot apply post-init tweaks.
)

REM Try to write keystore.properties in the Android project, if present.
set "KEYSTORE_PROPS=%~dp0app\android\keystore.properties"
if exist "%~dp0app\android" (
  echo storeFile=%TWA_KEYSTORE_PATH%> "%KEYSTORE_PROPS%"
  echo storePassword=%TWA_KEYSTORE_PASSWORD%>> "%KEYSTORE_PROPS%"
  echo keyAlias=%TWA_KEY_ALIAS%>> "%KEYSTORE_PROPS%"
  echo keyPassword=%TWA_KEY_PASSWORD%>> "%KEYSTORE_PROPS%"
)

echo.
echo Init complete.
echo Next: (1) deploy frontend/public/.well-known/assetlinks.json to https://%TWA_DOMAIN%/.well-known/assetlinks.json
echo       (2) run 03_build.cmd then 04_install.cmd

endlocal
