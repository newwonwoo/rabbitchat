"use client";

import { themes } from "@/data/themes";

// Skeleton: full theme catalog UI is deferred. Cycle action lives in ParentPlayMenu.
export function ThemeSelector() {
  return (
    <section className="rounded-2xl bg-white/70 p-4 text-sm shadow-soft">
      <h2 className="mb-2 text-base font-semibold">테마 (skeleton)</h2>
      <ul className="space-y-1 text-kkang-ink/70">
        {themes.map((t) => (
          <li key={t.id}>
            {t.emoji} {t.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
