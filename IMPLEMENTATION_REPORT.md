# RabbitChat MVP 구현 보고 (하네스 §15)

## 구현 요약

- 27개월 아동용 텍스트 없는 회상 동화 친구 앱의 mock MVP를 Next.js 14 App Router + TypeScript로 신규 구현.
- 3개 기준 문서(하네스 / 인수인계서 / 최종 프롬프트)와 깡총이 CI 컨셉 시트를 모두 반영.
- P0(빌드 통과 / 아동 텍스트 금지 / scene 전환 / 로그 누적 / 부모 진입)을 우선 완성하고, P1 skeleton(테마·캐릭터 cycle, useAudioRecorder, parent skeleton 4종, mock provider 4종)으로 자리만 잡음.
- CI 팔레트 6색과 6개 표정 모션(ear-bounce, body-wobble, soft-land, voice-pulse 등)을 Tailwind theme/keyframes에 토큰화하여 깡총이 캐릭터를 CSS로 구현(실제 PNG/Lottie는 P2 보존).
- 인계서 §6의 6종 치명 오류(template literal 누락, className 문법, tsconfig paths, CSS 셀렉터 누락 등)를 처음부터 차단.

## 생성/수정 파일

```
app/layout.tsx
app/globals.css
app/page.tsx
package.json
tsconfig.json
next.config.js
.eslintrc.json
.gitignore
next-env.d.ts
postcss.config.js
tailwind.config.ts

types/{character,place,story,session,turn,preference,ui}.ts

data/{characters,places,themes,stories}.ts

lib/{storyEngine,logEngine,audioEngine,languageEngine,uiStateMachine,preferenceEngine}.ts
lib/providers/{sttProvider,llmProvider,ttsProvider,mockProviders}.ts

hooks/{useLongPress,useAudioRecorder}.ts

components/character/KkangchongCharacter.tsx
components/child-screen/{ChildStoryScreen,ChildIconButton,ChoiceImageButton,ParentGate}.tsx
components/parent-screen/{ParentHome,ParentPlayMenu,ParentLogViewer,
                          CharacterManager,ThemeSelector,StoryBuilder,SettingsPanel}.tsx

public/.gitkeep
```

## 실행 결과

- `npm install`: 성공 (109 packages)
- `npm run build`: 성공 (TypeScript 0 error, Next.js static prerender, route `/` 4.28kB)
- `npm run dev`: 실행 가능 (`http://localhost:3000`, Ready in ~2.3s, HTTP 200, 8.6KB SSR HTML)

## 하네스 검증

| 항목 | 결과 | 근거 |
|---|---|---|
| 아동 화면 텍스트 금지 | PASS | `components/child-screen/`·`components/character/` JSX visible children에 한글 0건. 1건 발견된 한글은 주석(`KkangchongCharacter.tsx:12`)이며 하네스 §14.1에서 주석은 명시 허용. |
| 실제 API 호출 없음 | PASS | 전체 grep `api.openai.com` / `elevenlabs` / `supabase` 0건. mock provider 외 fetch 없음. |
| SpeechRecognition 미사용 | PASS | grep `SpeechRecognition` / `webkitSpeechRecognition` 0건. |
| scene 전환 | PASS | `lib/storyEngine.ts`의 `nextScene` + `app/page.tsx:handleChoice`로 s1→s2→s3 전이. `ChildStoryScreen` 내 `scene.visual` 이모지가 즉시 갱신. |
| 로그 누적 | PASS | `app/page.tsx`에서 8개 turn 이벤트(`session_start`, `character_press`, `mock_voice`, `choice`, `parent_gate`, `restart_story`, `change_theme`, `change_character`) 모두 호출, `appendTurn`으로 최근 100개 유지, `ParentLogViewer`에서 역순 표시. |
| 부모 메뉴 진입 | PASS | `ParentGate`의 3초 long press → `parent_gate` 로그 + `setUiMode("parent_home")` → `ParentHome`의 "놀이 메뉴" 버튼 → `setUiMode("parent_menu")`. |

## mock 처리된 기능

- 음성 재생: `audioEngine.playMockVoice`가 700ms 동안 `isAudioPlaying=true`를 유지하고 자동 해제. UI는 깡총이의 입 모양 변화 + voice-pulse 애니메이션 + 🔊 아이콘 표시.
- STT: `mockSTTProvider.transcribe` → `(mock-transcript)` 반환.
- LLM: `mockLLMProvider.generateReply` → `(mock-reply) <prompt[:30]>` 반환.
- TTS: `mockTTSProvider.speak` → 200ms sleep 후 resolve.
- 녹음: `useAudioRecorder`가 `isRecording` 토글만 수행, 마이크 권한 요청 없음, MediaRecorder 미인스턴스화.
- preferenceEngine: `loadPreference`가 default를 반환, `savePreference`는 no-op.
- 캐릭터/테마 변경: cycle 방식 (`(idx + 1) % length`). UI catalog는 skeleton.
- 깡총이 시각 표현: PNG/Lottie 대신 CSS rounded shape + Tailwind keyframes로 구현.

## 다음 연동 포인트

- `useAudioRecorder`: `getUserMedia({ audio: true })` + `new MediaRecorder(stream)` 연결 위치 주석으로 표시.
- `mockProviders.ts`: STT는 OpenAI/whisper, LLM은 OpenAI text model, TTS는 ElevenLabs voice clone로 swap-in. 인터페이스는 그대로 유지.
- `logEngine.ts`: 메모리 배열 → Supabase/Postgres 영속화.
- `preferenceEngine.ts`: localStorage 1차, Supabase 2차로 확장.
- `KkangchongCharacter.tsx`: CSS 실루엣을 깡총이 CI PNG/Lottie로 교체. `mood` prop은 그대로 유지.
- `parent-screen/ThemeSelector`, `CharacterManager`, `StoryBuilder`, `SettingsPanel`: skeleton에 실제 UI 채우기.

## CI 반영 내역

- Tailwind theme 색상 토큰: `kkang-ivory #F6F1E8`, `kkang-cream #EDE8DC`, `kkang-beige #E4DCCF`, `kkang-pink #F7D7DA`, `kkang-sand #DCCFBE`, `kkang-ink #2B2B2B`.
- Keyframes: `ear-bounce`, `ear-bounce-r`, `body-wobble`, `soft-land`, `voice-pulse`.
- 표정/포즈 매핑(`KkangchongCharacter.tsx`):
  - listening (idle 기본) → ear-bounce + body-wobble
  - happy (audio playing) → 입이 열리고 voice-pulse
  - jumping → soft-land 1회 재생
  - sleepy → 눈을 가는 선으로
  - waving / thinking → mood prop 확장 가능 (현재 idle/happy로 자동 매핑)
- 이야기 시각: s1 `🏬🛒` → s2 `🍎🍌` → s3 `🍌✨` (CI 푸드 시트의 사과/바나나 모티프와 일치).

## 우선순위 매트릭스 (실제 구현 결과)

| 단계 | 우선순위 | 상태 |
|---|---|---|
| Bootstrap (Next.js 14, Tailwind, tsconfig) | P0 | 완료 |
| 도메인 타입 7종 | P0 | 완료 |
| Mock 데이터 4종 | P0 | 완료 |
| 코어 엔진 6종 | P0 | 완료 |
| Provider 인터페이스 + mock 4종 | P1 | 완료 |
| `useLongPress` (3초) | P0 | 완료 |
| `useAudioRecorder` skeleton | P1 | 완료 |
| 아동 화면 5종 | P0 | 완료 |
| 부모 P0 컴포넌트 3종 (Home/PlayMenu/LogViewer) | P0 | 완료 |
| 부모 skeleton 4종 (Theme/Character/Story/Settings) | P1 | 완료 |
| `app/page.tsx` 조립 + turn 이벤트 8종 | P0 | 완료 |
| 빌드·정적 grep·dev SSR 검증 | P0 | 완료 |
| Tailwind 기반 UI polish + 깡총이 CI 토큰 | P2(부분) | 완료 |
| 실제 PNG/Lottie 에셋, 실제 STT/LLM/TTS 연동 | P2 | 보류(의도적) |
