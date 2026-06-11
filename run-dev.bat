@echo off
title LifeOS-MC dev server
cd /d "%~dp0"
echo ============================================
echo  LifeOS Mission Control - starting dev server
echo  Folder: %CD%
echo ============================================
echo.
echo [1/2] Installing dependencies (npm install)...
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed. See the error above.
  pause
  exit /b 1
)
echo.
echo [2/2] Starting Next.js dev server (npm run dev)...
echo Open http://localhost:3000 in your browser once it says "Ready".
echo.
call npm run dev
pause
