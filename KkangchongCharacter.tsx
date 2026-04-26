/**
 * components/character/KkangchongCharacter.tsx
 * ----------------------------------------------------------
 * 깡총이 캐릭터 단일 컴포넌트.
 * - 6 표정 (DESIGN.md 정의) × 5 모션 매트릭스
 * - PNG 자산은 public/assets/character/ 에 위치 (data/assets.ts와 매핑)
 * - 모든 화면에서 이 컴포넌트만 사용 (직접 <img> 금지 → 일관성 보장)
 * - aria-label 필수 props로 강제 (아이 화면은 텍스트 0이라 SR 의존)
 *
 * Next.js 14 app router 기준. 'use client' — 모션 클래스 토글에 클라이언트 필요.
 */

'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

// ── 타입 정의 ─────────────────────────────────────────────
// DESIGN.md의 6 표정. listening/thinking/jumping은 전용 자산이 없어
// 가장 가까운 자산을 proxy로 사용 (자산 보강 시 EMOTION_TO_ASSET만 변경)
export type KkangEmotion =
  | 'happy'
  | 'listening'
  | 'waving'
  | 'thinking'
  | 'jumping'
  | 'sleepy'

// DESIGN.md 5 모션 + 'still'(모션 없음)
export type KkangMotion =
  | 'still'        // 정지
  | 'breathing'    // 기본값. body-wobble 무한 반복 (호흡)
  | 'ear-bounce'   // 귀 까딱 + 호흡 동시
  | 'soft-land'    // 진입 시 한번 튀어오름
  | 'voice-pulse'  // 음성 재생 중 (펄스 표시 별도 컴포넌트)
  | 'jumping'      // 짧은 점프 응답 (인터랙션 결과)

// 표정 → 자산 파일 매핑
// listening/thinking/jumping은 전용 자산 미보유 → proxy 사용
// 자산 보강 시(예: listening.png 추가) 이 매핑만 수정하면 모든 화면 일괄 적용
const EMOTION_TO_ASSET: Record<KkangEmotion, string> = {
  happy: '/assets/character/happy.png',
  listening: '/assets/character/curious.png', // proxy — 귀 살짝 기울인 표정
  waving: '/assets/character/hi.png',
  thinking: '/assets/character/curious.png',  // proxy — 자산 보강 권장
  jumping: '/assets/character/handsup.png',   // proxy — 자산 보강 권장
  sleepy: '/assets/character/sleepy.png',
}

// proxy 사용 여부 — 콘솔 경고/디버그용
const PROXY_EMOTIONS: Record<KkangEmotion, boolean> = {
  happy: false,
  listening: true,
  waving: false,
  thinking: true,
  jumping: true,
  sleepy: false,
}

// ── 컴포넌트 props ────────────────────────────────────────
interface KkangchongCharacterProps {
  /** 표정 — 기본값 happy */
  emotion?: KkangEmotion
  /** 모션 — 기본값 breathing */
  motion?: KkangMotion
  /** 픽셀 단위 사이즈 — child story 메인은 380~720, 일반은 200 */
  size?: number
  /** 접근성 라벨 (필수) — 아이 화면은 텍스트 0이라 SR 의존 */
  ariaLabel: string
  /** 추가 className */
  className?: string
  /** 우선 로드 여부 — 첫 화면이라면 true (Next.js Image priority) */
  priority?: boolean
}

// ── 모션 → Tailwind animate-* 클래스 매핑 ─────────────────
function motionClass(motion: KkangMotion): string {
  switch (motion) {
    case 'still':
      return ''
    case 'breathing':
      return 'animate-body-wobble'
    case 'ear-bounce':
      // body-wobble은 부모에, ear-bounce는 SVG 귀 부분에 적용해야 정확
      // 여기서는 body-wobble만 적용. ear-bounce는 PNG로는 불가하므로
      // 이미지 컴포넌트 전체에 살짝 회전 효과를 주는 것으로 대체.
      return 'animate-body-wobble'
    case 'soft-land':
      return 'animate-soft-land'
    case 'voice-pulse':
      // 음성 재생 중 호흡 + 펄스 표시는 부모 컴포넌트가 별도로 그림
      return 'animate-body-wobble'
    case 'jumping':
      return 'animate-jumping'
    default:
      return ''
  }
}

// ── 메인 컴포넌트 ───────────────────────────────────────
/**
 * 깡총이를 화면에 그린다.
 *
 * @example child story 화면 (메인 캐릭터, 듣고 있음)
 *   <KkangchongCharacter
 *     emotion="listening"
 *     motion="breathing"
 *     size={380}
 *     ariaLabel="깡총이가 듣고 있어요"
 *     priority
 *   />
 *
 * @example splash 화면 (인사, 진입 모션)
 *   <KkangchongCharacter
 *     emotion="waving"
 *     motion="soft-land"
 *     size={200}
 *     ariaLabel="깡총이"
 *     priority
 *   />
 */
export default function KkangchongCharacter({
  emotion = 'happy',
  motion = 'breathing',
  size = 200,
  ariaLabel,
  className = '',
  priority = false,
}: KkangchongCharacterProps) {
  const [mounted, setMounted] = useState(false)
  const src = EMOTION_TO_ASSET[emotion]
  const isProxy = PROXY_EMOTIONS[emotion]

  // 개발 모드에서 proxy 사용 시 콘솔 경고
  // (production 빌드에서 Next.js가 process.env.NODE_ENV === 'development' 분기 처리)
  useEffect(() => {
    setMounted(true)
    if (process.env.NODE_ENV === 'development' && isProxy) {
      // eslint-disable-next-line no-console
      console.info(
        `[KkangchongCharacter] emotion="${emotion}" uses proxy asset "${src}". ` +
        `Replace with dedicated asset when available.`
      )
    }
  }, [emotion, src, isProxy])

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`relative inline-block ${motionClass(motion)} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt="" // role="img" + aria-label로 처리 → alt는 빈 문자열
        width={size}
        height={size}
        priority={priority}
        className="w-full h-full object-contain"
        // SSR 시 깜빡임 방지 — 마운트 전에는 opacity 0
        style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.2s' }}
      />
    </div>
  )
}

// ── 보조: 음성 재생 중 펄스 표시 ────────────────────────
/**
 * 깡총이 옆에 4-bar 음성 펄스를 그린다.
 * 캐릭터와 함께 위치를 맞추기 위해 별도 컴포넌트로 분리.
 *
 * @example
 *   <div className="relative">
 *     <KkangchongCharacter emotion="listening" motion="voice-pulse" ariaLabel="..." />
 *     {isPlaying && <VoicePulse />}
 *   </div>
 */
export function VoicePulse({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-end gap-1 h-8 ${className}`}
      aria-hidden="true"
    >
      <span className="w-1 h-3 bg-kkang-pink-deep rounded-full animate-voice-pulse opacity-70" />
      <span className="w-1 h-6 bg-kkang-pink-deep rounded-full animate-voice-pulse-2 opacity-70" />
      <span className="w-1 h-4 bg-kkang-pink-deep rounded-full animate-voice-pulse-3 opacity-70" />
      <span className="w-1 h-7 bg-kkang-pink-deep rounded-full animate-voice-pulse-4 opacity-70" />
    </div>
  )
}
