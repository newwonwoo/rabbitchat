"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AIGeneratorError,
  generateStoryWithAI,
  type AuthorInput,
} from "@/lib/aiStoryGenerator";
import { loadProfile } from "@/lib/profile";
import { getProviderMode } from "@/lib/providers";
import {
  appendCustomStory,
  loadCustomStories,
  publishStory,
  upsertCustomStory,
} from "@/lib/storage/customStoryStore";
import {
  warmStory,
  type StoryWarmProgress,
  type StoryWarmReport,
} from "@/lib/storyPipeline";
import type { Story } from "@/types/story";

type Step = "input" | "generating" | "review" | "warming" | "test";

export function StoryBuilder() {
  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<"natural" | "form">("natural");
  const [rawText, setRawText] = useState(
    "원우가 어린이집에서 친구랑 블록 놀이를 했고 점심에 김밥을 먹었어",
  );
  const [placeName, setPlaceName] = useState("어린이집");
  const [eventText, setEventText] = useState("친구랑 놀고 점심 먹음");
  const [childPreference, setChildPreference] = useState("바나나 좋아함");

  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<{
    msg: string;
    hint?: string;
  } | null>(null);

  const [story, setStory] = useState<Story | null>(null);
  const [savedList, setSavedList] = useState<Story[]>([]);

  const [warmProgress, setWarmProgress] = useState<StoryWarmProgress | null>(null);
  const [warmReport, setWarmReport] = useState<StoryWarmReport | null>(null);

  const profile = useMemo(() => loadProfile(), []);

  useEffect(() => {
    setSavedList(loadCustomStories());
  }, []);

  // --- Step 1 → Step 2 ---
  const onGenerate = async () => {
    setGenerationError(null);
    setGenerating(true);
    setStep("generating");

    const input: AuthorInput = {
      childName: profile.name,
      childAgeMonths: profile.ageMonths,
      ...(inputMode === "natural"
        ? { rawText }
        : { placeName, eventText, childPreference }),
    };

    try {
      const out = await generateStoryWithAI(input);
      setStory(out);
      // Persist as draft immediately so we don't lose it on reload.
      appendCustomStory(out);
      setSavedList(loadCustomStories());
      setStep("review");
    } catch (e) {
      const err = e as AIGeneratorError;
      setGenerationError({ msg: err.message, hint: err.hint });
      setStep("input");
    } finally {
      setGenerating(false);
    }
  };

  // --- Step 3 → Step 4 ---
  const onConfirm = async () => {
    if (!story) return;
    upsertCustomStory(story);
    setStep("warming");
    setWarmProgress(null);
    setWarmReport(null);
    const report = await warmStory(story, (p) => setWarmProgress(p));
    setWarmReport(report);
    setStep("test");
  };

  // --- Step 5 deploy ---
  const onPublish = () => {
    if (!story) return;
    publishStory(story.id);
    setSavedList(loadCustomStories());
    setStep("input");
    setStory(null);
    setWarmReport(null);
    alert("배포 완료. 아이 화면에서 새 이야기로 보입니다.");
  };

  const onSaveDraft = () => {
    setStep("input");
    setStory(null);
    setWarmReport(null);
  };

  const onEditScene = (sceneIdx: number, key: "spokenLine" | "parentSummary", val: string) => {
    if (!story) return;
    const next = { ...story };
    next.scenes = next.scenes.map((s, i) =>
      i === sceneIdx ? { ...s, [key]: val } : s,
    );
    setStory(next);
  };

  const onEditChoice = (
    sceneIdx: number,
    choiceIdx: number,
    key: "parentLabel" | "responseLine" | "emoji",
    val: string,
  ) => {
    if (!story) return;
    const next = { ...story };
    next.scenes = next.scenes.map((s, i) => {
      if (i !== sceneIdx) return s;
      const newChoices = s.choices.map((c, j) =>
        j === choiceIdx ? { ...c, [key]: val } : c,
      );
      return { ...s, choices: newChoices };
    });
    setStory(next);
  };

  const onRegenerate = () => {
    setStory(null);
    setStep("input");
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold">이야기 만들기</h2>
        <div className="text-xs text-kkang-ink/50">
          {step === "input" ? "1. 입력" : null}
          {step === "generating" ? "2. AI 생성 중" : null}
          {step === "review" ? "3. 검토·수정" : null}
          {step === "warming" ? "4. 음성·이미지 준비" : null}
          {step === "test" ? "5. 테스트·배포" : null}
        </div>
      </header>

      {step === "input" ? (
        <InputStep
          mode={inputMode}
          setMode={setInputMode}
          rawText={rawText}
          setRawText={setRawText}
          placeName={placeName}
          setPlaceName={setPlaceName}
          eventText={eventText}
          setEventText={setEventText}
          childPreference={childPreference}
          setChildPreference={setChildPreference}
          onGenerate={onGenerate}
          generating={generating}
          generationError={generationError}
        />
      ) : null}

      {step === "generating" ? <GeneratingStep /> : null}

      {step === "review" && story ? (
        <ReviewStep
          story={story}
          onEditScene={onEditScene}
          onEditChoice={onEditChoice}
          onConfirm={onConfirm}
          onRegenerate={onRegenerate}
        />
      ) : null}

      {step === "warming" ? <WarmingStep progress={warmProgress} /> : null}

      {step === "test" && story ? (
        <TestStep
          story={story}
          report={warmReport}
          onPublish={onPublish}
          onSaveDraft={onSaveDraft}
        />
      ) : null}

      <SavedList list={savedList} />
    </section>
  );
}

// --- Step components ------------------------------------------------------

function InputStep(props: {
  mode: "natural" | "form";
  setMode: (m: "natural" | "form") => void;
  rawText: string;
  setRawText: (s: string) => void;
  placeName: string;
  setPlaceName: (s: string) => void;
  eventText: string;
  setEventText: (s: string) => void;
  childPreference: string;
  setChildPreference: (s: string) => void;
  onGenerate: () => void;
  generating: boolean;
  generationError: { msg: string; hint?: string } | null;
}) {
  const realMode = getProviderMode() === "real";
  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
      <div className="mb-3 flex justify-end">
        <div className="rounded-full bg-kkang-cream p-1 text-xs shadow-soft">
          <button
            type="button"
            onClick={() => props.setMode("natural")}
            className={`rounded-full px-3 py-1 ${props.mode === "natural" ? "bg-kkang-pink font-semibold" : ""}`}
          >
            자연어
          </button>
          <button
            type="button"
            onClick={() => props.setMode("form")}
            className={`rounded-full px-3 py-1 ${props.mode === "form" ? "bg-kkang-pink font-semibold" : ""}`}
          >
            표준 입력
          </button>
        </div>
      </div>

      {props.mode === "natural" ? (
        <label className="block text-sm">
          <span className="block text-xs text-kkang-ink/60">아이의 하루를 자유롭게 적어 주세요</span>
          <textarea
            rows={4}
            value={props.rawText}
            onChange={(e) => props.setRawText(e.target.value)}
            placeholder="예: 원우가 어린이집에서 친구랑 블록 놀이를 했고 점심에 김밥을 먹었어"
            className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
          />
        </label>
      ) : (
        <div className="grid grid-cols-1 gap-3 text-sm">
          <label className="block">
            <span className="block text-xs text-kkang-ink/60">장소</span>
            <input
              type="text"
              value={props.placeName}
              onChange={(e) => props.setPlaceName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-kkang-ink/60">있었던 일</span>
            <textarea
              rows={3}
              value={props.eventText}
              onChange={(e) => props.setEventText(e.target.value)}
              className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-kkang-ink/60">아이의 선호 (선택)</span>
            <input
              type="text"
              value={props.childPreference}
              onChange={(e) => props.setChildPreference(e.target.value)}
              className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
            />
          </label>
        </div>
      )}

      {!realMode ? (
        <p className="mt-3 rounded-xl bg-yellow-100 p-2 text-xs text-yellow-900">
          현재 mock 모드입니다. AI 시나리오 생성은{" "}
          <code>NEXT_PUBLIC_PROVIDER=real</code> + <code>OPENAI_API_KEY</code>{" "}
          가 필요합니다.
        </p>
      ) : null}

      {props.generationError ? (
        <p className="mt-3 rounded-xl bg-red-100 p-2 text-xs text-red-800">
          {props.generationError.msg}
          {props.generationError.hint ? (
            <span className="block text-red-600">{props.generationError.hint}</span>
          ) : null}
        </p>
      ) : null}

      <button
        type="button"
        onClick={props.onGenerate}
        disabled={props.generating}
        className="mt-4 rounded-xl bg-kkang-pink px-5 py-3 text-base font-semibold shadow-pop active:scale-[0.99] disabled:opacity-50"
      >
        🎬 AI로 시나리오 만들기
      </button>
    </div>
  );
}

function GeneratingStep() {
  return (
    <div className="flex items-center justify-center rounded-2xl bg-white/70 p-8 shadow-soft">
      <div className="text-center">
        <div className="mb-2 animate-pulse text-5xl">🎬</div>
        <p className="text-sm font-semibold">AI가 시나리오를 작성하고 있어요</p>
        <p className="mt-1 text-xs text-kkang-ink/60">약 5~10초 소요됩니다</p>
      </div>
    </div>
  );
}

function ReviewStep(props: {
  story: Story;
  onEditScene: (
    sceneIdx: number,
    key: "spokenLine" | "parentSummary",
    val: string,
  ) => void;
  onEditChoice: (
    sceneIdx: number,
    choiceIdx: number,
    key: "parentLabel" | "responseLine" | "emoji",
    val: string,
  ) => void;
  onConfirm: () => void;
  onRegenerate: () => void;
}) {
  const { story } = props;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
        <div className="text-xs text-kkang-ink/60">제목</div>
        <div className="mt-1 text-lg font-bold">{story.title}</div>
        <div className="text-sm text-kkang-ink/70">{story.subtitle}</div>
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {(story.tags ?? []).map((t) => (
            <span key={t} className="rounded-full bg-kkang-cream px-2 py-0.5">
              {t}
            </span>
          ))}
          {story.estimatedMinutes ? (
            <span className="rounded-full bg-kkang-cream px-2 py-0.5">
              약 {story.estimatedMinutes}분
            </span>
          ) : null}
        </div>
      </div>

      {story.scenes.map((s, sIdx) => (
        <div key={s.id} className="rounded-2xl bg-white/70 p-4 shadow-soft">
          <div className="text-xs text-kkang-ink/60">
            장면 {sIdx + 1} · {s.placeId} · {s.visual}
          </div>
          <label className="mt-2 block text-xs">
            <span className="text-kkang-ink/60">깡총이 대사</span>
            <textarea
              rows={2}
              value={s.spokenLine ?? ""}
              onChange={(e) => props.onEditScene(sIdx, "spokenLine", e.target.value)}
              className="mt-1 w-full rounded-lg border border-kkang-beige bg-kkang-ivory px-2 py-1 text-sm"
            />
          </label>
          <label className="mt-2 block text-xs">
            <span className="text-kkang-ink/60">부모 요약</span>
            <input
              type="text"
              value={s.parentSummary}
              onChange={(e) => props.onEditScene(sIdx, "parentSummary", e.target.value)}
              className="mt-1 w-full rounded-lg border border-kkang-beige bg-kkang-ivory px-2 py-1 text-sm"
            />
          </label>
          {s.choices.length > 0 ? (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-kkang-ink/60">선택지 ({s.choices.length}개)</div>
              {s.choices.map((c, cIdx) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[40px_1fr] items-start gap-2 rounded-lg bg-kkang-ivory p-2"
                >
                  <input
                    type="text"
                    value={c.emoji}
                    onChange={(e) =>
                      props.onEditChoice(sIdx, cIdx, "emoji", e.target.value)
                    }
                    className="w-10 rounded border border-kkang-beige bg-white px-1 py-1 text-center text-2xl"
                  />
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={c.parentLabel}
                      onChange={(e) =>
                        props.onEditChoice(sIdx, cIdx, "parentLabel", e.target.value)
                      }
                      placeholder="라벨"
                      className="w-full rounded border border-kkang-beige bg-white px-2 py-1 text-sm"
                    />
                    <textarea
                      rows={2}
                      value={c.responseLine ?? ""}
                      onChange={(e) =>
                        props.onEditChoice(sIdx, cIdx, "responseLine", e.target.value)
                      }
                      placeholder="이 선택을 누르면 깡총이가 할 말"
                      className="w-full rounded border border-kkang-beige bg-white px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-xs text-kkang-ink/50">마지막 장면 (선택지 없음)</div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={props.onRegenerate}
          className="rounded-xl bg-kkang-cream px-4 py-2 text-sm shadow-soft"
        >
          🔄 다시 생성
        </button>
        <button
          type="button"
          onClick={props.onConfirm}
          className="flex-1 rounded-xl bg-kkang-pink px-4 py-3 text-base font-semibold shadow-pop"
        >
          ✅ 확인 — 음성·이미지 준비
        </button>
      </div>
    </div>
  );
}

function WarmingStep({ progress }: { progress: StoryWarmProgress | null }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
      <div className="text-sm font-semibold">음성·이미지 자동 최적화 중…</div>
      {progress ? (
        <div className="mt-3 text-xs text-kkang-ink/70">
          <div>
            {progress.phase === "tts"
              ? "🎙️ 엄마 목소리 생성"
              : progress.phase === "images"
                ? "🖼️ 사진 검색"
                : "✅ 완료"}{" "}
            · {progress.done} / {progress.total}
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-kkang-cream">
            <div
              className="h-full bg-kkang-pink transition-all"
              style={{
                width: progress.total === 0
                  ? "100%"
                  : `${(progress.done / progress.total) * 100}%`,
              }}
            />
          </div>
          {progress.current ? (
            <div className="mt-1 truncate text-kkang-ink/50">현재: {progress.current}</div>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 text-xs text-kkang-ink/60">시작 중…</div>
      )}
    </div>
  );
}

function TestStep(props: {
  story: Story;
  report: StoryWarmReport | null;
  onPublish: () => void;
  onSaveDraft: () => void;
}) {
  const r = props.report;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
        <div className="text-sm font-semibold">{props.story.title}</div>
        <div className="text-xs text-kkang-ink/60">{props.story.subtitle}</div>

        {r ? (
          <ul className="mt-3 space-y-1 text-xs text-kkang-ink/80">
            {r.skipped === "mock_mode" ? (
              <li className="text-yellow-800">
                Mock 모드라 음성은 캐시되지 않았습니다. real 모드 + 키 설정 후 다시 시도.
              </li>
            ) : (
              <>
                <li>
                  🎙️ 음성: 새로 캐시 {r.ttsNew}개, 적중 {r.ttsHit}개, 실패 {r.ttsFailed}개
                  ({r.charsBilled}자 사용)
                </li>
                <li>
                  🖼️ 이미지: 캐시 {r.imgOk}개, 실패 {r.imgFailed}개 / 총 {r.imgTotal}
                </li>
              </>
            )}
          </ul>
        ) : null}
      </div>

      <p className="rounded-xl bg-kkang-cream p-3 text-xs text-kkang-ink/70">
        💡 <strong>테스트</strong>: 부모 화면 메인 → "오늘의 이야기"에서 미리 재생할 수 있습니다.
        문제 없으면 아래 "배포" 버튼으로 아이 화면에 공개하세요.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={props.onSaveDraft}
          className="rounded-xl bg-kkang-cream px-4 py-2 text-sm shadow-soft"
        >
          📝 임시 저장 (배포 X)
        </button>
        <button
          type="button"
          onClick={props.onPublish}
          className="flex-1 rounded-xl bg-kkang-pink px-4 py-3 text-base font-semibold shadow-pop"
        >
          🚀 아이에게 배포
        </button>
      </div>
    </div>
  );
}

function SavedList({ list }: { list: Story[] }) {
  if (list.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-soft">
      <h3 className="text-sm font-semibold">저장된 이야기 ({list.length})</h3>
      <ul className="mt-2 space-y-1 text-xs text-kkang-ink/70">
        {list.map((s) => (
          <li key={s.id} className="flex items-center justify-between">
            <span>
              {s.coverEmoji ?? "🎀"} {s.title}
              <span className="ml-2 text-kkang-ink/40">{s.themeId}</span>
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                s.status === "published"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {s.status === "published" ? "배포됨" : "초안"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
