"use client";

import { useEffect, useState } from "react";

import { getCharacterPose } from "@/lib/aiCache";
import type { Character, CharacterMood } from "@/types/character";

export type KkangchongSize = "sm" | "md" | "lg" | "xl";

type Props = {
  character: Character;
  isPlaying: boolean;
  mood?: CharacterMood;
  size?: KkangchongSize;
  onPress: () => void;
};

// 3-tier visual fallback (no more sprite coordinate guessing):
//   1. Per-mood PNG file at /assets/character/kkang_<mood>.png
//      → parent slices from the CI sheet via parent settings or
//        any image editor and drops the 6 files into public/assets/character/
//   2. IndexedDB blob written by the in-app slice tool (same effect,
//      but no GitHub upload needed)
//   3. CSS-drawn bunny silhouette (always available, never breaks)

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

function moodFileUrl(mood: CharacterMood): string {
  return `/assets/character/kkang_${mood}.png`;
}

export function KkangchongCharacter({
  character,
  isPlaying,
  mood,
  size = "lg",
  onPress,
}: Props) {
  const [tier, setTier] = useState<"file" | "indexeddb" | "css">("file");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const effectiveMood: CharacterMood = isPlaying
    ? "happy"
    : (mood ?? character.defaultMood);

  // Try IndexedDB blob when the file URL fails (404)
  useEffect(() => {
    let revoke: string | null = null;
    (async () => {
      if (tier !== "indexeddb") return;
      const blob = await getCharacterPose(effectiveMood);
      if (blob) {
        const url = URL.createObjectURL(blob);
        revoke = url;
        setBlobUrl(url);
      } else {
        setTier("css");
      }
    })();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [tier, effectiveMood]);

  // Reset tier when the mood changes so each pose gets a fresh chance.
  useEffect(() => {
    setTier("file");
    setBlobUrl(null);
  }, [effectiveMood]);

  const targetH = SIZE_PX[size];

  const animClass = BODY_ANIM[effectiveMood];

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={character.name}
      className={`relative flex items-end justify-center bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-kkang-pink/60 ${animClass}`}
      style={{
        width: targetH,
        height: targetH,
        transformOrigin: "50% 90%",
      }}
    >
      {tier === "file" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={moodFileUrl(effectiveMood)}
          alt=""
          aria-hidden
          className="h-full w-full object-contain"
          onError={() => setTier("indexeddb")}
        />
      ) : tier === "indexeddb" && blobUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blobUrl}
          alt=""
          aria-hidden
          className="h-full w-full object-contain"
          onError={() => setTier("css")}
        />
      ) : (
        <FallbackBunny mood={effectiveMood} character={character} />
      )}

      <span
        aria-hidden
        className={`pointer-events-none absolute right-2 top-2 text-3xl transition-opacity ${
          isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        🔊
      </span>
    </button>
  );
}

function FallbackBunny({
  mood,
  character,
}: {
  mood: CharacterMood;
  character: Character;
}) {
  const eyeShape = mood === "sleepy" ? "h-[6px]" : "h-6";
  const mouthOpen = mood === "happy" || mood === "jumping";
  return (
    <span className="relative inline-block" aria-hidden style={{ transform: "scale(2)", transformOrigin: "50% 90%" }}>
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
            <span className={`block w-6 ${eyeShape} rounded-full bg-kkang-ink transition-all`} />
            <span className={`block w-6 ${eyeShape} rounded-full bg-kkang-ink transition-all`} />
          </span>
        </span>
        <span className="absolute left-1/2 top-[58%] -translate-x-1/2 block h-3 w-5 rounded-full bg-kkang-ink" />
        <span
          className={`absolute left-1/2 top-[68%] -translate-x-1/2 block rounded-full border-2 border-kkang-ink transition-all ${
            mouthOpen ? "h-5 w-8 bg-kkang-pink/60" : "h-1 w-6 bg-transparent"
          }`}
        />
      </span>
    </span>
  );
}
