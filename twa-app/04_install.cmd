@echo off
setlocal

call "%~dp0twa.vars.cmd"

if not exist "%~dp0app\twa-manifest.json" (
  echo Missing project. Run 02_init.cmd first.
  exit /b 2
)

REM Install newest APK via adb (no Bubblewrap interaction).
REM Prefer packaged APK in dist\, otherwise take newest from Gradle outputs.

set "APK="

for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command "if (Test-Path '%~dp0dist') { Get-ChildItem -Path '%~dp0dist' -Filter *.apk | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName }"`) do set "APK=%%F"

if "%APK%"=="" (
  for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0app\\app\\build\\outputs\\apk' -Recurse -Filter *.apk -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"`) do set "APK=%%F"
)

if "%APK%"=="" (
  echo No APK found. Run 03_build.cmd then 05_package_apk.cmd first.
  exit /b 2
)

echo Using APK: %APK%
echo.

REM Locate adb.exe (prefer ANDROID_HOME, then local.properties sdk.dir, then default SDK path)
set "ADB="
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$candidates = @(); if ($env:ANDROID_HOME) { $candidates += Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe' }; $lpFiles = @('%~dp0app\local.properties','%~dp0..\frontend\android\local.properties'); foreach ($lp in $lpFiles) { if (Test-Path $lp) { $line = (Get-Content $lp | Where-Object { $_ -match '^sdk\.dir=' } | Select-Object -First 1); if ($line) { $sdk = $line -replace '^sdk\.dir=',''; $sdk = $sdk -replace '\\:', ':'; $sdk = $sdk -replace '\\\\', '\\'; $candidates += (Join-Path $sdk 'platform-tools\adb.exe') } } }; if ($env:LOCALAPPDATA) { $candidates += (Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe') }; $found = $candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1; if ($found) { $found } else { '' }"`) do set "ADB=%%P"

if "%ADB%"=="" (
  echo adb.exe not found. Install Android SDK Platform-Tools and/or set ANDROID_HOME.
  exit /b 2
)

echo Using adb: %ADB%
echo.
"%ADB%" kill-server
"%ADB%" start-server
"%ADB%" devices
echo.
echo Installing...
"%ADB%" install -r "%APK%"

echo.
echo If install fails, ensure:
echo - USB debugging enabled
echo - Device connected and authorized
echo - Android SDK platform-tools installed
echo - if needed, set ANDROID_HOME to your Android SDK path

endlocal
