"use client";

import { useEffect, useState } from "react";

import {
  appendCustomStory,
  loadCustomStories,
} from "@/lib/storage/customStoryStore";
import { themes } from "@/data/themes";
import type { Story } from "@/types/story";

// v1: parent can add a single-scene "story" with a title, an emoji visual,
// a parent summary, and up to 3 emoji choices. Stored in localStorage.
// Multi-scene authoring will be a later phase.

export function StoryBuilder() {
  const [title, setTitle] = useState("");
  const [themeId, setThemeId] = useState(themes[0]?.id ?? "");
  const [visual, setVisual] = useState("🏬🛒");
  const [summary, setSummary] = useState("");
  const [choice1, setChoice1] = useState("🛒");
  const [choice1Label, setChoice1Label] = useState("");
  const [choice2, setChoice2] = useState("🍌");
  const [choice2Label, setChoice2Label] = useState("");
  const [saved, setSaved] = useState<Story[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSaved(loadCustomStories());
  }, []);

  const reset = () => {
    setTitle("");
    setVisual("🏬🛒");
    setSummary("");
    setChoice1("🛒");
    setChoice1Label("");
    setChoice2("🍌");
    setChoice2Label("");
  };

  const handleAdd = () => {
    if (!title.trim()) {
      setFeedback("제목을 입력해 주세요.");
      return;
    }
    const choices = [
      { emoji: choice1, label: choice1Label, idSuffix: "a" },
      { emoji: choice2, label: choice2Label, idSuffix: "b" },
    ].filter((c) => c.emoji.trim().length > 0);

    if (choices.length === 0) {
      setFeedback("선택지를 1개 이상 입력해 주세요.");
      return;
    }

    const id = `custom_${Date.now().toString(36)}`;
    const story: Story = {
      id,
      themeId,
      title: title.trim(),
      startSceneId: "s1",
      scenes: [
        {
          id: "s1",
          placeId: "custom",
          visual: visual.trim() || "✨",
          parentSummary: summary.trim() || "(부모 요약 없음)",
          choices: choices.map((c) => ({
            id: `${id}_${c.idSuffix}`,
            emoji: c.emoji.trim(),
            nextSceneId: null,
            parentLabel: c.label.trim() || c.emoji.trim(),
          })),
        },
      ],
    };

    setSaved(appendCustomStory(story));
    reset();
    setFeedback("저장되었습니다.");
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">이야기 만들기 (v1)</h2>

      <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <label className="block">
            <span className="block text-xs text-kkang-ink/60">제목</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
              placeholder="예: 마트에서 과일 고르기"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-kkang-ink/60">테마</span>
            <select
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-kkang-ink/60">장면 비주얼 (이모지)</span>
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
              <span className="block text-xs text-kkang-ink/60">선택1 (이모지)</span>
              <input
                type="text"
                value={choice1}
                onChange={(e) => setChoice1(e.target.value)}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
              />
            </label>
            <label>
              <span className="block text-xs text-kkang-ink/60">선택1 부모 라벨</span>
              <input
                type="text"
                value={choice1Label}
                onChange={(e) => setChoice1Label(e.target.value)}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
              />
            </label>
            <label>
              <span className="block text-xs text-kkang-ink/60">선택2 (이모지)</span>
              <input
                type="text"
                value={choice2}
                onChange={(e) => setChoice2(e.target.value)}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
              />
            </label>
            <label>
              <span className="block text-xs text-kkang-ink/60">선택2 부모 라벨</span>
              <input
                type="text"
                value={choice2Label}
                onChange={(e) => setChoice2Label(e.target.value)}
                className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
              />
            </label>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-xl bg-kkang-pink px-4 py-2 text-sm font-semibold shadow-pop active:scale-[0.99]"
          >
            저장
          </button>
          {feedback ? (
            <span className="text-xs text-kkang-ink/60">{feedback}</span>
          ) : null}
        </div>
      </div>

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
        <p className="mt-3 text-xs text-kkang-ink/50">
          저장된 이야기를 아동 화면에 연결하는 기능은 다음 단계에서 제공됩니다.
        </p>
      </div>
    </section>
  );
}
