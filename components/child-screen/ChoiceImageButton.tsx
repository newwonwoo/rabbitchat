"use client";

import { useEffect, useState } from "react";

import { useSearchedImage } from "@/lib/imageSearcher";
import type { VisualAsset } from "@/types/asset";
import type { Choice } from "@/types/story";

type Props = {
  choice: Choice;
  asset?: VisualAsset;
  onPress: (choiceId: string) => void;
};

// `choice.parentLabel` is intentionally NOT rendered as visible text.
// It only feeds aria-label and the image-search query.
//
// Visual fallback chain (addendum §4.1 — emoji is the LAST resort):
//   1. Local PNG at asset.imageUrl (e.g. /assets/obj_blocks.png)
//   2. Pexels-searched image keyed by asset.label / parentLabel
//   3. Emoji from asset.emojiFallback / choice.emoji
export function ChoiceImageButton({ choice, asset, onPress }: Props) {
  const localUrl = asset?.imageUrl;
  const queryLabel = asset?.label ?? choice.parentLabel;
  const { url: searchedUrl } = useSearchedImage(queryLabel, "square");

  type Tier = "local" | "searched" | "emoji";
  const [tier, setTier] = useState<Tier>(localUrl ? "local" : "searched");

  // If we started in 'searched' but it later resolves to null, drop to emoji.
  useEffect(() => {
    if (tier === "searched" && searchedUrl === null) {
      setTier("emoji");
    }
  }, [tier, searchedUrl]);

  const currentSrc =
    tier === "local"
      ? localUrl
      : tier === "searched"
        ? searchedUrl ?? undefined
        : undefined;

  const handleError = () => {
    if (tier === "local") {
      // Either local missing or 404 — try searched if available, else emoji
      setTier(searchedUrl ? "searched" : "emoji");
    } else if (tier === "searched") {
      setTier("emoji");
    }
  };

  return (
    <button
      type="button"
      onClick={() => onPress(choice.id)}
      aria-label={choice.parentLabel}
      className="flex h-32 w-32 select-none items-center justify-center overflow-hidden rounded-3xl bg-kkang-cream text-6xl shadow-pop transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-kkang-pink/60"
    >
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
        <span aria-hidden className="flex h-full w-full items-center justify-center">
          {asset?.emojiFallback ?? choice.emoji}
        </span>
      )}
    </button>
  );
}
