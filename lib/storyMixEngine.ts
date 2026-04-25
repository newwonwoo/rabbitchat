// Handoff §2.2: 27개월 연령은 반복을 좋아한다.
//   반복 40% / 선호 소재 변주 40% / 신규 20%.
// This engine picks the next story to suggest given the recent log.

import { stories } from "@/data/stories";
import type { Story } from "@/types/story";
import type { Turn } from "@/types/turn";

export type Bucket = "repeat" | "variation" | "new";

const REPEAT_PROB = 0.4;
const VARIATION_PROB = 0.4;

export function pickBucket(rng: () => number = Math.random): Bucket {
  const r = rng();
  if (r < REPEAT_PROB) return "repeat";
  if (r < REPEAT_PROB + VARIATION_PROB) return "variation";
  return "new";
}

function lastPlayedStoryId(turns: Turn[]): string | null {
  for (let i = turns.length - 1; i >= 0; i--) {
    const t = turns[i];
    if (t.event === "session_start" || t.event === "change_theme") {
      const m = t.detail.match(/theme=([^\s]+)/);
      if (m) return m[1];
    }
  }
  return null;
}

export type Suggestion = {
  bucket: Bucket;
  story: Story;
  reason: string;
};

export function suggestNextStory(
  turns: Turn[],
  available: Story[] = stories,
  rng: () => number = Math.random,
): Suggestion | null {
  if (available.length === 0) return null;
  const bucket = pickBucket(rng);
  const lastThemeId = lastPlayedStoryId(turns);
  const lastStory = lastThemeId
    ? available.find((s) => s.themeId === lastThemeId)
    : null;

  if (bucket === "repeat" && lastStory) {
    return { bucket, story: lastStory, reason: "repeat preferred" };
  }
  if (bucket === "variation" && lastStory) {
    const sameTheme = available.filter(
      (s) => s.themeId === lastStory.themeId && s.id !== lastStory.id,
    );
    if (sameTheme.length > 0) {
      const idx = Math.floor(rng() * sameTheme.length);
      return { bucket, story: sameTheme[idx], reason: "same-theme variation" };
    }
  }
  // new (or fallback when repeat/variation has no candidate)
  const others = lastStory
    ? available.filter((s) => s.id !== lastStory.id)
    : available;
  const pool = others.length > 0 ? others : available;
  const idx = Math.floor(rng() * pool.length);
  return { bucket: "new", story: pool[idx], reason: "fresh story" };
}
