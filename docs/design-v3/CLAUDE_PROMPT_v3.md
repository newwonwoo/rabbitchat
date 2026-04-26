# RabbitChat — Claude Code Prompt v3 (통합본)

> 이 문서 하나가 RabbitChat 프로젝트의 단일 레퍼런스다.
> Claude Code에 이 문서를 컨텍스트로 주면 시안의 모든 결정이 코드에 반영된다.
> 첫 번째 작성된 DESIGN.md + 추가 보강 8개 항목 + 시안 v3 결정 + 작성된 9개 파일 산출물을 모두 통합했다.

---

## 0. 한 줄 사명

> **27개월 아이를 위한 "엄마 무릎 위에서 듣는 따뜻한 동화책" — 게임 앱이 아니라 정성스러운 동화책 한 권.**

스택: **Next.js 14 (app router) + TypeScript + Tailwind**, Vercel 배포, TWA로 Google Play.

---

## 1. 작성 완료된 산출물 (이미 제공됨)

다음 9개 파일이 시안 v3 단계에서 작성되어 있다. **이미 작성된 파일은 그대로 사용**하고, 필요한 부분만 확장한다.

| 파일 | 책임 | 검증 상태 |
|---|---|---|
| `tailwind.config.ts` | 컬러·폰트·모션·radius·shadow 토큰 | TS strict ✓ |
| `styles/tokens.ts` | JS/TS에서 토큰 직접 참조 | TS strict ✓ |
| `styles/globals.css` | CSS 변수, 종이 질감 배경, prefers-reduced-motion | — |
| `components/character/KkangchongCharacter.tsx` | 6 표정 × 5 모션 깡총이 컴포넌트 + VoicePulse | TS strict ✓ |
| `data/assets.ts` | 29개 자산 인덱싱 + fuzzy match | TS strict ✓ + 30/30 PASS |
| `lib/storage/db.ts` | IndexedDB 4 store 래퍼 (tts/llm/img/character) | TS strict ✓ |
| `lib/cacheWarmer.ts` | optimize 단계 자산 선처리 + 진행률 | TS strict ✓ |
| `lib/characterVoice.ts` | sanitizeCharacterVoice 페르소나 가드 | TS strict ✓ + 11/11 PASS |
| `lib/imageSearcher.ts` | 4단 폴백 체인 (local→api→pexels→emoji) | TS strict ✓ |
| `lib/providers/{tts,llm}.ts` | 외부 API 위임 stub (mock 모드 지원) | TS strict ✓ |

**이 파일들의 코드는 그대로 두고, 아래 화면들과 추가 모듈만 새로 작성**한다.

---

## 2. 작성해야 할 모듈 (Claude Code 작업 범위)

### 2.1 화면 (8개)

```
app/
├── page.tsx                      # 1. splash
├── home/page.tsx                 # 2. home (부모/공용 큐레이션)
├── child/[storyId]/page.tsx      # 3. child story (★ 핵심)
├── parent/page.tsx               # 4. parent home
├── parent/create/page.tsx        # 5. story create wizard (5단)
├── parent/review/[storyId]/page.tsx   # 6. review/edit (storyboard)
├── parent/optimize/[storyId]/page.tsx # 7. optimize (음성·이미지 선처리)
└── parent/publish/[storyId]/page.tsx  # 8. publish
```

### 2.2 추가 모듈

```
lib/
├── aiStoryGenerator.ts    # LLM 호출 + 프롬프트 조립 (lib/providers/llm 사용)
├── storyPipeline.ts       # 시나리오 → scene 변환 + 자산 매칭
└── providers/
    ├── tts.ts             # 이미 작성됨
    └── llm.ts             # 이미 작성됨

components/
├── child-screen/          # 아이 화면 전용 (텍스트 0)
│   ├── ChildStoryRoot.tsx
│   ├── ChoiceImageButton.tsx    # ← parentLabel은 aria만
│   └── HomeIcon.tsx, LockIcon.tsx
└── parent-screen/         # 부모 화면 (텍스트 허용)
    ├── ParentTile.tsx
    ├── StoryWizard.tsx
    └── SceneEditor.tsx

public/assets/character/   # 29개 PNG (이미 보유)
public/assets/voice/       # 엄마 사전 녹음 (선택)
public/assets/sound/       # 효과음 (선택)
```

---

## 3. 디자인 시스템 (변하지 않는 톤)

### 3.1 컬러 토큰 (tailwind.config.ts에 이미 정의)

| 토큰 | hex | 용도 |
|---|---|---|
| `kkang-ivory` | #F6F1E8 | 메인 배경 |
| `kkang-cream` | #EDE8DC | 카드 배경 |
| `kkang-beige` | #E4DCCF | 보더·구분선 |
| `kkang-pink` | #F7D7DA | 볼터치·하이라이트 |
| `kkang-pink-deep` | #E8A5AB | play 버튼·featured 보더 (시선 끌 액센트) |
| `kkang-sand` | #DCCFBE | 보조 면 |
| `kkang-deep-sand` | #C9BCA6 | 캐릭터 외곽선·그림자 |
| `kkang-ink` | #2B2B2B | 텍스트 (부모 화면만) |
| `kkang-ink-soft` | #5A5246 | 부모 보조 텍스트 |

**금지**: 형광색, 차가운 그레이/블랙, 단색 배경 (radial gradient 필수).

### 3.2 폰트 (4종)

| 토큰 | 패밀리 | 용도 |
|---|---|---|
| `font-display` | Gaegu | 큰 제목·강조 (한글 손글씨) |
| `font-sans` | Gowun Dodum | 부모 화면 본문 |
| `font-serif` | Gowun Batang | 메타·캡션 (명조) |
| `font-accent` | Caveat | 영문 라벨·인사 (필기체) |

**금지**: Inter, Roboto, Arial, system 폰트.

### 3.3 모션 (Tailwind animate-* utility)

- `animate-body-wobble` — 모든 깡총이의 기본값 (호흡)
- `animate-ear-bounce` / `animate-ear-bounce-r` — 좌·우 귀 까딱
- `animate-soft-land` — 화면 진입 시 한 번
- `animate-voice-pulse` (1~4) — 음성 재생 중 4-bar
- `animate-jumping` — 선택지 탭 응답

`prefers-reduced-motion: reduce` 시 globals.css가 모든 애니메이션 무력화.

### 3.4 레이아웃 원칙

- 모서리: 카드 18px / 큰 카드 24px / 디바이스 32px (`rounded-kkang`, `rounded-kkang-lg`, `rounded-kkang-xl`)
- 그림자: 검정 대신 갈색 톤 (`shadow-kkang-soft` 등)
- 종이 질감: `bg-kkang-paper` utility 또는 globals.css의 body 자동 적용
- 아이 화면 터치 타깃: **최소 144px** (`min-height: 144px`)

---

## 4. 깡총이 캐릭터 사용 규약

**컴포넌트가 이미 작성되어 있다 (`KkangchongCharacter`).**
화면에서는 `<img>`나 raw SVG를 직접 쓰지 않고 항상 이 컴포넌트를 통한다.

```tsx
import KkangchongCharacter, { VoicePulse } from '@/components/character/KkangchongCharacter'

// child story 메인
<KkangchongCharacter
  emotion="listening"
  motion="breathing"
  size={380}
  ariaLabel="깡총이가 듣고 있어요"
  priority
/>
```

### 표정 → 자산 매핑 (이미 코드에 반영)

| DESIGN 키워드 | 매핑 자산 | 비고 |
|---|---|---|
| happy | happy.png | ✓ |
| listening | curious.png | proxy — 자산 추가 권장 |
| waving | hi.png | ✓ |
| thinking | curious.png | proxy — 자산 추가 권장 |
| jumping | handsup.png | proxy — 자산 추가 권장 |
| sleepy | sleepy.png | ✓ |

자산이 추가되면 `KkangchongCharacter.tsx`의 `EMOTION_TO_ASSET`만 수정하면 모든 화면에 일괄 적용된다.

---

## 5. 화면별 구현 가이드

### 5.1 Splash (`app/page.tsx`)

- 디바이스: 모바일·태블릿 모두 대응 (반응형)
- 깡총이: `emotion="waving"`, `motion="soft-land"`, size 200
- 제목: "깡총이와 / 대화놀이" (Gaegu, 38~48px, 손글씨)
- 영문 액센트: "a story for you" (Caveat, pink-deep)
- 진행 도트 3개 (첫 번째만 pink-deep 24px width로 길게)
- 부모 모드 게이트: 화면 long press 3초 → home으로
- 하단에 매우 약한 hint 텍스트 (opacity 0.5)

### 5.2 Home (`app/home/page.tsx`)

**중요**: HomeScreen은 **부모/공용 큐레이션 화면**이다 (parentLabel 허용).
아이가 직접 진입하지 않고, 부모가 큐레이션한 이야기 카드를 선택해 child/[storyId]로 이동.

- 발행된 이야기 카드 그리드
- 각 카드: 깡총이 자산 + 이야기 제목(parentLabel 사용 가능)
- 부모 자물쇠 버튼 → /parent로

### 5.3 Child Story (`app/child/[storyId]/page.tsx`) ★ 핵심

가로 레이아웃 (태블릿 우선, 모바일은 세로 스택).

```
┌──────────────────────────────────────────┐
│ [홈]                              [락]    │
│                                           │
│        깡총이                  banner 1 ★ │
│      (listening)               banner 2   │
│       VoicePulse               banner 3   │
│                                           │
└──────────────────────────────────────────┘
```

- **텍스트 0** — 화면에 보이는 한글/숫자 모두 금지
- 깡총이: 좌측 55%, max-width 380~720px, `emotion="listening"`
- 선택지: 우측 45%, banner 3개, 각 144px+ 높이
- 첫 banner는 featured (pink-deep 2px border + 그라데이션 + play 72px)
- 나머지 banner는 일반 (pink-deep play 64px)
- 선택지 이미지는 `imageSearcher.ts`의 결과 (대부분 local hit)
- 탭 → `animate-jumping` 깡총이 + 음성 재생 + voice-pulse 활성

```tsx
// ChoiceImageButton 골격
interface Props {
  imageKeyword: string
  parentLabel: string  // ← visible 렌더링 절대 금지
  onSelect: () => void
}
// JSX:
<button onClick={onSelect} aria-label={parentLabel} className="kkang-option-banner ...">
  <div className="option-img"><Image src={resolvedUrl} alt="" /></div>
  <div className="kkang-play"><PlayIcon /></div>
  {/* parentLabel은 절대 children이나 text node로 렌더하지 않음 */}
</button>
```

### 5.4 Parent Home (`app/parent/page.tsx`)

- 좌상단: 깡총이 (smile.png, size 60) + "good evening" (Caveat) + 인사
- 우상단: 부모 아바타 (이니셜)
- 7-tile 그리드: "새 이야기 만들기"가 2-cell + 핑크 그라데이션 + 핑크 보더로 강조
- 나머지 6 tile: 검토·수정 / 엄마 목소리 / 발행한 이야기 / 청취 기록 / 설정 등

### 5.5 Story Create Wizard (`app/parent/create/page.tsx`)

5단계:
1. 이야기 주제 선택 (오늘 한 일·일상 액션 키워드)
2. 등장 인물 (깡총이 + 가족)
3. 톤 (잔잔 / 신나 / 자장가)
4. 길이 (3~7 scene)
5. 미리보기 → AI 생성 호출 (`aiStoryGenerator.ts`)

생성 결과는 review로 이동.

### 5.6 Review/Edit (`app/parent/review/[storyId]/page.tsx`)

- storyboard 형식: scene 카드 세로 스택
- 각 scene: 깡총이 자산 + spokenLine + 선택지 + 반응 대사
- 모든 텍스트 인라인 편집 가능
- **저장 시 sanitizeCharacterVoice 자동 적용** + checkVoicePersona로 검증

### 5.7 Optimize (`app/parent/optimize/[storyId]/page.tsx`)

`cacheWarmer.warmStoryCache()` 호출. 진행률 progress callback으로 UI 업데이트.

```tsx
const result = await warmStoryCache(story, (p) => {
  setProgress(p.ratio)
  setLabel(p.label)
})
if (result.failed > 0) showWarning(`${result.failed}개 자산 처리 실패`)
```

### 5.8 Publish (`app/parent/publish/[storyId]/page.tsx`)

- optimize 완료 확인 (`isStoryWarm`)
- 발행 버튼 → home의 카드 그리드에 추가
- 부모 화면에 "아이가 들을 수 있어요" 표시

---

## 6. 시스템 가드 — 절대 규칙

### 6.1 시각 자산 4단 폴백 (이미 imageSearcher.ts 구현)

```
local → /api/character → /api/pexels(proxy) → emoji
```

- 1단에서 hit하면 나머지 호출 없음
- Pexels는 반드시 우리 서버 proxy 경유
- google.com/search · bing.com/images · unsplash 직접 호출 → harness:check 차단

### 6.2 음성 자산 3단 폴백 (이미 cacheWarmer.ts + providers/tts.ts 구현)

```
scene.audioFile → scene.spokenLine 기반 TTS cache → mock/무음
```

- mock 모드에서 직접 elevenlabs.io 호출 금지

### 6.3 데이터 흐름 — 아이 재생 중 API 0

| 단계 | LLM | 이미지 | TTS | DB 쓰기 |
|---|---|---|---|---|
| 부모 검토 → optimize | ✓ | ✓ | ✓ | IndexedDB 모두 캐싱 |
| 아이 재생 | ✗ 0 | ✗ 0 (캐시 hit only) | ✗ 0 (캐시 hit only) | 청취 로그만 |

### 6.4 IndexedDB 4 store (이미 db.ts 구현)

| store | 키 | 값 | TTL |
|---|---|---|---|
| `tts` | hash(text+voiceId) | audio URL | 90일 |
| `llm` | hash(prompt+model) | 응답 텍스트 | 30일 |
| `img` | hash(query+provider) | ImageResult | 60일 |
| `character` | keyword | CharacterAsset | 영구 |

단일 store 통합 절대 금지.

### 6.5 sanitizeCharacterVoice 페르소나 가드 (이미 characterVoice.ts 구현)

깡총이 ≠ 엄마. "엄마가 ~" 류 표현 차단/치환.

```ts
sanitizeCharacterVoice('엄마가 동물원에 갔어')
// → '우리가 동물원에 갔어'
```

**적용 위치**: LLM 응답 직후, scene.spokenLine 저장 전, audioFile 자막 생성 전.
**검증**: `checkVoicePersona(text)`가 빈 배열을 반환해야 함.

### 6.6 parentLabel 노출 정책

| 컨텍스트 | visible 텍스트 | aria/로그 |
|---|---|---|
| 아동 화면 (`components/child-screen/**`) | ❌ 금지 | ✓ aria-label만 |
| HomeScreen (부모/공용 큐레이션) | ✓ 허용 | ✓ |
| 부모 화면 | ✓ 허용 | ✓ |
| 검토·로그 | ✓ 허용 | ✓ |
| `process.env.NEXT_PUBLIC_DEBUG === '1'` | ⚑ 한정 허용 (디버그 오버레이) | ✓ |

### 6.7 harness:check 차단 항목 6종

```bash
npm run harness:check
```

빌드 실패 조건:
1. `components/child-screen/**` 하위 JSX text node에 한글 포함 (aria-label 예외)
2. `SpeechRecognition` / `webkitSpeechRecognition` 사용
3. mock 모드에서 `api.openai.com` / `elevenlabs` / `supabase` 직접 호출 (lib/providers 미경유)
4. `parentLabel` / `parentSummary`가 child-screen 컴포넌트에 prop drill되어 children/text로 도달
5. `google.com/search` · `bing.com/images` · `unsplash.com/api` 직접 호출
6. 깡총이 응답 텍스트에 `엄마가|엄마는|엄마 말` 정규식 매칭 (sanitizeCharacterVoice 미적용)

---

## 7. 테스트·검증 절차 (필수)

코드 수정 후 반드시 아래 순서로 검증:

```bash
# 1. TypeScript syntax + 타입 체크
npx tsc --noEmit

# 2. import 정합성
npx eslint --ext .ts,.tsx . --rule 'import/no-unresolved: error'

# 3. mock function execution (단위 테스트)
npm test

# 4. harness:check (이 프로젝트 전용 검수)
npm run harness:check

# 5. 빌드
npm run build
```

`harness:check` 스크립트 골격:

```ts
// scripts/harness-check.ts
import { glob } from 'glob'
import { readFileSync } from 'fs'

const checks = [
  { name: 'child screen Korean text',
    files: 'components/child-screen/**/*.tsx',
    pattern: />[\s\S]*?[가-힣]+[\s\S]*?</,
    excludePattern: /aria-label="[^"]*[가-힣]/ },
  { name: 'SpeechRecognition usage',
    files: '**/*.{ts,tsx}',
    pattern: /\b(webkit)?SpeechRecognition\b/ },
  // ... 나머지 4개
]
```

---

## 8. 결과 보고 형식 (Claude Code가 출력해야 함)

작업 완료 시 아래 형식으로 보고:

```markdown
## 디자인 반영 요약
- ...

## 수정한 파일
- ...

## 화면별 변경
- Splash: ...
- Home: ...
- Child Story: ...
- Parent Home: ...
- Story Wizard: ...
- Review/Edit: ...
- Optimize: ...
- Publish: ...

## 하네스 검증
| 항목 | 결과 | 근거 |
|---|---|---|
| 아이 화면 텍스트 금지 | PASS | grep 결과 0 |
| 큰 터치 타깃 (144px+) | PASS | min-height 검사 |
| 깡총이 좌측/선택지 우측 구조 | PASS | child story flex 구조 |
| 컬러 토큰 반영 | PASS | tailwind.config.ts 통합 |
| 캐시 우선 구조 | PASS | cacheWarmer 호출 |
| 자산 4단 폴백 | PASS | imageSearcher 통합 |
| 음성 3단 폴백 | PASS | cacheWarmer + providers/tts |
| 깡총이 페르소나 가드 | PASS | sanitizeCharacterVoice 적용 |

## 실행 결과
- npm install: ...
- npm run build: ...
- npm run harness:check: ...
- npm run dev: ...
```

---

## 9. 핵심 통제 문장 (변경 금지)

> **분기는 풍부하게, 화면은 단순하게.**
> **이야기는 영화 시나리오처럼, 비주얼은 동화책 한 페이지처럼.**
> **텍스트는 부모 화면에만, 아이 화면에는 큰 그림과 엄마 목소리만.**

---

## 부록 A. 자산 매핑 권장 보강

추가 촬영 가능하다면:
- **listening** (귀 쫑긋 + 눈 크게) — child story 메인 표정. 1순위
- **thinking** (한 손 턱 + 위쪽 시선) — 검토·로딩 상태. 2순위
- **jumping** (양발 공중) — 정답·축하 모먼트. 3순위

자산 추가 시:
1. `public/assets/character/`에 PNG 업로드
2. `data/assets.ts`의 `CHARACTER_ASSETS`에 entry 추가
3. `KkangchongCharacter.tsx`의 `EMOTION_TO_ASSET` 매핑 업데이트
4. `PROXY_EMOTIONS` 해당 키 false로 변경

## 부록 B. 환경변수

```
NEXT_PUBLIC_RABBITCHAT_MODE=mock|live   # 명시적 모드 (없으면 API 키 유무로 자동 판단)
NEXT_PUBLIC_DEBUG=1                      # debug 오버레이 활성화
ELEVENLABS_API_KEY=...                   # 서버 전용. live 모드 필수
ELEVENLABS_DEFAULT_VOICE_ID=...
OPENAI_API_KEY=... 또는 ANTHROPIC_API_KEY=...
PEXELS_API_KEY=...                       # 서버 전용. /api/pexels에서만 사용
```

NEXT_PUBLIC_ 접두사 없는 키는 절대 클라이언트 번들에 포함되지 않아야 함 (Next.js 자동 보장).
