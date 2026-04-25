# RabbitChat / 하얀 토끼 깡총 — 클로드 전달용 통합 인계서 v1.0

## 0. 목적

이 문서는 현재까지의 RabbitChat / 하얀 토끼 깡총 프로젝트를 Claude Code 또는 다른 개발 에이전트에게 넘기기 위한 **복구·재구현용 기준 문서**다.

현재 Codex 산출물은 일부 구조와 mock 구현 방향은 있으나, 그대로 실행 가능한 품질이 아니다.  
따라서 Claude에게는 “기존 산출물을 그대로 이어받아라”가 아니라, **현재 코드 의도와 설계서를 기준으로 정상 동작하는 Next.js MVP를 재구현하라**고 지시한다.

---

# 1. 제품 정의

## 1.1 서비스명

**하얀 토끼 깡총 / RabbitChat**

## 1.2 한 줄 정의

엄마 유사 목소리로 말하는, 텍스트 없는, 장소 기반 인터랙티브 회상 동화 친구.

## 1.3 핵심 컨셉

27개월 아동이 실제 겪은 장소와 사건을 바탕으로, 깡총이라는 캐릭터가 사진/그림 위에서 음성으로 질문하고 반응한다.  
아이는 그림을 누르거나 말하면서 참여한다.

```text
아이의 실제 장소 경험
+ 텍스트 없는 그림/사진/아이콘 UI
+ 깡총이 캐릭터
+ 엄마 유사 목소리 TTS
+ 짧은 이야기와 질문
+ 반복/변주/신규 이야기
+ 부모 로그/보정
= 개인화 회상 동화 친구
```

---

# 2. 대상 아이 기준

## 2.1 언어 수준

- 월령: 약 27개월
- 단어 300개 이상 사용 가능
- 복문 사용 가능
- 순서 표현 가능
- 예: “밥 먼저 먹고 씻을 거야.”
- 단순 단어학습보다 **회상, 순서, 이유, 감정, 문장 확장**이 중요함

## 2.2 대화 설계 기준

- 단어 반복만 하지 말 것
- 아이 발화를 자연스럽게 재진술할 것
- 직접 지적식 교정 금지
- 새 단어는 쉬운 설명과 함께 제공
- 반복을 좋아하는 월령이므로 반복 자체를 기능으로 설계
- 반복 40%, 선호 소재 변주 40%, 완전 신규 20%를 기본값으로 둠

---

# 3. 절대 원칙

## 3.1 아동 화면

아동 화면에는 텍스트를 표시하지 않는다.

허용:
- 사진
- 그림
- 캐릭터
- 아이콘
- 이모지 placeholder
- 애니메이션
- 소리/음성 상태

금지:
- 버튼 텍스트
- 자막
- 질문 문장
- 메뉴명
- 숫자 안내
- 채팅창
- 광고
- 외부 링크

## 3.2 부모 화면

부모 화면에는 텍스트를 허용한다.

부모 화면 기능:
- 부모 홈
- 이야기 시작
- 테마 선택
- 캐릭터 변경
- 장소 관리
- 이야기 만들기
- 음성 설정
- 로그/보정
- 안전/데이터 설정

## 3.3 캐릭터 정체성

깡총이는 엄마가 아니다.

금지:
```text
엄마가 안아줄게.
엄마 말 들어야지.
엄마가 사랑해.
```

허용:
```text
내가 안아줄게, 친구야.
깡총이가 옆에 있어.
우리 같이 해볼까?
깡총이는 네가 좋아.
```

---

# 4. 기술 환경 판단

## 4.1 1차 환경

- 개발/테스트: Windows Chrome
- 1차 실사용: Android Chrome / Android 태블릿
- iPad: 후순위 호환성 검증

## 4.2 음성 처리 원칙

브라우저 `SpeechRecognition` 사용 금지.

권장 구조:

```text
MediaRecorder 녹음
→ Storage 업로드
→ 서버 STT
→ 의도 분류
→ 이야기 상태 판단
→ LLM 응답 생성
→ ElevenLabs 등 TTS
→ 오디오 재생
→ 깡총이 입 애니메이션
```

## 4.3 MVP에서는 mock-first

초기 MVP는 실제 API 연동 금지.

- 실제 OpenAI API 호출 금지
- 실제 ElevenLabs API 호출 금지
- 실제 DB 연결 금지
- 실제 인증 구현 금지
- STT/LLM/TTS는 provider interface + mock provider만 구현

---

# 5. 현재 Codex 산출물 요약

현재 Codex가 만들려 한 구조는 다음과 같다.

## 5.1 생성 대상 구조

```text
app/
components/
  character/
  child-screen/
  parent-screen/
data/
hooks/
lib/
  providers/
types/
public/
src/
```

## 5.2 주요 파일 의도

### app/page.tsx

의도:
- 아동 화면과 부모 화면을 단일 페이지에서 상태 전환
- 테마 변경
- 캐릭터 변경
- 로그 누적
- 이야기 장면 전환
- 3초 롱프레스 부모 화면 진입

### components/child-screen/ChildStoryScreen.tsx

의도:
- 아동용 메인 플레이 화면
- 배경/장면 이모지 표시
- 깡총이 캐릭터 표시
- 선택지 버튼 표시
- 부모 진입 게이트 포함

### components/character/KkangchongCharacter.tsx

의도:
- 깡총이 캐릭터 mock
- 캐릭터 클릭 시 mock 음성 상태 표시
- `playing` 상태일 때 pulse 애니메이션

### components/parent-screen/ParentHome.tsx

의도:
- 부모 홈
- 현재 이야기명, 현재 장면 요약
- 놀이 메뉴, 로그, 아동화면 복귀 버튼

### components/parent-screen/ParentPlayMenu.tsx

의도:
- 현재 이야기 재시작
- 다음 테마
- 다음 캐릭터
- 뒤로 가기

### components/parent-screen/ParentLogViewer.tsx

의도:
- 턴 로그 확인
- actor/event/detail 표시

### data/stories.ts

의도:
- “마트에서 카트를 밀고 바나나를 고르는 이야기” mock 구현
- s1: 마트 입구 + 카트
- s2: 과일 코너 + 바나나/사과
- s3: 바나나 선택 완료

### lib/storyEngine.ts

의도:
- themeId로 story 찾기
- sceneId로 scene 찾기
- 선택지에 따라 다음 scene 찾기
- restartStory

### lib/logEngine.ts

의도:
- createTurn
- appendTurn
- 최근 100개 로그 유지

### lib/audioEngine.ts

의도:
- mock 음성 재생 상태
- 700ms 동안 playing 상태

### hooks/useLongPress.ts

의도:
- 3초 long press 감지
- 부모 메뉴 진입용

### hooks/useAudioRecorder.ts

의도:
- MediaRecorder 실제 구현 전 skeleton
- isRecording, start, stop 제공

### lib/providers/*

의도:
- STTProvider
- LLMProvider
- TTSProvider
- mock provider

---

# 6. 현재 Codex 산출물의 치명 오류

현재 받은 PowerShell 생성 스크립트는 구조는 있으나, 그대로 실행하면 TypeScript/TSX 문법 오류가 난다.

## 6.1 app/page.tsx 오류

잘못된 코드:

```tsx
log("character", "character_press", ${character.id} pressed);
log("child", "choice", choice=${choiceId} -> scene=${next.id});
log("system", "restart_story", restart to ${first.id});
log("system", "change_theme", theme=${themes[nextIdx].id});
log("system", "change_character", character=${characters[nextIdx].id});
```

정상 코드:

```tsx
log("character", "character_press", `${character.id} pressed`);
log("child", "choice", `choice=${choiceId} -> scene=${next.id}`);
log("system", "restart_story", `restart to ${first.id}`);
log("system", "change_theme", `theme=${themes[nextIdx].id}`);
log("system", "change_character", `character=${characters[nextIdx].id}`);
```

## 6.2 KkangchongCharacter.tsx 오류

잘못된 코드:

```tsx
<div className={character-face ${isPlaying ? "playing" : ""}}>{emoji}</div>
```

정상 코드:

```tsx
<div className={`character-face ${isPlaying ? "playing" : ""}`}>{emoji}</div>
```

## 6.3 languageEngine.ts 오류

잘못된 코드:

```ts
return ${scene.parentSummary} (scene=${scene.id});
```

정상 코드:

```ts
return `${scene.parentSummary} (scene=${scene.id})`;
```

## 6.4 logEngine.ts 오류

잘못된 코드:

```ts
id: ${Date.now()}-${Math.random().toString(16).slice(2, 8)}
```

정상 코드:

```ts
id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
```

## 6.5 mockProviders.ts 오류

잘못된 코드:

```ts
return (mock-reply) ${prompt.slice(0, 30)};
```

정상 코드:

```ts
return `(mock-reply) ${prompt.slice(0, 30)}`;
```

## 6.6 tsconfig.json 오류

잘못된 설정:

```json
"paths": {
  "@/": ["./"]
},
"include": ["next-env.d.ts", "/*.ts", "/.tsx", ".next/types/**/.ts"]
```

정상 권장:

```json
"paths": {
  "@/*": ["./*"]
},
"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
```

## 6.7 globals.css 오류

잘못된 CSS:

```css
{ box-sizing: border-box; }
```

정상 CSS:

```css
* {
  box-sizing: border-box;
}
```

---

# 7. Claude에게 맡길 작업 방향

Claude에게는 “이 코드를 고쳐라”보다, 다음처럼 시키는 것이 낫다.

```text
현재 Codex 산출물은 구조 의도만 참고하고, 실행 가능한 Next.js MVP로 재구현하라.
```

이유:
- 코드 생성 스크립트에 반복적인 template literal 오류가 있음
- tsconfig 오류 있음
- 아동 화면 텍스트 금지 원칙이 완전히 보장되지 않음
- UI/UX skeleton 수준이라 실제 기획 반영 부족
- 현재 산출물은 mock demo 수준

---

# 8. Claude Code 전달용 작업 요청서

아래 내용을 Claude에게 그대로 전달한다.

```text
너는 시니어 프론트엔드/풀스택 개발자다.
RabbitChat / 하얀 토끼 깡총 MVP를 Next.js + TypeScript로 정상 실행 가능한 상태로 구현하라.

현재 Codex가 만든 초안은 구조 참고용이다.
그 초안에는 template literal 누락, className 문법 오류, tsconfig paths 오류, CSS 오류가 있으므로 그대로 신뢰하지 말고 정상 코드로 재구현하라.

목표:
27개월 아이를 위한 텍스트 없는 인터랙티브 회상 동화 앱의 mock MVP를 만든다.

핵심 제품:
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

중요 검수:
- npm install 성공
- npm run build 성공
- npm run dev 성공
- 아동 화면에 한글 텍스트가 보이지 않음
- 부모 화면에는 텍스트가 보임
- 캐릭터 클릭 시 mock 음성 상태 변경
- 선택지 클릭 시 scene 전환
- 로그가 ParentLogViewer에 누적 표시
- 3초 long press로 부모 홈/메뉴 진입

작업 완료 후:
1. 파일 목록
2. 실행 방법
3. 구현 기능
4. mock 처리한 기능
5. 다음 실제 API 연동 포인트
6. 아동 화면 텍스트 금지 보장 방식
7. npm run build 결과
를 보고하라.
```

---

# 9. 권장 폴더 구조

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

# 10. Claude에게 강조할 설계 포인트

## 10.1 아동 화면 텍스트 금지

화면에 표시되는 것은 이모지/아이콘/캐릭터/시각 요소만.

단, 다음은 허용:
- aria-label
- 부모 화면 텍스트
- 내부 로그 텍스트
- data parentLabel

## 10.2 부모 화면과 아동 화면 분리

부모 화면은 텍스트 기반이어도 된다.

부모 화면 필수:
- 현재 이야기
- 현재 장면
- 로그
- 재시작
- 캐릭터 변경 skeleton
- 테마 변경 skeleton

## 10.3 실제 API 금지

MVP에서는 다음 금지:
- OpenAI API
- ElevenLabs API
- Supabase
- 인증
- DB
- Browser SpeechRecognition

## 10.4 나중에 실제 연동할 지점

- MediaRecorder → Storage upload
- STT provider → OpenAI STT
- LLM provider → OpenAI text model
- TTS provider → ElevenLabs voice clone
- logEngine → Supabase/Postgres
- assets → 실제 깡총이 CI 이미지/Lottie

---

# 11. 현재 코드 초안에서 살릴 것

살릴 만한 것:
- Next.js App Router 구조
- mock data 기반 접근
- storyEngine 개념
- logEngine 개념
- parent/child 화면 분리 개념
- useLongPress 개념
- provider interface 개념

버릴 것:
- 현재 PowerShell 생성 스크립트 자체
- template literal 오류가 있는 파일 내용
- tsconfig 잘못된 paths/include
- CSS 오타
- 일반 ChatCard/mockMessages 잔재
- handoff scripts

---

# 12. 최종 판단

현재 코덱스 산출물은 “전달 실패 + 코드 품질 실패”다.  
하지만 설계 방향과 파일 구조 의도는 남아 있으므로, Claude에게는 다음 기준으로 넘긴다.

```text
기존 코드는 참고만 한다.
Next.js MVP를 새로, 깨끗하게, 빌드 통과 기준으로 재구현한다.
```

최종 성공 기준:

```text
npm install
npm run build
npm run dev
```

세 가지가 통과하고, 브라우저에서 다음이 가능해야 한다.

```text
아동 화면 진입
깡총이 클릭
선택지 클릭
장면 전환
부모 화면 진입
로그 확인
재시작
```
