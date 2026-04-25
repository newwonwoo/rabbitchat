"use client";

import type { Character, CharacterMood } from "@/types/character";

export type KkangchongSize = "sm" | "md" | "lg" | "xl";

type Props = {
  character: Character;
  isPlaying: boolean;
  mood?: CharacterMood;
  size?: KkangchongSize;
  onPress: () => void;
};

// CSS-rendered bunny placeholder aligned with the 깡총이 CI sheet.
//
// CI mapping (handoff §10.4 leaves PNG/Lottie for later — swap is a 1-file
// change, the prop surface stays stable):
//   listening → idle (default)        — soft body wobble + ear bounce
//   happy     → audio playing         — voice-pulse + open mouth + bright cheeks
//   waving    → fresh greeting        — body wobble + raised right ear
//   thinking  → long-press / waiting  — slow body wobble + tilted ear
//   jumping   → scene transition      — soft-land
//   sleepy    → reserved (idle 30s+)  — closed eyes + slowed motion
//
// `mood` overrides the default; `isPlaying` always takes the highest priority
// because it represents an external lifecycle (mock voice).
//
// Size guide tracks the CI sheet (32cm / 24cm / 16cm / 10cm reference plush).

const SIZE_TO_TAILWIND: Record<KkangchongSize, { wrapper: string; body: string; ear: string; ears: { l: string; r: string } }> = {
  sm: {
    wrapper: "h-32 w-24",
    body: "h-24 w-20",
    ear: "h-12 w-4",
    ears: {
      l: "-top-10 left-2",
      r: "-top-10 right-2",
    },
  },
  md: {
    wrapper: "h-44 w-36",
    body: "h-32 w-28",
    ear: "h-16 w-5",
    ears: {
      l: "-top-12 left-3",
      r: "-top-12 right-3",
    },
  },
  lg: {
    wrapper: "h-56 w-44",
    body: "h-40 w-32",
    ear: "h-20 w-6",
    ears: {
      l: "-top-16 left-3",
      r: "-top-16 right-3",
    },
  },
  xl: {
    wrapper: "h-72 w-56",
    body: "h-52 w-44",
    ear: "h-24 w-8",
    ears: {
      l: "-top-20 left-4",
      r: "-top-20 right-4",
    },
  },
};

export function KkangchongCharacter({
  character,
  isPlaying,
  mood,
  size = "lg",
  onPress,
}: Props) {
  const effectiveMood: CharacterMood = isPlaying
    ? "happy"
    : (mood ?? character.defaultMood);

  const bodyAnim =
    effectiveMood === "happy"
      ? "animate-voice-pulse"
      : effectiveMood === "jumping"
        ? "animate-soft-land"
        : effectiveMood === "sleepy"
          ? ""
          : effectiveMood === "thinking"
            ? "animate-body-wobble [animation-duration:2.4s]"
            : "animate-body-wobble";

  const earLeftAnim =
    effectiveMood === "sleepy"
      ? ""
      : effectiveMood === "thinking"
        ? "animate-ear-bounce [animation-duration:3s]"
        : "animate-ear-bounce";

  const earRightAnim =
    effectiveMood === "sleepy"
      ? ""
      : effectiveMood === "waving"
        ? "animate-ear-bounce-r [animation-duration:0.8s]"
        : effectiveMood === "thinking"
          ? "animate-ear-bounce-r [animation-duration:3s]"
          : "animate-ear-bounce-r";

  const eyeShape = effectiveMood === "sleepy" ? "h-[3px]" : "h-3";
  const mouthOpen = effectiveMood === "happy" || effectiveMood === "jumping";
  const cheekIntense = effectiveMood === "happy" || effectiveMood === "waving";

  const dim = SIZE_TO_TAILWIND[size];

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={character.name}
      className={`relative flex select-none items-end justify-center bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-kkang-pink/60 ${dim.wrapper}`}
    >
      <span
        className={`relative inline-block ${bodyAnim}`}
        style={{ transformOrigin: "50% 90%" }}
      >
        {/* Ears */}
        <span
          aria-hidden
          className={`${earLeftAnim} absolute ${dim.ears.l} ${dim.ear} rounded-full shadow-soft`}
          style={{
            backgroundColor: character.bodyColor,
            borderTop: `12px solid ${character.earColor}`,
            transformOrigin: "50% 95%",
          }}
        />
        <span
          aria-hidden
          className={`${earRightAnim} absolute ${dim.ears.r} ${dim.ear} rounded-full shadow-soft`}
          style={{
            backgroundColor: character.bodyColor,
            borderTop: `12px solid ${character.earColor}`,
            transformOrigin: "50% 95%",
          }}
        />

        {/* Body */}
        <span
          aria-hidden
          className={`relative inline-flex items-center justify-center rounded-[48%] shadow-pop ${dim.body}`}
          style={{ backgroundColor: character.bodyColor }}
        >
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

          <span
            aria-hidden
            className={`absolute left-3 top-[55%] block h-3 w-4 rounded-full ${
              cheekIntense ? "bg-kkang-pink" : "bg-kkang-pink/70"
            }`}
          />
          <span
            aria-hidden
            className={`absolute right-3 top-[55%] block h-3 w-4 rounded-full ${
              cheekIntense ? "bg-kkang-pink" : "bg-kkang-pink/70"
            }`}
          />

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

          {/* Sleepy "Z" */}
          {effectiveMood === "sleepy" ? (
            <span
              aria-hidden
              className="absolute -right-1 top-1 text-xl text-kkang-ink/50"
            >
              z
            </span>
          ) : null}
        </span>
      </span>

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
