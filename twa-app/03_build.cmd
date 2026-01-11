@echo off
setlocal

call "%~dp0twa.vars.cmd"

if not exist "%~dp0app\twa-manifest.json" (
  echo Missing project. Run 02_init.cmd first.
  exit /b 2
)

REM Non-interactive build: use Gradle directly and sign release with our keystore.
REM This avoids Bubblewrap prompting for passwords.

set "GRADLE_ROOT=%~dp0app"
if not exist "%GRADLE_ROOT%\gradlew.bat" (
  echo gradlew.bat not found under %GRADLE_ROOT%
  exit /b 1
)

REM Write keystore.properties consumed by app/app/build.gradle
set "KEYSTORE_PROPS=%GRADLE_ROOT%\keystore.properties"
set "STORE_FILE=%TWA_KEYSTORE_PATH:\=/%"
echo storeFile=%STORE_FILE%> "%KEYSTORE_PROPS%"
echo storePassword=%TWA_KEYSTORE_PASSWORD%>> "%KEYSTORE_PROPS%"
echo keyAlias=%TWA_KEY_ALIAS%>> "%KEYSTORE_PROPS%"
echo keyPassword=%TWA_KEY_PASSWORD%>> "%KEYSTORE_PROPS%"

pushd "%GRADLE_ROOT%"
echo Building signed release APK via Gradle...
call gradlew.bat assembleRelease
if errorlevel 1 (
  popd
  exit /b 1
)
popd

echo.
echo Build finished. Run 05_package_apk.cmd to collect the newest APK into dist\

endlocal
