# scripts/

## 바탕화면 더블클릭 런처 (Windows)

매번 PowerShell 켜고 명령 칠 필요 없이, **바탕화면 아이콘 더블클릭 한 번**으로 RabbitChat을 띄우는 방법입니다.

### 1단계 — 바로 가기 만들기

탐색기에서 이 폴더(`scripts\`)를 열고 **`start-rabbitchat.bat`** 우클릭 → **"바로 가기 만들기"**.

### 2단계 — 바탕화면으로 옮기기

생성된 `start-rabbitchat.bat - 바로 가기` 파일을 바탕화면으로 끌어다 놓습니다.

### 3단계 — (선택) 이름·아이콘 정리

바로 가기 우클릭 → **이름 바꾸기** → "깡총이" 등 원하는 이름으로.
우클릭 → **속성** → **아이콘 변경** → 원하는 .ico 파일 선택.

### 사용

이제 바탕화면 아이콘을 **더블클릭**하면:

1. 처음이면 자동으로 `npm install` (약 1분)
2. 5초 뒤 브라우저가 자동으로 `http://localhost:3000` 열림
3. dev 서버가 켜진 콘솔 창은 그대로 유지됨

콘솔 창을 닫으면 서버가 종료됩니다.

---

### PowerShell 버전(`start-rabbitchat.ps1`)

PowerShell을 선호하는 경우 `start-rabbitchat.ps1`을 사용하세요. 단 처음 한 번 ExecutionPolicy 허용이 필요합니다:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

이후 .ps1 파일도 동일하게 바로 가기 만들기 → 바탕화면 이동.

---

### 안전 가드

- 두 스크립트 모두 **`git pull`을 자동 실행하지 않습니다** — 로컬 변경분 보호.
- Node.js 미설치 검출 시 안내 후 종료.
- 포트 3000이 이미 점유돼 있으면 Next.js가 3001로 자동 변경합니다 (콘솔 첫 줄에서 확인 가능).

---

## harness-check.mjs

```bash
npm run harness:check
```

하네스 §14 + Addendum v1.1 §5 정적 검수를 실행합니다.

13개 검사 모두 PASS여야 머지 가능:

- 금지 API 코드 (`SpeechRecognition` / `api.openai.com` / `elevenlabs` / `supabase`)
- 아동 화면 한글 visible JSX children
- `parentLabel` / `parentSummary` JSX 노출
- 8개 turn 이벤트 호출 누락
- `generateStoryFromEvent` export
- `branchCount` 필드 존재
- `resolveAssetsForStory` export
- ChildStoryScreen의 `backgroundAsset` / `choiceAssets` prop
- 외부 이미지 검색 API URL
