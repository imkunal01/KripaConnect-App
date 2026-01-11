@echo off
setlocal enabledelayedexpansion

call "%~dp0twa.vars.cmd"

echo === TWA Config ===
echo Domain: %TWA_DOMAIN%
echo Manifest: %TWA_MANIFEST_URL%
echo Package: %TWA_PACKAGE_NAME%
echo Project Dir: %~dp0app
echo.

REM Optionally configure JDK/SDK paths for Bubblewrap.
if not "%TWA_JAVA_HOME%"=="" (
  set "JAVA_HOME=%TWA_JAVA_HOME%"
  set "PATH=%JAVA_HOME%\bin;%PATH%"
)
if not "%TWA_ANDROID_SDK_ROOT%"=="" (
  set "ANDROID_SDK_ROOT=%TWA_ANDROID_SDK_ROOT%"
  set "ANDROID_HOME=%TWA_ANDROID_SDK_ROOT%"
  set "PATH=%ANDROID_SDK_ROOT%\platform-tools;%ANDROID_SDK_ROOT%\cmdline-tools\latest\bin;%PATH%"
)

echo Running Bubblewrap doctor...
pushd "%~dp0"
npx --yes @bubblewrap/cli doctor
popd

echo.
echo If doctor fails due to SDK paths, set TWA_JAVA_HOME and/or TWA_ANDROID_SDK_ROOT in twa.vars.cmd
echo and re-run this script.

endlocal
