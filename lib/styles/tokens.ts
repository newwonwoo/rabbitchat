/**
 * styles/tokens.ts
 * ----------------------------------------------------------
 * Tailwind 클래스가 아닌 곳(JS 로직, motion 라이브러리, 인라인 스타일,
 * canvas 등)에서 토큰을 직접 읽고 싶을 때 참조한다.
 * tailwind.config.ts와 globals.css의 CSS 변수가 항상 같은 값.
 * ※ 토큰 변경 시 3 파일 동기화 필요.
 */

// 'as const'로 모든 값을 리터럴 타입으로 추론 → 자동완성과 타입 안전
export const colors = {
  ivory: '#F6F1E8',
  cream: '#EDE8DC',
  beige: '#E4DCCF',
  pink: '#F7D7DA',
  pinkDeep: '#E8A5AB',
  sand: '#DCCFBE',
  deepSand: '#C9BCA6',
  ink: '#2B2B2B',
  inkSoft: '#5A5246',
} as const

// 폰트 패밀리 — Google Fonts 로딩명과 일치해야 함
export const fonts = {
  display: 'Gaegu, sans-serif',
  sans: '"Gowun Dodum", sans-serif',
  serif: '"Gowun Batang", serif',
  accent: 'Caveat, cursive',
} as const

// 모션 duration/easing 상수 — JS 애니메이션, framer-motion 등에서 사용
export const motion = {
  durations: {
    earBounce: 1400,    // ms
    bodyWobble: 2800,
    softLand: 600,
    voicePulse: 1200,
    jumping: 400,
    interactionTap: 200,// 탭 응답 시간 한계
  },
  easing: {
    softBounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'ease-in-out',
  },
} as const

// 컴포넌트 사이즈 가이드 — DESIGN.md 기준
export const sizes = {
  childTouchTargetMin: 144,   // px — 아이 화면 터치 타깃 최소 144px
  rabbitMaxOnChildScreen: 720,// px — child story에서 깡총이 최대
  iconButton: 56,             // px — 홈/락 아이콘 버튼
  optionImageSquare: 116,     // px — 선택지 카드 이미지
  playButton: 64,             // px — 일반 play
  playButtonLg: 72,           // px — featured play
} as const

// 배경 그라데이션 — 종이 질감 표현
export const paperBackground = `
  radial-gradient(circle at 15% 20%, rgba(220,207,190,0.25) 0%, transparent 40%),
  radial-gradient(circle at 85% 80%, rgba(247,215,218,0.18) 0%, transparent 45%)
`.trim()

// 토큰 통합 export — `import { tokens } from '@/styles/tokens'`로 사용
export const tokens = { colors, fonts, motion, sizes, paperBackground } as const

// 타입도 함께 export — props 정의 등에 활용
export type ColorToken = keyof typeof colors
export type FontToken = keyof typeof fonts
