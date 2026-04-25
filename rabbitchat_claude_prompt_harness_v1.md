# RabbitChat / 하얀 토끼 깡총 — Claude Code 실행 프롬프트·지침·하네스 v1.0

## 0. 사용법

이 문서는 Claude Code 또는 다른 개발 에이전트에게 그대로 붙여넣기 위한 실행 지침이다.

권장 사용 순서:

```text
1. 먼저 이 문서 전체를 Claude Code에 전달
2. rabbitchat_claude_handoff_v1.md도 함께 전달
3. Claude에게 "하네스 기준으로 먼저 점검하고, 그다음 구현하라"고 지시
4. 구현 후 npm install / npm run build / npm run dev 결과를 받음
5. 결과가 실패하면 하네스의 실패 항목 기준으로만 수정 요청
```

---

# 1. Claude Code 최종 프롬프트

아래 내용을 그대로 Claude Code에 전달한다.

```text
너는 시니어 프론트엔드/풀스택 개발자다.

RabbitChat / 하얀 토끼 깡총 MVP를 Next.js + TypeScript로 정상 실행 가능한 상태로 구현하라.

첨부된 rabbitchat_claude_handoff_v1.md는 제품 정의, 기존 Codex 산출물 문제점, 설계 방향을 정리한 인계서다. 반드시 먼저 읽고, 아래 하네스 기준에 맞춰 작업하라.

중요:
현재 Codex 산출물은 구조 의도만 참고한다.
그대로 복사하거나 이어받지 말라.
기존 초안에는 template literal 누락, className 문법 오류, tsconfig paths 오류, CSS 오류가 있으므로, 실행 가능한 새 코드로 재구현하라.

목표:
27개월 아이를 위한 텍스트 없는 인터랙티브 회상 동화 앱의 mock MVP를 만든다.

제품 핵심:
- 캐릭터: 하얀 토끼 깡총이
- 기본 이야기: 마트에서 카트를 밀고 바나나를 고르는 이야기
- 아동 화면: 텍스트 금지, 이모지/아이콘/캐릭터 중심
- 부모 화면: 텍스트 허용, 로그/설정/메뉴 표시
- 음성/STT/LLM/TTS는 실제 API 없이 mock provider
- 브라우저 SpeechRecognition 사용 금지
- MediaRecorder는 skeleton hook만 구현

기술 스택:
- Next.js 14 App Router
- React 18
- TypeScript
- CSS 또는 Tailwind 중 편한 방식
- 실제 API 호출 없음
- DB 없음
- 인증 없음

구현 원칙:
1. mock-first로 구현한다.
2. npm install, npm run build가 통과해야 한다.
3. 아동 화면에는 표시 텍스트를 넣지 않는다.
4. 부모 화면에는 텍스트를 허용한다.
5. 컴포넌트, 엔진, 타입, 데이터, provider를 분리한다.
6. 기능을 과확장하지 않는다.
7. 기존 Codex 스크립트의 오류를 반복하지 않는다.
8. 구현 후 하네스 검증 결과를 보고한다.

필수 화면:
1. 아동 플레이 화면
2. 부모 홈
3. 플레이 중 부모 메뉴
4. 부모 로그 화면

아동 플레이 화면 요구:
- 텍스트 표시 금지
- 깡총이 캐릭터 표시
- 캐릭터 클릭 시 mock 음성 재생 상태 표시
- 선택지는 그림/이모지 버튼
- 선택지 클릭 시 다음 장면으로 전환
- 3초 long press로 부모 화면 진입
- 버튼에 표시 텍스트 금지
- aria-label은 허용

부모 화면 요구:
- 텍스트 표시 허용
- 현재 이야기명 표시
- 현재 장면 요약 표시
- 재시작
- 다른 테마 시작 skeleton
- 캐릭터 변경 skeleton
- 턴 로그 보기
- 아동 화면 복귀

필수 데이터:
- characters.ts
  - 깡총이
  - 보조 캐릭터 skeleton 1개
- themes.ts
  - 마트 모험
  - 공원 산책 skeleton
- stories.ts
  - story_mart_banana
  - s1: 마트 입구, 카트 선택
  - s2: 과일 코너, 바나나/사과 선택
  - s3: 바나나 선택 완료

필수 엔진:
- storyEngine.ts
  - getStoryByTheme
  - getScene
  - nextScene
  - restartStory
- logEngine.ts
  - createTurn
  - appendTurn
- audioEngine.ts
  - playMockVoice
- languageEngine.ts
  - parentNarration
- preferenceEngine.ts skeleton
- uiStateMachine.ts

필수 훅:
- useLongPress
- useAudioRecorder skeleton

필수 provider:
- sttProvider.ts
- llmProvider.ts
- ttsProvider.ts
- mockProviders.ts

필수 타입:
- character.ts
- place.ts
- story.ts
- session.ts
- turn.ts
- preference.ts
- ui.ts

필수 검수:
- npm install 성공
- npm run build 성공
- npm run dev 실행 가능
- 아동 화면에 한글 텍스트가 보이지 않음
- 부모 화면에는 텍스트가 보임
- 캐릭터 클릭 시 mock 음성 상태 변경
- 선택지 클릭 시 scene 전환
- 로그가 ParentLogViewer에 누적 표시
- 3초 long press로 부모 홈/메뉴 진입

작업 완료 후 반드시 보고:
1. 생성/수정 파일 목록
2. 실행 방법
3. 구현 기능
4. mock 처리한 기능
5. 다음 실제 API 연동 포인트
6. 아동 화면 텍스트 금지 보장 방식
7. npm run build 결과
8. 하네스 검증 결과표
```

---

# 2. Claude용 개발 지침

## 2.1 개발 태도

- 기능 확장보다 **실행 가능성**을 우선한다.
- 디자인 완성도보다 **상태 전이와 로그 구조**를 우선한다.
- 실제 AI 연동보다 **provider interface와 mock 구조**를 우선한다.
- 설명보다 **빌드 통과 코드**를 우선한다.
- 불확실하면 기능을 추가하지 말고 skeleton으로 둔다.

## 2.2 금지 사항

다음은 절대 하지 않는다.

```text
실제 OpenAI API 호출
실제 ElevenLabs API 호출
Supabase 연결
인증 구현
DB 구현
브라우저 SpeechRecognition 사용
아동 화면에 텍스트 표시
광고/외부 링크 추가
과도한 애니메이션 라이브러리 추가
복잡한 상태관리 라이브러리 추가
```

## 2.3 허용 사항

```text
이모지 placeholder
CSS 기반 mock 애니메이션
aria-label
부모 화면 텍스트
내부 로그 텍스트
mock provider
memory state 기반 로그 저장
local skeleton function
```

## 2.4 우선순위

```text
P0: npm run build 통과
P0: 아동 화면 텍스트 금지
P0: scene 전환
P0: 로그 누적
P0: 부모 화면 진입

P1: 재시작
P1: 테마 변경 skeleton
P1: 캐릭터 변경 skeleton
P1: useAudioRecorder skeleton
P1: mock provider 구조

P2: UI polish
P2: 깡총이 CI 이미지 반영
P2: 실제 음성/TTS 연동
```

---

# 3. 하네스 원칙

이 프로젝트는 하네스 방식으로 진행한다.

## 3.1 하네스 정의

하네스는 개발자가 임의로 기능을 확장하지 못하게 하고, 다음을 고정하는 운영 규칙이다.

```text
입력 조건
출력 조건
금지 조건
검증 조건
실패 시 수정 범위
```

## 3.2 하네스의 목적

- 기능 과확장 방지
- 실행 불가 코드 방지
- mock과 실제 API 혼동 방지
- 아동 화면 텍스트 노출 방지
- 빌드 실패 조기 탐지
- Claude/Codex가 다른 방향으로 새지 않게 통제

---

# 4. 구현 하네스

## 4.1 입력 하네스

Claude는 다음 입력만 신뢰한다.

```text
1. rabbitchat_claude_handoff_v1.md
2. 본 프롬프트·지침·하네스 문서
3. 현재 로컬 프로젝트 파일
```

다음은 신뢰하지 않는다.

```text
Codex가 만든 오류 있는 PowerShell 스크립트
검증되지 않은 PR 생성 완료 주장
빌드되지 않은 파일 목록
다운로드 불가능한 zip 경로
```

## 4.2 출력 하네스

최종 산출물은 다음이어야 한다.

```text
Next.js 14 App Router 프로젝트
TypeScript strict 빌드 통과
mock 기반 MVP
실제 API key 없이 실행 가능
부모 화면과 아동 화면 분리
```

## 4.3 범위 하네스

이번 단계에서 구현할 것:

```text
아동 화면
부모 홈
부모 놀이 메뉴
부모 로그 화면
mock 이야기
mock 캐릭터
mock 음성 상태
scene 전환
turn log
3초 long press
provider interface
audio recorder skeleton
```

이번 단계에서 구현하지 말 것:

```text
실제 STT
실제 LLM
실제 TTS
음성 클론
DB
로그인
파일 업로드
실제 이미지 에셋 관리
결제
사용자 계정
배포
```

---

# 5. 파일 구조 하네스

Claude는 아래 구조를 기준으로 구현한다.

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

## 5.1 허용되는 축소

MVP에서 아래 파일은 skeleton이어도 된다.

```text
CharacterManager.tsx
ThemeSelector.tsx
StoryBuilder.tsx
SettingsPanel.tsx
preferenceEngine.ts
useAudioRecorder.ts
providers/*
```

## 5.2 제거해야 할 잔재

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

# 6. 아동 화면 하네스

## 6.1 표시 허용

아동 화면에서 표시 가능한 것:

```text
🐰
🛒
🍌
🍎
🏬
🔊
🔈
🔒
시각적 도형
캐릭터 이미지
아이콘 이미지
```

## 6.2 표시 금지

아동 화면에서 표시 금지:

```text
마트
카트
바나나
다시 시작
부모 메뉴
다음
선택
녹음
이야기
```

단, `aria-label`, 내부 데이터, 부모 화면 텍스트는 허용.

## 6.3 아동 화면 검증 방법

Claude는 아동 화면 컴포넌트를 검토해 다음을 확인한다.

```text
JSX children에 한글 문자열 없음
버튼 텍스트 없음
선택지 label은 aria-label로만 사용
parentLabel은 화면에 렌더링하지 않음
```

검증 보고 예시:

```text
ChildStoryScreen: visible text 없음
ChildIconButton: emoji만 렌더링
ChoiceImageButton: parentLabel은 aria-label로만 전달
ParentGate: lock icon만 렌더링
```

---

# 7. 부모 화면 하네스

부모 화면은 텍스트 허용.

필수 포함:
- 현재 이야기 제목
- 현재 장면 요약
- 부모 메뉴
- 로그 목록
- 재시작 버튼
- 테마 변경 skeleton
- 캐릭터 변경 skeleton
- 아동 화면 복귀 버튼

부모 화면에서는 한글 텍스트가 있어도 정상이다.

---

# 8. 상태 전이 하네스

최소 상태:

```ts
type UIMode =
  | "child"
  | "parent_home"
  | "parent_menu"
  | "parent_logs";
```

권장 확장 상태:

```ts
type PlayPhase =
  | "IDLE"
  | "INTRO_PLAYING"
  | "QUESTION_WAITING"
  | "CHILD_RESPONDING"
  | "PROCESSING"
  | "RESPONSE_PLAYING"
  | "NEXT_READY"
  | "COMPLETED";
```

MVP에서는 `UIMode`만 구현해도 된다.  
단, `uiStateMachine.ts`에 확장 가능성을 주석으로 남긴다.

---

# 9. 이야기 데이터 하네스

## 9.1 기본 이야기

반드시 다음 story를 구현한다.

```text
story_mart_banana
```

## 9.2 장면

```text
s1: 마트 입구 / 카트 선택
s2: 과일 코너 / 바나나 또는 사과 선택
s3: 바나나 선택 완료
```

## 9.3 장면 데이터 예시

```ts
{
  id: "s1",
  placeId: "mart_entrance",
  visual: "🏬🛒",
  parentSummary: "마트 입구에서 카트를 밀기 시작함.",
  choices: [
    {
      id: "push_cart",
      emoji: "🛒",
      nextSceneId: "s2",
      parentLabel: "카트 밀기"
    }
  ]
}
```

주의:
- `parentSummary`, `parentLabel`은 부모/로그용
- 아동 화면에 렌더링 금지

---

# 10. 로그 하네스

## 10.1 Turn 타입

권장:

```ts
export type TurnActor = "child" | "character" | "system";

export type Turn = {
  id: string;
  at: string;
  actor: TurnActor;
  event: string;
  detail: string;
};
```

## 10.2 로그 저장

필수 이벤트:

```text
session_start
character_press
mock_voice
choice
parent_gate
restart_story
change_theme
change_character
```

## 10.3 로그 출력

부모 로그 화면에서만 텍스트로 표시한다.

---

# 11. 음성 하네스

## 11.1 MVP

실제 음성 파일 재생 불필요.

필수:
- 캐릭터 클릭 시 `isAudioPlaying = true`
- 500~1000ms 뒤 `false`
- UI에서 상태 변화 확인 가능

## 11.2 금지

- Web Speech API 금지
- 실제 마이크 권한 요청 금지
- 실제 TTS API 호출 금지

## 11.3 useAudioRecorder skeleton

허용:

```ts
const start = () => setIsRecording(true);
const stop = () => setIsRecording(false);
```

주석으로 추후 MediaRecorder 연동 포인트를 남긴다.

---

# 12. Provider 하네스

## 12.1 인터페이스

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

## 12.2 mock provider

```ts
mockSTTProvider
mockLLMProvider
mockTTSProvider
```

## 12.3 금지

```text
fetch("https://api.openai.com")
fetch("https://api.elevenlabs.io")
SpeechRecognition
webkitSpeechRecognition
```

---

# 13. 빌드 하네스

Claude는 작업 후 반드시 아래를 실행한다.

```bash
npm install
npm run build
```

가능하면 추가:

```bash
npm run dev
```

## 13.1 실패 시 보고 형식

```text
실패 명령:
에러 메시지:
원인:
수정한 파일:
재실행 결과:
```

## 13.2 통과 기준

```text
npm run build exits with 0
TypeScript error 없음
ESLint error 없음 또는 lint 미사용
Next.js build 성공
```

---

# 14. 정적 검수 하네스

Claude는 작업 후 아래 수동 검수를 수행한다.

## 14.1 금지 문자열 검색

아동 화면 파일에서 한글 visible text가 있는지 확인한다.

대상:

```text
components/child-screen/*
components/character/*
```

허용:
- aria-label 값
- type 정의
- 변수명
- 주석

금지:
- JSX visible children 한글 문자열

## 14.2 금지 API 검색

프로젝트 전체에서 검색:

```text
SpeechRecognition
webkitSpeechRecognition
api.openai.com
elevenlabs
supabase
```

MVP에서는 나오면 안 된다.  
단, README나 주석에 “추후 연동” 설명으로 등장하는 것은 허용 가능하나, 실행 코드에는 금지.

---

# 15. 보고 하네스

Claude의 최종 보고는 아래 표로 한다.

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

# 16. Claude에게 줄 짧은 재시작 명령

긴 프롬프트 이후 수정 반복 시에는 아래만 사용한다.

```text
하네스 기준으로 다시 점검해줘.
아동 화면 텍스트 금지, 실제 API 호출 금지, npm run build 통과 여부를 우선 확인하고,
실패 항목만 최소 수정해줘.
기능 추가하지 말고 하네스 위반만 고쳐줘.
```

---

# 17. Claude에게 줄 실패 수정 명령

빌드 실패 시:

```text
빌드 실패 로그를 기준으로만 수정해줘.
새 기능 추가 금지.
수정 범위는 TypeScript 오류, import 오류, tsconfig 오류, CSS 오류에 한정해줘.
수정 후 npm run build를 다시 실행하고 결과를 보고해줘.
```

아동 화면 텍스트가 발견되면:

```text
아동 화면에 표시되는 텍스트를 모두 제거해줘.
텍스트 의미가 필요한 경우 aria-label로만 남기고, 화면에는 이모지/아이콘만 렌더링해줘.
부모 화면 텍스트는 유지해도 된다.
```

실제 API 호출이 발견되면:

```text
실제 API 호출을 제거하고 provider interface + mock provider로 대체해줘.
MVP에서는 외부 네트워크 호출이 없어야 한다.
```

---

# 18. 최종 성공 기준

```text
npm install
npm run build
npm run dev
```

이 세 단계가 통과한다.

브라우저에서:

```text
아동 화면 진입
깡총이 클릭
mock 음성 상태 변화
선택지 클릭
장면 전환
3초 long press
부모 홈 진입
부모 메뉴 진입
로그 확인
재시작
```

이 가능해야 한다.

---

# 19. 최종 판단

현재 Codex 산출물은 참고용으로만 쓴다.  
Claude에게는 **실행 가능한 Next.js MVP 재구현**을 맡긴다.

핵심 통제 문장:

```text
기능을 늘리지 말고, 하네스 통과를 먼저 달성하라.
```
