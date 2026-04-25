"use client";

import { useEffect, useState } from "react";

import { resolveAssetsForStory } from "@/lib/imageAssetResolver";
import {
  generateStoryFromEvent,
  type StoryAutoGenerateOutput,
} from "@/lib/storyAutoGenerator";
import {
  appendCustomStory,
  loadCustomStories,
} from "@/lib/storage/customStoryStore";
import type { Story } from "@/types/story";

// v2: parent supplies placeName + eventText only; the rule-based auto
// generator builds a Story (≥3 scenes, ≥5 internal branches) and the
// asset resolver picks background + choice images. Manual mode (v1)
// remains as an "advanced" toggle.

export function StoryBuilder() {
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  // shared
  const [saved, setSaved] = useState<Story[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSaved(loadCustomStories());
  }, []);

  // auto fields
  const [placeName, setPlaceName] = useState("마트");
  const [eventText, setEventText] = useState("카트를 밀고 바나나를 골랐어");
  const [childPreference, setChildPreference] = useState("바나나를 좋아함");
  const [preview, setPreview] = useState<StoryAutoGenerateOutput | null>(null);

  const handleGenerate = () => {
    if (!placeName.trim() || !eventText.trim()) {
      setFeedback("장소와 이벤트를 모두 입력해 주세요.");
      return;
    }
    const out = generateStoryFromEvent({
      placeName: placeName.trim(),
      eventText: eventText.trim(),
      childPreference: childPreference.trim() || undefined,
    });
    setPreview(out);
    setFeedback(`분기 ${out.branchCount}개 생성됨.`);
  };

  const handleSavePreview = () => {
    if (!preview) return;
    setSaved(appendCustomStory(preview.story));
    setFeedback("저장되었습니다.");
    setPreview(null);
  };

  // manual fields (v1 remnant)
  const [title, setTitle] = useState("");
  const [visual, setVisual] = useState("🏬🛒");
  const [summary, setSummary] = useState("");
  const [c1, setC1] = useState("🛒");
  const [c1Label, setC1Label] = useState("");
  const [c2, setC2] = useState("🍌");
  const [c2Label, setC2Label] = useState("");

  const handleManualAdd = () => {
    if (!title.trim()) {
      setFeedback("제목을 입력해 주세요.");
      return;
    }
    const id = `custom_${Date.now().toString(36)}`;
    const story: Story = {
      id,
      themeId: "auto_theme",
      title: title.trim(),
      startSceneId: "s1",
      scenes: [
        {
          id: "s1",
          placeId: "custom",
          visual: visual.trim() || "✨",
          parentSummary: summary.trim() || "(부모 요약 없음)",
          choices: [
            { id: `${id}_a`, emoji: c1, nextSceneId: null, parentLabel: c1Label || c1 },
            { id: `${id}_b`, emoji: c2, nextSceneId: null, parentLabel: c2Label || c2 },
          ],
        },
      ],
    };
    setSaved(appendCustomStory(story));
    setFeedback("저장되었습니다.");
    setTitle("");
    setSummary("");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">이야기 만들기</h2>
        <div className="rounded-full bg-kkang-cream p-1 text-xs shadow-soft">
          <button
            type="button"
            onClick={() => setMode("auto")}
            className={`rounded-full px-3 py-1 ${mode === "auto" ? "bg-kkang-pink font-semibold" : ""}`}
          >
            자동
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`rounded-full px-3 py-1 ${mode === "manual" ? "bg-kkang-pink font-semibold" : ""}`}
          >
            직접 입력
          </button>
        </div>
      </div>

      {mode === "auto" ? (
        <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
          <p className="mb-3 text-xs text-kkang-ink/60">
            장소와 있었던 일만 알려 주시면 깡총이가 이야기를 만들어 드려요.
          </p>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <label className="block">
              <span className="block text-xs text-kkang-ink/60">장소</span>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
                placeholder="예: 마트"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-kkang-ink/60">있었던 일</span>
              <textarea
                value={eventText}
                onChange={(e) => setEventText(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
                placeholder="예: 카트를 밀고 바나나를 골랐어"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-kkang-ink/60">아이의 선호 (선택)</span>
              <input
                type="text"
                value={childPreference}
                onChange={(e) => setChildPreference(e.target.value)}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-xl bg-kkang-pink px-4 py-2 text-sm font-semibold shadow-pop active:scale-[0.99]"
            >
              이야기 생성
            </button>
            {feedback ? (
              <span className="text-xs text-kkang-ink/60">{feedback}</span>
            ) : null}
          </div>

          {preview ? (
            <PreviewCard preview={preview} onSave={handleSavePreview} />
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <label className="block">
              <span className="block text-xs text-kkang-ink/60">제목</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-kkang-ink/60">장면 비주얼</span>
              <input
                type="text"
                value={visual}
                onChange={(e) => setVisual(e.target.value)}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-kkang-ink/60">부모 요약</span>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="block text-xs text-kkang-ink/60">선택1</span>
                <input
                  type="text"
                  value={c1}
                  onChange={(e) => setC1(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
                />
              </label>
              <label>
                <span className="block text-xs text-kkang-ink/60">선택1 라벨</span>
                <input
                  type="text"
                  value={c1Label}
                  onChange={(e) => setC1Label(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
                />
              </label>
              <label>
                <span className="block text-xs text-kkang-ink/60">선택2</span>
                <input
                  type="text"
                  value={c2}
                  onChange={(e) => setC2(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
                />
              </label>
              <label>
                <span className="block text-xs text-kkang-ink/60">선택2 라벨</span>
                <input
                  type="text"
                  value={c2Label}
                  onChange={(e) => setC2Label(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
                />
              </label>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleManualAdd}
              className="rounded-xl bg-kkang-pink px-4 py-2 text-sm font-semibold shadow-pop active:scale-[0.99]"
            >
              저장
            </button>
            {feedback ? (
              <span className="text-xs text-kkang-ink/60">{feedback}</span>
            ) : null}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
        <h3 className="text-sm font-semibold">저장된 이야기 ({saved.length})</h3>
        {saved.length === 0 ? (
          <p className="mt-2 text-xs text-kkang-ink/60">
            아직 만든 이야기가 없습니다.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-kkang-ink/70">
            {saved.map((s) => (
              <li key={s.id}>
                {s.scenes[0]?.visual} {s.title}
                <span className="ml-2 text-kkang-ink/40">{s.themeId}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PreviewCard({
  preview,
  onSave,
}: {
  preview: StoryAutoGenerateOutput;
  onSave: () => void;
}) {
  const assets = resolveAssetsForStory({
    placeName: preview.story.title,
    eventText: preview.assistantLine,
    extractedObjects: preview.extractedObjects,
  });
  return (
    <div className="mt-4 rounded-2xl bg-kkang-ivory p-4 text-sm shadow-soft">
      <div className="text-xs text-kkang-ink/60">미리보기</div>
      <div className="mt-1 text-base font-semibold">{preview.story.title}</div>
      <div className="mt-1 text-xs text-kkang-ink/70">
        분기 {preview.branchCount}개 · 장면 {preview.story.scenes.length}개
      </div>
      <div className="mt-2 text-xs text-kkang-ink/60">
        배경: {assets.backgroundAsset.label} {assets.backgroundAsset.emojiFallback}
      </div>
      <ul className="mt-2 space-y-1 text-xs text-kkang-ink/70">
        {preview.branches.slice(0, 5).map((b) => (
          <li key={b.id}>
            · {b.questionLine} →{" "}
            {b.options.map((o) => `${o.emoji} ${o.parentLabel}`).join(" / ")}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSave}
        className="mt-3 rounded-xl bg-kkang-pink px-4 py-2 text-sm font-semibold shadow-pop active:scale-[0.99]"
      >
        저장
      </button>
    </div>
  );
}
