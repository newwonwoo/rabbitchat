"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AIGeneratorError,
  generateStoryWithAI,
  type AuthorInput,
} from "@/lib/aiStoryGenerator";
import {
  hashKey,
  getCachedImageUrl,
  putCachedImageUrl,
} from "@/lib/aiCache";
import { warmTTSPhrases, type WarmReport } from "@/lib/cacheWarmer";
import { loadProfile } from "@/lib/profile";
import { getProviderMode } from "@/lib/providers";
import {
  collectStoryImageLabels,
  collectStoryLines,
} from "@/lib/storyPipeline";
import type { Story } from "@/types/story";

type StageId =
  | "input"
  | "scenario"
  | "voiceList"
  | "voiceGen"
  | "imageList"
  | "imageFetch"
  | "placement"
  | "validation";

type StageStatus = "idle" | "running" | "done" | "failed" | "skipped";

type StageState = {
  status: StageStatus;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
};

const ORDER: { id: StageId; icon: string; title: string; hint: string }[] = [
  { id: "input", icon: "📝", title: "입력", hint: "부모가 채운 9개 섹션" },
  { id: "scenario", icon: "🎬", title: "시나리오·대화문", hint: "LLM이 JSON으로 작성" },
  { id: "voiceList", icon: "📋", title: "목소리 리스트업", hint: "spokenLine + responseLine 모음" },
  { id: "voiceGen", icon: "🎙️", title: "목소리 생성", hint: "ElevenLabs TTS → IndexedDB 캐시" },
  { id: "imageList", icon: "🗂️", title: "이미지 리스트업", hint: "배경 + 사물 키워드" },
  { id: "imageFetch", icon: "🖼️", title: "이미지 가져오기", hint: "Pexels 검색 → URL 캐시" },
  { id: "placement", icon: "🧭", title: "각 구역 배치", hint: "scene별 mp3·이미지 매핑" },
  { id: "validation", icon: "✅", title: "검증", hint: "누락·오류 자동 점검" },
];

type ImgFetchItem = {
  label: string;
  orientation: "square" | "landscape";
  url: string | null;
  cacheHit: boolean;
};

type PlacementRow = {
  sceneId: string;
  placeId: string;
  spokenLine?: string;
  audioFile?: string;
  bgImage?: string;
  choices: Array<{
    label: string;
    emoji: string;
    responseLine?: string;
    image?: string;
  }>;
};

type ValidationIssue = { level: "warn" | "error"; msg: string };

const DEFAULT_INPUT: AuthorInput = {
  childName: "원우",
  childAgeMonths: 27,
  placeType: "어린이집",
  placeDetail: "교실",
  eventText: "친구랑 블록으로 자동차를 만들었어",
  friends: ["시현이"],
  others: ["선생님"],
  childActions: ["블록을 쌓았어", "자동차라고 말했어", "친구에게 보여줬어"],
  childPreferences: ["블록", "자동차", "시현이"],
  childQuote: "자동차 만들었어",
  emotions: ["신남", "뿌듯함"],
  goals: ["회상", "순서", "어휘"],
  repeatMode: "variation",
};

// Quick presets — one-click scenario swap.
const PRESETS: { id: string; label: string; input: AuthorInput }[] = [
  {
    id: "kinder",
    label: "어린이집 / 시현이 / 블록",
    input: { ...DEFAULT_INPUT },
  },
  {
    id: "mart",
    label: "마트 / 바나나",
    input: {
      ...DEFAULT_INPUT,
      placeType: "마트",
      placeDetail: "과일 코너",
      eventText: "엄마랑 카트 밀고 바나나를 골랐어",
      friends: [],
      others: ["엄마"],
      childActions: ["카트를 밀었어", "바나나를 골랐어"],
      childPreferences: ["바나나", "카트"],
      childQuote: "바나나!",
      emotions: ["신남"],
      goals: ["어휘", "순서"],
    },
  },
  {
    id: "park",
    label: "공원 / 나비 / 꽃",
    input: {
      ...DEFAULT_INPUT,
      placeType: "공원",
      placeDetail: "꽃밭",
      eventText: "나비를 따라가다가 꽃을 봤어",
      friends: [],
      others: ["엄마", "아빠"],
      childActions: ["나비를 따라갔어", "꽃 냄새를 맡았어"],
      childPreferences: ["나비", "꽃"],
      childQuote: "나비 예뻐",
      emotions: ["호기심", "신남"],
      goals: ["회상", "감정"],
    },
  },
];

export function PipelineTester() {
  const [input, setInput] = useState<AuthorInput>({
    ...DEFAULT_INPUT,
    childName: loadProfile().name || DEFAULT_INPUT.childName,
  });
  const [editing, setEditing] = useState(false);
  const [rawText, setRawText] = useState("");
  // Input mode — what gets sent to the LLM:
  //   "natural"  = only childName + age + rawText (form defaults ignored)
  //   "form"     = all 9 structured fields, rawText ignored
  //   "both"     = everything combined (richest context)
  const [inputMode, setInputMode] = useState<"natural" | "form" | "both">("form");

  const update = <K extends keyof AuthorInput>(key: K, value: AuthorInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };
  const updateList = (key: keyof AuthorInput, csv: string) => {
    const arr = csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setInput((prev) => ({ ...prev, [key]: arr } as AuthorInput));
  };
  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setInput({ ...p.input, childName: input.childName });
    setRawText("");
    if (inputMode === "natural") setInputMode("form");
  };
  const applyRawText = () => {
    setInput((prev) => ({ ...prev, rawText: rawText.trim() || undefined }));
  };

  // Compose the actual input that gets sent to the LLM, based on mode.
  const composeInput = (): AuthorInput => {
    if (inputMode === "natural") {
      return {
        childName: input.childName,
        childAgeMonths: input.childAgeMonths,
        rawText: rawText.trim() || input.rawText,
      };
    }
    if (inputMode === "form") {
      const { rawText: _ignored, ...rest } = input;
      return rest;
    }
    // both
    return {
      ...input,
      rawText: rawText.trim() || input.rawText,
    };
  };

  const [stages, setStages] = useState<Record<StageId, StageState>>(() =>
    Object.fromEntries(
      ORDER.map((o) => [o.id, { status: "idle" } as StageState]),
    ) as Record<StageId, StageState>,
  );

  // Per-stage payloads
  const [scenario, setScenario] = useState<Story | null>(null);
  const [voiceList, setVoiceList] = useState<string[]>([]);
  const [voiceReport, setVoiceReport] = useState<WarmReport | null>(null);
  const [imageList, setImageList] = useState<
    Array<{ label: string; orientation: "square" | "landscape" }>
  >([]);
  const [imageFetch, setImageFetch] = useState<ImgFetchItem[]>([]);
  const [placement, setPlacement] = useState<PlacementRow[]>([]);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  const [running, setRunning] = useState(false);

  const realMode = getProviderMode() === "real";

  const setStage = (id: StageId, patch: Partial<StageState>) => {
    setStages((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const resetAll = () => {
    setStages(
      Object.fromEntries(
        ORDER.map((o) => [o.id, { status: "idle" } as StageState]),
      ) as Record<StageId, StageState>,
    );
    setScenario(null);
    setVoiceList([]);
    setVoiceReport(null);
    setImageList([]);
    setImageFetch([]);
    setPlacement([]);
    setIssues([]);
  };

  const runAll = async () => {
    if (running) return;
    setRunning(true);
    resetAll();

    // Stage 1 — input (already known)
    const t0 = Date.now();
    setStage("input", { status: "done", startedAt: t0, finishedAt: Date.now() });

    // Stage 2 — scenario
    let story: Story | null = null;
    setStage("scenario", { status: "running", startedAt: Date.now() });
    try {
      story = await generateStoryWithAI(composeInput());
      setScenario(story);
      setStage("scenario", { status: "done", finishedAt: Date.now() });
    } catch (e) {
      const err = e as AIGeneratorError;
      setStage("scenario", {
        status: "failed",
        finishedAt: Date.now(),
        error: `${err.message}${err.hint ? " — " + err.hint : ""}`,
      });
      setRunning(false);
      return;
    }

    // Stage 3 — voice list
    setStage("voiceList", { status: "running", startedAt: Date.now() });
    const lines = collectStoryLines(story);
    setVoiceList(lines);
    setStage("voiceList", { status: "done", finishedAt: Date.now() });

    // Stage 4 — voice gen
    setStage("voiceGen", { status: "running", startedAt: Date.now() });
    const vr = await warmTTSPhrases(lines);
    setVoiceReport(vr);
    setStage("voiceGen", {
      status: vr.skippedReason ? "skipped" : "done",
      finishedAt: Date.now(),
      error: vr.skippedReason
        ? vr.skippedReason === "mock_mode"
          ? "Mock 모드 — TTS 호출 스킵"
          : "Provider 미지원"
        : undefined,
    });

    // Stage 5 — image list
    setStage("imageList", { status: "running", startedAt: Date.now() });
    const labels = collectStoryImageLabels(story);
    const imgListRaw: Array<{ label: string; orientation: "square" | "landscape" }> = [
      ...labels.landscape.map((l) => ({ label: l, orientation: "landscape" as const })),
      ...labels.square.map((l) => ({ label: l, orientation: "square" as const })),
    ];
    setImageList(imgListRaw);
    setStage("imageList", { status: "done", finishedAt: Date.now() });

    // Stage 6 — image fetch
    setStage("imageFetch", { status: "running", startedAt: Date.now() });
    const fetched: ImgFetchItem[] = [];
    for (const item of imgListRaw) {
      const cacheKey = await hashKey(["img", "pexels", item.label, item.orientation]);
      const cached = await getCachedImageUrl(cacheKey);
      if (cached) {
        fetched.push({ ...item, url: cached, cacheHit: true });
        continue;
      }
      try {
        const res = await fetch("/api/image-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: item.label, orientation: item.orientation }),
        });
        if (!res.ok) {
          fetched.push({ ...item, url: null, cacheHit: false });
          continue;
        }
        const json = (await res.json()) as { ok: boolean; found: boolean; url?: string };
        const url = json.ok && json.found && json.url ? json.url : null;
        if (url) await putCachedImageUrl(cacheKey, url);
        fetched.push({ ...item, url, cacheHit: false });
      } catch {
        fetched.push({ ...item, url: null, cacheHit: false });
      }
    }
    setImageFetch(fetched);
    setStage("imageFetch", { status: "done", finishedAt: Date.now() });

    // Stage 7 — placement
    setStage("placement", { status: "running", startedAt: Date.now() });
    const urlByLabel = new Map<string, string>();
    for (const f of fetched) if (f.url) urlByLabel.set(f.label, f.url);
    const rows: PlacementRow[] = story.scenes.map((s) => ({
      sceneId: s.id,
      placeId: s.placeId,
      spokenLine: s.spokenLine,
      audioFile: s.audioFile,
      bgImage: urlByLabel.get(s.placeId) ?? urlByLabel.get(s.parentSummary?.split(/\s+/)[0] ?? ""),
      choices: s.choices.map((c) => ({
        label: c.parentLabel,
        emoji: c.emoji,
        responseLine: c.responseLine,
        image: urlByLabel.get(c.parentLabel),
      })),
    }));
    setPlacement(rows);
    setStage("placement", { status: "done", finishedAt: Date.now() });

    // Stage 8 — validation
    setStage("validation", { status: "running", startedAt: Date.now() });
    const probs: ValidationIssue[] = [];
    if (story.scenes.length < 3) probs.push({ level: "error", msg: `장면이 ${story.scenes.length}개 — 최소 3개 권장` });
    if (story.scenes.length > 5) probs.push({ level: "warn", msg: `장면이 ${story.scenes.length}개 — 5개 이하 권장` });
    let totalBranches = 0;
    for (const s of story.scenes) totalBranches += s.choices.length;
    if (totalBranches < 5) probs.push({ level: "warn", msg: `총 분기 ${totalBranches}개 (handoff §3 권장: ≥5)` });
    for (const s of story.scenes) {
      if (!s.spokenLine && !s.audioFile) {
        probs.push({ level: "error", msg: `${s.id}: spokenLine과 audioFile 둘 다 없음 — 장면 무음` });
      }
      if (s.choices.length > 3) {
        probs.push({ level: "warn", msg: `${s.id}: 선택지 ${s.choices.length}개 (한 화면 ≤3)` });
      }
      for (const c of s.choices) {
        if (!c.responseLine) {
          probs.push({ level: "warn", msg: `${s.id}/${c.id}: responseLine 없음 — 깡총이 반응 X` });
        }
      }
    }
    if (vr.failed > 0) probs.push({ level: "error", msg: `TTS 실패 ${vr.failed}개` });
    const imgFailed = fetched.filter((f) => !f.url).length;
    if (imgFailed > 0) probs.push({ level: "warn", msg: `이미지 ${imgFailed}개 검색 실패 — emoji 폴백 사용됨` });
    setIssues(probs);
    setStage("validation", {
      status: probs.some((p) => p.level === "error") ? "failed" : "done",
      finishedAt: Date.now(),
    });

    setRunning(false);
  };

  const totalMs = useMemo(() => {
    const first = stages.input.startedAt;
    const last = stages.validation.finishedAt;
    if (!first || !last) return null;
    return last - first;
  }, [stages]);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-kkang-ink">파이프라인 테스터</h2>
          <p className="mt-1 text-sm text-kkang-ink/60">
            8단계 각각의 입력·출력·실패를 한눈에. 비용도 함께 표시.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalMs !== null ? (
            <span className="text-xs text-kkang-ink/50">
              총 {(totalMs / 1000).toFixed(1)}초
            </span>
          ) : null}
          <button
            type="button"
            onClick={resetAll}
            disabled={running}
            className="rounded-xl bg-kkang-cream px-4 py-2 text-sm shadow-soft active:scale-[0.99] disabled:opacity-50"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={runAll}
            disabled={running}
            className="rounded-xl bg-kkang-pink px-5 py-2 text-sm font-bold shadow-pop active:scale-[0.99] disabled:opacity-50"
          >
            {running ? "실행 중…" : "▶ 테스트 실행"}
          </button>
        </div>
      </header>

      {/* Provider diagnostic — helps when "키는 있는데 실패한다" */}
      <div className="rounded-2xl bg-kkang-cream/70 p-3 text-xs shadow-soft">
        <div className="font-semibold text-kkang-ink">환경 진단</div>
        <ul className="mt-1 space-y-0.5 text-kkang-ink/70">
          <li>
            NEXT_PUBLIC_PROVIDER ={" "}
            <code className="rounded bg-white/60 px-1">{getProviderMode()}</code>{" "}
            {realMode
              ? "✅"
              : "⚠️ 'real'로 설정해야 LLM/TTS 실제 호출. .env.local 확인 후 dev 재시작."}
          </li>
          <li>
            <span className="text-kkang-ink/50">
              참고: 401(잘못된 키) / 429(rate or 잔액부족) / 404(모델 권한 없음) 같은 상태는 #2
              시나리오 단계에서 사유와 함께 표시됩니다.
            </span>
          </li>
        </ul>
      </div>

      {/* Input section — mode toggle + preset + free text + structured edit */}
      <div className="rounded-3xl bg-white p-5 shadow-card">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-kkang-ink">테스트 입력</h3>
            <p className="text-xs text-kkang-ink/60">
              아래 모드 선택 → 프리셋 또는 직접 입력 → ▶ 실행
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg bg-kkang-cream px-3 py-1 text-xs shadow-soft"
          >
            {editing ? "접기" : "직접 수정"}
          </button>
        </header>

        {/* 3-mode toggle — what gets sent to the LLM */}
        <div className="mb-3">
          <div className="text-xs text-kkang-ink/60">입력 방식</div>
          <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
            {(
              [
                { id: "natural", label: "자연어만", hint: "텍스트 1줄로 요약" },
                { id: "form", label: "입력폼만", hint: "9개 섹션 정밀" },
                { id: "both", label: "둘 다", hint: "자연어 + 폼 합쳐 전달" },
              ] as const
            ).map((m) => {
              const active = inputMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInputMode(m.id)}
                  className={`rounded-xl px-3 py-2 text-left ${
                    active ? "bg-kkang-pink font-semibold shadow-soft" : "bg-kkang-cream"
                  }`}
                >
                  <div className="text-kkang-ink">{m.label}</div>
                  <div className="text-[10px] text-kkang-ink/60">{m.hint}</div>
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-kkang-ink/50">
            {inputMode === "natural"
              ? "자녀 이름 + 자연어 textarea만 LLM에 전달. 폼 값은 무시됩니다."
              : inputMode === "form"
                ? "9개 섹션 폼만 LLM에 전달. 자연어 textarea 값은 무시됩니다."
                : "자연어 + 폼 둘 다 LLM에 전달 (가장 풍부한 컨텍스트)."}
          </p>
        </div>

        {/* Preset chips */}
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className="rounded-full bg-kkang-cream px-3 py-1 text-xs shadow-soft hover:bg-kkang-pink"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Natural-language quick input */}
        <div className="mb-3">
          <label className="block text-xs text-kkang-ink/60">
            자연어 추가 (선택) — 위 9개 항목과 함께 LLM에 전달됩니다
          </label>
          <div className="mt-1 flex gap-2">
            <textarea
              rows={2}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="예: 오늘 어린이집에서 시현이랑 블록으로 자동차 만들고 점심 잘 먹었어"
              className="flex-1 rounded-xl border border-kkang-beige bg-kkang-ivory px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={applyRawText}
              className="rounded-xl bg-kkang-cream px-3 py-2 text-xs shadow-soft active:scale-[0.99]"
            >
              적용
            </button>
          </div>
          {input.rawText ? (
            <p className="mt-1 text-[10px] text-kkang-ink/50">
              현재 첨부됨: "{input.rawText}"
            </p>
          ) : null}
        </div>

        {/* Editable structured fields (collapsible) */}
        {editing ? (
          <div className="grid grid-cols-1 gap-3 rounded-2xl bg-kkang-ivory p-3 text-xs sm:grid-cols-2">
            <Field label="자녀 이름">
              <input
                type="text"
                value={input.childName}
                onChange={(e) => update("childName", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="월령">
              <input
                type="number"
                value={input.childAgeMonths ?? 27}
                onChange={(e) => update("childAgeMonths", Number(e.target.value))}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="장소 유형">
              <input
                type="text"
                value={input.placeType ?? ""}
                onChange={(e) => update("placeType", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="세부 공간">
              <input
                type="text"
                value={input.placeDetail ?? ""}
                onChange={(e) => update("placeDetail", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="있었던 일" full>
              <textarea
                rows={2}
                value={input.eventText ?? ""}
                onChange={(e) => update("eventText", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="친구 (쉼표로)">
              <input
                type="text"
                value={(input.friends ?? []).join(", ")}
                onChange={(e) => updateList("friends", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="기타 사람">
              <input
                type="text"
                value={(input.others ?? []).join(", ")}
                onChange={(e) => updateList("others", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="아이 행동" full>
              <input
                type="text"
                value={(input.childActions ?? []).join(", ")}
                onChange={(e) => updateList("childActions", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="좋아한 것" full>
              <input
                type="text"
                value={(input.childPreferences ?? []).join(", ")}
                onChange={(e) => updateList("childPreferences", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="실제 말">
              <input
                type="text"
                value={input.childQuote ?? ""}
                onChange={(e) => update("childQuote", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
            <Field label="감정">
              <input
                type="text"
                value={(input.emotions ?? []).join(", ")}
                onChange={(e) => updateList("emotions", e.target.value)}
                className="w-full rounded-lg border border-kkang-beige bg-white px-2 py-1"
              />
            </Field>
          </div>
        ) : null}
      </div>

      {ORDER.map((o, idx) => (
        <StageCard
          key={o.id}
          index={idx + 1}
          icon={o.icon}
          title={o.title}
          hint={o.hint}
          state={stages[o.id]}
        >
          {o.id === "input" ? <InputView input={composeInput()} mode={inputMode} /> : null}
          {o.id === "scenario" && scenario ? <ScenarioView story={scenario} /> : null}
          {o.id === "voiceList" && voiceList.length ? (
            <VoiceListView lines={voiceList} />
          ) : null}
          {o.id === "voiceGen" && voiceReport ? <VoiceGenView report={voiceReport} /> : null}
          {o.id === "imageList" && imageList.length ? (
            <ImageListView items={imageList} />
          ) : null}
          {o.id === "imageFetch" && imageFetch.length ? (
            <ImageFetchView items={imageFetch} />
          ) : null}
          {o.id === "placement" && placement.length ? (
            <PlacementView rows={placement} />
          ) : null}
          {o.id === "validation" && (issues.length > 0 || stages.validation.status === "done") ? (
            <ValidationView issues={issues} />
          ) : null}
        </StageCard>
      ))}
    </section>
  );
}

// --- Cards ---------------------------------------------------------------

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-[10px] text-kkang-ink/60">{label}</span>
      {children}
    </label>
  );
}

function StageCard({
  index,
  icon,
  title,
  hint,
  state,
  children,
}: {
  index: number;
  icon: string;
  title: string;
  hint: string;
  state: StageState;
  children?: React.ReactNode;
}) {
  const took =
    state.startedAt && state.finishedAt
      ? `${(state.finishedAt - state.startedAt).toFixed(0)}ms`
      : null;
  const pill =
    state.status === "running"
      ? "bg-blue-100 text-blue-800"
      : state.status === "done"
        ? "bg-green-100 text-green-800"
        : state.status === "failed"
          ? "bg-red-100 text-red-800"
          : state.status === "skipped"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-kkang-cream text-kkang-ink/60";
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <header className="mb-3 flex items-center gap-3">
        <span className="text-sm font-bold text-kkang-ink/40">#{index}</span>
        <span aria-hidden className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="text-base font-bold text-kkang-ink">{title}</div>
          <div className="text-xs text-kkang-ink/50">{hint}</div>
        </div>
        <div className="flex items-center gap-2">
          {took ? <span className="text-[11px] text-kkang-ink/50">{took}</span> : null}
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${pill}`}>
            {state.status}
          </span>
        </div>
      </header>
      {state.error ? (
        <p className="mb-2 rounded-xl bg-red-50 p-2 text-xs text-red-700">{state.error}</p>
      ) : null}
      {children}
    </div>
  );
}

// --- Per-stage views -----------------------------------------------------

function InputView({ input, mode }: { input: AuthorInput; mode?: "natural" | "form" | "both" }) {
  const fmt = (label: string, v?: string | string[] | number) => {
    if (v === undefined || v === null) return null;
    if (Array.isArray(v)) {
      if (v.length === 0) return null;
      return (
        <li>
          <span className="text-kkang-ink/50">{label}:</span> {v.join(", ")}
        </li>
      );
    }
    return (
      <li>
        <span className="text-kkang-ink/50">{label}:</span> {String(v)}
      </li>
    );
  };
  return (
    <div className="space-y-2">
      {mode ? (
        <div className="text-[10px] text-kkang-ink/50">
          모드: <strong>{mode}</strong> — LLM에 실제 전달되는 항목만 표시
        </div>
      ) : null}
      <ul className="space-y-1 text-xs text-kkang-ink/80">
        {fmt("자녀", input.childName)}
        {fmt("월령", input.childAgeMonths)}
        {fmt("장소", [input.placeType, input.placeDetail].filter(Boolean) as string[])}
        {fmt("이벤트", input.eventText)}
        {fmt("친구", input.friends)}
        {fmt("기타", input.others)}
        {fmt("행동", input.childActions)}
        {fmt("좋아한 것", input.childPreferences)}
        {fmt("실제 말", input.childQuote)}
        {fmt("감정", input.emotions)}
        {fmt("목표", input.goals)}
        {fmt("반복", input.repeatMode)}
        {fmt("자유 메모", input.rawText)}
      </ul>
    </div>
  );
}

function ScenarioView({ story }: { story: Story }) {
  const branches = story.scenes.reduce((n, s) => n + s.choices.length, 0);
  return (
    <div className="space-y-2 text-xs text-kkang-ink/80">
      <div>
        <strong>{story.title}</strong> · {story.subtitle}
      </div>
      <div>
        장면 {story.scenes.length}개 · 분기 {branches}개 · 약 {story.estimatedMinutes}분
      </div>
      <details>
        <summary className="cursor-pointer text-kkang-ink/60">JSON 전체 보기</summary>
        <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-kkang-ivory p-3 text-[10px] leading-relaxed">
          {JSON.stringify(story, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function VoiceListView({ lines }: { lines: string[] }) {
  const total = lines.reduce((n, l) => n + l.length, 0);
  return (
    <div className="space-y-2 text-xs text-kkang-ink/80">
      <div>
        총 {lines.length}개 라인 · 글자 {total}자
      </div>
      <ol className="max-h-60 space-y-1 overflow-auto pl-5 text-[11px]">
        {lines.map((l, i) => (
          <li key={i} className="list-decimal">{l}</li>
        ))}
      </ol>
    </div>
  );
}

function VoiceGenView({ report }: { report: WarmReport }) {
  return (
    <div className="space-y-1 text-xs text-kkang-ink/80">
      <div>
        새로 캐시 <strong>{report.newWarm}</strong> · 적중 {report.hit} · 실패 {report.failed}
      </div>
      <div>ElevenLabs 글자 사용: {report.charsBilled}자 (Free 10k자/월 한도)</div>
      {report.skippedReason ? (
        <div className="text-yellow-700">스킵 사유: {report.skippedReason}</div>
      ) : null}
    </div>
  );
}

function ImageListView({ items }: { items: { label: string; orientation: string }[] }) {
  return (
    <div className="space-y-1 text-xs text-kkang-ink/80">
      <div>총 {items.length}개 이미지 검색 대상</div>
      <ul className="max-h-60 space-y-1 overflow-auto text-[11px]">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`}>
            <span className="text-kkang-ink/50">[{it.orientation}]</span> {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImageFetchView({ items }: { items: ImgFetchItem[] }) {
  const ok = items.filter((i) => i.url).length;
  return (
    <div className="space-y-2 text-xs text-kkang-ink/80">
      <div>
        성공 <strong>{ok}</strong> / 실패 {items.length - ok} (캐시 적중{" "}
        {items.filter((i) => i.cacheHit).length})
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {items.map((it, i) => (
          <div
            key={`${it.label}-${i}`}
            className="overflow-hidden rounded-xl bg-kkang-ivory text-[10px]"
          >
            <div className="aspect-square bg-kkang-cream">
              {it.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.url} alt="" aria-hidden className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl">❌</div>
              )}
            </div>
            <div className="p-1 truncate text-kkang-ink/70">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlacementView({ rows }: { rows: PlacementRow[] }) {
  return (
    <div className="space-y-3 text-xs text-kkang-ink/80">
      {rows.map((r) => (
        <div key={r.sceneId} className="rounded-xl bg-kkang-ivory p-3">
          <div className="font-semibold">
            {r.sceneId} · {r.placeId}
          </div>
          <div className="mt-1 text-[11px] text-kkang-ink/70">
            🎙️ 음성: {r.audioFile ? `mp3 ${r.audioFile}` : r.spokenLine ? `TTS "${r.spokenLine}"` : "❌ 없음"}
          </div>
          <div className="mt-1 text-[11px] text-kkang-ink/70">
            🖼️ 배경: {r.bgImage ? "✓ 매핑됨" : "— Pexels 결과 없음 → emoji 폴백"}
          </div>
          {r.choices.length > 0 ? (
            <ul className="mt-2 space-y-0.5 text-[11px]">
              {r.choices.map((c, i) => (
                <li key={i}>
                  {c.emoji} {c.label}{" "}
                  {c.image ? "✓이미지" : "—이미지없음"}{" "}
                  {c.responseLine ? "✓반응대사" : "—반응없음"}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1 text-[11px] text-kkang-ink/50">마지막 장면 (선택지 없음)</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ValidationView({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="text-sm text-green-700">✅ 모든 검증 통과 — 아이에게 배포 가능</div>
    );
  }
  return (
    <ul className="space-y-1 text-xs">
      {issues.map((it, i) => (
        <li
          key={i}
          className={
            it.level === "error"
              ? "text-red-700"
              : "text-yellow-800"
          }
        >
          {it.level === "error" ? "🔴" : "⚠️"} {it.msg}
        </li>
      ))}
    </ul>
  );
}
