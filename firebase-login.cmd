@echo off
title FIREBASE LOGIN - CODEX
cd /d "%~dp0"
echo.
echo Firebase login for this project
echo --------------------------------
echo This uses --no-localhost so it works better on unstable networks.
echo The CLI will print a Google URL, then ask you to paste the auth code.
echo.
firebase login --reauth --no-localhost
echo.
echo If login succeeded, return to Codex.
pause
