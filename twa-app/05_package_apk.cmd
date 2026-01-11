@echo off
setlocal enabledelayedexpansion

if not exist "%~dp0dist" mkdir "%~dp0dist"

set "SEARCH_ROOT=%~dp0app\android\app\build\outputs\apk"
if not exist "%SEARCH_ROOT%" (
  echo APK output folder not found: %SEARCH_ROOT%
  echo Run 03_build.cmd first.
  exit /b 2
)

REM Find newest APK under outputs\apk
set "NEWEST_APK="
for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command "Get-ChildItem -Path '%SEARCH_ROOT%' -Recurse -Filter *.apk | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"`) do set "NEWEST_APK=%%F"

if "%NEWEST_APK%"=="" (
  echo No APK found under %SEARCH_ROOT%
  exit /b 1
)

for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd-HHmmss'"`) do set "TS=%%T"

set "OUT=%~dp0dist\twa-%TS%.apk"
copy /y "%NEWEST_APK%" "%OUT%" >nul
echo Packaged: %OUT%

endlocal
