"use client";

import type { Character, CharacterMood } from "@/types/character";

type Props = {
  character: Character;
  isPlaying: boolean;
  mood?: CharacterMood;
  onPress: () => void;
};

// CSS-rendered bunny placeholder aligned with the 깡총이 CI sheet.
// Real PNG/Lottie asset is intentionally deferred (P2).
//
// Mood mapping (CI sheet → UI state):
//   listening → idle (default)
//   happy     → audio playing
//   waving    → fresh press
//   thinking  → long-press in progress
//   jumping   → scene transition
//   sleepy    → reserved
//
// The visible state here is driven by `isPlaying` (mock voice) and an optional
// `mood` override; everything else stays as the default listening pose.

export function KkangchongCharacter({ character, isPlaying, mood, onPress }: Props) {
  const effectiveMood: CharacterMood = isPlaying ? "happy" : (mood ?? character.defaultMood);

  const bodyAnim =
    effectiveMood === "happy"
      ? "animate-voice-pulse"
      : effectiveMood === "jumping"
        ? "animate-soft-land"
        : "animate-body-wobble";

  const eyeShape = effectiveMood === "sleepy" ? "h-[3px]" : "h-3";
  const mouthOpen = effectiveMood === "happy" || effectiveMood === "jumping";

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={character.name}
      className="relative flex h-56 w-44 select-none items-end justify-center bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-kkang-pink/60"
    >
      <span
        className={`relative inline-block ${bodyAnim}`}
        style={{ transformOrigin: "50% 90%" }}
      >
        {/* Ears */}
        <span
          aria-hidden
          className="animate-ear-bounce absolute -top-16 left-3 h-20 w-6 rounded-full shadow-soft"
          style={{
            backgroundColor: character.bodyColor,
            borderTop: `12px solid ${character.earColor}`,
            transformOrigin: "50% 95%",
          }}
        />
        <span
          aria-hidden
          className="animate-ear-bounce-r absolute -top-16 right-3 h-20 w-6 rounded-full shadow-soft"
          style={{
            backgroundColor: character.bodyColor,
            borderTop: `12px solid ${character.earColor}`,
            transformOrigin: "50% 95%",
          }}
        />

        {/* Body */}
        <span
          aria-hidden
          className="relative inline-flex h-40 w-32 items-center justify-center rounded-[48%] shadow-pop"
          style={{ backgroundColor: character.bodyColor }}
        >
          {/* Face */}
          <span aria-hidden className="absolute inset-x-0 top-7 flex justify-center">
            <span className="flex w-20 items-center justify-between">
              <span
                className={`block w-3 ${eyeShape} rounded-full bg-kkang-ink transition-all`}
              />
              <span
                className={`block w-3 ${eyeShape} rounded-full bg-kkang-ink transition-all`}
              />
            </span>
          </span>
          <span
            aria-hidden
            className="absolute left-1/2 top-[58%] -translate-x-1/2 block h-2 w-3 rounded-full bg-kkang-ink"
          />
          <span
            aria-hidden
            className={`absolute left-1/2 top-[68%] -translate-x-1/2 block rounded-full border-2 border-kkang-ink transition-all ${
              mouthOpen ? "h-3 w-5 bg-kkang-pink/60" : "h-[3px] w-4 bg-transparent"
            }`}
          />

          {/* Cheek blush */}
          <span
            aria-hidden
            className="absolute left-3 top-[55%] block h-3 w-4 rounded-full bg-kkang-pink/70"
          />
          <span
            aria-hidden
            className="absolute right-3 top-[55%] block h-3 w-4 rounded-full bg-kkang-pink/70"
          />

          {/* Feet */}
          <span
            aria-hidden
            className="absolute -bottom-3 left-3 block h-5 w-9 rounded-full shadow-soft"
            style={{ backgroundColor: character.earColor }}
          />
          <span
            aria-hidden
            className="absolute -bottom-3 right-3 block h-5 w-9 rounded-full shadow-soft"
            style={{ backgroundColor: character.earColor }}
          />
        </span>
      </span>

      {/* Voice indicator (icon only, no text) */}
      <span
        aria-hidden
        className={`pointer-events-none absolute right-2 top-2 text-2xl transition-opacity ${
          isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        🔊
      </span>
    </button>
  );
}
