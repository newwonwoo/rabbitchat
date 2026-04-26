/**
 * lib/imageSearcher.ts
 * ----------------------------------------------------------
 * 시각 자산 4단 폴백 체인.
 *   1st: local asset (data/assets.ts → fuzzy match)
 *   2nd: /api/character (서버측 fuzzy / DB 매칭)
 *   3rd: /api/pexels (Pexels 서버 proxy — 우리 서버 경유만 허용)
 *   4th: emoji fallback (앱 깨짐 방지 최후의 수단)
 *
 * 호출 정책:
 *   - 부모 검토 / optimize 단계에서만 1~3단 호출
 *   - 아이 재생 중에는 호출하지 않음 (storyPipeline이 사전 처리)
 *   - 모든 결과는 IndexedDB img store에 캐싱
 *
 * harness:check 차단 항목:
 *   - google.com/search, bing.com/images, unsplash 등 직접 호출
 *   - Pexels API 직접 호출 (반드시 /api/pexels proxy 경유)
 */

import { findAssetByKeyword, type CharacterAsset } from '@/data/assets'
import { get, set, hashKey, TTL } from '@/lib/storage/db'

// ── 결과 타입 ─────────────────────────────────────────
export type ImageSource = 'local' | 'api-character' | 'pexels-proxy' | 'emoji'

export interface ImageResult {
  /** 이미지 URL (또는 emoji 문자) */
  url: string
  /** 어느 단계에서 해결되었는지 — 디버그/모니터링 */
  source: ImageSource
  /** 자산 메타 (local인 경우만) */
  asset?: CharacterAsset
}

// ── 키워드 → emoji 매핑 (마지막 폴백) ───────────────
// 매우 거칠지만 앱 깨짐 방지가 목적
const EMOJI_FALLBACK: Array<{ pattern: RegExp; emoji: string }> = [
  { pattern: /사과|apple/i, emoji: '🍎' },
  { pattern: /바나나|banana/i, emoji: '🍌' },
  { pattern: /딸기|strawberry/i, emoji: '🍓' },
  { pattern: /밥|식사|meal|rice/i, emoji: '🍚' },
  { pattern: /물|water/i, emoji: '💧' },
  { pattern: /주스|juice/i, emoji: '🧃' },
  { pattern: /목욕|bathtub|bath/i, emoji: '🛁' },
  { pattern: /양치|teeth|brush/i, emoji: '🪥' },
  { pattern: /손\s*씻|wash/i, emoji: '🧼' },
  { pattern: /자|잠|sleep/i, emoji: '😴' },
  { pattern: /자동차|car/i, emoji: '🚗' },
  { pattern: /공원|park/i, emoji: '🌳' },
  { pattern: /동물원|zoo/i, emoji: '🦒' },
]

const DEFAULT_EMOJI = '🐰' // 깡총이 emoji

function pickEmoji(keyword: string): string {
  for (const { pattern, emoji } of EMOJI_FALLBACK) {
    if (pattern.test(keyword)) return emoji
  }
  return DEFAULT_EMOJI
}

// ── 단계별 함수 ────────────────────────────────────────
/**
 * 1단계: 로컬 자산 인덱스에서 fuzzy 매칭.
 * data/assets.ts의 findAssetByKeyword 사용.
 */
function resolveLocal(keyword: string): ImageResult | null {
  const asset = findAssetByKeyword(keyword)
  if (!asset) return null
  return {
    url: asset.src,
    source: 'local',
    asset,
  }
}

/**
 * 2단계: 서버 API의 캐릭터 매칭 시도.
 * 서버 측에 더 큰 자산 DB가 있을 수 있음.
 * 실패 시 null 반환.
 */
async function resolveApiCharacter(keyword: string): Promise<ImageResult | null> {
  try {
    const url = `/api/character?label=${encodeURIComponent(keyword)}`
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return null
    const data = (await res.json()) as { url?: string }
    if (!data.url) return null
    return { url: data.url, source: 'api-character' }
  } catch {
    return null
  }
}

/**
 * 3단계: Pexels API (서버 proxy 경유).
 * 클라이언트에서 직접 api.pexels.com 호출 금지 — harness:check 차단 항목.
 * 반드시 /api/pexels?q=... 형태로 우리 서버 통해 호출.
 */
async function resolvePexelsProxy(keyword: string): Promise<ImageResult | null> {
  try {
    const url = `/api/pexels?q=${encodeURIComponent(keyword)}`
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return null
    const data = (await res.json()) as { url?: string }
    if (!data.url) return null
    return { url: data.url, source: 'pexels-proxy' }
  } catch {
    return null
  }
}

/**
 * 4단계: emoji fallback.
 * 항상 성공 — 앱이 절대 깨지지 않게 보장.
 */
function resolveEmoji(keyword: string): ImageResult {
  return { url: pickEmoji(keyword), source: 'emoji' }
}

// ── 메인 API ─────────────────────────────────────────
/**
 * 키워드로 가장 적절한 이미지를 4단 폴백 체인을 따라 해결.
 * 결과는 IndexedDB 'img' store에 캐싱.
 *
 * @param keyword - 검색 키워드 (예: "사과 먹기", "목욕")
 * @param options.skipCache - true면 캐시 무시하고 항상 새로 검색
 *
 * @example
 *   const img = await searchImage('사과 먹은 이야기')
 *   // → { url: '/assets/character/eatapple.png', source: 'local', asset: {...} }
 */
export async function searchImage(
  keyword: string,
  options: { skipCache?: boolean } = {}
): Promise<ImageResult> {
  // 빈 입력 가드
  if (!keyword || !keyword.trim()) {
    return resolveEmoji('')
  }

  const cacheKey = await hashKey('img', keyword.trim().toLowerCase())

  // ── 캐시 hit 확인 ─────────────────────────────────
  if (!options.skipCache) {
    const cached = await get<ImageResult>('img', cacheKey)
    if (cached) return cached
  }

  // ── 1단계: 로컬 ────────────────────────────────────
  const local = resolveLocal(keyword)
  if (local) {
    await set('img', cacheKey, local, TTL.img)
    return local
  }

  // ── 2단계: /api/character ─────────────────────────
  const apiChar = await resolveApiCharacter(keyword)
  if (apiChar) {
    await set('img', cacheKey, apiChar, TTL.img)
    return apiChar
  }

  // ── 3단계: Pexels proxy ───────────────────────────
  const pexels = await resolvePexelsProxy(keyword)
  if (pexels) {
    await set('img', cacheKey, pexels, TTL.img)
    return pexels
  }

  // ── 4단계: emoji ──────────────────────────────────
  const emoji = resolveEmoji(keyword)
  // emoji는 캐싱하지 않음 (다음 호출 시 1~3단계 재시도 가능)
  return emoji
}

/**
 * 여러 키워드를 한 번에 처리 (storyPipeline에서 scene별로 미리 호출).
 * 병렬 처리.
 */
export async function searchImages(
  keywords: string[]
): Promise<ImageResult[]> {
  return Promise.all(keywords.map((kw) => searchImage(kw)))
}
