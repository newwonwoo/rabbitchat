"use client";

import type { Choice } from "@/types/story";

type Props = {
  choice: Choice;
  onPress: (choiceId: string) => void;
};

// `choice.parentLabel` is intentionally NOT rendered in JSX children.
// It is only forwarded to aria-label so screen readers can describe it,
// but visible UI is emoji-only.
export function ChoiceImageButton({ choice, onPress }: Props) {
  return (
    <button
      type="button"
      onClick={() => onPress(choice.id)}
      aria-label={choice.parentLabel}
      className="flex h-32 w-32 select-none items-center justify-center rounded-3xl bg-kkang-cream text-6xl shadow-pop transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-kkang-pink/60"
    >
      <span aria-hidden>{choice.emoji}</span>
    </button>
  );
}
