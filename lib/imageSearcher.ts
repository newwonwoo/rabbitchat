"use client";

import { useEffect, useState } from "react";

import {
  getCachedImageUrl,
  hashKey,
  putCachedImageUrl,
} from "@/lib/aiCache";

// Label / placeId → English Pexels search query. Korean labels and
// snake_case scene placeIds get translated into landscape-friendly
// English so the returned image is actually relevant.
const QUERY_HINTS: Record<string, string> = {
  // --- play activities ---
  블록: "wooden toy blocks kids",
  "블록 놀이": "wooden toy blocks kids",
  공: "soft children play ball",
  공놀이: "kids playing ball",
  책: "kids picture book",
  "책 읽기": "child reading picture book",
  // --- food items ---
  닭고기: "kids chicken meal",
  김치: "korean kimchi small bowl",
  국수: "korean kids noodle bowl",
  반찬: "korean small side dish",
  점심: "korean kindergarten lunch tray",
  비빔밥: "korean bibimbap kids bowl",
  // --- friends / family ---
  친구: "kids friends playing",
  "다른 친구": "kids friend silhouette",
  시현: "korean toddler portrait",
  가족: "korean family warm portrait",
  // --- places (Korean labels) ---
  마트: "supermarket aisle bright",
  "과일 코너": "fruit aisle supermarket",
  계산대: "supermarket checkout",
  공원: "park path trees soft",
  어린이집: "kindergarten classroom korean",
  집: "cozy living room kids",
  침실: "cozy children bedroom warm",
  대모산: "mountain trail family hike",
  산: "soft mountain view kids",
  // --- places (placeId snake_case) ---
  kinder_intro: "korean kindergarten welcome",
  kinder: "kindergarten classroom playroom",
  kinder_lunch: "korean kindergarten lunch tray",
  mart_entrance: "supermarket entrance bright",
  fruit_aisle: "supermarket fruit aisle",
  checkout: "supermarket checkout small",
  park_path: "park path trees gentle",
  bedroom: "cozy children bedroom warm",
  home: "cozy korean apartment living room",
  auto_place: "warm children scene illustration",
  // --- fruit / drink ---
  바나나: "yellow banana isolated",
  사과: "red apple isolated",
  딸기: "strawberry isolated white",
  배: "asian pear fruit",
  우유: "milk carton kids",
  주스: "kids juice cup small",
  // --- hygiene routines ---
  목욕: "child bath warm cozy",
  양치: "child brushing teeth illustration",
  손씻기: "child washing hands soap",
  화장실: "child potty training cute",
  // --- emotion ---
  "웃는 얼굴": "smiling kid face",
  "졸린 얼굴": "sleepy child face",
  "놀란 얼굴": "surprised child face",
};

function toQuery(label: string): string {
  return QUERY_HINTS[label] ?? label;
}

export type SearchedImage = {
  url: string | null;
  loading: boolean;
  error: string | null;
};

// SSR-safe in-flight de-dup so concurrent calls don't double-fetch.
const inflight = new Map<string, Promise<string | null>>();

async function searchImageOnce(
  label: string,
  orientation: "square" | "landscape" | "portrait",
): Promise<string | null> {
  const query = toQuery(label);
  const cacheKey = await hashKey(["img", "pexels", query, orientation]);

  const cached = await getCachedImageUrl(cacheKey);
  if (cached) return cached;

  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey)!;
  }

  const job = (async () => {
    try {
      const res = await fetch("/api/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, orientation }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { ok: boolean; found: boolean; url?: string };
      if (!json.ok || !json.found || !json.url) return null;
      await putCachedImageUrl(cacheKey, json.url);
      return json.url;
    } catch {
      return null;
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, job);
  return job;
}

export function useSearchedImage(
  label: string | undefined,
  orientation: "square" | "landscape" | "portrait" = "square",
  enabled = true,
): SearchedImage {
  const [state, setState] = useState<SearchedImage>({
    url: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!enabled || !label) return;
    setState((s) => ({ ...s, loading: true }));
    searchImageOnce(label, orientation).then(
      (url) => {
        if (cancelled) return;
        setState({ url, loading: false, error: url ? null : "no result" });
      },
      (e) => {
        if (cancelled) return;
        setState({ url: null, loading: false, error: (e as Error).message });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [label, orientation, enabled]);

  return state;
}
