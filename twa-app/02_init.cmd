@echo off
setlocal

REM Use PowerShell implementation to avoid cmd.exe parsing edge cases.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp002_init.ps1"

endlocal
