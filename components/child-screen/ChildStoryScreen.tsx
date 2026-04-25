"use client";

import { useEffect, useState } from "react";

import { ChoiceImageButton } from "@/components/child-screen/ChoiceImageButton";
import { ParentGate } from "@/components/child-screen/ParentGate";
import { KkangchongCharacter } from "@/components/character/KkangchongCharacter";
import type { Character, CharacterMood } from "@/types/character";
import type { Scene } from "@/types/story";

type Props = {
  character: Character;
  scene: Scene;
  isAudioPlaying: boolean;
  onCharacterPress: () => void;
  onChoice: (choiceId: string) => void;
  onParentEnter: () => void;
};

const SLEEPY_AFTER_MS = 30_000;

// Food motif glyphs from the CI food-action sheet. When the child picks
// one, we play a short "한입 → 씹기 → 삼키기 → 맛있어!" pose chain.
const FOOD_GLYPHS = new Set(["🍌", "🍎", "🍓", "🥖", "🍐"]);

export function ChildStoryScreen({
  character,
  scene,
  isAudioPlaying,
  onCharacterPress,
  onChoice,
  onParentEnter,
}: Props) {
  const visualGlyphs = Array.from(scene.visual);
  const [transitionMood, setTransitionMood] = useState<CharacterMood | null>(null);
  const [foodGlyph, setFoodGlyph] = useState<string | null>(null);
  const [foodPhase, setFoodPhase] = useState<0 | 1 | 2 | 3>(0);

  // Greet the child with a "waving" mood whenever the scene changes.
  useEffect(() => {
    setTransitionMood("waving");
    const t = setTimeout(() => setTransitionMood(null), 1200);
    return () => clearTimeout(t);
  }, [scene.id]);

  // After SLEEPY_AFTER_MS of inactivity, drift into sleepy.
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
      // Phase 1 (한입) → 2 (씹기) → 3 (삼키기 + 맛있어!)
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
  const characterMood: CharacterMood | undefined =
    transitionMood ?? undefined;

  return (
    <main
      aria-label="child-story"
      className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-kkang-ivory via-kkang-cream to-kkang-beige px-6 pb-10 pt-6"
    >
      <div className="absolute right-4 top-4">
        <ParentGate onUnlock={onParentEnter} />
      </div>

      <div
        aria-label="scene-visual"
        className="mt-10 flex flex-wrap items-center justify-center gap-3 text-7xl"
      >
        {isFoodSequence ? (
          <span aria-hidden className="relative inline-flex">
            <span
              className={`transition-transform duration-300 ${
                foodPhase === 1
                  ? "scale-110"
                  : foodPhase === 2
                    ? "scale-95 animate-body-wobble"
                    : "scale-50 opacity-50"
              }`}
            >
              {foodGlyph}
            </span>
            {foodPhase === 3 ? (
              <span className="absolute -right-10 top-2 text-4xl">✨</span>
            ) : null}
          </span>
        ) : (
          visualGlyphs.map((g, i) => (
            <span key={`${scene.id}-glyph-${i}`} aria-hidden>
              {g}
            </span>
          ))
        )}
      </div>

      <div className="my-6 flex justify-center">
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
        className="flex w-full max-w-md flex-wrap items-center justify-center gap-5"
      >
        {!isFoodSequence &&
          scene.choices.map((c) => (
            <ChoiceImageButton key={c.id} choice={c} onPress={handleChoice} />
          ))}
        {!isFoodSequence && scene.choices.length === 0 ? (
          <span aria-label="story-end" className="text-6xl">
            <span aria-hidden>✨</span>
          </span>
        ) : null}
      </div>
    </main>
  );
}
