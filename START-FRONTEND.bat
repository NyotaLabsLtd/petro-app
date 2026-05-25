@echo off
cd /d %~dp0
echo Starting PETRO Frontend...
echo.
echo Opening browser...
start http://localhost:3000/petro.html
npx serve -p 3000
pause