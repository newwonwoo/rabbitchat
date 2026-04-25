# 깡총이 시각 에셋 교체 가이드

현재는 `KkangchongCharacter.tsx`가 CSS만으로 깡총이를 그린다.
실제 PNG / Lottie / Rive 에셋이 준비되면 **컴포넌트 1개만** 교체하면 된다 — 외부 인터페이스는 그대로 유지된다.

## 교체 위치

`components/character/KkangchongCharacter.tsx`

## 안정 인터페이스 (변경 금지)

```ts
type Props = {
  character: Character;            // CI 시트 매핑
  isPlaying: boolean;              // mock voice 재생 중
  mood?: CharacterMood;            // 6 표정 중 하나
  size?: KkangchongSize;           // sm/md/lg/xl (CI 사이즈 가이드: 10/16/24/32cm)
  onPress: () => void;             // 클릭 시 mock voice 트리거
};

type CharacterMood =
  | "happy"     // audio playing
  | "listening" // idle 기본
  | "waving"    // 인트로/씬 진입
  | "thinking"  // long-press / 대기
  | "jumping"   // 선택지 직후 transition
  | "sleepy";   // 30s+ idle
```

## 단계별 교체 시나리오

### 1단계: 정적 PNG (가장 단순)

`public/kkangchong/` 아래 표정별 PNG를 두고 mood → 파일명 매핑:

```ts
const MOOD_TO_SRC: Record<CharacterMood, string> = {
  happy:     "/kkangchong/happy.png",
  listening: "/kkangchong/listening.png",
  waving:    "/kkangchong/waving.png",
  thinking:  "/kkangchong/thinking.png",
  jumping:   "/kkangchong/jumping.png",
  sleepy:    "/kkangchong/sleepy.png",
};
```

`<Image src={MOOD_TO_SRC[effectiveMood]} ... />`로 교체.
사이즈 가이드(`SIZE_TO_TAILWIND`)는 그대로 유지.

### 2단계: 스프라이트 시트 + CSS 애니메이션

`public/kkangchong/sprite.png` 1장 + steps() 애니메이션.
귀 흔들림/몸 wobble을 CSS keyframes 그대로 활용.

### 3단계: Lottie / Rive

`@lottiefiles/react-lottie-player` 등을 추가. mood별 JSON을 lazy-load.
SSR 대응을 위해 `dynamic(() => import(...), { ssr: false })`로 감싼다.

## 교체 시 검증

1. `npm run build`가 통과하는지 (시그니처 미변경 확인)
2. `app/page.tsx`의 호출부는 한 줄도 안 바뀌어야 한다
3. 6 mood 모두 시각적으로 다르게 보이는지
4. `<Image>`의 경우 `next.config.js`에 도메인 추가 필요 없음 (public 정적 자산)
5. 라이센스: 깡총이 CI는 자체 IP. 외부 Lottie 사용 시 라이센스 확인

## 비교 표

| 단계 | 파일 추가 | 번들 영향 | 표정 전환 자연스러움 | 비용 |
|---|---|---|---|---|
| 현재 (CSS) | 0 | ~0 | △ | 0 |
| 1단계 PNG | 6장 | +수 KB | ○ | 일러스트 1회 |
| 2단계 스프라이트 | 1장 | +수십 KB | ◎ | 일러스트 + 시트 컷 |
| 3단계 Lottie | 6 JSON | +수백 KB | ◎◎ | 모션 디자인 |
