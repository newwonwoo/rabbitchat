/**
 * tailwind.config.ts
 * ----------------------------------------------------------
 * RabbitChat 디자인 토큰을 Tailwind 유틸리티 클래스로 노출한다.
 * - bg-kkang-ivory, text-kkang-ink-soft, animate-ear-bounce 등으로 사용
 * - tokens.ts는 JS/TS 코드에서 직접 값을 읽고 싶을 때 참조
 * - globals.css는 CSS 변수(--kkang-*)로 같은 토큰을 노출 (런타임 테마 변경 대비)
 * 세 곳의 값이 항상 일치하도록 토큰을 변경할 때는 3 파일 모두 수정.
 */

import type { Config } from 'tailwindcss'

const config: Config = {
  // Next.js 14 app router 기준 경로
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ── 컬러 토큰 ──────────────────────────────────────────
      // DESIGN.md 6종 + 운영 보조 3종 (pink-deep / deep-sand / ink-soft)
      // 차가운 그레이/블랙은 절대 사용하지 않는다는 게 핵심 룰.
      colors: {
        kkang: {
          ivory: '#F6F1E8',      // 메인 배경
          cream: '#EDE8DC',      // 카드 배경
          beige: '#E4DCCF',      // 보더/구분선
          pink: '#F7D7DA',       // 볼터치/하이라이트
          'pink-deep': '#E8A5AB',// play 버튼·featured 보더 (시선 끌 액센트)
          sand: '#DCCFBE',       // 보조 면
          'deep-sand': '#C9BCA6',// 캐릭터 외곽선/그림자
          ink: '#2B2B2B',        // 텍스트 (부모 화면만)
          'ink-soft': '#5A5246', // 부모 보조 텍스트
        },
      },

      // ── 폰트 ──────────────────────────────────────────────
      // Google Fonts에서 layout.tsx 또는 globals.css에서 로드
      // - display: 큰 제목·강조 (손글씨 한글)
      // - sans:    부모 화면 본문 (둥근 고딕)
      // - serif:   메타·캡션 (명조)
      // - accent:  영문 라벨·인사 (필기체)
      fontFamily: {
        display: ['Gaegu', 'sans-serif'],
        sans: ['"Gowun Dodum"', 'sans-serif'],
        serif: ['"Gowun Batang"', 'serif'],
        accent: ['Caveat', 'cursive'],
      },

      // ── 모서리 라운드 ───────────────────────────────────
      // 동화책 톤이라 모든 모서리가 충분히 둥글어야 함.
      // 18px(kkang) ~ 24px(kkang-lg)이 표준.
      borderRadius: {
        kkang: '1.125rem',     // 18px — 카드·버튼 표준
        'kkang-lg': '1.5rem',  // 24px — 큰 카드·banner
        'kkang-xl': '2rem',    // 32px — 디바이스 프레임
      },

      // ── 박스 그림자 ────────────────────────────────────
      // 따뜻한 톤 유지를 위해 검정 그림자 대신 갈색 톤으로
      boxShadow: {
        'kkang-soft': '0 6px 16px rgba(60, 45, 30, 0.06)',
        'kkang-card': '0 8px 24px rgba(60, 45, 30, 0.10)',
        'kkang-deep': '0 24px 60px rgba(60, 45, 30, 0.25)',
        'kkang-pink': '0 4px 12px rgba(232, 165, 171, 0.40)',
      },

      // ── 모션 keyframes ─────────────────────────────────
      // DESIGN.md 5종 + jumping(인터랙션 응답)
      // 모든 애니메이션은 prefers-reduced-motion 시 globals.css에서 무력화
      keyframes: {
        // 왼쪽 귀가 자연스럽게 까딱
        'ear-bounce': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '30%': { transform: 'rotate(-8deg)' },
          '60%': { transform: 'rotate(-4deg)' },
        },
        // 오른쪽 귀 (50ms 어긋난 위상)
        'ear-bounce-r': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '30%': { transform: 'rotate(8deg)' },
          '60%': { transform: 'rotate(4deg)' },
        },
        // 호흡하는 듯한 몸 흔들림 (모든 화면 기본값)
        'body-wobble': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        // 화면 진입 시 살짝 튀어오르는 마무리
        'soft-land': {
          '0%': { transform: 'translateY(40px) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        // 음성 재생 중 4-bar 표시
        'voice-pulse': {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
        // 선택지 탭 시 짧은 점프 응답
        'jumping': {
          '0%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-20px)' },
          '60%': { transform: 'translateY(-10px)' },
        },
      },

      // ── 애니메이션 utility (animate-* 형태로 노출) ────────
      animation: {
        // cubic-bezier(.34,1.56,.64,1) = 살짝 튕기는 ease-out
        'ear-bounce': 'ear-bounce 1.4s ease-in-out infinite',
        'ear-bounce-r': 'ear-bounce-r 1.4s ease-in-out infinite 0.05s',
        'body-wobble': 'body-wobble 2.8s ease-in-out infinite',
        'soft-land': 'soft-land 0.6s cubic-bezier(.34,1.56,.64,1)',
        'voice-pulse': 'voice-pulse 1.2s ease-in-out infinite',
        'voice-pulse-2': 'voice-pulse 1.2s ease-in-out infinite 0.15s',
        'voice-pulse-3': 'voice-pulse 1.2s ease-in-out infinite 0.30s',
        'voice-pulse-4': 'voice-pulse 1.2s ease-in-out infinite 0.45s',
        'jumping': 'jumping 0.4s ease-out',
      },

      // ── 종이 질감 배경 ──────────────────────────────────
      // 단색 배경 금지 — radial gradient를 얹어 종이의 결을 표현
      backgroundImage: {
        'kkang-paper': `
          radial-gradient(circle at 15% 20%, rgba(220,207,190,0.25) 0%, transparent 40%),
          radial-gradient(circle at 85% 80%, rgba(247,215,218,0.18) 0%, transparent 45%)
        `,
      },
    },
  },
  plugins: [],
}

export default config
