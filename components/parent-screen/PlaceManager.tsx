"use client";

import { places } from "@/data/places";

// Read-only catalog for now. Add / edit / upload-photo will arrive in
// a later phase (handoff §3.2 "장소 관리").
export function PlaceManager() {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">장소 관리</h2>
      <ul className="grid grid-cols-2 gap-3">
        {places.map((p) => (
          <li
            key={p.id}
            className="flex flex-col items-start gap-1 rounded-2xl bg-kkang-cream px-4 py-3 shadow-soft"
          >
            <span className="text-3xl" aria-hidden>
              {p.emoji}
            </span>
            <span className="text-sm font-semibold">{p.name}</span>
            <span className="text-xs text-kkang-ink/60">{p.id}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-kkang-ink/50">
        장소 추가/사진 업로드는 다음 단계에서 제공됩니다.
      </p>
    </section>
  );
}
