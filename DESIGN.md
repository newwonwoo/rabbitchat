# RabbitChat / 하얀 토끼 깡총 — 디자인 & 로직 한 장

> 27개월 아이를 위한 **엄마 목소리 AI 회상 동화 친구**.
> 부모가 하루를 입력하면 AI가 영화 시나리오처럼 짜고, 엄마 음성 클론으로 들려주는 구독형 키즈 앱.

---

## 1. 분위기 (Mood)

### 한 줄
**"엄마 무릎 위에서 듣는 동화책. 종이 결만큼 부드럽고, 이야기 한 권만큼 따뜻하게."**

### 톤 키워드
`따뜻함` · `부드러움` · `친밀함` · `안전함` · `프리미엄 구독 키즈 앱` (Pinkfong / Lingokids / Khan Academy Kids 결)

### 절대 금지
- 게임 같은 화려함 / 만화 효과음 / 형광 색
- 차가운 그레이·블랙 위주의 모던 톤
- 텍스트 위주 UI (아이는 글을 못 읽는다)
- "엄마가 ~" 라고 말하는 깡총이 (인계서 §3.3)

---

## 2. 시각 시스템

### 컬러 팔레트 (CI 시트 기준)

| 토큰 | hex | 역할 |
|---|---|---|
| `kkang-ivory` | `#F6F1E8` | 베이스 배경 |
| `kkang-cream` | `#EDE8DC` | 카드/차분한 면 |
| `kkang-beige` | `#E4DCCF` | 보더/구분 |
| `kkang-pink` | `#F7D7DA` | 액센트 / 주요 액션 |
| `kkang-sand` | `#DCCFBE` | 보조면 |
| `kkang-ink` | `#2B2B2B` | 텍스트 / 윤곽 |

### 타이포

- 본문: `ui-rounded` 시스템 폰트 스택 (둥근 결)
- 한국어 강조: 굵게 (font-bold / extrabold)
- 아이 화면은 **거의 텍스트 0**, 부모 라벨만 큼지막하게

### 그림자 / 깊이

| 토큰 | 용도 |
|---|---|
| `shadow-soft` | 작은 카드 / 부드러운 띄움 |
| `shadow-card` | 라이브러리 카드 / 폼 섹션 |
| `shadow-pop` | 버튼 / 인터랙션 — 살짝 튀어나옴 |
| `shadow-hero` | 홈의 hero 카드 — 핑크 글로우 |

### 둥근 모서리

- 작은 요소: `rounded-2xl` (16px)
- 카드: `rounded-3xl` (24px)
- Hero: `rounded-[36px]`
- 동그란 버튼: `rounded-full`

### 모션 (Tailwind keyframes)

- `ear-bounce` / `ear-bounce-r` — 깡총이 양쪽 귀
- `body-wobble` — 몸 살랑살랑
- `soft-land` — 점프 후 착지
- `voice-pulse` — 음성 재생 중

표정별 애니메이션 매핑은 `KkangchongCharacter.tsx` 참고. 6 표정: `happy / listening / waving / thinking / jumping / sleepy`

---

## 3. 화면 흐름

```
splash (1.5s)
  ↓
home (큐레이션 카드 — 오늘의 이야기 + 라이브러리)
  ↓
[탭]
  ↓
child story (2단 레이아웃)
  ├ 좌측: 깡총이 캐릭터 (xl, 720px)
  └ 우측: 큰 가로 banner 선택지 (이미지 + 라벨 + ▶️ 핑크 원)
  ↑
  └─ 🏠(좌상단) / 🔒(우상단) — long-press 3s
  ↓
parent 홈 (타일 7개)
  ↓
이야기 만들기 (5단 wizard)
```

### 레이아웃 원칙

- **아이 화면 = 큰 단위 (touch target 144px+)**, 텍스트 X / aria-label만
- **부모 화면 = 텍스트 OK, 카드 형식 일관**
- 깡총이는 **좌측 고정 / 선택지는 우측 banner**
- 배경 ≠ 캐릭터 — 배경은 장소만, 깡총이는 항상 앞에

---

## 4. 핵심 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 14.2 (App Router) |
| 스타일 | Tailwind CSS 3.4 (CI 토큰) |
| 타입 | TypeScript strict |
| 상태 | React useState / useEffect (외부 store 안 씀) |
| 영속화 | localStorage + IndexedDB |
| LLM | OpenAI gpt-4o-mini (Grok 호환 swap) |
| STT | OpenAI Whisper |
| TTS | ElevenLabs voice clone (엄마 목소리) |
| 이미지 | Pexels API (라이센스 안전) |
| 캐시 | IndexedDB ("tts" / "llm" / "img" / "character" 4 store) |
| 배포 | Vercel (vercel.json 준비됨) |

---

## 5. 콘텐츠 아키텍처

### Story 스키마 (= 영화 시나리오)

```ts
Story {
  title / subtitle / tags / coverImageQuery / estimatedMinutes
  scenes: Scene[]
  status: "draft" | "published"
}
Scene {
  placeId / visual / parentSummary
  audioFile?     // 엄마 녹음 mp3 (있으면 우선)
  spokenLine?    // TTS 폴백 텍스트
  choices: Choice[]
}
Choice {
  emoji / parentLabel / nextSceneId
  responseLine?  // 선택 시 깡총이 반응
}
```

### 데이터 라이프사이클

```
부모 입력 (자연어 또는 9개 섹션 폼)
  ↓
AI (OpenAI gpt-4o-mini)
  → 시나리오 JSON 자동 생성
  → 모든 장면 spokenLine + choice responseLine 작성
  ↓
부모 검토 (storyboard 미리보기, 줄별 수정 가능)
  ↓
자동 최적화
  → 모든 발화 ElevenLabs로 mp3 생성 → IndexedDB 캐시
  → 모든 사물·배경 Pexels 검색 → URL 캐시
  ↓
배포 (status: draft → published)
  ↓
아이 화면 home에 카드로 등장
  ↓
아이 재생 시 = API 호출 0, 비용 0 (모두 캐시)
```

---

## 6. 자산 해결 체인 (Asset Resolution)

**모든 시각 자산은 4단 폴백**:

```
1) data/assets.ts에 정의된 로컬 PNG (예: /assets/bg_kindergarten.png)
   ↓ 없으면
2) /api/character?label=...  — public/assets/character/ fuzzy 매칭
   ↓ 매칭 실패
3) Pexels 자동 검색 (PEXELS_API_KEY 있으면)
   ↓ 결과 없음
4) Emoji (최후 수단)
```

**음성도 동일 패턴**:

```
1) scene.audioFile (엄마 녹음 mp3)
   ↓ 없거나 404
2) scene.spokenLine → ElevenLabs TTS (cached)
   ↓ mock 또는 키 없음
3) 무음
```

---

## 7. 사용자 역할 분담

| 역할 | 무엇을 하나 |
|---|---|
| **부모** | 하루 입력 (9개 섹션 폼) · 엄마 음성 1~3분 녹음 1회 · API 키 등록 1회 · 배포 결정 |
| **AI (OpenAI)** | 시나리오 텍스트 + 분기 + 어휘 |
| **AI (ElevenLabs)** | 모든 발화 → 엄마 음성 mp3 (1회 생성, 영구 캐시) |
| **AI (Pexels)** | 사물 / 배경 사진 자동 |
| **시스템** | 캐시 / 라우팅 / 영속화 / 폴백 체인 |
| **아이** | 깡총이 누르기 + 선택지 누르기 (텍스트 0, 큰 그림만) |

---

## 8. 깡총이 페르소나 가드 (handoff §3.3)

깡총이는 **엄마 목소리로 말하지만 엄마는 아님**. 두 층 보호:

1. LLM 시스템 프롬프트: `너는 엄마가 아니다. "엄마가 ~", "엄마 말~" 절대 X`
2. `lib/characterVoice.ts`의 `sanitizeCharacterVoice` 정규식 후처리 — LLM이 실수로 "엄마가" 라고 해도 클라이언트로 가기 전에 치환

---

## 9. 비용 모델

| 1 스토리당 | 비용 |
|---|---|
| OpenAI gpt-4o-mini | ~$0.001 |
| ElevenLabs TTS (10~17 라인 평균) | ~150자 (Free 10k자/월) |
| Pexels (8장) | $0 |
| **합계** | **~$0.001** (정확히 한 번만, 캐시 영구) |

월 사용 계산 (캐시 적용):
- 신규 스토리 5개 → ~$0.005
- 재생: 무한 (캐시 hit)
- ElevenLabs Free 티어 안에서 **여유 있게** 운영

---

## 10. 폴더 구조 (필수만)

```
app/
  page.tsx            ← 라우팅 허브
  layout.tsx
  manifest.ts         ← PWA
  api/
    character/        ← 자산 fuzzy 검색
    image-search/     ← Pexels 프록시

components/
  child-screen/       ← 아이 UI
  parent-screen/      ← 부모 UI
  character/          ← 깡총이

lib/
  aiStoryGenerator.ts ← OpenAI 시나리오 작가
  storyPipeline.ts    ← 자동 최적화 워커
  cacheWarmer.ts      ← TTS 사전 캐시
  characterVoice.ts   ← §3.3 가드
  imageSearcher.ts    ← Pexels 클라이언트
  providers/          ← LLM / STT / TTS 추상화
  storage/            ← localStore / customStoryStore

public/assets/
  character/          ← ★ 깡총이 컷 + 사물 (한 폴더 정책)
  voice/              ← 엄마 녹음 mp3 7개
  sound/              ← 효과음 mp3 7개
```

---

## 11. 검수 체크리스트 (npm run harness:check)

자동으로 차단되는 것:
- 아동 화면 한글 visible JSX children
- `SpeechRecognition` / `webkitSpeechRecognition` 사용
- `api.openai.com` / `elevenlabs` / `supabase` 직접 호출 (mock 모드일 때)
- `parentLabel` / `parentSummary` 아동 컴포넌트에서 렌더링
- 외부 이미지 검색 API (`google.com/search` / `bing.com/images` 등)

---

## 12. 한 줄 통제 문장

> **분기는 풍부하게, 화면은 단순하게.
> 이야기는 영화 시나리오처럼, 비주얼은 동화책 한 페이지처럼.
> 텍스트는 부모 화면에만, 아이 화면에는 큰 그림과 엄마 목소리만.**
