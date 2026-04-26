"use client";

import { useEffect, useState } from "react";

import {
  getCachedImageUrl,
  hashKey,
  putCachedImageUrl,
} from "@/lib/aiCache";

// Korean → English query hints. Pexels indexes English better. Mapping
// keeps quality high without hitting a translation API.
const QUERY_HINTS: Record<string, string> = {
  // play
  블록: "wooden toy blocks kids",
  "블록 놀이": "wooden toy blocks kids",
  공: "soft children play ball",
  공놀이: "kids playing ball",
  책: "kids picture book",
  "책 읽기": "child reading picture book",
  // food
  닭고기: "kids chicken meal",
  김치: "korean kimchi small bowl",
  국수: "korean kids noodle bowl",
  반찬: "korean small side dish",
  점심: "korean kindergarten lunch tray",
  // friends
  친구: "kids friends playing",
  "다른 친구": "kids friend silhouette",
  시현: "korean toddler portrait",
  // places
  마트: "supermarket aisle bright",
  "과일 코너": "fruit aisle supermarket",
  계산대: "supermarket checkout",
  공원: "park path trees soft",
  어린이집: "kindergarten classroom korean",
  집: "cozy living room kids",
  // fruit
  바나나: "yellow banana isolated",
  사과: "red apple isolated",
  딸기: "strawberry isolated white",
  배: "asian pear fruit",
  우유: "milk carton kids",
  // emotion
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
