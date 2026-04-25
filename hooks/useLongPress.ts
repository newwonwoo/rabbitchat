"use client";

import { useCallback, useRef } from "react";

export type UseLongPressOptions = {
  onLongPress: () => void;
  durationMs?: number;
};

export type UseLongPressBindings = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
};

export function useLongPress({
  onLongPress,
  durationMs = 3000,
}: UseLongPressOptions): UseLongPressBindings {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onLongPress();
    }, durationMs);
  }, [clear, onLongPress, durationMs]);

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}
