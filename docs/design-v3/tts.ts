/**
 * lib/providers/tts.ts
 * ----------------------------------------------------------
 * TTS provider 인터페이스 + 구현 stub.
 *
 * cacheWarmer.ts가 의존하는 인터페이스를 정의하고, 실제 ElevenLabs 구현은
 * 환경변수 ELEVENLABS_API_KEY가 있을 때만 동작.
 * mock 모드에서는 무음 audio URL 반환.
 *
 * harness:check 차단 항목:
 *   - 클라이언트에서 직접 elevenlabs.io 호출 금지
 *   - 반드시 이 파일을 통해서만 호출 (서버 라우트 또는 SSR)
 */

// ── 환경 모드 ─────────────────────────────────────
function isMockMode(): boolean {
  // Next.js 환경변수: NEXT_PUBLIC_RABBITCHAT_MODE='mock'이면 mock
  // 또는 ELEVENLABS_API_KEY가 비어있으면 자동 mock
  if (typeof process === 'undefined') return true
  const explicit = process.env.NEXT_PUBLIC_RABBITCHAT_MODE
  if (explicit === 'mock') return true
  if (explicit === 'live') return false
  // 명시적 설정이 없으면 API 키 유무로 판단
  return !process.env.ELEVENLABS_API_KEY
}

// ── 1초 무음 WAV (mock 모드용) ─────────────────────
// base64 인코딩된 1초 무음 (44100Hz mono PCM) — 실제 재생 가능
const SILENT_WAV_DATA_URL =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

// ── 메인 API ─────────────────────────────────────
/**
 * 텍스트를 TTS로 합성하고 audio URL을 반환.
 * mock 모드에서는 무음 data URL 반환 (앱 흐름은 정상 작동).
 *
 * @param text - sanitize 완료된 텍스트 (sanitizeCharacterVoice 사전 적용 필수)
 * @param voiceId - ElevenLabs voice ID (엄마 목소리)
 * @returns 재생 가능한 audio URL (data URL 또는 cached URL)
 *
 * @example
 *   const url = await synthesizeTTS('안녕, 오늘 뭐 했어?', 'voice_abc')
 *   audio.src = url
 *   audio.play()
 */
export async function synthesizeTTS(
  text: string,
  voiceId: string
): Promise<string> {
  if (isMockMode()) {
    // mock — 무음 data URL 반환. cacheWarmer 흐름 검증 가능.
    return SILENT_WAV_DATA_URL
  }

  // live — 서버 API 라우트로 위임 (직접 외부 호출 금지)
  // /app/api/tts/route.ts 가 실제 ElevenLabs 호출 담당
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  })

  if (!res.ok) {
    throw new Error(`TTS 합성 실패: ${res.status}`)
  }

  // 서버가 audio URL(또는 base64) 반환
  const data = (await res.json()) as { url: string }
  return data.url
}

/**
 * 사용 가능한 voice 목록 조회 (부모 화면 — 엄마 목소리 선택용).
 */
export async function listVoices(): Promise<Array<{ id: string; name: string }>> {
  if (isMockMode()) {
    return [
      { id: 'mock-mom-1', name: '엄마 목소리 1 (mock)' },
      { id: 'mock-mom-2', name: '엄마 목소리 2 (mock)' },
    ]
  }
  const res = await fetch('/api/tts/voices')
  if (!res.ok) return []
  return res.json()
}
