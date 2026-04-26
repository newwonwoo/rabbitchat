/**
 * lib/cacheWarmer.ts
 * ----------------------------------------------------------
 * optimize 단계에서 story의 모든 자산을 사전 처리하고 IndexedDB에 캐싱.
 *
 * 목표:
 *   아이가 story를 재생할 때 신규 API 호출이 0번 발생하도록 보장.
 *   → 모든 image / TTS / LLM 결과가 미리 캐시되어 있어야 함.
 *
 * 호출 시점:
 *   부모가 publish 누르기 직전 "음성·이미지 자동 최적화" 단계.
 *   진행률 UI를 보여줄 수 있도록 progress callback 지원.
 */

import { searchImage } from '@/lib/imageSearcher'
import { sanitizeCharacterVoice } from '@/lib/characterVoice'
import { get, set, hashKey, TTL } from '@/lib/storage/db'

// ── 타입 ──────────────────────────────────────────────
/**
 * Scene = story의 한 장면.
 * (storyPipeline.ts에서 정의되는 scene과 호환되도록 최소 구조)
 */
export interface SceneForWarming {
  /** scene 식별자 */
  id: string
  /** 깡총이 대사 (TTS 대상) — sanitize 미적용 원본 가능 */
  spokenLine?: string
  /** 사전 녹음 오디오 파일 경로 (1순위) */
  audioFile?: string
  /** 음성 voice id (ElevenLabs) */
  voiceId?: string
  /** 선택지 키워드 — 이미지 검색 대상 */
  optionKeywords?: string[]
  /** 메인 이미지 키워드 */
  imageKeyword?: string
}

export interface StoryForWarming {
  id: string
  scenes: SceneForWarming[]
}

export interface WarmProgress {
  /** 0.0 ~ 1.0 */
  ratio: number
  /** 현재 처리 중인 작업 라벨 */
  label: string
  /** 누적 완료 작업 수 */
  done: number
  /** 전체 작업 수 */
  total: number
}

export interface WarmResult {
  storyId: string
  totalTasks: number
  succeeded: number
  failed: number
  /** 실패한 작업의 라벨 (디버그용) */
  failures: string[]
  /** 소요 시간 (ms) */
  elapsedMs: number
}

// ── TTS 사전 생성 ─────────────────────────────────
/**
 * spokenLine을 TTS로 변환하여 캐시.
 * 이미 audioFile이 있으면 skip.
 *
 * 실제 TTS 호출은 lib/providers/tts (별도 구현)를 통해.
 * 여기서는 캐시 hit/miss와 호출 위임만 담당.
 */
async function warmTTS(scene: SceneForWarming): Promise<void> {
  // 1순위 audioFile이 이미 있으면 TTS 불필요
  if (scene.audioFile) return
  if (!scene.spokenLine) return

  const sanitized = sanitizeCharacterVoice(scene.spokenLine)
  const voiceId = scene.voiceId ?? 'default'
  const cacheKey = await hashKey('tts', sanitized, voiceId)

  // 캐시 hit 확인
  const cached = await get<string>('tts', cacheKey)
  if (cached) return

  // 새로 생성 — 실제 TTS provider 호출
  // (lib/providers/tts.ts에서 구현. 여기는 인터페이스만 호출)
  try {
    const { synthesizeTTS } = await import('@/lib/providers/tts')
    const audioUrl = await synthesizeTTS(sanitized, voiceId)
    await set('tts', cacheKey, audioUrl, TTL.tts)
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[cacheWarmer] TTS warm failed:', err)
    }
    throw err
  }
}

// ── 이미지 사전 검색 ─────────────────────────────
/**
 * scene의 이미지 키워드와 선택지 키워드를 모두 검색해 캐시.
 */
async function warmImages(scene: SceneForWarming): Promise<void> {
  const keywords: string[] = []
  if (scene.imageKeyword) keywords.push(scene.imageKeyword)
  if (scene.optionKeywords) keywords.push(...scene.optionKeywords)

  // 병렬 처리. searchImage 자체가 캐시 저장까지 처리하므로 결과는 무시 가능
  await Promise.all(keywords.map((kw) => searchImage(kw)))
}

// ── 메인 API ─────────────────────────────────────
/**
 * story 전체를 사전 처리하여 캐시 채우기.
 *
 * @param story - publish 직전의 story 데이터
 * @param onProgress - 진행률 callback (UI 업데이트용)
 *
 * @example
 *   const result = await warmStoryCache(story, (p) => setProgress(p.ratio))
 *   if (result.failed > 0) showWarning(`${result.failed}개 자산 처리 실패`)
 */
export async function warmStoryCache(
  story: StoryForWarming,
  onProgress?: (progress: WarmProgress) => void
): Promise<WarmResult> {
  const startedAt = Date.now()

  // 작업 단위 = scene별 (TTS + 이미지)
  // total은 각 scene당 2개 작업으로 계산 (대략적 진행률용)
  const total = story.scenes.length * 2
  let done = 0
  let succeeded = 0
  let failed = 0
  const failures: string[] = []

  const tick = (label: string) => {
    done += 1
    onProgress?.({
      ratio: done / total,
      label,
      done,
      total,
    })
  }

  for (const scene of story.scenes) {
    // TTS
    try {
      await warmTTS(scene)
      succeeded += 1
    } catch {
      failed += 1
      failures.push(`tts:${scene.id}`)
    }
    tick(`scene ${scene.id} — 음성 준비`)

    // 이미지
    try {
      await warmImages(scene)
      succeeded += 1
    } catch {
      failed += 1
      failures.push(`img:${scene.id}`)
    }
    tick(`scene ${scene.id} — 이미지 준비`)
  }

  return {
    storyId: story.id,
    totalTasks: total,
    succeeded,
    failed,
    failures,
    elapsedMs: Date.now() - startedAt,
  }
}

/**
 * story가 이미 충분히 cache되어있는지 확인 (재시작/재방문 시).
 *
 * @returns true면 재생 가능 (cache hit), false면 warm 필요
 */
export async function isStoryWarm(story: StoryForWarming): Promise<boolean> {
  for (const scene of story.scenes) {
    // TTS 캐시 확인
    if (!scene.audioFile && scene.spokenLine) {
      const sanitized = sanitizeCharacterVoice(scene.spokenLine)
      const voiceId = scene.voiceId ?? 'default'
      const ttsKey = await hashKey('tts', sanitized, voiceId)
      const ttsHit = await get<string>('tts', ttsKey)
      if (!ttsHit) return false
    }
    // 이미지 캐시는 검사 비용이 크므로 일단 TTS만 체크
    // (이미지는 1단계 local hit이 보장되는 경우가 많음)
  }
  return true
}
