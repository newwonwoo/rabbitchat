"use client";

import type { Character } from "@/types/character";
import type { Theme } from "@/data/themes";

type Props = {
  currentCharacter: Character;
  currentTheme: Theme;
  onRestart: () => void;
  onCycleTheme: () => void;
  onCycleCharacter: () => void;
  onBack: () => void;
};

export function ParentPlayMenu({
  currentCharacter,
  currentTheme,
  onRestart,
  onCycleTheme,
  onCycleCharacter,
  onBack,
}: Props) {
  return (
    <main className="min-h-screen bg-kkang-ivory px-6 py-8 text-kkang-ink">
      <div className="mx-auto max-w-md">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">놀이 메뉴</h1>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-kkang-cream px-4 py-2 text-sm shadow-soft"
          >
            뒤로
          </button>
        </header>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl bg-kkang-pink px-5 py-4 text-left shadow-pop active:scale-[0.99]"
          >
            <div className="text-base font-semibold">이야기 재시작</div>
            <div className="text-xs text-kkang-ink/60">처음 장면부터 다시</div>
          </button>
          <button
            type="button"
            onClick={onCycleTheme}
            className="rounded-2xl bg-kkang-cream px-5 py-4 text-left shadow-soft active:scale-[0.99]"
          >
            <div className="text-base font-semibold">테마 변경</div>
            <div className="text-xs text-kkang-ink/60">
              현재: {currentTheme.emoji} {currentTheme.name}
            </div>
          </button>
          <button
            type="button"
            onClick={onCycleCharacter}
            className="rounded-2xl bg-kkang-cream px-5 py-4 text-left shadow-soft active:scale-[0.99]"
          >
            <div className="text-base font-semibold">캐릭터 변경</div>
            <div className="text-xs text-kkang-ink/60">
              현재: {currentCharacter.emoji} {currentCharacter.name}
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
