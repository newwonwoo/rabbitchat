"use client";

import { useEffect, useState } from "react";

type Props = {
  onDone: () => void;
};

// Branded boot screen — animated bunny + wordmark fade out after ~1.6s.
// Used to mask app initial paint and set the premium tone.
export function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1300);
    const t2 = setTimeout(() => onDone(), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <main
      aria-label="splash"
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-gradient-to-b from-kkang-ivory via-kkang-cream to-kkang-beige transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Decorative dots */}
      <span aria-hidden className="absolute left-12 top-20 text-3xl opacity-40">
        ✨
      </span>
      <span aria-hidden className="absolute right-16 top-32 text-2xl opacity-30">
        ✨
      </span>
      <span aria-hidden className="absolute bottom-24 left-20 text-2xl opacity-30">
        💗
      </span>

      <div className="flex flex-col items-center gap-6">
        <span
          aria-hidden
          className="text-9xl drop-shadow-pop"
          style={{ animation: "soft-land 0.9s ease-out 1, body-wobble 1.6s ease-in-out 0.9s infinite" }}
        >
          🐰
        </span>
        <h1 className="text-4xl font-bold tracking-wide text-kkang-ink">
          하얀 토끼 깡총
        </h1>
        <p className="text-base text-kkang-ink/60">
          마음이 따뜻해지는 우리 친구
        </p>
      </div>
    </main>
  );
}
