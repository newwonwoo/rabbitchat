"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AIGeneratorError,
  generateStoryWithAI,
  type AuthorGoal,
  type AuthorInput,
  type AuthorRepeatMode,
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

const PLACE_TYPES = ["어린이집", "마트", "공원", "집", "친척집", "병원", "산", "기타"];

const COMMON_EMOTIONS = ["신남", "뿌듯함", "즐거움", "호기심", "조금 슬픔", "졸림", "당황"];

const COMMON_GOALS: { id: AuthorGoal; label: string; hint: string }[] = [
  { id: "회상", label: "회상", hint: "오늘 있었던 일 떠올리기" },
  { id: "순서", label: "순서 말하기", hint: "먼저, 그 다음, 마지막" },
  { id: "어휘", label: "어휘 확장", hint: "새 단어 반복 노출" },
  { id: "감정", label: "감정 표현", hint: "기분 묻기" },
  { id: "사회성", label: "사회성", hint: "친구·가족 상호작용" },
];

const REPEAT_MODES: { id: AuthorRepeatMode; label: string; hint: string }[] = [
  { id: "variation", label: "비슷한 변주", hint: "같은 톤, 다른 사물·친구" },
  { id: "repeat", label: "동일 반복", hint: "운율 강화 — 같은 이야기 또 듣기" },
  { id: "new", label: "완전 신규", hint: "도전 어휘 + 새 장면" },
];

type Step = "input" | "generating" | "review" | "warming" | "test";

export function StoryBuilder() {
  const [step, setStep] = useState<Step>("input");

  // Rich form state — see lib/aiStoryGenerator.ts AuthorInput
  const [placeType, setPlaceType] = useState("어린이집");
  const [placeDetail, setPlaceDetail] = useState("교실");
  const [eventText, setEventText] = useState(
    "친구랑 블록으로 자동차를 만들었어",
  );
  const [friends, setFriends] = useState<string[]>(["시현이"]);
  const [others, setOthers] = useState<string[]>(["선생님"]);
  const [childActions, setChildActions] = useState<string[]>([
    "블록을 쌓았어",
    "자동차라고 말했어",
    "친구에게 보여줬어",
  ]);
  const [childPreferences, setChildPreferences] = useState<string[]>([
    "블록",
    "자동차",
    "시현이",
  ]);
  const [childQuote, setChildQuote] = useState("자동차 만들었어");
  const [emotions, setEmotions] = useState<string[]>(["신남", "뿌듯함"]);
  const [goals, setGoals] = useState<AuthorGoal[]>(["회상", "순서", "어휘"]);
  const [repeatMode, setRepeatMode] = useState<AuthorRepeatMode>("variation");
  const [rawText, setRawText] = useState("");

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
      placeType: placeType.trim() || undefined,
      placeDetail: placeDetail.trim() || undefined,
      eventText: eventText.trim() || undefined,
      friends: friends.filter((s) => s.trim().length > 0),
      others: others.filter((s) => s.trim().length > 0),
      childActions: childActions.filter((s) => s.trim().length > 0),
      childPreferences: childPreferences.filter((s) => s.trim().length > 0),
      childQuote: childQuote.trim() || undefined,
      emotions: emotions.filter((s) => s.trim().length > 0),
      goals,
      repeatMode,
      rawText: rawText.trim() || undefined,
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
          placeType={placeType}
          setPlaceType={setPlaceType}
          placeDetail={placeDetail}
          setPlaceDetail={setPlaceDetail}
          eventText={eventText}
          setEventText={setEventText}
          friends={friends}
          setFriends={setFriends}
          others={others}
          setOthers={setOthers}
          childActions={childActions}
          setChildActions={setChildActions}
          childPreferences={childPreferences}
          setChildPreferences={setChildPreferences}
          childQuote={childQuote}
          setChildQuote={setChildQuote}
          emotions={emotions}
          setEmotions={setEmotions}
          goals={goals}
          setGoals={setGoals}
          repeatMode={repeatMode}
          setRepeatMode={setRepeatMode}
          rawText={rawText}
          setRawText={setRawText}
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
  placeType: string;
  setPlaceType: (s: string) => void;
  placeDetail: string;
  setPlaceDetail: (s: string) => void;
  eventText: string;
  setEventText: (s: string) => void;
  friends: string[];
  setFriends: (v: string[]) => void;
  others: string[];
  setOthers: (v: string[]) => void;
  childActions: string[];
  setChildActions: (v: string[]) => void;
  childPreferences: string[];
  setChildPreferences: (v: string[]) => void;
  childQuote: string;
  setChildQuote: (s: string) => void;
  emotions: string[];
  setEmotions: (v: string[]) => void;
  goals: AuthorGoal[];
  setGoals: (v: AuthorGoal[]) => void;
  repeatMode: AuthorRepeatMode;
  setRepeatMode: (m: AuthorRepeatMode) => void;
  rawText: string;
  setRawText: (s: string) => void;
  onGenerate: () => void;
  generating: boolean;
  generationError: { msg: string; hint?: string } | null;
}) {
  const realMode = getProviderMode() === "real";

  return (
    <div className="space-y-4">
      {!realMode ? (
        <p className="rounded-2xl bg-yellow-100 p-3 text-xs text-yellow-900 shadow-soft">
          현재 mock 모드입니다. AI 시나리오 생성은{" "}
          <code>NEXT_PUBLIC_PROVIDER=real</code> + <code>OPENAI_API_KEY</code>{" "}
          가 필요합니다.
        </p>
      ) : null}

      {/* 장소 */}
      <SectionCard icon="📍" title="장소" hint="어디에서 있었던 일인가요?">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="block">
            <span className="block text-xs text-kkang-ink/60">장소 유형</span>
            <select
              value={props.placeType}
              onChange={(e) => props.setPlaceType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
            >
              {PLACE_TYPES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-kkang-ink/60">세부 공간</span>
            <input
              type="text"
              value={props.placeDetail}
              onChange={(e) => props.setPlaceDetail(e.target.value)}
              placeholder="예: 교실"
              className="mt-1 w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2"
            />
          </label>
        </div>
      </SectionCard>

      {/* 있었던 일 */}
      <SectionCard icon="📖" title="있었던 일" hint="시나리오의 핵심 이벤트">
        <textarea
          rows={2}
          value={props.eventText}
          onChange={(e) => props.setEventText(e.target.value)}
          placeholder="예: 친구랑 블록으로 자동차를 만들었어"
          className="w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2 text-sm"
        />
      </SectionCard>

      {/* 함께한 사람 */}
      <SectionCard icon="👥" title="함께한 사람" hint="이름이 시나리오에 그대로 등장합니다">
        <div className="space-y-3">
          <ChipInput
            label="친구"
            placeholder="시현이 (Enter)"
            values={props.friends}
            onChange={props.setFriends}
            color="bg-kkang-pink/40"
          />
          <ChipInput
            label="가족·선생님"
            placeholder="선생님 (Enter)"
            values={props.others}
            onChange={props.setOthers}
            color="bg-kkang-cream"
          />
        </div>
      </SectionCard>

      {/* 아이 행동 */}
      <SectionCard icon="🎯" title="아이 행동" hint="여러 행동 → 분기 후보가 됩니다">
        <ChipInput
          label="행동"
          placeholder="블록을 쌓았어 (Enter)"
          values={props.childActions}
          onChange={props.setChildActions}
          color="bg-white"
        />
      </SectionCard>

      {/* 좋아한 것 */}
      <SectionCard icon="💗" title="좋아한 것" hint="어휘 반복 노출의 핵심">
        <ChipInput
          label="좋아한 것"
          placeholder="블록 (Enter)"
          values={props.childPreferences}
          onChange={props.setChildPreferences}
          color="bg-kkang-pink/30"
        />
      </SectionCard>

      {/* 아이 실제 말 */}
      <SectionCard icon="💬" title="아이 실제 말" hint="시나리오에 그대로 인용됩니다">
        <input
          type="text"
          value={props.childQuote}
          onChange={(e) => props.setChildQuote(e.target.value)}
          placeholder='예: "자동차 만들었어"'
          className="w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2 text-sm"
        />
      </SectionCard>

      {/* 감정 */}
      <SectionCard icon="😊" title="감정" hint="깡총이가 함께 느낍니다">
        <ChipPicker
          options={COMMON_EMOTIONS}
          values={props.emotions}
          onChange={props.setEmotions}
          allowCustom
        />
      </SectionCard>

      {/* 목표 */}
      <SectionCard icon="🎓" title="목표" hint="AI가 시나리오에 반영합니다">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {COMMON_GOALS.map((g) => {
            const active = props.goals.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  if (active) props.setGoals(props.goals.filter((x) => x !== g.id));
                  else props.setGoals([...props.goals, g.id]);
                }}
                className={`rounded-xl px-3 py-2 text-left text-sm transition-transform active:scale-[0.99] ${
                  active
                    ? "bg-kkang-pink font-semibold shadow-soft"
                    : "bg-kkang-cream"
                }`}
              >
                <div className="text-kkang-ink">{g.label}</div>
                <div className="text-xs text-kkang-ink/60">{g.hint}</div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* 반복 방식 */}
      <SectionCard icon="🔄" title="반복 방식" hint="handoff §2.2 — 반복 40% / 변주 40% / 신규 20%">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {REPEAT_MODES.map((m) => {
            const active = props.repeatMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => props.setRepeatMode(m.id)}
                className={`rounded-xl px-3 py-2 text-left text-sm ${
                  active
                    ? "bg-kkang-pink font-semibold shadow-soft"
                    : "bg-kkang-cream"
                }`}
              >
                <div className="text-kkang-ink">{m.label}</div>
                <div className="text-xs text-kkang-ink/60">{m.hint}</div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* 자유 메모 (선택) */}
      <SectionCard icon="📝" title="자유 메모" hint="추가 컨텍스트 (선택)">
        <textarea
          rows={2}
          value={props.rawText}
          onChange={(e) => props.setRawText(e.target.value)}
          placeholder="추가로 알려줄 게 있으면 자유롭게…"
          className="w-full rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2 text-sm"
        />
      </SectionCard>

      {props.generationError ? (
        <p className="rounded-2xl bg-red-100 p-3 text-xs text-red-800 shadow-soft">
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
        className="w-full rounded-2xl bg-kkang-pink px-5 py-4 text-lg font-bold shadow-pop active:scale-[0.99] disabled:opacity-50"
      >
        🎬 AI로 시나리오 만들기
      </button>
    </div>
  );
}

// --- Reusable form pieces -------------------------------------------------

function SectionCard({
  icon,
  title,
  hint,
  children,
}: {
  icon: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-card">
      <header className="mb-3 flex items-baseline gap-2">
        <span aria-hidden className="text-xl">{icon}</span>
        <h3 className="text-base font-bold text-kkang-ink">{title}</h3>
        {hint ? (
          <span className="ml-auto text-xs text-kkang-ink/50">{hint}</span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function ChipInput({
  label,
  placeholder,
  values,
  onChange,
  color = "bg-kkang-cream",
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  color?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="mb-1 text-xs text-kkang-ink/60">{label}</div>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((v) => (
          <span
            key={v}
            className={`flex items-center gap-1 rounded-full ${color} px-3 py-1 text-sm shadow-soft`}
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`${v} 삭제`}
              className="rounded-full px-1 text-kkang-ink/50 hover:bg-white/30"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className="min-w-[140px] flex-1 rounded-full border border-kkang-beige bg-kkang-ivory px-3 py-1 text-sm focus:outline-none"
        />
      </div>
    </div>
  );
}

function ChipPicker({
  options,
  values,
  onChange,
  allowCustom,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  allowCustom?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={`rounded-full px-3 py-1 text-sm shadow-soft ${
                active ? "bg-kkang-pink font-semibold" : "bg-kkang-cream"
              }`}
            >
              {o}
            </button>
          );
        })}
        {values.filter((v) => !options.includes(v)).map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full bg-kkang-pink px-3 py-1 text-sm shadow-soft"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`${v} 삭제`}
              className="rounded-full px-1 text-kkang-ink/60"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {allowCustom ? (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = draft.trim();
              if (v && !values.includes(v)) onChange([...values, v]);
              setDraft("");
            }
          }}
          placeholder="직접 입력 (Enter)"
          className="mt-2 w-full rounded-full border border-kkang-beige bg-kkang-ivory px-3 py-1 text-sm"
        />
      ) : null}
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
