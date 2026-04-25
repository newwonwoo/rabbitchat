"use client";

import { characters } from "@/data/characters";

// Skeleton: future home for adding/editing/uploading custom characters.
export function CharacterManager() {
  return (
    <section className="rounded-2xl bg-white/70 p-4 text-sm shadow-soft">
      <h2 className="mb-2 text-base font-semibold">캐릭터 관리 (skeleton)</h2>
      <ul className="space-y-1 text-kkang-ink/70">
        {characters.map((c) => (
          <li key={c.id}>
            {c.emoji} {c.name}
            {c.isPrimary ? " · 기본" : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
