/**
 * lib/providers/llm.ts
 * ----------------------------------------------------------
 * LLM provider 인터페이스 + 구현 stub.
 *
 * 실제 OpenAI/Anthropic 호출은 서버 라우트(/api/llm)가 담당.
 * 클라이언트에서 직접 api.openai.com 호출은 harness:check가 차단.
 *
 * sanitizeCharacterVoice는 이 파일에서 적용하지 않고,
 * 호출하는 쪽(storyPipeline)이 LLM 응답을 받은 후 적용.
 * (LLM 사용 의도에 따라 sanitize 적용 여부가 다를 수 있어 책임 분리)
 */

function isMockMode(): boolean {
  if (typeof process === 'undefined') return true
  const explicit = process.env.NEXT_PUBLIC_RABBITCHAT_MODE
  if (explicit === 'mock') return true
  if (explicit === 'live') return false
  return !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY
}

// ── 메인 API ─────────────────────────────────────
export interface LLMRequest {
  /** 시스템 프롬프트 */
  system?: string
  /** 사용자 프롬프트 */
  user: string
  /** 응답 형식 — JSON 모드 등 */
  responseFormat?: 'text' | 'json'
  /** 최대 토큰 */
  maxTokens?: number
}

/**
 * LLM 호출 (서버 라우트 경유).
 * mock 모드에서는 고정 mock 응답 반환.
 *
 * @example
 *   const res = await generateText({
 *     system: '너는 따뜻한 동화 작가야',
 *     user: '오늘 사과 먹은 이야기 만들어줘',
 *   })
 */
export async function generateText(req: LLMRequest): Promise<string> {
  if (isMockMode()) {
    // mock — 고정 응답으로 storyPipeline 흐름 검증
    if (req.responseFormat === 'json') {
      return JSON.stringify({
        scenes: [
          {
            id: 'scene-1',
            spokenLine: '오늘 사과를 먹었지? 정말 맛있었을 거야.',
            options: ['더 먹고싶어', '배불러'],
          },
        ],
      })
    }
    return '오늘 우리가 함께 사과를 먹었지. 정말 맛있었어!'
  }

  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    throw new Error(`LLM 호출 실패: ${res.status}`)
  }

  const data = (await res.json()) as { text: string }
  return data.text
}
