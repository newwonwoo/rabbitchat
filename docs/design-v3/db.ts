/**
 * lib/storage/db.ts
 * ----------------------------------------------------------
 * IndexedDB 4 store 래퍼 (tts / llm / img / character).
 * - 단일 store 통합 금지 — 각 store의 TTL과 invalidation 정책이 다름
 * - 모든 함수는 Promise 기반
 * - SSR 환경(window 없음)에서는 모든 함수가 안전하게 no-op
 *
 * 키 컨벤션:
 *   tts:       hash(text + voiceId)
 *   llm:       hash(prompt + model)
 *   img:       hash(query + provider)
 *   character: keyword (소문자 정규화)
 */

// ── 상수 ─────────────────────────────────────────────────
const DB_NAME = 'rabbitchat'
const DB_VERSION = 1

export const STORES = ['tts', 'llm', 'img', 'character'] as const
export type StoreName = (typeof STORES)[number]

// ── DB 인스턴스 캐시 ───────────────────────────────────
// 여러 호출에서 동일한 connection을 재사용
let dbPromise: Promise<IDBDatabase> | null = null

/**
 * SSR 안전 체크 — IndexedDB는 브라우저 전용
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

/**
 * IndexedDB 연결을 열거나 캐시된 연결 반환.
 * 4개 store가 없으면 onupgradeneeded에서 생성.
 */
function openDB(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    return Promise.reject(new Error('IndexedDB unavailable (SSR or unsupported)'))
  }
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      // 4개 store 모두 보장
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name) // out-of-line key
        }
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      dbPromise = null // 실패 시 재시도 가능하게
      reject(req.error)
    }
  })

  return dbPromise
}

// ── 저장된 값 envelope ────────────────────────────────
// expiresAt 같은 메타데이터를 같이 저장하기 위한 wrapper
interface StoredValue<T> {
  value: T
  storedAt: number  // 저장 시각 (Date.now())
  expiresAt?: number // 만료 시각 (Date.now() + ttl)
}

// ── 핵심 API ──────────────────────────────────────────
/**
 * store에서 key로 값을 조회. 만료된 값은 자동 삭제 후 null 반환.
 *
 * @example
 *   const cached = await get<string>('tts', 'hash_abc')
 *   if (cached) playAudio(cached)
 */
export async function get<T>(store: StoreName, key: string): Promise<T | null> {
  if (!isBrowser()) return null

  try {
    const db = await openDB()
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).get(key)
      req.onsuccess = () => {
        const stored = req.result as StoredValue<T> | undefined
        if (!stored) return resolve(null)
        // TTL 만료 체크
        if (stored.expiresAt && stored.expiresAt < Date.now()) {
          // 만료 → 비동기로 삭제 (반환은 null)
          void deleteKey(store, key)
          return resolve(null)
        }
        resolve(stored.value)
      }
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

/**
 * store에 값 저장. ttlMs를 주면 만료 시각이 함께 저장됨.
 *
 * @param ttlMs - undefined이면 영구 저장
 * @example
 *   // TTS 캐시 — 30일
 *   await set('tts', 'hash_abc', audioBlob, 30 * 24 * 60 * 60 * 1000)
 *   // 캐릭터 자산 인덱스 — 영구 (앱 업데이트 시 갱신)
 *   await set('character', 'happy', { src: '...' })
 */
export async function set<T>(
  store: StoreName,
  key: string,
  value: T,
  ttlMs?: number
): Promise<void> {
  if (!isBrowser()) return

  const stored: StoredValue<T> = {
    value,
    storedAt: Date.now(),
    expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
  }

  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).put(stored, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    // 저장 실패는 silent — 캐시는 보조 수단이므로 앱 흐름은 계속
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[storage] set failed: ${store}/${key}`, err)
    }
  }
}

/**
 * 단일 키 삭제
 */
export async function deleteKey(store: StoreName, key: string): Promise<void> {
  if (!isBrowser()) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // ignore
  }
}

/**
 * store 전체 비우기 — 디버그·로그아웃·캐시 무효화 시 사용
 */
export async function clearStore(store: StoreName): Promise<void> {
  if (!isBrowser()) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // ignore
  }
}

/**
 * store의 모든 키 나열 (디버그 화면용)
 */
export async function listKeys(store: StoreName): Promise<string[]> {
  if (!isBrowser()) return []
  try {
    const db = await openDB()
    return await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).getAllKeys()
      req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String))
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

// ── 키 해싱 헬퍼 (tts/llm/img store용) ───────────────────
/**
 * 텍스트로 안정적인 해시 키 생성.
 * Web Crypto API의 SHA-256을 사용.
 * 동일 입력 → 동일 키 → 캐시 hit.
 */
export async function hashKey(...parts: string[]): Promise<string> {
  if (!isBrowser() || !window.crypto?.subtle) {
    // 폴백: 단순 join (충돌 가능성 있지만 SSR에서는 캐시 미사용)
    return parts.join('|')
  }
  const text = parts.join('|')
  const encoded = new TextEncoder().encode(text)
  const buffer = await window.crypto.subtle.digest('SHA-256', encoded)
  const bytes = Array.from(new Uint8Array(buffer))
  // hex 16자만 사용 → 키 길이 절약
  return bytes.slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ── TTL 상수 ─────────────────────────────────────────
// 운영 정책: TTS는 길게(엄마 목소리 안정), LLM은 중간, IMG는 길게
export const TTL = {
  tts: 90 * 24 * 60 * 60 * 1000,      // 90일
  llm: 30 * 24 * 60 * 60 * 1000,      // 30일
  img: 60 * 24 * 60 * 60 * 1000,      // 60일
  character: undefined,                // 영구 (앱 업데이트 시 갱신)
} as const
