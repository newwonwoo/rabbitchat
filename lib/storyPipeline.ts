// Walks a Story tree, collects every TTS-spoken line and every image
// label needing resolution, and pre-warms both. After this runs the
// child playback is API-call-free.

import { warmTTSPhrases } from "@/lib/cacheWarmer";
import {
  hashKey,
  getCachedImageUrl,
  putCachedImageUrl,
} from "@/lib/aiCache";
import type { Story } from "@/types/story";

// Same Korean → English mapping used by useSearchedImage. Re-imported
// here so server-less prewarm logic doesn't have to import a "use client"
// hook module.
const QUERY_HINTS: Record<string, string> = {
  블록: "wooden toy blocks kids",
  공: "soft children play ball",
  공놀이: "kids playing ball",
  책: "kids picture book",
  닭고기: "kids chicken meal",
  김치: "korean kimchi small bowl",
  국수: "korean kids noodle bowl",
  점심: "korean kindergarten lunch tray",
  친구: "kids friends playing",
  마트: "supermarket aisle bright",
  공원: "park path trees soft",
  어린이집: "kindergarten classroom korean",
  바나나: "yellow banana isolated",
  사과: "red apple isolated",
  딸기: "strawberry isolated white",
  배: "asian pear fruit",
  카트: "shopping cart small empty",
};

function toQuery(label: string): string {
  return QUERY_HINTS[label] ?? label;
}

async function prewarmImage(label: string, orientation: "square" | "landscape"): Promise<boolean> {
  if (!label) return false;
  const query = toQuery(label);
  const cacheKey = await hashKey(["img", "pexels", query, orientation]);
  const cached = await getCachedImageUrl(cacheKey);
  if (cached) return true;
  try {
    const res = await fetch("/api/image-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, orientation }),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { ok: boolean; found: boolean; url?: string };
    if (!json.ok || !json.found || !json.url) return false;
    await putCachedImageUrl(cacheKey, json.url);
    return true;
  } catch {
    return false;
  }
}

export type StoryWarmProgress = {
  phase: "tts" | "images" | "done";
  total: number;
  done: number;
  current?: string;
};

export type StoryWarmReport = {
  ttsTotal: number;
  ttsNew: number;
  ttsHit: number;
  ttsFailed: number;
  imgTotal: number;
  imgOk: number;
  imgFailed: number;
  charsBilled: number;
  skipped?: "mock_mode" | "provider_unsupported";
};

export function collectStoryLines(story: Story): string[] {
  const set = new Set<string>();
  for (const scene of story.scenes) {
    if (scene.spokenLine) set.add(scene.spokenLine);
    for (const choice of scene.choices) {
      if (choice.responseLine) set.add(choice.responseLine);
    }
  }
  return Array.from(set);
}

export function collectStoryImageLabels(story: Story): {
  square: string[];
  landscape: string[];
} {
  const square = new Set<string>();
  const landscape = new Set<string>();
  if (story.coverImageQuery) landscape.add(story.coverImageQuery);
  for (const scene of story.scenes) {
    if (scene.placeId) landscape.add(scene.placeId);
    if (scene.parentSummary) landscape.add(scene.parentSummary.split(/[\s,.\-—]+/)[0]);
    for (const c of scene.choices) {
      if (c.parentLabel) square.add(c.parentLabel);
    }
  }
  return {
    square: Array.from(square),
    landscape: Array.from(landscape),
  };
}

export async function warmStory(
  story: Story,
  onProgress?: (p: StoryWarmProgress) => void,
): Promise<StoryWarmReport> {
  const lines = collectStoryLines(story);
  const ttsReport = await warmTTSPhrases(lines, (tp) => {
    onProgress?.({
      phase: "tts",
      total: tp.total,
      done: tp.done,
      current: tp.current ?? undefined,
    });
  });

  const labels = collectStoryImageLabels(story);
  const imgList: { label: string; orientation: "square" | "landscape" }[] = [
    ...labels.square.map((l) => ({ label: l, orientation: "square" as const })),
    ...labels.landscape.map((l) => ({ label: l, orientation: "landscape" as const })),
  ];

  let imgOk = 0;
  let imgFailed = 0;
  for (let i = 0; i < imgList.length; i++) {
    const { label, orientation } = imgList[i];
    onProgress?.({
      phase: "images",
      total: imgList.length,
      done: i,
      current: label,
    });
    const ok = await prewarmImage(label, orientation);
    if (ok) imgOk += 1;
    else imgFailed += 1;
  }
  onProgress?.({ phase: "done", total: imgList.length, done: imgList.length });

  return {
    ttsTotal: ttsReport.total,
    ttsNew: ttsReport.newWarm,
    ttsHit: ttsReport.hit,
    ttsFailed: ttsReport.failed,
    charsBilled: ttsReport.charsBilled,
    imgTotal: imgList.length,
    imgOk,
    imgFailed,
    skipped: ttsReport.skippedReason ?? undefined,
  };
}
