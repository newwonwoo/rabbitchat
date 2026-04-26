"use client";

import { useEffect, useState } from "react";

import { useSearchedImage } from "@/lib/imageSearcher";
import type { VisualAsset } from "@/types/asset";
import type { Choice } from "@/types/story";

type Props = {
  choice: Choice;
  asset?: VisualAsset;
  onPress: (choiceId: string) => void;
  variant?: "card" | "banner";
};

// In-process per-label cache to avoid re-hitting /api/character
// every render.
const labelCache = new Map<string, string | null>();

async function findInCharacterFolder(label: string): Promise<string | null> {
  if (!label) return null;
  if (labelCache.has(label)) return labelCache.get(label)!;
  try {
    const res = await fetch(
      `/api/character?label=${encodeURIComponent(label)}`,
    );
    if (!res.ok) {
      labelCache.set(label, null);
      return null;
    }
    const json = (await res.json()) as { ok: boolean; url: string | null };
    const url = json.url ?? null;
    labelCache.set(label, url);
    return url;
  } catch {
    labelCache.set(label, null);
    return null;
  }
}

// Visual fallback chain (addendum §4.1 — emoji is the LAST resort):
//   1. Local PNG at asset.imageUrl
//   2. /api/character?label=<parentLabel>  — fuzzy match in
//      public/assets/character/ (where the parent drops everything)
//   3. Pexels-searched image (license-safe auto fetch)
//   4. Emoji
//
// Parent override: parentLabel is also rendered as a small caption.
export function ChoiceImageButton({ choice, asset, onPress, variant = "card" }: Props) {
  const localUrl = asset?.imageUrl;
  const queryLabel = asset?.label ?? choice.parentLabel;

  // Local PNG (data/assets.ts) tier
  type Tier = "local" | "character" | "searched" | "emoji";
  const [tier, setTier] = useState<Tier>(localUrl ? "local" : "character");
  const [characterUrl, setCharacterUrl] = useState<string | null>(null);

  // Tier 2: parent-uploaded folder
  useEffect(() => {
    if (tier !== "character") return;
    let cancelled = false;
    findInCharacterFolder(queryLabel).then((url) => {
      if (cancelled) return;
      if (url) {
        setCharacterUrl(url);
      } else {
        setTier("searched");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tier, queryLabel]);

  // Tier 3: Pexels (only enabled when we've fallen through to it)
  const { url: searchedUrl } = useSearchedImage(
    queryLabel,
    "square",
    tier === "searched",
  );

  useEffect(() => {
    if (tier === "searched" && searchedUrl === null) {
      setTier("emoji");
    }
  }, [tier, searchedUrl]);

  const currentSrc =
    tier === "local"
      ? localUrl
      : tier === "character"
        ? characterUrl ?? undefined
        : tier === "searched"
          ? searchedUrl ?? undefined
          : undefined;

  const handleError = () => {
    if (tier === "local") setTier("character");
    else if (tier === "character") setTier("searched");
    else if (tier === "searched") setTier("emoji");
  };

  if (variant === "banner") {
    return (
      <button
        type="button"
        onClick={() => onPress(choice.id)}
        aria-label={choice.parentLabel}
        className="group flex w-full items-center gap-5 rounded-[28px] bg-white p-4 shadow-card transition-transform active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-kkang-pink/60"
      >
        <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-kkang-cream text-7xl">
          {currentSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentSrc}
              alt=""
              aria-hidden
              className="h-full w-full object-cover"
              onError={handleError}
            />
          ) : (
            <span aria-hidden>{asset?.emojiFallback ?? choice.emoji}</span>
          )}
        </div>
        <div className="flex flex-1 items-center justify-between gap-3">
          <span className="text-2xl font-bold text-kkang-ink">
            {choice.parentLabel}
          </span>
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-kkang-pink text-xl shadow-pop transition-transform group-active:scale-90"
          >
            ▶️
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPress(choice.id)}
      aria-label={choice.parentLabel}
      className="flex w-44 flex-col items-center gap-2 rounded-3xl bg-kkang-cream p-3 shadow-pop transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-kkang-pink/60"
    >
      <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl bg-white text-7xl">
        {currentSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentSrc}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            onError={handleError}
          />
        ) : (
          <span aria-hidden>{asset?.emojiFallback ?? choice.emoji}</span>
        )}
      </div>
      <span className="text-base font-semibold text-kkang-ink">
        {choice.parentLabel}
      </span>
    </button>
  );
}
