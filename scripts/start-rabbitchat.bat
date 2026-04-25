@echo off
REM RabbitChat double-click launcher (Windows)
REM
REM Usage:
REM   1) Right-click scripts\start-rabbitchat.bat -> "Create shortcut"
REM   2) Drag the shortcut to your Desktop
REM   3) Double-click the desktop icon to start the dev server
REM
REM Closing this console window will stop the server.
REM
REM Note: messages are in English to avoid cmd.exe codepage issues.
REM       The app itself (browser UI) is fully Korean.

chcp 65001 >nul
setlocal
title RabbitChat dev server

REM cd to repo root (one level up from this script)
cd /d "%~dp0\.."

echo.
echo ============================================================
echo  RabbitChat dev launcher
echo ============================================================
echo.
echo  Repo: %CD%
echo.

REM 1. Check Node is installed
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo  Install LTS from https://nodejs.org/ then rerun this launcher.
  echo.
  pause
  exit /b 1
)

REM 2. Install dependencies if missing
if not exist node_modules\ (
  echo [1/3] First run - installing dependencies ^(~1 min^).
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo [ERROR] npm install failed. Check the log above.
    pause
    exit /b 1
  )
) else (
  echo [1/3] Dependencies already installed - skipping.
)

REM 3. Open browser after 5 seconds
echo [2/3] Opening browser in 5 seconds ^(http://localhost:3000^).
echo        If port 3000 is busy, Next.js will switch to 3001 - watch the console.
start "" /B cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"

REM 4. Start dev server (foreground; closing this window stops it)
echo [3/3] Starting dev server. Close this window to stop it.
echo.
call npm run dev

endlocal
