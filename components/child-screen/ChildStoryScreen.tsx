"use client";

import { ChoiceImageButton } from "@/components/child-screen/ChoiceImageButton";
import { ParentGate } from "@/components/child-screen/ParentGate";
import { KkangchongCharacter } from "@/components/character/KkangchongCharacter";
import type { Character } from "@/types/character";
import type { Scene } from "@/types/story";

type Props = {
  character: Character;
  scene: Scene;
  isAudioPlaying: boolean;
  onCharacterPress: () => void;
  onChoice: (choiceId: string) => void;
  onParentEnter: () => void;
};

export function ChildStoryScreen({
  character,
  scene,
  isAudioPlaying,
  onCharacterPress,
  onChoice,
  onParentEnter,
}: Props) {
  // Decompose scene.visual into emoji glyphs (Array.from handles surrogate pairs).
  const visualGlyphs = Array.from(scene.visual);

  return (
    <main
      aria-label="child-story"
      className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-kkang-ivory via-kkang-cream to-kkang-beige px-6 pb-10 pt-6"
    >
      {/* Top: parent gate (icon only) */}
      <div className="absolute right-4 top-4">
        <ParentGate onUnlock={onParentEnter} />
      </div>

      {/* Scene visual */}
      <div
        aria-label="scene-visual"
        className="mt-10 flex flex-wrap items-center justify-center gap-3 text-7xl"
      >
        {visualGlyphs.map((g, i) => (
          <span key={`${scene.id}-glyph-${i}`} aria-hidden>
            {g}
          </span>
        ))}
      </div>

      {/* Character */}
      <div className="my-6 flex justify-center">
        <KkangchongCharacter
          character={character}
          isPlaying={isAudioPlaying}
          onPress={onCharacterPress}
        />
      </div>

      {/* Choices */}
      <div
        aria-label="choices"
        className="flex w-full max-w-md flex-wrap items-center justify-center gap-5"
      >
        {scene.choices.map((c) => (
          <ChoiceImageButton key={c.id} choice={c} onPress={onChoice} />
        ))}
        {scene.choices.length === 0 ? (
          <span aria-label="story-end" className="text-6xl">
            <span aria-hidden>✨</span>
          </span>
        ) : null}
      </div>
    </main>
  );
}
