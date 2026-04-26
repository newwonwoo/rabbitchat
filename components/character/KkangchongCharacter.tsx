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

// Resolution chain — no exact filename required:
//   1. /api/character-pose?mood=<m>  → fuzzy-matches whatever PNG the
//      parent uploaded (kkang_happy.png, 행복.png, kkangchong_smile_v2.png ...)
//   2. IndexedDB blob written by the in-app slice tool
//   3. Hard-coded /assets/character/kkang_<mood>.png (legacy strict path)
//   4. CSS-drawn bunny silhouette (always works)

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

// In-process per-mood URL cache so we don't re-hit the API every render.
const apiUrlCache = new Map<CharacterMood, string | null>();

async function fetchPoseUrl(mood: CharacterMood): Promise<string | null> {
  if (apiUrlCache.has(mood)) return apiUrlCache.get(mood)!;
  try {
    const res = await fetch(
      `/api/character-pose?mood=${encodeURIComponent(mood)}`,
    );
    if (!res.ok) {
      apiUrlCache.set(mood, null);
      return null;
    }
    const json = (await res.json()) as { ok: boolean; url: string | null };
    const url = json.url ?? null;
    apiUrlCache.set(mood, url);
    return url;
  } catch {
    apiUrlCache.set(mood, null);
    return null;
  }
}

export function KkangchongCharacter({
  character,
  isPlaying,
  mood,
  size = "lg",
  onPress,
}: Props) {
  type Tier = "api" | "indexeddb" | "strict" | "css";
  const [tier, setTier] = useState<Tier>("api");
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const effectiveMood: CharacterMood = isPlaying
    ? "happy"
    : (mood ?? character.defaultMood);

  // Reset tier when mood changes — try the chain again per pose
  useEffect(() => {
    setTier("api");
    setApiUrl(null);
    setBlobUrl(null);
  }, [effectiveMood]);

  // Tier 1: API lookup
  useEffect(() => {
    if (tier !== "api") return;
    let cancelled = false;
    fetchPoseUrl(effectiveMood).then((url) => {
      if (cancelled) return;
      if (url) {
        setApiUrl(url);
      } else {
        setTier("indexeddb");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tier, effectiveMood]);

  // Tier 2: IndexedDB blob
  useEffect(() => {
    let revoke: string | null = null;
    if (tier !== "indexeddb") return;
    (async () => {
      const blob = await getCharacterPose(effectiveMood);
      if (blob) {
        const url = URL.createObjectURL(blob);
        revoke = url;
        setBlobUrl(url);
      } else {
        setTier("strict");
      }
    })();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [tier, effectiveMood]);

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
      {tier === "api" && apiUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={apiUrl}
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
          onError={() => setTier("strict")}
        />
      ) : tier === "strict" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/assets/character/kkang_${effectiveMood}.png`}
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
    <span
      className="relative inline-block"
      aria-hidden
      style={{ transform: "scale(2)", transformOrigin: "50% 90%" }}
    >
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
            <span
              className={`block w-6 ${eyeShape} rounded-full bg-kkang-ink transition-all`}
            />
            <span
              className={`block w-6 ${eyeShape} rounded-full bg-kkang-ink transition-all`}
            />
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
