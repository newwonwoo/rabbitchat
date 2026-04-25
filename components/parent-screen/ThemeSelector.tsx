"use client";

import { themes, type Theme } from "@/data/themes";

type Props = {
  currentThemeId: string;
  onSelect: (theme: Theme) => void;
};

export function ThemeSelector({ currentThemeId, onSelect }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">테마 선택</h2>
      <ul className="grid grid-cols-2 gap-3">
        {themes.map((t) => {
          const isActive = t.id === currentThemeId;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t)}
                aria-pressed={isActive}
                className={`flex w-full flex-col items-start gap-1 rounded-2xl px-4 py-3 text-left shadow-soft transition-transform active:scale-[0.99] ${
                  isActive ? "bg-kkang-pink" : "bg-kkang-cream"
                }`}
              >
                <span className="text-3xl" aria-hidden>
                  {t.emoji}
                </span>
                <span className="text-sm font-semibold">{t.name}</span>
                {isActive ? (
                  <span className="text-xs text-kkang-ink/60">현재</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
