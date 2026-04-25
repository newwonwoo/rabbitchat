"use client";

import type { VisualAsset } from "@/types/asset";
import type { Choice } from "@/types/story";

type Props = {
  choice: Choice;
  asset?: VisualAsset;
  onPress: (choiceId: string) => void;
};

// `choice.parentLabel` is intentionally NOT rendered as visible text.
// It is only forwarded to aria-label so screen readers describe it.
// When an `asset` is provided (Addendum v1.1 §4), render the big image;
// otherwise emoji fallback.
export function ChoiceImageButton({ choice, asset, onPress }: Props) {
  const hasImage = asset && asset.imageUrl;
  return (
    <button
      type="button"
      onClick={() => onPress(choice.id)}
      aria-label={choice.parentLabel}
      className="flex h-32 w-32 select-none items-center justify-center overflow-hidden rounded-3xl bg-kkang-cream text-6xl shadow-pop transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-kkang-pink/60"
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.imageUrl}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          onError={(e) => {
            // PNG missing → swap to emoji fallback
            const t = e.currentTarget;
            t.style.display = "none";
            const span = t.parentElement?.querySelector(
              "[data-emoji-fallback]",
            ) as HTMLElement | null;
            if (span) span.style.display = "flex";
          }}
        />
      ) : null}
      <span
        aria-hidden
        data-emoji-fallback
        className={`flex h-full w-full items-center justify-center ${
          hasImage ? "hidden" : ""
        }`}
      >
        {asset?.emojiFallback ?? choice.emoji}
      </span>
    </button>
  );
}
