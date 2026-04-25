@echo off
REM RabbitChat / 하얀 토끼 깡총 — Windows 더블클릭 런처
REM
REM 사용법:
REM   1) scripts\start-rabbitchat.bat 우클릭 → "바로 가기 만들기"
REM   2) 생성된 바로 가기를 바탕화면으로 끌어다 놓기
REM   3) 더블클릭하면 자동으로 npm install (필요 시) → 브라우저 오픈 → npm run dev
REM
REM 콘솔 창을 닫으면 서버가 종료됩니다.

setlocal
title RabbitChat dev server

REM 레포 루트로 이동 (스크립트 위치 기준 한 단계 위)
cd /d "%~dp0\.."

echo.
echo ============================================================
echo  RabbitChat / 하얀 토끼 깡총 dev launcher
echo ============================================================
echo.
echo  레포 위치: %CD%
echo.

REM 1. Node 설치 확인
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js 가 설치되어 있지 않습니다.
  echo  https://nodejs.org/ 에서 LTS 버전을 설치한 뒤 다시 실행해 주세요.
  echo.
  pause
  exit /b 1
)

REM 2. node_modules 없으면 npm install
if not exist node_modules\ (
  echo [1/3] 처음 실행입니다. 의존성을 설치합니다 ^(약 1분^).
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo [ERROR] npm install 실패. 로그를 확인해 주세요.
    pause
    exit /b 1
  )
) else (
  echo [1/3] 의존성 이미 설치됨 - 건너뜀.
)

REM 3. 5초 뒤 브라우저로 localhost:3000 자동 오픈
echo [2/3] 5초 뒤 브라우저를 엽니다 ^(http://localhost:3000^).
echo        포트 3000 이 사용 중이면 Next.js 가 3001 로 옮길 수 있습니다 - 콘솔 메시지를 확인해 주세요.
start "" /B cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"

REM 4. dev 서버 기동
echo [3/3] dev 서버 시작.
echo        이 창을 닫으면 서버가 종료됩니다.
echo.
call npm run dev

endlocal
