# RabbitChat / 하얀 토끼 깡총 - Windows PowerShell 런처
# .bat 과 동등하지만 PowerShell 스크립트를 선호하는 환경용입니다.
#
# 사용법:
#   1) PowerShell ExecutionPolicy 허용 (한 번만):
#        Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
#   2) 우클릭 → "바로 가기 만들기" → 바탕화면으로 끌어다 놓기
#      바로 가기 속성에서 대상이 powershell.exe -File <경로> 가 되도록 수정
#   3) 더블클릭

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'RabbitChat dev server'

# 레포 루트로 이동
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host ""
Write-Host "============================================================"
Write-Host " RabbitChat / 하얀 토끼 깡총 dev launcher"
Write-Host "============================================================"
Write-Host ""
Write-Host " 레포 위치: $repoRoot"
Write-Host ""

# 1. Node 설치 확인
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "[ERROR] Node.js 가 설치되어 있지 않습니다." -ForegroundColor Red
  Write-Host " https://nodejs.org/ 에서 LTS 버전을 설치한 뒤 다시 실행해 주세요."
  Read-Host "Enter 를 누르면 종료합니다"
  exit 1
}

# 2. node_modules 없으면 npm install
if (-not (Test-Path 'node_modules')) {
  Write-Host '[1/3] 처음 실행입니다. 의존성을 설치합니다 (약 1분).'
  npm install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[ERROR] npm install 실패.' -ForegroundColor Red
    Read-Host 'Enter 를 누르면 종료합니다'
    exit 1
  }
} else {
  Write-Host '[1/3] 의존성 이미 설치됨 - 건너뜀.'
}

# 3. 5초 뒤 브라우저 오픈
Write-Host '[2/3] 5초 뒤 브라우저를 엽니다 (http://localhost:3000).'
Write-Host '       포트 3000 이 사용 중이면 Next.js 가 3001 로 옮길 수 있습니다.'
Start-Job -ScriptBlock {
  Start-Sleep -Seconds 5
  Start-Process 'http://localhost:3000'
} | Out-Null

# 4. dev 서버 기동
Write-Host '[3/3] dev 서버 시작. 이 창을 닫으면 서버가 종료됩니다.'
Write-Host ''
npm run dev
