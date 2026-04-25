"use client";

import { useCallback, useEffect, useState } from "react";

import {
  clearCache,
  getCacheStats,
  getCounters,
  type CacheStats as CacheStatsT,
} from "@/lib/aiCache";

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(2)}MB`;
}

function pct(hit: number, miss: number): string {
  const total = hit + miss;
  if (total === 0) return "—";
  return `${Math.round((hit / total) * 100)}%`;
}

export function CacheStats() {
  const [stats, setStats] = useState<CacheStatsT | null>(null);
  const [counters, setCounters] = useState(getCounters());
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setStats(await getCacheStats());
    setCounters(getCounters());
  }, []);

  useEffect(() => {
    void refresh();
    const i = setInterval(() => setCounters(getCounters()), 1500);
    return () => clearInterval(i);
  }, [refresh]);

  const onClear = async (which: "tts" | "llm" | "all") => {
    if (
      !window.confirm(
        which === "all"
          ? "모든 캐시(TTS + LLM)를 지울까요? 다음 응답부터 비용이 다시 발생합니다."
          : `${which.toUpperCase()} 캐시를 지울까요?`,
      )
    )
      return;
    setBusy(true);
    await clearCache(which === "all" ? undefined : which);
    setBusy(false);
    await refresh();
  };

  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-soft">
      <h2 className="text-base font-semibold">응답 캐시 (비용 절감)</h2>
      <p className="mt-1 text-xs text-kkang-ink/60">
        같은 응답은 한 번만 결제하고, 그 다음부턴 저장된 음성·텍스트를 재생합니다.
        <br />
        캐시는 이 브라우저에만 저장되며 외부로 전송되지 않습니다.
      </p>

      {stats ? (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-kkang-cream p-3">
            <div className="text-xs text-kkang-ink/60">엄마 목소리 (TTS)</div>
            <div className="mt-1 font-semibold">
              {stats.ttsCount}개 · {fmtBytes(stats.ttsBytes)}
            </div>
            <div className="text-xs text-kkang-ink/60">
              적중률: {pct(counters.ttsHit, counters.ttsMiss)}
              <span className="ml-2">
                ({counters.ttsHit} hit / {counters.ttsMiss} miss)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onClear("tts")}
              disabled={busy}
              className="mt-2 rounded-lg bg-white px-2 py-1 text-xs shadow-soft active:scale-[0.99] disabled:opacity-50"
            >
              TTS 캐시 비우기
            </button>
          </div>
          <div className="rounded-xl bg-kkang-cream p-3">
            <div className="text-xs text-kkang-ink/60">응답 (LLM)</div>
            <div className="mt-1 font-semibold">
              {stats.llmCount}개 · {fmtBytes(stats.llmBytes)}
            </div>
            <div className="text-xs text-kkang-ink/60">
              적중률: {pct(counters.llmHit, counters.llmMiss)}
              <span className="ml-2">
                ({counters.llmHit} hit / {counters.llmMiss} miss)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onClear("llm")}
              disabled={busy}
              className="mt-2 rounded-lg bg-white px-2 py-1 text-xs shadow-soft active:scale-[0.99] disabled:opacity-50"
            >
              LLM 캐시 비우기
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-kkang-ink/60">불러오는 중…</p>
      )}

      <button
        type="button"
        onClick={() => onClear("all")}
        disabled={busy}
        className="mt-3 rounded-xl bg-kkang-pink px-3 py-2 text-sm shadow-soft active:scale-[0.99] disabled:opacity-50"
      >
        모든 캐시 비우기
      </button>

      <p className="mt-3 text-xs text-kkang-ink/50">
        엄마 음성을 새로 클론하면 voice id가 바뀌어 TTS 캐시가 자동으로 새 항목으로 적립됩니다.
        오래된 항목이 너무 많아지면 위 "비우기"로 정리할 수 있습니다.
      </p>
    </section>
  );
}
