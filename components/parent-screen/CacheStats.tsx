"use client";

import { useCallback, useEffect, useState } from "react";

import {
  clearCache,
  getCacheStats,
  getCounters,
  type CacheStats as CacheStatsT,
} from "@/lib/aiCache";
import {
  warmTTSPhrases,
  type WarmProgress,
  type WarmReport,
} from "@/lib/cacheWarmer";
import { getAllCommonPhrases, getCommonPhraseStats } from "@/lib/commonPhrases";

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
  const [warmProgress, setWarmProgress] = useState<WarmProgress | null>(null);
  const [warmReport, setWarmReport] = useState<WarmReport | null>(null);

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

  const onWarm = async () => {
    setBusy(true);
    setWarmReport(null);
    setWarmProgress(null);
    const phrases = getAllCommonPhrases();
    const report = await warmTTSPhrases(phrases, (p) => setWarmProgress(p));
    setWarmReport(report);
    setWarmProgress(null);
    setBusy(false);
    await refresh();
  };

  const phraseInfo = getCommonPhraseStats();

  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-soft">
      <h2 className="text-base font-semibold">응답 캐시 (비용 절감)</h2>
      <p className="mt-1 text-xs text-kkang-ink/60">
        같은 응답은 한 번만 결제하고, 그 다음부턴 저장된 음성·텍스트를 재생합니다.
        캐시는 이 브라우저에만 저장됩니다.
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

      <div className="mt-4 border-t border-kkang-beige/60 pt-3">
        <h3 className="text-sm font-semibold">공통 응답 미리 캐시</h3>
        <p className="mt-1 text-xs text-kkang-ink/60">
          깡총이가 자주 쓰는 짧은 말 {phraseInfo.totalLines}개 (총{" "}
          {phraseInfo.totalChars}자)을 한 번에 TTS로 생성해서 캐시에 넣어 둡니다.
          이후 같은 말은 ElevenLabs 호출 없이 즉시 재생되어 평생 무료.
        </p>
        <button
          type="button"
          onClick={onWarm}
          disabled={busy}
          className="mt-2 rounded-xl bg-kkang-pink px-4 py-2 text-sm font-semibold shadow-pop active:scale-[0.99] disabled:opacity-50"
        >
          {busy && warmProgress ? "캐시 채우는 중…" : "공통 응답 미리 캐시"}
        </button>

        {warmProgress ? (
          <div className="mt-3 text-xs text-kkang-ink/70">
            <div>
              {warmProgress.done} / {warmProgress.total} 처리 중
              <span className="ml-2 text-kkang-ink/50">
                hit {warmProgress.hit} · 새로 캐시 {warmProgress.newWarm} · 실패 {warmProgress.failed}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-kkang-cream">
              <div
                className="h-full bg-kkang-pink transition-all"
                style={{
                  width: `${
                    warmProgress.total === 0
                      ? 0
                      : (warmProgress.done / warmProgress.total) * 100
                  }%`,
                }}
              />
            </div>
            {warmProgress.current ? (
              <div className="mt-1 truncate text-kkang-ink/50">
                현재: {warmProgress.current}
              </div>
            ) : null}
          </div>
        ) : null}

        {warmReport ? (
          <div className="mt-3 rounded-xl bg-kkang-ivory p-3 text-xs text-kkang-ink/80">
            {warmReport.skippedReason === "mock_mode" ? (
              <>
                Mock 모드라 캐시 워밍을 건너뛰었습니다. <code>.env.local</code>
                에 <code>NEXT_PUBLIC_PROVIDER=real</code> + ElevenLabs 키를 넣고
                서버 재시작 후 다시 시도해 주세요.
              </>
            ) : warmReport.skippedReason === "provider_unsupported" ? (
              <>현재 TTS 제공자가 prefetch를 지원하지 않습니다.</>
            ) : (
              <>
                완료. 총 {warmReport.total}개 중 새로 캐시 {warmReport.newWarm}개,
                기존 적중 {warmReport.hit}개, 실패 {warmReport.failed}개.
                <br />
                실제 ElevenLabs 글자 사용: 약 {warmReport.charsBilled}자.
              </>
            )}
          </div>
        ) : null}
      </div>

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
      </p>
    </section>
  );
}
