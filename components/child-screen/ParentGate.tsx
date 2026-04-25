"use client";

import { useLongPress } from "@/hooks/useLongPress";

type Props = {
  onUnlock: () => void;
  durationMs?: number;
};

// 3-second long-press gate. Visible UI is the lock icon only.
export function ParentGate({ onUnlock, durationMs = 3000 }: Props) {
  const bindings = useLongPress({ onLongPress: onUnlock, durationMs });

  return (
    <button
      type="button"
      aria-label="parent-gate"
      {...bindings}
      className="flex h-12 w-12 select-none items-center justify-center rounded-full bg-kkang-beige/70 text-2xl shadow-soft active:scale-95"
    >
      <span aria-hidden>🔒</span>
    </button>
  );
}
