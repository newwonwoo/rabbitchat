"use client";

// Tiny IndexedDB-backed cache for AI responses.
//
// Why IndexedDB, not localStorage:
//   - localStorage is ~5MB string-only; TTS blobs can be 100KB+ each.
//   - IndexedDB stores Blob/ArrayBuffer natively, no base64 overhead.
//
// Layout: one DB "rabbitchat-ai-cache" with two stores:
//   "tts"  — { key: hash(voiceId + text), blob: Blob, ts: number, bytes: number }
//   "llm"  — { key: hash(model + system + user), text: string, ts: number, bytes: number }
//
// Hit on second call → no network, no cost.

const DB_NAME = "rabbitchat-ai-cache";
const DB_VERSION = 3;

export type CacheStoreName = "tts" | "llm" | "img" | "character";

type CacheEntry<T> = {
  key: string;
  ts: number;
  bytes: number;
  // either blob (tts) or text (llm)
  blob?: Blob;
  text?: T;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase | null> {
  if (!isBrowser()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("tts")) {
        db.createObjectStore("tts", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("llm")) {
        db.createObjectStore("llm", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("img")) {
        db.createObjectStore("img", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("character")) {
        db.createObjectStore("character", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function hashKey(parts: string[]): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    // Fallback — sum of char codes (collision-prone but only for SSR)
    return parts.join("|");
  }
  const text = parts.join("|");
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getEntry<T>(
  store: CacheStoreName,
  key: string,
): Promise<CacheEntry<T> | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}

async function putEntry<T>(
  store: CacheStoreName,
  entry: CacheEntry<T>,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

export async function getCachedBlob(key: string): Promise<Blob | null> {
  const e = await getEntry<unknown>("tts", key);
  return e?.blob ?? null;
}

export async function putCachedBlob(key: string, blob: Blob): Promise<void> {
  await putEntry("tts", {
    key,
    ts: Date.now(),
    bytes: blob.size,
    blob,
  });
}

export async function getCachedText(key: string): Promise<string | null> {
  const e = await getEntry<string>("llm", key);
  return e?.text ?? null;
}

export async function putCachedText(key: string, text: string): Promise<void> {
  await putEntry("llm", {
    key,
    ts: Date.now(),
    bytes: text.length * 2, // UTF-16 rough
    text,
  });
}

// Image-search URL cache. Keyed by hash(query + orientation) → resolved
// CDN URL. Stores the URL string only, not the binary (browsers cache
// the binary natively from the <img src>).
export async function getCachedImageUrl(key: string): Promise<string | null> {
  const e = await getEntry<string>("img", key);
  return e?.text ?? null;
}

export async function putCachedImageUrl(key: string, url: string): Promise<void> {
  await putEntry("img", {
    key,
    ts: Date.now(),
    bytes: url.length * 2,
    text: url,
  });
}

// Character pose blobs sliced by the parent from the CI sheet.
// Key = mood (e.g. "happy", "listening", ...). Value = PNG Blob.
export async function getCharacterPose(mood: string): Promise<Blob | null> {
  const e = await getEntry<unknown>("character", mood);
  return e?.blob ?? null;
}

export async function putCharacterPose(mood: string, blob: Blob): Promise<void> {
  await putEntry("character", {
    key: mood,
    ts: Date.now(),
    bytes: blob.size,
    blob,
  });
}

export async function clearCharacterPoses(): Promise<void> {
  return clearCache("character");
}

// --- Stats / management ---------------------------------------------------

export type CacheStats = {
  ttsCount: number;
  ttsBytes: number;
  llmCount: number;
  llmBytes: number;
  imgCount: number;
  imgBytes: number;
};

export async function getCacheStats(): Promise<CacheStats> {
  const db = await openDb();
  if (!db) {
    return {
      ttsCount: 0,
      ttsBytes: 0,
      llmCount: 0,
      llmBytes: 0,
      imgCount: 0,
      imgBytes: 0,
    };
  }
  const tally = (store: CacheStoreName) =>
    new Promise<{ count: number; bytes: number }>((resolve) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).openCursor();
      let count = 0;
      let bytes = 0;
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) {
          const v = cur.value as CacheEntry<unknown>;
          count += 1;
          bytes += v.bytes ?? 0;
          cur.continue();
        } else {
          resolve({ count, bytes });
        }
      };
      req.onerror = () => resolve({ count: 0, bytes: 0 });
    });
  const [tts, llm, img] = await Promise.all([
    tally("tts"),
    tally("llm"),
    tally("img"),
  ]);
  return {
    ttsCount: tts.count,
    ttsBytes: tts.bytes,
    llmCount: llm.count,
    llmBytes: llm.bytes,
    imgCount: img.count,
    imgBytes: img.bytes,
  };
}

export async function clearCache(store?: CacheStoreName): Promise<void> {
  const db = await openDb();
  if (!db) return;
  const stores: CacheStoreName[] = store
    ? [store]
    : ["tts", "llm", "img", "character"];
  for (const s of stores) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(s, "readwrite");
      const req = tx.objectStore(s).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }
}

// --- Lightweight in-process counters for hit-rate display ----------------

const counters = { ttsHit: 0, ttsMiss: 0, llmHit: 0, llmMiss: 0 };

export function bumpHit(store: CacheStoreName): void {
  if (store === "tts") counters.ttsHit += 1;
  else counters.llmHit += 1;
}
export function bumpMiss(store: CacheStoreName): void {
  if (store === "tts") counters.ttsMiss += 1;
  else counters.llmMiss += 1;
}
export function getCounters() {
  return { ...counters };
}
