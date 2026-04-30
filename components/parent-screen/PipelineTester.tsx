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

type ValidationAction =
  | { kind: "regenerate-scenario"; label: string }
  | { kind: "regenerate-voice"; label: string }
  | { kind: "retry-failed-images"; label: string }
  | { kind: "retry-validation"; label: string };

type ValidationIssue = {
  level: "warn" | "error";
  msg: string;
  action?: ValidationAction;
};

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

  // Parse the natural-language textarea into 9 form fields via LLM.
  // Auto-switches mode to "form" so the parsed values actually get used.
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const parseNatural = async () => {
    if (!rawText.trim()) {
      setParseError("자연어 textarea가 비어 있습니다.");
      return;
    }
    setParseError(null);
    setParsing(true);
    try {
      const res = await fetch("/api/parse-natural", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawText.trim() }),
      });
      const j = (await res.json()) as { ok: boolean; fields?: Record<string, unknown>; error?: string };
      if (!j.ok || !j.fields) {
        setParseError(j.error || "변환 실패");
        return;
      }
      const f = j.fields;
      setInput((prev) => ({
        ...prev,
        placeType: typeof f.placeType === "string" && f.placeType ? f.placeType : prev.placeType,
        placeDetail: typeof f.placeDetail === "string" ? f.placeDetail : prev.placeDetail,
        eventText: typeof f.eventText === "string" && f.eventText ? f.eventText : prev.eventText,
        friends: Array.isArray(f.friends) ? (f.friends as string[]) : prev.friends,
        others: Array.isArray(f.others) ? (f.others as string[]) : prev.others,
        childActions: Array.isArray(f.childActions) ? (f.childActions as string[]) : prev.childActions,
        childPreferences: Array.isArray(f.childPreferences) ? (f.childPreferences as string[]) : prev.childPreferences,
        childQuote: typeof f.childQuote === "string" ? f.childQuote : prev.childQuote,
        emotions: Array.isArray(f.emotions) ? (f.emotions as string[]) : prev.emotions,
        goals: Array.isArray(f.goals) ? (f.goals as ("회상"|"순서"|"어휘"|"감정"|"사회성")[]) : prev.goals,
        repeatMode:
          f.repeatMode === "repeat" || f.repeatMode === "new" || f.repeatMode === "variation"
            ? f.repeatMode
            : prev.repeatMode,
      }));
      setEditing(true);
      setInputMode("form");
    } catch (e) {
      setParseError((e as Error).message);
    } finally {
      setParsing(false);
    }
  };

  // Env check — reads /api/env-check on mount.
  type EnvCheck = {
    NEXT_PUBLIC_PROVIDER: string | null;
    LLM_VENDOR?: string;
    OPENAI_API_KEY: { present: boolean; length: number };
    GROK_API_KEY?: { present: boolean; length: number };
    ELEVENLABS_API_KEY: { present: boolean; length: number };
    ELEVENLABS_VOICE_ID: { present: boolean; length: number };
    PEXELS_API_KEY: { present: boolean; length: number };
  };
  const [envCheck, setEnvCheck] = useState<EnvCheck | null>(null);
  useEffect(() => {
    fetch("/api/env-check")
      .then((r) => r.json())
      .then((j: EnvCheck) => setEnvCheck(j))
      .catch(() => undefined);
  }, []);

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

  // --- Per-stage runners --------------------------------------------------
  // Each one is callable in isolation so the failed-cell retry buttons in
  // the validation grid can fix only what broke. They mutate state and
  // return what the next stage in the chain needs.

  async function runScenario(): Promise<Story | null> {
    setStage("scenario", { status: "running", startedAt: Date.now(), error: undefined });
    try {
      const s = await generateStoryWithAI(composeInput());
      setScenario(s);
      setStage("scenario", { status: "done", finishedAt: Date.now() });
      return s;
    } catch (e) {
      const err = e as AIGeneratorError;
      setStage("scenario", {
        status: "failed",
        finishedAt: Date.now(),
        error: `${err.message}${err.hint ? " — " + err.hint : ""}`,
      });
      return null;
    }
  }

  function runVoiceList(s: Story): string[] {
    setStage("voiceList", { status: "running", startedAt: Date.now(), error: undefined });
    const lines = collectStoryLines(s);
    setVoiceList(lines);
    setStage("voiceList", { status: "done", finishedAt: Date.now() });
    return lines;
  }

  async function runVoiceGen(lines: string[]): Promise<WarmReport> {
    setStage("voiceGen", { status: "running", startedAt: Date.now(), error: undefined });
    const vr = await warmTTSPhrases(lines);
    setVoiceReport(vr);
    setStage("voiceGen", {
      status: vr.skippedReason ? "skipped" : vr.failed > 0 ? "failed" : "done",
      finishedAt: Date.now(),
      error: vr.skippedReason
        ? vr.skippedReason === "mock_mode"
          ? "Mock 모드 — TTS 호출 스킵"
          : "Provider 미지원"
        : vr.failed > 0
          ? `${vr.failed}개 실패 — ELEVENLABS 키/voice id 확인`
          : undefined,
    });
    return vr;
  }

  function runImageList(s: Story): Array<{ label: string; orientation: "square" | "landscape" }> {
    setStage("imageList", { status: "running", startedAt: Date.now(), error: undefined });
    const labels = collectStoryImageLabels(s);
    const list: Array<{ label: string; orientation: "square" | "landscape" }> = [
      ...labels.landscape.map((l) => ({ label: l, orientation: "landscape" as const })),
      ...labels.square.map((l) => ({ label: l, orientation: "square" as const })),
    ];
    setImageList(list);
    setStage("imageList", { status: "done", finishedAt: Date.now() });
    return list;
  }

  async function fetchOneImage(
    item: { label: string; orientation: "square" | "landscape" },
    bypassCache = false,
  ): Promise<ImgFetchItem> {
    const cacheKey = await hashKey(["img", "pexels", item.label, item.orientation]);
    if (!bypassCache) {
      const cached = await getCachedImageUrl(cacheKey);
      if (cached) return { ...item, url: cached, cacheHit: true };
    }
    try {
      const res = await fetch("/api/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: item.label, orientation: item.orientation }),
      });
      if (!res.ok) return { ...item, url: null, cacheHit: false };
      const json = (await res.json()) as { ok: boolean; found: boolean; url?: string };
      const url = json.ok && json.found && json.url ? json.url : null;
      if (url) await putCachedImageUrl(cacheKey, url);
      return { ...item, url, cacheHit: false };
    } catch {
      return { ...item, url: null, cacheHit: false };
    }
  }

  async function runImageFetch(
    list: Array<{ label: string; orientation: "square" | "landscape" }>,
  ): Promise<ImgFetchItem[]> {
    setStage("imageFetch", { status: "running", startedAt: Date.now(), error: undefined });
    const fetched: ImgFetchItem[] = [];
    for (const item of list) {
      fetched.push(await fetchOneImage(item));
    }
    setImageFetch(fetched);
    const failedCount = fetched.filter((f) => !f.url).length;
    setStage("imageFetch", {
      status: failedCount > 0 ? "failed" : "done",
      finishedAt: Date.now(),
      error: failedCount > 0 ? `${failedCount}개 검색 실패` : undefined,
    });
    return fetched;
  }

  function runPlacement(s: Story, fetched: ImgFetchItem[]): PlacementRow[] {
    setStage("placement", { status: "running", startedAt: Date.now(), error: undefined });
    const urlByLabel = new Map<string, string>();
    for (const f of fetched) if (f.url) urlByLabel.set(f.label, f.url);
    const rows: PlacementRow[] = s.scenes.map((sc) => ({
      sceneId: sc.id,
      placeId: sc.placeId,
      spokenLine: sc.spokenLine,
      audioFile: sc.audioFile,
      bgImage:
        urlByLabel.get(sc.placeId) ?? urlByLabel.get(sc.parentSummary?.split(/\s+/)[0] ?? ""),
      choices: sc.choices.map((c) => ({
        label: c.parentLabel,
        emoji: c.emoji,
        responseLine: c.responseLine,
        image: urlByLabel.get(c.parentLabel),
      })),
    }));
    setPlacement(rows);
    setStage("placement", { status: "done", finishedAt: Date.now() });
    return rows;
  }

  function runValidation(s: Story, vr: WarmReport, fetched: ImgFetchItem[]): ValidationIssue[] {
    setStage("validation", { status: "running", startedAt: Date.now(), error: undefined });
    const probs: ValidationIssue[] = [];
    if (s.scenes.length < 3) {
      probs.push({
        level: "error",
        msg: `장면이 ${s.scenes.length}개 — 최소 3개 권장`,
        action: { kind: "regenerate-scenario", label: "시나리오 재생성" },
      });
    }
    if (s.scenes.length > 5) {
      probs.push({
        level: "warn",
        msg: `장면이 ${s.scenes.length}개 — 5개 이하 권장`,
        action: { kind: "regenerate-scenario", label: "시나리오 재생성" },
      });
    }
    let totalBranches = 0;
    for (const sc of s.scenes) totalBranches += sc.choices.length;
    if (totalBranches < 5) {
      probs.push({
        level: "warn",
        msg: `총 분기 ${totalBranches}개 (handoff §3 권장: ≥5)`,
        action: { kind: "regenerate-scenario", label: "시나리오 재생성" },
      });
    }
    for (const sc of s.scenes) {
      if (!sc.spokenLine && !sc.audioFile) {
        probs.push({
          level: "error",
          msg: `${sc.id}: spokenLine과 audioFile 둘 다 없음 — 장면 무음`,
          action: { kind: "regenerate-scenario", label: "시나리오 재생성" },
        });
      }
      if (sc.choices.length > 3) {
        probs.push({
          level: "warn",
          msg: `${sc.id}: 선택지 ${sc.choices.length}개 (한 화면 ≤3)`,
          action: { kind: "regenerate-scenario", label: "시나리오 재생성" },
        });
      }
      for (const c of sc.choices) {
        if (!c.responseLine) {
          probs.push({
            level: "warn",
            msg: `${sc.id}/${c.id}: responseLine 없음 — 깡총이 반응 X`,
            action: { kind: "regenerate-scenario", label: "시나리오 재생성" },
          });
        }
      }
    }
    if (vr.failed > 0) {
      probs.push({
        level: "error",
        msg: `TTS 실패 ${vr.failed}개`,
        action: { kind: "regenerate-voice", label: "목소리 재생성" },
      });
    }
    const imgFailed = fetched.filter((f) => !f.url).length;
    if (imgFailed > 0) {
      probs.push({
        level: "warn",
        msg: `이미지 ${imgFailed}개 검색 실패 — emoji 폴백 사용됨`,
        action: { kind: "retry-failed-images", label: "실패 이미지만 재시도" },
      });
    }
    setIssues(probs);
    setStage("validation", {
      status: probs.some((p) => p.level === "error") ? "failed" : "done",
      finishedAt: Date.now(),
    });
    return probs;
  }

  // Full chain (▶ 테스트 실행).
  const runAll = async () => {
    if (running) return;
    setRunning(true);
    resetAll();

    const t0 = Date.now();
    setStage("input", { status: "done", startedAt: t0, finishedAt: Date.now() });

    const s = await runScenario();
    if (!s) {
      setRunning(false);
      return;
    }
    const lines = runVoiceList(s);
    const vr = await runVoiceGen(lines);
    const list = runImageList(s);
    const fetched = await runImageFetch(list);
    runPlacement(s, fetched);
    runValidation(s, vr, fetched);

    setRunning(false);
  };

  // Re-run a single stage and everything downstream from it. Used by the
  // per-card "🔄 다시" button and by validation-issue action buttons.
  const retryFromStage = async (id: StageId) => {
    if (running) return;
    setRunning(true);
    try {
      let s = scenario;
      let lines = voiceList;
      let vr = voiceReport;
      let list = imageList;
      let fetched = imageFetch;

      const stages: StageId[] = [
        "scenario",
        "voiceList",
        "voiceGen",
        "imageList",
        "imageFetch",
        "placement",
        "validation",
      ];
      const startIdx = stages.indexOf(id);
      if (startIdx === -1) return;

      for (let i = startIdx; i < stages.length; i++) {
        const stageId = stages[i];
        if (stageId === "scenario") {
          s = await runScenario();
          if (!s) return;
        } else if (stageId === "voiceList") {
          if (!s) return;
          lines = runVoiceList(s);
        } else if (stageId === "voiceGen") {
          vr = await runVoiceGen(lines);
        } else if (stageId === "imageList") {
          if (!s) return;
          list = runImageList(s);
        } else if (stageId === "imageFetch") {
          fetched = await runImageFetch(list);
        } else if (stageId === "placement") {
          if (!s) return;
          runPlacement(s, fetched);
        } else if (stageId === "validation") {
          if (!s || !vr) return;
          runValidation(s, vr, fetched);
        }
      }
    } finally {
      setRunning(false);
    }
  };

  // Refetch only images that previously came back null. Cheaper than
  // re-running the whole image stage.
  const retryFailedImages = async () => {
    if (running) return;
    if (imageFetch.length === 0) return;
    setRunning(true);
    setStage("imageFetch", { status: "running", startedAt: Date.now(), error: undefined });
    try {
      const next: ImgFetchItem[] = [];
      for (const it of imageFetch) {
        if (it.url) {
          next.push(it);
          continue;
        }
        next.push(await fetchOneImage({ label: it.label, orientation: it.orientation }, true));
      }
      setImageFetch(next);
      const failedCount = next.filter((f) => !f.url).length;
      setStage("imageFetch", {
        status: failedCount > 0 ? "failed" : "done",
        finishedAt: Date.now(),
        error: failedCount > 0 ? `${failedCount}개 검색 실패` : undefined,
      });
      if (scenario) {
        runPlacement(scenario, next);
        if (voiceReport) runValidation(scenario, voiceReport, next);
      }
    } finally {
      setRunning(false);
    }
  };

  const runValidationOnly = () => {
    if (!scenario || !voiceReport) return;
    runValidation(scenario, voiceReport, imageFetch);
  };

  const handleIssueAction = async (action: ValidationAction) => {
    switch (action.kind) {
      case "regenerate-scenario":
        await retryFromStage("scenario");
        break;
      case "regenerate-voice":
        await retryFromStage("voiceGen");
        break;
      case "retry-failed-images":
        await retryFailedImages();
        break;
      case "retry-validation":
        runValidationOnly();
        break;
    }
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

      {/* Provider diagnostic — server reads .env.local so this is the
          source of truth, not the client bundle. */}
      <div className="rounded-2xl bg-kkang-cream/70 p-3 text-xs shadow-soft">
        <div className="font-semibold text-kkang-ink">환경 진단 (.env.local)</div>
        {envCheck ? (
          <ul className="mt-1 grid grid-cols-1 gap-0.5 text-kkang-ink/80 sm:grid-cols-2">
            <li>
              NEXT_PUBLIC_PROVIDER ={" "}
              <code className="rounded bg-white/60 px-1">
                {envCheck.NEXT_PUBLIC_PROVIDER ?? "(unset)"}
              </code>{" "}
              {envCheck.NEXT_PUBLIC_PROVIDER === "real" ? "✅" : "⚠️ 'real' 필요"}
            </li>
            <li>
              LLM_VENDOR ={" "}
              <code className="rounded bg-white/60 px-1">
                {envCheck.LLM_VENDOR ?? "openai"}
              </code>
            </li>
            <li>
              OPENAI_API_KEY {envCheck.OPENAI_API_KEY.present ? "✅" : "❌"}{" "}
              <span className="text-kkang-ink/50">
                ({envCheck.OPENAI_API_KEY.length}자)
              </span>
            </li>
            <li>
              ELEVENLABS_API_KEY{" "}
              {envCheck.ELEVENLABS_API_KEY.present ? "✅" : "❌"}{" "}
              <span className="text-kkang-ink/50">
                ({envCheck.ELEVENLABS_API_KEY.length}자)
              </span>
            </li>
            <li>
              ELEVENLABS_VOICE_ID{" "}
              {envCheck.ELEVENLABS_VOICE_ID.present ? "✅" : "❌"}{" "}
              <span className="text-kkang-ink/50">
                ({envCheck.ELEVENLABS_VOICE_ID.length}자)
              </span>
            </li>
            <li>
              PEXELS_API_KEY{" "}
              {envCheck.PEXELS_API_KEY.present ? "✅" : "❌"}{" "}
              <span className="text-kkang-ink/50">
                ({envCheck.PEXELS_API_KEY.length}자)
              </span>
            </li>
          </ul>
        ) : (
          <p className="mt-1 text-kkang-ink/50">진단 불러오는 중…</p>
        )}
        {envCheck && !envCheck.OPENAI_API_KEY.present ? (
          <p className="mt-2 rounded-xl bg-yellow-100 p-2 text-yellow-900">
            <strong>OPENAI_API_KEY 미인식.</strong> 흔한 원인:
            <br />• 파일 이름이 <code>.env.local.txt</code> (Notepad 자동 확장자)
            <br />• <code>.env.local</code>이 아니라 <code>.env</code>에 넣음
            <br />• 키 앞뒤 공백 또는 따옴표 들어감
            <br />• <strong>dev 서버 재시작 안 함</strong> (env는 서버 시작 시 1회만 읽음)
          </p>
        ) : null}
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
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={applyRawText}
                className="rounded-xl bg-kkang-cream px-3 py-2 text-xs shadow-soft active:scale-[0.99]"
              >
                적용
              </button>
              <button
                type="button"
                onClick={parseNatural}
                disabled={parsing || !rawText.trim()}
                className="rounded-xl bg-kkang-pink px-3 py-2 text-xs font-bold shadow-pop active:scale-[0.99] disabled:opacity-50"
                title="LLM이 자연어를 9개 폼 항목으로 자동 분해합니다"
              >
                {parsing ? "변환중…" : "✨ 폼으로"}
              </button>
            </div>
          </div>
          {parseError ? (
            <p className="mt-1 text-[10px] text-red-700">{parseError}</p>
          ) : null}
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
          onRetry={
            o.id === "input"
              ? undefined
              : () => retryFromStage(o.id)
          }
          retryDisabled={running || (o.id !== "scenario" && !scenario)}
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
            <ImageFetchView
              items={imageFetch}
              onRetryFailed={
                imageFetch.some((f) => !f.url) && !running
                  ? retryFailedImages
                  : undefined
              }
            />
          ) : null}
          {o.id === "placement" && placement.length ? (
            <PlacementView rows={placement} />
          ) : null}
          {o.id === "validation" && (issues.length > 0 || stages.validation.status === "done") ? (
            <ValidationView
              issues={issues}
              onAction={handleIssueAction}
              busy={running}
            />
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
  onRetry,
  retryDisabled,
  children,
}: {
  index: number;
  icon: string;
  title: string;
  hint: string;
  state: StageState;
  onRetry?: () => void;
  retryDisabled?: boolean;
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
  // Show the retry button once the stage has actually run at least once,
  // or when it ended in a recoverable state (failed/skipped/done).
  const showRetry =
    onRetry &&
    (state.status === "failed" ||
      state.status === "done" ||
      state.status === "skipped");
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
          {showRetry ? (
            <button
              type="button"
              onClick={onRetry}
              disabled={retryDisabled}
              className="rounded-lg bg-kkang-cream px-2 py-1 text-[11px] font-semibold shadow-soft active:scale-[0.98] disabled:opacity-50"
              title="이 단계부터 다시 실행"
            >
              🔄 다시
            </button>
          ) : null}
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

function ImageFetchView({
  items,
  onRetryFailed,
}: {
  items: ImgFetchItem[];
  onRetryFailed?: () => void;
}) {
  const ok = items.filter((i) => i.url).length;
  return (
    <div className="space-y-2 text-xs text-kkang-ink/80">
      <div className="flex items-center justify-between gap-2">
        <span>
          성공 <strong>{ok}</strong> / 실패 {items.length - ok} (캐시 적중{" "}
          {items.filter((i) => i.cacheHit).length})
        </span>
        {onRetryFailed ? (
          <button
            type="button"
            onClick={onRetryFailed}
            className="rounded-lg bg-kkang-pink px-2 py-1 text-[11px] font-semibold shadow-soft active:scale-[0.98]"
          >
            🔄 실패만 재시도
          </button>
        ) : null}
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

function ValidationView({
  issues,
  onAction,
  busy,
}: {
  issues: ValidationIssue[];
  onAction?: (action: ValidationAction) => void;
  busy?: boolean;
}) {
  if (issues.length === 0) {
    return (
      <div className="text-sm text-green-700">✅ 모든 검증 통과 — 아이에게 배포 가능</div>
    );
  }
  // De-duplicate "regenerate-scenario" actions in the bulk-action footer
  // (every scenario-level issue suggests the same fix).
  const bulkActions = new Map<string, ValidationAction>();
  for (const it of issues) {
    if (it.action) bulkActions.set(it.action.kind, it.action);
  }
  return (
    <div className="space-y-3 text-xs">
      <ul className="space-y-1">
        {issues.map((it, i) => (
          <li
            key={i}
            className={`flex items-start justify-between gap-2 rounded-lg px-2 py-1 ${
              it.level === "error"
                ? "bg-red-50 text-red-800"
                : "bg-yellow-50 text-yellow-900"
            }`}
          >
            <span className="flex-1">
              {it.level === "error" ? "🔴" : "⚠️"} {it.msg}
            </span>
            {it.action && onAction ? (
              <button
                type="button"
                onClick={() => onAction(it.action!)}
                disabled={busy}
                className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-kkang-ink shadow-soft active:scale-[0.98] disabled:opacity-50"
              >
                🔧 {it.action.label}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {bulkActions.size > 0 && onAction ? (
        <div className="flex flex-wrap gap-2 border-t border-kkang-beige/60 pt-2">
          <span className="self-center text-[10px] text-kkang-ink/60">일괄 조치:</span>
          {Array.from(bulkActions.values()).map((a) => (
            <button
              key={a.kind}
              type="button"
              onClick={() => onAction(a)}
              disabled={busy}
              className="rounded-lg bg-kkang-pink px-3 py-1 text-[11px] font-bold shadow-pop active:scale-[0.98] disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
