# RabbitChat / 하얀 토끼 깡총 — Claude Code 실행 프롬프트 v1.0

아래 내용을 Claude Code에 그대로 붙여넣으세요.

---

너는 시니어 프론트엔드/풀스택 개발자다.

RabbitChat / 하얀 토끼 깡총 MVP를 **Next.js 14 App Router + TypeScript**로 정상 실행 가능한 상태로 구현하라.

첨부된 인계서와 하네스 문서를 먼저 읽어라.

- `rabbitchat_claude_handoff_v1.md`
- `rabbitchat_claude_prompt_harness_v1.md`

현재 Codex 산출물은 구조 의도만 참고한다.  
그대로 복사하거나 이어받지 말라.  
기존 초안에는 template literal 누락, className 문법 오류, tsconfig paths 오류, CSS 오류가 있으므로, 실행 가능한 새 코드로 재구현하라.

---

## 목표

27개월 아이를 위한 **텍스트 없는 인터랙티브 회상 동화 앱의 mock MVP**를 만든다.

핵심 제품:

- 캐릭터: 하얀 토끼 깡총이
- 기본 이야기: 마트에서 카트를 밀고 바나나를 고르는 이야기
- 아동 화면: 텍스트 금지, 이모지/아이콘/캐릭터 중심
- 부모 화면: 텍스트 허용, 로그/설정/메뉴 표시
- 음성/STT/LLM/TTS는 실제 API 없이 mock provider
- 브라우저 `SpeechRecognition` 사용 금지
- MediaRecorder는 skeleton hook만 구현

---

## 기술 스택

- Next.js 14 App Router
- React 18
- TypeScript
- CSS 또는 Tailwind 중 편한 방식
- 실제 API 호출 없음
- DB 없음
- 인증 없음

---

## 절대 원칙

1. `npm install`, `npm run build`, `npm run dev`가 가능해야 한다.
2. 아동 화면에는 표시 텍스트를 넣지 않는다.
3. 부모 화면에는 텍스트를 허용한다.
4. 실제 OpenAI / ElevenLabs / Supabase / 외부 API 호출 금지.
5. 브라우저 `SpeechRecognition`, `webkitSpeechRecognition` 사용 금지.
6. mock-first로 구현한다.
7. 기능을 과확장하지 말고, MVP 수용 기준을 먼저 만족시킨다.
8. 하네스 위반이 있으면 기능 추가보다 하네스 수정이 우선이다.

---

## 필수 화면

1. 아동 플레이 화면
2. 부모 홈
3. 플레이 중 부모 메뉴
4. 부모 로그 화면

---

## 아동 플레이 화면 요구

아동 화면에는 텍스트가 보이면 안 된다.

허용:

- 이모지
- 아이콘
- 캐릭터
- 그림/사진 placeholder
- mock 음성 상태 아이콘
- aria-label

금지:

- 버튼 텍스트
- 질문 문장
- 메뉴명
- 자막
- 한글 label 렌더링

기능:

- 깡총이 캐릭터 표시
- 캐릭터 클릭 시 mock 음성 재생 상태 표시
- 선택지는 그림/이모지 버튼
- 선택지 클릭 시 다음 장면으로 전환
- 3초 long press로 부모 화면 진입
- 버튼의 의미는 `aria-label`로만 제공

---

## 부모 화면 요구

부모 화면에는 텍스트를 허용한다.

필수:

- 현재 이야기명 표시
- 현재 장면 요약 표시
- 재시작
- 다른 테마 시작 skeleton
- 캐릭터 변경 skeleton
- 턴 로그 보기
- 아동 화면 복귀

---

## 필수 데이터

### characters.ts

- 깡총이
- 보조 캐릭터 skeleton 1개

### themes.ts

- 마트 모험
- 공원 산책 skeleton

### stories.ts

`story_mart_banana` 구현.

장면:

1. `s1`: 마트 입구, 카트 선택
2. `s2`: 과일 코너, 바나나/사과 선택
3. `s3`: 바나나 선택 완료

주의:

- `parentSummary`, `parentLabel`은 부모 화면/로그용이다.
- 아동 화면에는 렌더링하지 않는다.

---

## 필수 엔진

### storyEngine.ts

- `getStoryByTheme`
- `getScene`
- `nextScene`
- `restartStory`

### logEngine.ts

- `createTurn`
- `appendTurn`

### audioEngine.ts

- `playMockVoice`
- 500~1000ms 동안 playing 상태를 만들고 해제

### languageEngine.ts

- `parentNarration`

### preferenceEngine.ts

- skeleton

### uiStateMachine.ts

최소 상태:

```ts
type UIMode = "child" | "parent_home" | "parent_menu" | "parent_logs";
```

---

## 필수 훅

### useLongPress

- 3초 long press 감지
- 부모 메뉴 진입용

### useAudioRecorder

- skeleton
- 실제 마이크 권한 요청하지 않아도 됨
- `isRecording`, `start`, `stop` 제공

---

## 필수 provider

- `sttProvider.ts`
- `llmProvider.ts`
- `ttsProvider.ts`
- `mockProviders.ts`

인터페이스 예시:

```ts
export type STTProvider = {
  name: string;
  transcribe: (audio: Blob) => Promise<string>;
};

export type LLMProvider = {
  name: string;
  generateReply: (prompt: string) => Promise<string>;
};

export type TTSProvider = {
  name: string;
  speak: (text: string) => Promise<void>;
};
```

실제 API 호출 금지. mock provider만 구현.

---

## 필수 타입

- `character.ts`
- `place.ts`
- `story.ts`
- `session.ts`
- `turn.ts`
- `preference.ts`
- `ui.ts`

---

## 권장 폴더 구조

```text
app/
  layout.tsx
  page.tsx
  globals.css

components/
  character/
    KkangchongCharacter.tsx
  child-screen/
    ChildStoryScreen.tsx
    ChildIconButton.tsx
    ChoiceImageButton.tsx
    ParentGate.tsx
  parent-screen/
    ParentHome.tsx
    ParentPlayMenu.tsx
    ParentLogViewer.tsx
    CharacterManager.tsx
    ThemeSelector.tsx
    StoryBuilder.tsx
    SettingsPanel.tsx

data/
  characters.ts
  places.ts
  stories.ts
  themes.ts

hooks/
  useAudioRecorder.ts
  useLongPress.ts

lib/
  audioEngine.ts
  languageEngine.ts
  logEngine.ts
  preferenceEngine.ts
  storyEngine.ts
  uiStateMachine.ts
  providers/
    sttProvider.ts
    llmProvider.ts
    ttsProvider.ts
    mockProviders.ts

types/
  character.ts
  place.ts
  story.ts
  session.ts
  turn.ts
  preference.ts
  ui.ts

public/
  .gitkeep
```

---

## 제거 대상

있다면 제거한다.

```text
components/ChatCard.tsx
data/mockMessages.ts
hooks/useMockMessages.ts
types/chat.ts
handoff/*
MISSING_PROJECT_FILES.txt
*.zip
```

---

## 검수 조건

작업 후 반드시 실행한다.

```bash
npm install
npm run build
```

가능하면:

```bash
npm run dev
```

정적 검수:

1. `components/child-screen/*`, `components/character/*`에 visible 한글 텍스트가 없어야 한다.
2. `SpeechRecognition`, `webkitSpeechRecognition`이 실행 코드에 없어야 한다.
3. `api.openai.com`, `elevenlabs`, `supabase` 실제 호출이 없어야 한다.
4. `parentLabel`, `parentSummary`는 부모 화면/로그에서만 렌더링해야 한다.
5. 아동 화면의 버튼은 이모지/아이콘만 보여야 한다.

---

## 최종 수용 기준

브라우저에서 다음이 가능해야 한다.

1. 아동 화면 진입
2. 깡총이 클릭
3. mock 음성 상태 변화
4. 선택지 클릭
5. 장면 전환
6. 3초 long press
7. 부모 홈 진입
8. 부모 놀이 메뉴 진입
9. 로그 확인
10. 재시작

---

## 완료 보고 형식

작업 완료 후 아래 형식으로 보고하라.

```text
## 구현 요약
- ...

## 생성/수정 파일
- ...

## 실행 결과
- npm install: 성공/실패
- npm run build: 성공/실패
- npm run dev: 실행 가능/불가

## 하네스 검증
| 항목 | 결과 | 근거 |
|---|---|---|
| 아동 화면 텍스트 금지 | PASS/FAIL | ... |
| 실제 API 호출 없음 | PASS/FAIL | ... |
| SpeechRecognition 미사용 | PASS/FAIL | ... |
| scene 전환 | PASS/FAIL | ... |
| 로그 누적 | PASS/FAIL | ... |
| 부모 메뉴 진입 | PASS/FAIL | ... |

## mock 처리된 기능
- ...

## 다음 연동 포인트
- ...
```

---

## 실패 시 원칙

빌드 실패 시:

```text
빌드 실패 로그를 기준으로만 수정하라.
새 기능 추가 금지.
수정 범위는 TypeScript 오류, import 오류, tsconfig 오류, CSS 오류에 한정하라.
수정 후 npm run build를 다시 실행하고 결과를 보고하라.
```

아동 화면 텍스트가 발견되면:

```text
아동 화면에 표시되는 텍스트를 모두 제거하라.
텍스트 의미가 필요한 경우 aria-label로만 남기고, 화면에는 이모지/아이콘만 렌더링하라.
부모 화면 텍스트는 유지해도 된다.
```

실제 API 호출이 발견되면:

```text
실제 API 호출을 제거하고 provider interface + mock provider로 대체하라.
MVP에서는 외부 네트워크 호출이 없어야 한다.
```

---

## 핵심 통제 문장

기능을 늘리지 말고, 하네스 통과를 먼저 달성하라.
