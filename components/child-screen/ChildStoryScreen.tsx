"use client";

import { useEffect, useState } from "react";

import { ChoiceImageButton } from "@/components/child-screen/ChoiceImageButton";
import { ParentGate } from "@/components/child-screen/ParentGate";
import { KkangchongCharacter } from "@/components/character/KkangchongCharacter";
import { useSearchedImage } from "@/lib/imageSearcher";
import { getTTSProvider } from "@/lib/providers";
import { isUserGestureUnlocked, unlockAudio } from "@/lib/soundEngine";
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
  onGoHome: () => void;
  onReplay: () => void;
};

const SLEEPY_AFTER_MS = 30_000;

const FOOD_GLYPHS = new Set(["🍌", "🍎", "🍓", "🥖", "🍐"]);

export function ChildStoryScreen({
  character,
  scene,
  isAudioPlaying,
  backgroundAsset,
  choiceAssets,
  onCharacterPress,
  onChoice,
  onParentEnter,
  onGoHome,
  onReplay,
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

  const [needsTap, setNeedsTap] = useState(!isUserGestureUnlocked());

  // Scene voice playback chain (handoff §1.2):
  //   1. scene.audioFile — parent's recorded mp3 (instant, free)
  //   2. scene.spokenLine — TTS via cloned voice (cached, free after first)
  //   3. silent
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isUserGestureUnlocked()) return;
    let activeAudio: HTMLAudioElement | null = null;
    let cancelled = false;

    const playSceneVoice = async () => {
      if (scene.audioFile) {
        const audio = new Audio(scene.audioFile);
        audio.volume = 1.0;
        activeAudio = audio;
        try {
          await audio.play();
          return; // file played, done
        } catch {
          // 404 or autoplay block — fall through to TTS
        }
      }
      if (scene.spokenLine && !cancelled) {
        try {
          const tts = getTTSProvider();
          await tts.speak(scene.spokenLine);
        } catch {
          // mock mode or missing key — silent
        }
      }
    };

    void playSceneVoice();
    return () => {
      cancelled = true;
      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }
    };
  }, [scene.audioFile, scene.spokenLine, needsTap]);

  const handleStartTap = () => {
    unlockAudio();
    setNeedsTap(false);
  };

  useEffect(() => {
    if (isAudioPlaying || transitionMood) return;
    const t = setTimeout(() => setTransitionMood("sleepy"), SLEEPY_AFTER_MS);
    return () => clearTimeout(t);
  }, [scene.id, isAudioPlaying, transitionMood]);

  const handleChoice = (choiceId: string) => {
    const choice = scene.choices.find((c) => c.id === choiceId);
    const glyph = choice?.emoji ?? "";

    // Play 깡총이's reaction line for this choice (cached after first time).
    if (choice?.responseLine) {
      try {
        const tts = getTTSProvider();
        void tts.speak(choice.responseLine).catch(() => undefined);
      } catch {
        // silent in mock mode
      }
    }

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

  // Background fallback chain — NEVER queries the character folder.
  // Background = place only (마트 / 어린이집 / 침실 ...). The 깡총이
  // character belongs in the foreground; mixing the two looked terrible.
  //   1. Local PNG at backgroundAsset.imageUrl (data/assets.ts kind=background)
  //   2. Pexels searched (license-safe, only when local missing)
  //   3. null → no background image, just the gradient
  const bgLabel = backgroundAsset?.label ?? scene.placeId ?? "";
  const [bgTier, setBgTier] = useState<"local" | "searched" | "none">(
    backgroundAsset?.imageUrl ? "local" : "searched",
  );

  useEffect(() => {
    setBgTier(backgroundAsset?.imageUrl ? "local" : "searched");
  }, [backgroundAsset?.imageUrl, bgLabel]);

  const { url: searchedBg } = useSearchedImage(
    bgLabel,
    "landscape",
    bgTier === "searched",
  );

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
      {needsTap ? (
        <button
          type="button"
          onClick={handleStartTap}
          aria-label="시작하기"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-kkang-ivory/95 backdrop-blur-sm"
        >
          <span aria-hidden className="text-9xl">🐰</span>
          <span className="mt-6 text-2xl font-bold text-kkang-ink">
            화면을 한 번 터치해 주세요
          </span>
          <span className="mt-2 text-sm text-kkang-ink/60">
            소리를 켜기 위해 필요해요
          </span>
        </button>
      ) : null}

      {showBigBg && bgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgSrc}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
          onError={() => {
            if (bgTier === "local") setBgTier("searched");
            else setBgTier("none");
          }}
        />
      ) : null}

      <div className="absolute right-4 top-4 z-10">
        <ParentGate onUnlock={onParentEnter} />
      </div>

      {/* Home button (top-left, child-discoverable) */}
      <button
        type="button"
        onClick={onGoHome}
        aria-label="홈으로 돌아가기"
        className="absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-2xl shadow-soft active:scale-95"
      >
        <span aria-hidden>🏠</span>
      </button>

      {/* Two-column layout: 깡총이 (left) + choice banners (right).
          Stacks vertically on narrow screens. */}
      <div className="z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-8 px-6 py-8 lg:flex-row lg:items-stretch lg:gap-12 lg:py-16">
        {/* Left column — character */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          {!showBigBg && !isFoodSequence ? (
            <div
              aria-label="scene-visual"
              className="flex flex-wrap items-center justify-center gap-3 text-6xl"
            >
              {visualGlyphs.map((g, i) => (
                <span key={`${scene.id}-glyph-${i}`} aria-hidden>
                  {g}
                </span>
              ))}
            </div>
          ) : null}
          {isFoodSequence ? (
            <FoodSpriteFrame glyph={foodGlyph!} phase={foodPhase} />
          ) : null}
          <KkangchongCharacter
            character={character}
            isPlaying={isAudioPlaying}
            mood={characterMood}
            size="xl"
            onPress={onCharacterPress}
          />
        </div>

        {/* Right column — choice banners */}
        <div
          aria-label="choices"
          className="flex w-full max-w-md flex-1 flex-col justify-center gap-4 lg:max-w-lg"
        >
          {!isFoodSequence &&
            visibleChoices.map((c) => (
              <ChoiceImageButton
                key={c.id}
                choice={c}
                asset={choiceAssets?.[c.id]}
                onPress={handleChoice}
                variant="banner"
              />
            ))}
          {!isFoodSequence && visibleChoices.length === 0 ? (
            <div
              aria-label="story-end"
              className="flex flex-col items-center gap-5 rounded-[28px] bg-white/80 p-6 shadow-card"
            >
              <span aria-hidden className="text-6xl">✨</span>
              <div className="flex w-full flex-col gap-3">
                <button
                  type="button"
                  onClick={onReplay}
                  aria-label="다시 들을래"
                  className="flex w-full items-center gap-4 rounded-2xl bg-kkang-pink p-4 shadow-pop transition-transform active:scale-[0.98]"
                >
                  <span aria-hidden className="text-4xl">🔁</span>
                  <span className="text-xl font-bold text-kkang-ink">
                    다시 들을래
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onGoHome}
                  aria-label="다른 이야기"
                  className="flex w-full items-center gap-4 rounded-2xl bg-kkang-cream p-4 shadow-pop transition-transform active:scale-[0.98]"
                >
                  <span aria-hidden className="text-4xl">🏠</span>
                  <span className="text-xl font-bold text-kkang-ink">
                    다른 이야기
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

// --- Food sprite renderer -------------------------------------------------
// Crops one frame from public/assets/ci/food-sheet.png. Falls back to the
// emoji animation if the sheet is missing.

// Food sequence renderer. Coordinate-based sheet cropping was unreliable
// (kept dragging in adjacent text from the source image), so the sequence
// is now a clean emoji animation. When per-action food PNGs are uploaded
// (kkang_apple_bite.png etc.) we'll route through the same fuzzy lookup
// API used for character poses.
function FoodSpriteFrame({
  glyph,
  phase,
}: {
  glyph: string;
  phase: 0 | 1 | 2 | 3;
}) {
  return (
    <span aria-hidden className="relative inline-flex">
      <span
        className={`text-9xl transition-transform duration-300 ${
          phase === 1
            ? "scale-110"
            : phase === 2
              ? "scale-95 animate-body-wobble"
              : phase === 3
                ? "scale-110"
                : "scale-100"
        }`}
      >
        {glyph}
      </span>
      {phase === 3 ? (
        <span className="absolute -right-12 top-2 text-5xl">✨</span>
      ) : null}
    </span>
  );
}
