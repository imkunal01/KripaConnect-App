@echo off
setlocal

call "%~dp0twa.vars.cmd"

if not exist "%~dp0app\twa-manifest.json" (
  echo Missing project. Run 02_init.cmd first.
  exit /b 2
)

pushd "%~dp0app"
echo Building APK via Bubblewrap...
npx --yes @bubblewrap/cli build
if errorlevel 1 (
  echo.
  echo Bubblewrap build failed; attempting Gradle build directly...
  if exist "%~dp0app\android\gradlew.bat" (
    pushd "%~dp0app\android"
    call gradlew.bat assembleRelease
    popd
  ) else (
    echo gradlew.bat not found under app\android. Cannot run Gradle fallback.
    popd
    exit /b 1
  )
)
popd

echo.
echo Build finished. Run 05_package_apk.cmd to collect the newest APK into dist\

endlocal
