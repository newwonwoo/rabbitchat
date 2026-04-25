"use client";

import { useEffect, useState } from "react";

import { CacheStats } from "@/components/parent-screen/CacheStats";
import { MicTester } from "@/components/parent-screen/MicTester";
import { loadPreference, savePreference } from "@/lib/preferenceEngine";

type Props = {
  onExportData: () => void;
  onDeleteData: () => void;
};

export function SettingsPanel({ onExportData, onDeleteData }: Props) {
  const [voiceVolume, setVoiceVolume] = useState(0.8);

  useEffect(() => {
    const pref = loadPreference();
    setVoiceVolume(pref.voiceVolume);
  }, []);

  const updateVolume = (v: number) => {
    setVoiceVolume(v);
    const pref = loadPreference();
    savePreference({ ...pref, voiceVolume: v });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">설정</h2>

      <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
        <label className="block text-sm font-medium" htmlFor="voice-volume">
          음성 볼륨
        </label>
        <input
          id="voice-volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={voiceVolume}
          onChange={(e) => updateVolume(Number(e.target.value))}
          className="mt-2 w-full accent-kkang-pink"
        />
        <p className="mt-1 text-xs text-kkang-ink/60">
          현재: {Math.round(voiceVolume * 100)}%
        </p>
      </div>

      <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
        <h3 className="text-sm font-semibold">안전</h3>
        <ul className="mt-2 space-y-1 text-xs text-kkang-ink/70">
          <li>· 외부 링크 / 광고 차단됨</li>
          <li>· 실제 마이크 권한은 설정에서 명시 허용 시에만 요청</li>
          <li>· 음성 인식 API 사용하지 않음</li>
        </ul>
      </div>

      <MicTester />

      <CacheStats />

      <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
        <h3 className="text-sm font-semibold">데이터</h3>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={onExportData}
            className="rounded-xl bg-kkang-cream px-4 py-2 text-sm shadow-soft active:scale-[0.99]"
          >
            로그/설정 내보내기 (JSON)
          </button>
          <button
            type="button"
            onClick={onDeleteData}
            className="rounded-xl bg-kkang-pink px-4 py-2 text-sm shadow-soft active:scale-[0.99]"
          >
            저장된 데이터 삭제
          </button>
        </div>
      </div>
    </section>
  );
}
