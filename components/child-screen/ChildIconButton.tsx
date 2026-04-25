"use client";

type Props = {
  emoji: string;
  ariaLabel: string;
  onPress: () => void;
};

// Pure icon button. JSX children are emoji only; semantic meaning is on aria-label.
export function ChildIconButton({ emoji, ariaLabel, onPress }: Props) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={ariaLabel}
      className="flex h-24 w-24 select-none items-center justify-center rounded-full bg-kkang-cream text-5xl shadow-pop transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-kkang-pink/60"
    >
      <span aria-hidden>{emoji}</span>
    </button>
  );
}
