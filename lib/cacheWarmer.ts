// Pre-warm the TTS cache for a list of phrases. Runs sequentially with
// a small delay between calls to stay within ElevenLabs Free concurrency.
//
// Already-cached lines are detected via the bumpHit/bumpMiss counters in
// aiCache: we snapshot before/after to tell whether the call was a hit
// (free) or a miss (newly billed + cached).

import { getCounters } from "@/lib/aiCache";
import { getProviderMode, getTTSProvider } from "@/lib/providers";

export type WarmProgress = {
  total: number;
  done: number;
  hit: number;
  newWarm: number;
  failed: number;
  current: string | null;
};

export type WarmReport = {
  total: number;
  hit: number;
  newWarm: number;
  failed: number;
  charsBilled: number;
  skippedReason?: "mock_mode" | "provider_unsupported" | null;
};

const REQUEST_DELAY_MS = 250;

export async function warmTTSPhrases(
  texts: string[],
  onProgress?: (p: WarmProgress) => void,
): Promise<WarmReport> {
  // In mock mode, prefetch is a no-op so warming would be meaningless.
  // Surface that to the UI rather than silently doing nothing.
  if (getProviderMode() === "mock") {
    return {
      total: texts.length,
      hit: 0,
      newWarm: 0,
      failed: 0,
      charsBilled: 0,
      skippedReason: "mock_mode",
    };
  }

  const tts = getTTSProvider();
  if (!tts.prefetch) {
    return {
      total: texts.length,
      hit: 0,
      newWarm: 0,
      failed: 0,
      charsBilled: 0,
      skippedReason: "provider_unsupported",
    };
  }

  let hit = 0;
  let newWarm = 0;
  let failed = 0;
  let charsBilled = 0;

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    onProgress?.({
      total: texts.length,
      done: i,
      hit,
      newWarm,
      failed,
      current: text,
    });

    const beforeMiss = getCounters().ttsMiss;
    try {
      await tts.prefetch(text);
      const afterMiss = getCounters().ttsMiss;
      if (afterMiss > beforeMiss) {
        newWarm += 1;
        charsBilled += text.length;
      } else {
        hit += 1;
      }
    } catch {
      failed += 1;
    }

    if (i < texts.length - 1) {
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    }
  }

  onProgress?.({
    total: texts.length,
    done: texts.length,
    hit,
    newWarm,
    failed,
    current: null,
  });

  return {
    total: texts.length,
    hit,
    newWarm,
    failed,
    charsBilled,
    skippedReason: null,
  };
}
