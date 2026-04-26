"use client";

import { useEffect, useState } from "react";

import { ChoiceImageButton } from "@/components/child-screen/ChoiceImageButton";
import { ParentGate } from "@/components/child-screen/ParentGate";
import { KkangchongCharacter } from "@/components/character/KkangchongCharacter";
import { FOOD_SHEET, type CISpriteFrame } from "@/lib/ciSheet";
import { useSearchedImage } from "@/lib/imageSearcher";
import type { VisualAsset } from "@/types/asset";
import type { Character, CharacterMood } from "@/types/character";
import type { Scene } from "@/types/story";

type Props = {
  character: Character;
  scene: Scene;
  isAudioPlaying: boolean;
  // Addendum v1.1 §4 — optional big image rendering.
  backgroundAsset?: VisualAsset;
  choiceAssets?: Record<string, VisualAsset>;
  onCharacterPress: () => void;
  onChoice: (choiceId: string) => void;
  onParentEnter: () => void;
};

const SLEEPY_AFTER_MS = 30_000;

const FOOD_GLYPHS = new Set(["🍌", "🍎", "🍓", "🥖", "🍐"]);

// Map an emoji choice to a 4-frame food sequence in the CI food sheet:
//   phase 1 (hold) → phase 2 (bite) → phase 3 (chew/expr) → phase 4 (happy/expr)
const FOOD_SEQUENCE: Record<string, [string, string, string, string]> = {
  "🍎": ["apple_hold", "apple_bite", "expr_chew", "expr_happy"],
  "🍌": ["banana_hold", "banana_bite", "expr_chew", "expr_happy"],
  "🍓": ["strawberry_hold", "strawberry_bite", "expr_chew", "expr_happy"],
  "🍐": ["pear_eat", "pear_eat", "expr_chew", "expr_happy"],
  "🥖": ["meal_bite", "meal_chew", "meal_swallow", "meal_done"],
};

export function ChildStoryScreen({
  character,
  scene,
  isAudioPlaying,
  backgroundAsset,
  choiceAssets,
  onCharacterPress,
  onChoice,
  onParentEnter,
}: Props) {
  const visualGlyphs = Array.from(scene.visual);
  const [transitionMood, setTransitionMood] = useState<CharacterMood | null>(
    null,
  );
  const [foodGlyph, setFoodGlyph] = useState<string | null>(null);
  const [foodPhase, setFoodPhase] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    setTransitionMood("waving");
    const t = setTimeout(() => setTransitionMood(null), 1200);
    return () => clearTimeout(t);
  }, [scene.id]);

  // Pre-recorded scene voice (parent's own mp3) — handoff §1.2.
  // Plays directly via HTML5 Audio, skips TTS entirely. If the file
  // is missing or autoplay is blocked we just stay silent.
  useEffect(() => {
    if (!scene.audioFile) return;
    if (typeof window === "undefined") return;
    const audio = new Audio(scene.audioFile);
    audio.volume = 1.0;
    void audio.play().catch(() => {
      // file missing / autoplay blocked — silent
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [scene.audioFile]);

  useEffect(() => {
    if (isAudioPlaying || transitionMood) return;
    const t = setTimeout(() => setTransitionMood("sleepy"), SLEEPY_AFTER_MS);
    return () => clearTimeout(t);
  }, [scene.id, isAudioPlaying, transitionMood]);

  const handleChoice = (choiceId: string) => {
    const choice = scene.choices.find((c) => c.id === choiceId);
    const glyph = choice?.emoji ?? "";
    if (FOOD_GLYPHS.has(glyph)) {
      setFoodGlyph(glyph);
      setFoodPhase(1);
      setTimeout(() => setFoodPhase(2), 500);
      setTimeout(() => setFoodPhase(3), 1100);
      setTimeout(() => {
        setFoodGlyph(null);
        setFoodPhase(0);
        onChoice(choiceId);
      }, 1700);
      setTransitionMood("happy");
    } else {
      setTransitionMood("jumping");
      setTimeout(() => onChoice(choiceId), 600);
    }
  };

  const isFoodSequence = foodGlyph !== null;
  const characterMood: CharacterMood | undefined = transitionMood ?? undefined;

  // Cap on-screen choices to 3 (handoff §3.3 — 화면엔 2개 중심, 최대 3개)
  const visibleChoices = scene.choices.slice(0, 3);

  // Background fallback chain: local PNG → Pexels-searched → null (emoji visual row).
  const { url: searchedBg } = useSearchedImage(
    backgroundAsset?.label,
    "landscape",
    !backgroundAsset?.imageUrl,
  );
  const [bgTier, setBgTier] = useState<"local" | "searched" | "none">(
    backgroundAsset?.imageUrl ? "local" : "searched",
  );

  useEffect(() => {
    setBgTier(backgroundAsset?.imageUrl ? "local" : "searched");
  }, [backgroundAsset?.imageUrl]);

  useEffect(() => {
    if (bgTier === "searched" && searchedBg === null) setBgTier("none");
  }, [bgTier, searchedBg]);

  const bgSrc =
    bgTier === "local"
      ? backgroundAsset?.imageUrl
      : bgTier === "searched"
        ? searchedBg ?? undefined
        : undefined;
  const showBigBg = !!bgSrc;

  return (
    <main
      aria-label="child-story"
      className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-kkang-ivory via-kkang-cream to-kkang-beige px-6 pb-10 pt-6"
    >
      {showBigBg && bgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgSrc}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
          onError={() => {
            if (bgTier === "local") {
              setBgTier(searchedBg ? "searched" : "none");
            } else {
              setBgTier("none");
            }
          }}
        />
      ) : null}

      <div className="absolute right-4 top-4 z-10">
        <ParentGate onUnlock={onParentEnter} />
      </div>

      <div
        aria-label="scene-visual"
        className="z-10 mt-10 flex flex-wrap items-center justify-center gap-3 text-7xl"
      >
        {isFoodSequence ? (
          <FoodSpriteFrame glyph={foodGlyph!} phase={foodPhase} />
        ) : (
          // When a backgroundAsset is rendered we skip the emoji visual to
          // avoid double-rendering the place; otherwise emoji glyph row.
          !showBigBg &&
          visualGlyphs.map((g, i) => (
            <span key={`${scene.id}-glyph-${i}`} aria-hidden>
              {g}
            </span>
          ))
        )}
      </div>

      <div className="z-10 my-6 flex justify-center">
        <KkangchongCharacter
          character={character}
          isPlaying={isAudioPlaying}
          mood={characterMood}
          size="lg"
          onPress={onCharacterPress}
        />
      </div>

      <div
        aria-label="choices"
        className="z-10 flex w-full max-w-md flex-wrap items-center justify-center gap-5"
      >
        {!isFoodSequence &&
          visibleChoices.map((c) => (
            <ChoiceImageButton
              key={c.id}
              choice={c}
              asset={choiceAssets?.[c.id]}
              onPress={handleChoice}
            />
          ))}
        {!isFoodSequence && visibleChoices.length === 0 ? (
          <span aria-label="story-end" className="text-6xl">
            <span aria-hidden>✨</span>
          </span>
        ) : null}
      </div>
    </main>
  );
}

// --- Food sprite renderer -------------------------------------------------
// Crops one frame from public/assets/ci/food-sheet.png. Falls back to the
// emoji animation if the sheet is missing.

function FoodSpriteFrame({
  glyph,
  phase,
}: {
  glyph: string;
  phase: 0 | 1 | 2 | 3;
}) {
  const [sheetOk, setSheetOk] = useState(true);
  const seq = FOOD_SEQUENCE[glyph];
  const frameKey =
    seq && phase >= 1
      ? (seq[(phase - 1) as 0 | 1 | 2 | 3] as keyof typeof FOOD_SHEET.frames)
      : null;
  const frame = (frameKey ? FOOD_SHEET.frames[frameKey] : null) as
    | CISpriteFrame
    | null;

  if (!sheetOk || !frame) {
    // legacy emoji animation
    return (
      <span aria-hidden className="relative inline-flex">
        <span
          className={`text-7xl transition-transform duration-300 ${
            phase === 1
              ? "scale-110"
              : phase === 2
                ? "scale-95 animate-body-wobble"
                : "scale-50 opacity-50"
          }`}
        >
          {glyph}
        </span>
        {phase === 3 ? (
          <span className="absolute -right-10 top-2 text-4xl">✨</span>
        ) : null}
        <img
          src={FOOD_SHEET.src}
          alt=""
          aria-hidden
          className="hidden"
          onError={() => setSheetOk(false)}
        />
      </span>
    );
  }

  const targetH = 220;
  const scale = targetH / frame.h;
  const renderedW = frame.w * scale;
  const sheetW = FOOD_SHEET.intrinsicW * scale;
  const sheetH = FOOD_SHEET.intrinsicH * scale;
  const bgX = -frame.x * scale;
  const bgY = -frame.y * scale;

  return (
    <span
      aria-hidden
      className="block animate-soft-land"
      style={{
        width: renderedW,
        height: targetH,
        backgroundImage: `url(${FOOD_SHEET.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sheetW}px ${sheetH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
      }}
    />
  );
}
