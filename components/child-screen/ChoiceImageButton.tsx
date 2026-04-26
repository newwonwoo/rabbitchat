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

// Visual fallback chain (addendum §4.1 — emoji is the LAST resort):
//   1. Local PNG at asset.imageUrl (e.g. /assets/obj_blocks.png)
//   2. Pexels-searched image keyed by asset.label / parentLabel
//   3. Emoji from asset.emojiFallback / choice.emoji
//
// Parent override: parentLabel is shown as a small caption under the
// image. This visibly violates harness §6.2 (no Korean on child screen)
// but is enabled at the parent's explicit request — kept short and
// deliberately small so it's hint-level not narrative.
export function ChoiceImageButton({ choice, asset, onPress }: Props) {
  const localUrl = asset?.imageUrl;
  const queryLabel = asset?.label ?? choice.parentLabel;
  const { url: searchedUrl } = useSearchedImage(queryLabel, "square");

  type Tier = "local" | "searched" | "emoji";
  const [tier, setTier] = useState<Tier>(localUrl ? "local" : "searched");

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
