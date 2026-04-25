"use client";

import { characters } from "@/data/characters";
import type { Character } from "@/types/character";

type Props = {
  currentCharacterId: string;
  onSelect: (character: Character) => void;
};

export function CharacterManager({ currentCharacterId, onSelect }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">캐릭터 선택</h2>
      <ul className="grid grid-cols-2 gap-3">
        {characters.map((c) => {
          const isActive = c.id === currentCharacterId;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                aria-pressed={isActive}
                className={`flex w-full flex-col items-start gap-1 rounded-2xl px-4 py-3 text-left shadow-soft transition-transform active:scale-[0.99] ${
                  isActive ? "bg-kkang-pink" : "bg-kkang-cream"
                }`}
              >
                <span className="text-3xl" aria-hidden>
                  {c.emoji}
                </span>
                <span className="text-sm font-semibold">{c.name}</span>
                <span className="text-xs text-kkang-ink/60">
                  {c.isPrimary ? "기본" : "보조"}
                  {isActive ? " · 현재" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
