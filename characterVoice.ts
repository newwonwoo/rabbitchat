/**
 * lib/characterVoice.ts
 * ----------------------------------------------------------
 * 깡총이 페르소나 가드.
 * "깡총이는 엄마 목소리로 말하지만 엄마가 아니다." 원칙을 강제한다.
 *
 * - LLM 응답 / scene.spokenLine / audioFile 자막 모두에 적용
 * - 적용 위치: 클라이언트 전달 직전 (server-side rendering, API response)
 * - harness:check가 sanitize 미적용 텍스트를 자동 탐지
 *
 * 운영 원칙:
 *   "엄마가 ~" → "우리가 ~"  (3인칭 → 1인칭 복수)
 *   "엄마는 ~" → "" (제거 후 자연스럽게 재구성)
 *   "엄마 말 ~" → 행동 표현으로 치환
 *   "엄마와" → "우리"
 */

// ── 치환 규칙 정의 ───────────────────────────────────────
// 순서 중요 — 더 구체적인 패턴이 먼저 와야 함.
// (예: "엄마 말" 처리 후 "엄마"가 처리되어야 일반 케이스 누락 방지)
interface SanitizeRule {
  /** 정규식 패턴 (g 플래그 필수) */
  pattern: RegExp
  /** 치환 문자열 또는 함수 */
  replacement: string | ((match: string, ...groups: string[]) => string)
  /** 디버그용 설명 */
  description: string
}

const SANITIZE_RULES: SanitizeRule[] = [
  // ── 1차: 명시적 자기-3인칭 표현 ─────────────────────
  {
    pattern: /엄마\s*말\s*(잘\s*들었지|들었지|들어)\s*\?/g,
    replacement: '잘 들어줘서 고마워',
    description: '엄마 말 잘 들었지? → 잘 들어줘서 고마워',
  },
  {
    pattern: /엄마\s*말/g,
    replacement: '내 이야기',
    description: '엄마 말 → 내 이야기',
  },
  {
    pattern: /엄마는\s+너를?\s*사랑해/g,
    replacement: '너를 정말 사랑해',
    description: '엄마는 너를 사랑해 → 너를 정말 사랑해',
  },
  {
    pattern: /엄마는\s+/g,
    replacement: '',
    description: '엄마는 ~ → 주어 제거',
  },

  // ── 2차: 동작 주체 치환 ────────────────────────────
  {
    pattern: /엄마가\s+/g,
    replacement: '우리가 ',
    description: '엄마가 ~ → 우리가 ~',
  },
  {
    pattern: /엄마와\s+/g,
    replacement: '우리 ',
    description: '엄마와 ~ → 우리 ~',
  },
  {
    pattern: /엄마랑\s+/g,
    replacement: '우리 ',
    description: '엄마랑 ~ → 우리 ~',
  },
  {
    pattern: /엄마를\s+/g,
    replacement: '나를 ',
    description: '엄마를 ~ → 나를 ~ (깡총이가 자기를 칭함)',
  },

  // ── 3차: 단독 "엄마" 호칭 ──────────────────────────
  // 위 규칙들이 모두 적용된 후 남은 단독 "엄마"는 보수적으로 처리
  // (전부 제거하면 자연스럽지 않을 수 있어 일단 유지하고 경고만)
]

// ── 위험 토큰 — sanitize 후에도 남으면 경고 ────────
// harness:check가 이 패턴을 탐지하면 빌드 실패
const DANGER_PATTERNS = [
  /엄마가/,
  /엄마는/,
  /엄마\s*말/,
] as const

// ── 메인 sanitize 함수 ──────────────────────────────
/**
 * 텍스트에서 깡총이 페르소나에 어긋나는 표현을 제거/치환한다.
 *
 * @param text - 원본 텍스트 (LLM 응답, spokenLine 등)
 * @returns sanitize된 텍스트
 *
 * @example
 *   sanitizeCharacterVoice('엄마가 동물원에 갔어')
 *   // → '우리가 동물원에 갔어'
 *
 *   sanitizeCharacterVoice('엄마는 너를 사랑해')
 *   // → '너를 정말 사랑해'
 */
export function sanitizeCharacterVoice(text: string): string {
  if (!text) return text
  let result = text
  for (const rule of SANITIZE_RULES) {
    // TS의 String.prototype.replace 시그니처가 까다로워 분기 처리
    if (typeof rule.replacement === 'string') {
      result = result.replace(rule.pattern, rule.replacement)
    } else {
      result = result.replace(rule.pattern, rule.replacement)
    }
  }
  // 연속 공백 정리
  result = result.replace(/\s{2,}/g, ' ').trim()
  return result
}

/**
 * 텍스트에 위험 패턴이 남아있는지 검사 (테스트/harness용).
 *
 * @returns 위험 매칭 정보 배열. 빈 배열이면 안전.
 *
 * @example
 *   const issues = checkVoicePersona(spokenLine)
 *   if (issues.length > 0) throw new Error(`페르소나 가드 실패: ${...}`)
 */
export function checkVoicePersona(
  text: string
): Array<{ pattern: string; matched: string; index: number }> {
  if (!text) return []
  const issues: Array<{ pattern: string; matched: string; index: number }> = []
  for (const pattern of DANGER_PATTERNS) {
    const match = text.match(pattern)
    if (match && typeof match.index === 'number') {
      issues.push({
        pattern: pattern.source,
        matched: match[0],
        index: match.index,
      })
    }
  }
  return issues
}

/**
 * 객체 안의 모든 string 필드를 재귀적으로 sanitize.
 * scene 객체 통째로 처리할 때 유용.
 *
 * 주의: 깊은 복사를 만들지 않고 새 객체를 반환 (immutable 보장)
 *
 * @example
 *   const cleanScene = sanitizeSceneText(scene)
 *   // scene.spokenLine, scene.questionLine 등 모든 string 필드 sanitize됨
 */
export function sanitizeSceneText<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeCharacterVoice(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeCharacterVoice(item)
          : item && typeof item === 'object'
          ? sanitizeSceneText(item as Record<string, unknown>)
          : item
      )
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeSceneText(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result as T
}
