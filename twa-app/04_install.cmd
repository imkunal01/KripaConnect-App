@echo off
setlocal

call "%~dp0twa.vars.cmd"

if not exist "%~dp0app\twa-manifest.json" (
  echo Missing project. Run 02_init.cmd first.
  exit /b 2
)

pushd "%~dp0app"
echo Installing to connected device via Bubblewrap...
npx --yes @bubblewrap/cli install
popd

echo.
echo If install fails, ensure:
echo - USB debugging enabled
echo - Device connected and authorized
echo - adb is available on PATH (Android SDK platform-tools)

endlocal
