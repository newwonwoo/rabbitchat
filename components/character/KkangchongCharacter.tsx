"use client";

import { useState } from "react";

import { CHARACTER_SHEET } from "@/lib/ciSheet";
import type { Character, CharacterMood } from "@/types/character";

export type KkangchongSize = "sm" | "md" | "lg" | "xl";

type Props = {
  character: Character;
  isPlaying: boolean;
  mood?: CharacterMood;
  size?: KkangchongSize;
  onPress: () => void;
};

// Renders 깡총이 from the parent-uploaded CI sheet via CSS sprite.
// File expected at: public/assets/ci/character-sheet.png
//
// When the sheet is missing (404), `onError` flips to the legacy
// CSS-only silhouette so the app keeps working.
//
// Mood mapping: see lib/ciSheet.ts CHARACTER_SHEET.frames.

const SIZE_PX: Record<KkangchongSize, number> = {
  sm: 240,
  md: 360,
  lg: 540,
  xl: 720,
};

const BODY_ANIM: Record<CharacterMood, string> = {
  happy: "animate-voice-pulse",
  jumping: "animate-soft-land",
  sleepy: "",
  thinking: "animate-body-wobble [animation-duration:2.4s]",
  waving: "animate-body-wobble [animation-duration:1s]",
  listening: "animate-body-wobble",
};

export function KkangchongCharacter({
  character,
  isPlaying,
  mood,
  size = "lg",
  onPress,
}: Props) {
  const [sheetOk, setSheetOk] = useState(true);

  const effectiveMood: CharacterMood = isPlaying
    ? "happy"
    : (mood ?? character.defaultMood);

  const targetH = SIZE_PX[size];
  const frame =
    CHARACTER_SHEET.frames[effectiveMood as keyof typeof CHARACTER_SHEET.frames];
  const scale = targetH / frame.h;
  const renderedW = frame.w * scale;
  const sheetScaledW = CHARACTER_SHEET.intrinsicW * scale;
  const sheetScaledH = CHARACTER_SHEET.intrinsicH * scale;
  const bgX = -frame.x * scale;
  const bgY = -frame.y * scale;

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={character.name}
      className={`relative inline-flex items-end justify-center bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-kkang-pink/60 ${BODY_ANIM[effectiveMood]}`}
      style={{
        width: renderedW,
        height: targetH,
        transformOrigin: "50% 90%",
      }}
    >
      {sheetOk ? (
        // CSS sprite — single network request for the whole sheet, but
        // each render only shows the framed pose.
        <span
          aria-hidden
          className="block rounded-3xl"
          style={{
            width: renderedW,
            height: targetH,
            backgroundImage: `url(${CHARACTER_SHEET.src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${sheetScaledW}px ${sheetScaledH}px`,
            backgroundPosition: `${bgX}px ${bgY}px`,
            filter: effectiveMood === "sleepy" ? "saturate(0.85)" : "none",
          }}
        />
      ) : (
        <FallbackBunny mood={effectiveMood} character={character} />
      )}

      {/* Hidden probe — triggers onError if the sheet 404s, then flips to
          fallback. Cheap because browsers cache the 404 response. */}
      <img
        src={CHARACTER_SHEET.src}
        alt=""
        aria-hidden
        className="hidden"
        onError={() => setSheetOk(false)}
      />

      <span
        aria-hidden
        className={`pointer-events-none absolute right-1 top-1 text-2xl transition-opacity ${
          isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        🔊
      </span>
    </button>
  );
}

// --- Legacy CSS silhouette (fallback when CI sheet not yet uploaded) ------

function FallbackBunny({
  mood,
  character,
}: {
  mood: CharacterMood;
  character: Character;
}) {
  const eyeShape = mood === "sleepy" ? "h-[3px]" : "h-3";
  const mouthOpen = mood === "happy" || mood === "jumping";
  return (
    <span className="relative inline-block" aria-hidden>
      <span
        className="absolute -top-12 left-3 h-16 w-5 rounded-full shadow-soft"
        style={{
          backgroundColor: character.bodyColor,
          borderTop: `12px solid ${character.earColor}`,
        }}
      />
      <span
        className="absolute -top-12 right-3 h-16 w-5 rounded-full shadow-soft"
        style={{
          backgroundColor: character.bodyColor,
          borderTop: `12px solid ${character.earColor}`,
        }}
      />
      <span
        className="relative inline-flex h-32 w-28 items-center justify-center rounded-[48%] shadow-pop"
        style={{ backgroundColor: character.bodyColor }}
      >
        <span className="absolute inset-x-0 top-7 flex justify-center">
          <span className="flex w-20 items-center justify-between">
            <span className={`block w-3 ${eyeShape} rounded-full bg-kkang-ink transition-all`} />
            <span className={`block w-3 ${eyeShape} rounded-full bg-kkang-ink transition-all`} />
          </span>
        </span>
        <span className="absolute left-1/2 top-[58%] -translate-x-1/2 block h-2 w-3 rounded-full bg-kkang-ink" />
        <span
          className={`absolute left-1/2 top-[68%] -translate-x-1/2 block rounded-full border-2 border-kkang-ink transition-all ${
            mouthOpen ? "h-3 w-5 bg-kkang-pink/60" : "h-[3px] w-4 bg-transparent"
          }`}
        />
      </span>
    </span>
  );
}
