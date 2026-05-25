@echo off
cd /d %~dp0
echo Starting PETRO Backend Server...
echo.
node src/app.js
pause