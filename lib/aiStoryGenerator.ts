// AI scenario writer. Calls OpenAI gpt-4o-mini with response_format=json_object
// and a strict schema. Output is a fully-fleshed Story including spokenLine
// per scene and responseLine per choice — ready to feed to TTS pre-warm.
//
// Uses the existing sanitize/system-prompt guardrails (handoff §3.3) so
// the persona stays "깡총이, NOT 엄마" even when the cloned voice IS the
// parent's voice.
//
// Cost: ~$0.001 per story (gpt-4o-mini, ~1500 tokens). Cached via the
// existing LLM cache (lib/aiCache.ts → "llm" store) so the same input
// returns the same output for free on retry.

import { getCachedText, hashKey, putCachedText } from "@/lib/aiCache";
import { CHARACTER_VOICE_SYSTEM_PROMPT, sanitizeCharacterVoice } from "@/lib/characterVoice";
import { getProviderMode } from "@/lib/providers";
import type { Choice, Scene, Story } from "@/types/story";

// Pedagogical goals — addendum-aligned (handoff §2.2). Multiple OK.
export type AuthorGoal = "회상" | "순서" | "어휘" | "감정" | "사회성";

// Variation strategy (handoff §2.2 — 반복 40% / 변주 40% / 신규 20%).
export type AuthorRepeatMode = "repeat" | "variation" | "new";

export type AuthorInput = {
  // --- child profile (from settings) ---
  childName: string;
  childAgeMonths?: number;

  // --- natural-language fallback ---
  rawText?: string;

  // --- 장소 ---
  placeType?: string;          // 어린이집 / 마트 / 공원 / 집 / ...
  placeDetail?: string;        // 교실 / 과일 코너 / 침실 ...

  // --- 있었던 일 ---
  eventText?: string;

  // --- 함께한 사람 ---
  friends?: string[];          // ["시현이"]
  others?: string[];           // ["선생님", "엄마", ...]

  // --- 아이 행동 (시나리오 분기 후보) ---
  childActions?: string[];     // ["블록을 쌓았어", "자동차라고 말했어", ...]

  // --- 좋아한 것 (반복 노출 어휘) ---
  childPreferences?: string[]; // ["블록", "자동차", "시현이"]
  // legacy single field kept for backward compat
  childPreference?: string;

  // --- 아이 실제 말 ---
  childQuote?: string;         // "자동차 만들었어"

  // --- 감정 ---
  emotions?: string[];         // ["신남", "뿌듯함"]

  // --- 목표 ---
  goals?: AuthorGoal[];        // ["회상", "순서", "어휘"]

  // --- 반복 방식 ---
  repeatMode?: AuthorRepeatMode;

  // legacy: single placeName for older callers
  placeName?: string;
};

export class AIGeneratorError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
    this.name = "AIGeneratorError";
  }
}

// Multi-provider config (OpenAI / Grok) lives server-side only —
// see app/api/generate-story/route.ts. Client never sees the API key.

const SCHEMA_INSTRUCTION = `
JSON 스키마 (이 형식만 출력. 마크다운 펜스/주석/설명 금지):

{
  "title": "한국어, 8자 이내",
  "subtitle": "한국어, 20자 이내, 예: '어린이집 다녀와서'",
  "tags": ["회상","모험","일상","잠자기","먹기","놀이"] 중 1개 이상,
  "estimatedMinutes": 2~7 정수,
  "coverImageQuery": "Pexels 영어 키워드, 예: 'korean kindergarten classroom'",
  "themeId": "theme_today" | "theme_mart" | "theme_park" | "theme_bedtime" | "theme_morning" | "theme_book",
  "scenes": [
    {
      "id": "s1" | "s2" | ...,
      "placeId": "kinder_lunch" 같은 영어 lowercase,
      "visual": "이모지 1~3개만 (한글 금지)",
      "spokenLine": "장면 진입 시 깡총이가 말하는 한국어 한 문장",
      "parentSummary": "부모 로그용 한국어 한 줄",
      "choices": [
        {
          "id": "lowercase id",
          "emoji": "이모지 1자",
          "parentLabel": "한국어 2~6자",
          "responseLine": "이 선택을 누르면 깡총이가 하는 한국어 한 문장",
          "nextSceneId": "다음 scene id 또는 null"
        }
      ]
    }
  ]
}

【시나리오 작가 룰 — 영화 시나리오 수준으로 정성껏】

1. 톤
- 동화책 한 페이지처럼 따뜻하고 운율감 있는 한국어
- 27개월 아이가 알아듣기 쉬운 짧은 문장 (한 문장 6~10어절)
- 깡총이는 엄마가 아니다. "엄마가~", "엄마 말~" 절대 금지. "내가~", "깡총이가~", "우리 같이~"

2. 자녀 개인화 (제공된 입력 그대로 활용)
- 자녀 이름은 spokenLine/responseLine에 자연스럽게 포함
- 함께한 사람(친구·선생님 등) 이름을 그대로 인용
- 아이가 실제로 한 말이 있으면 1번 이상 인용 또는 재진술 ("아까 [실제 말] 했지!")
- 좋아한 것은 어휘 반복 노출의 핵심 — 여러 scene/choice에 자연스럽게 등장
- 감정(신남/뿌듯함 등)을 spokenLine에서 부드럽게 미러링

3. 분기 설계 (handoff §3 — 풍부한 분기, 단순한 화면)
- 장면 3~5개
- 한 화면 노출 선택지는 2~3개 (사람이 한 행동·좋아한 것 중심)
- 각 choice의 responseLine은 그 선택을 했을 때 깡총이의 따뜻한 반응 + 어휘 재진술
- 마지막 scene은 choices 빈 배열 OR 모든 choice의 nextSceneId가 null

4. 목표 반영
- 회상 목표: 순서를 묻는 질문 ("먼저 무엇을 했지?")
- 순서 목표: "그 다음에는?" 같이 시간 흐름 강조
- 어휘 목표: 좋아한 것 + 행동 어휘를 다양한 문장에 반복 노출
- 감정 목표: "기분이 어땠어?" 같은 감정 묻기 1회 이상
- 사회성 목표: 함께한 사람과의 상호작용 묻기

5. 반복 방식
- variation: 비슷한 장소·이벤트의 변주 (다른 친구·다른 사물)
- repeat: 같은 장소·같은 사물 그대로 반복 (운율 강화)
- new: 완전 신규 장소·이벤트 (도전 어휘)

6. visual 이모지
- 장면 분위기를 나타내는 이모지 1~3개. 한글 텍스트 절대 금지

7. coverImageQuery
- Pexels에 잘 검색되는 짧은 영어 키워드. "korean kindergarten classroom kids"

8. 출력은 오직 JSON 객체. 다른 텍스트 일체 금지.
`.trim();

function fmtList(label: string, items?: string[] | string): string | null {
  if (!items) return null;
  if (Array.isArray(items)) {
    if (items.length === 0) return null;
    return `${label}: ${items.join(", ")}`;
  }
  if (!items.trim()) return null;
  return `${label}: ${items}`;
}

function buildUserMessage(input: AuthorInput): string {
  const lines: string[] = [];
  lines.push(`[자녀] ${input.childName}` + (input.childAgeMonths ? ` (${input.childAgeMonths}개월)` : ""));

  // 장소
  const place: string[] = [];
  if (input.placeType) place.push(input.placeType);
  if (input.placeDetail) place.push(input.placeDetail);
  if (place.length === 0 && input.placeName) place.push(input.placeName);
  if (place.length) lines.push(`[장소] ${place.join(" · ")}`);

  // 있었던 일
  if (input.eventText) lines.push(`[있었던 일] ${input.eventText}`);

  // 함께한 사람
  const peopleLines: string[] = [];
  const f = fmtList("친구", input.friends);
  const o = fmtList("기타", input.others);
  if (f) peopleLines.push(f);
  if (o) peopleLines.push(o);
  if (peopleLines.length) lines.push(`[함께한 사람] ${peopleLines.join(" / ")}`);

  // 행동
  const actions = fmtList("아이 행동", input.childActions);
  if (actions) lines.push(`[${actions}]`);

  // 좋아한 것
  const prefs: string[] = [];
  if (input.childPreferences && input.childPreferences.length) prefs.push(...input.childPreferences);
  if (input.childPreference) prefs.push(input.childPreference);
  if (prefs.length) lines.push(`[좋아한 것] ${prefs.join(", ")}`);

  // 아이 실제 말
  if (input.childQuote) lines.push(`[아이 실제 말] "${input.childQuote}"`);

  // 감정
  const emo = fmtList("감정", input.emotions);
  if (emo) lines.push(`[${emo}]`);

  // 목표
  const goals = fmtList("목표", input.goals);
  if (goals) lines.push(`[${goals}]`);

  // 반복 방식
  if (input.repeatMode) {
    const modeLabel: Record<AuthorRepeatMode, string> = {
      repeat: "동일 반복 (운율 강화)",
      variation: "비슷한 이야기 변주",
      new: "완전 신규",
    };
    lines.push(`[반복 방식] ${modeLabel[input.repeatMode]}`);
  }

  // 자유 메모
  if (input.rawText) {
    lines.push("");
    lines.push("[부모 자유 메모]");
    lines.push(input.rawText);
  }

  return lines.join("\n");
}

type RawAIScene = {
  id: string;
  placeId: string;
  visual: string;
  spokenLine: string;
  parentSummary: string;
  choices: Array<{
    id: string;
    emoji: string;
    parentLabel: string;
    responseLine?: string;
    nextSceneId: string | null;
  }>;
};

type RawAIStory = {
  title: string;
  subtitle: string;
  tags: string[];
  estimatedMinutes: number;
  coverImageQuery: string;
  themeId: string;
  scenes: RawAIScene[];
};

function sanitizeStory(raw: RawAIStory, input: AuthorInput): Story {
  const id = `auto_${Date.now().toString(36)}`;
  const scenes: Scene[] = raw.scenes.map((s) => {
    const choices: Choice[] = s.choices.map((c) => ({
      id: c.id || `${s.id}_${Math.random().toString(36).slice(2, 6)}`,
      emoji: c.emoji || "✨",
      parentLabel: c.parentLabel || "선택",
      nextSceneId: c.nextSceneId,
      responseLine: c.responseLine
        ? sanitizeCharacterVoice(c.responseLine)
        : undefined,
    }));
    return {
      id: s.id,
      placeId: s.placeId || "auto",
      visual: s.visual || "✨",
      spokenLine: sanitizeCharacterVoice(s.spokenLine || ""),
      parentSummary: s.parentSummary || "",
      choices,
    };
  });

  const story: Story = {
    id,
    themeId: raw.themeId || "theme_today",
    title: raw.title || "이야기",
    subtitle: raw.subtitle,
    tags: (raw.tags as Story["tags"]) ?? ["일상"],
    estimatedMinutes: raw.estimatedMinutes ?? 3,
    coverImageQuery: raw.coverImageQuery,
    coverEmoji: "🎀",
    scenes,
    startSceneId: scenes[0]?.id ?? "s1",
    status: "draft",
    draftAt: new Date().toISOString(),
    generatedFromInput: input.rawText ?? buildUserMessage(input).slice(0, 500),
  };
  return story;
}

export async function generateStoryWithAI(input: AuthorInput): Promise<Story> {
  if (!input.childName?.trim()) {
    throw new AIGeneratorError("자녀 이름이 필요합니다.");
  }

  if (getProviderMode() !== "real") {
    throw new AIGeneratorError(
      "AI 생성은 real provider 모드에서만 가능합니다.",
      "NEXT_PUBLIC_PROVIDER=real + OPENAI_API_KEY 를 .env.local에 설정해 주세요.",
    );
  }

  const userMsg = buildUserMessage(input);

  // Cache by user message — server uses the same systemPrompt internally.
  const cacheKey = await hashKey(["aistory.v2", userMsg]);
  const cached = await getCachedText(cacheKey);
  let parsed: RawAIStory;
  if (cached) {
    try {
      parsed = JSON.parse(cached) as RawAIStory;
    } catch {
      // cache poisoned — fall through to refetch
      parsed = (await callServerRoute(userMsg)) as RawAIStory;
      await putCachedText(cacheKey, JSON.stringify(parsed));
    }
  } else {
    parsed = (await callServerRoute(userMsg)) as RawAIStory;
    await putCachedText(cacheKey, JSON.stringify(parsed));
  }

  if (!parsed.scenes || parsed.scenes.length === 0) {
    throw new AIGeneratorError("AI가 빈 시나리오를 반환했습니다.", "재시도 권장.");
  }

  return sanitizeStory(parsed, input);
}

// Calls the server route /api/generate-story. The OPENAI_API_KEY only
// exists server-side; client-side process.env doesn't see it. Failures
// surface with friendly Korean hints (401 / 429 / 403 / etc.).
async function callServerRoute(userMessage: string): Promise<RawAIStory> {
  let res: Response;
  try {
    res = await fetch("/api/generate-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage }),
    });
  } catch (e) {
    throw new AIGeneratorError("/api/generate-story 호출 실패", (e as Error).message);
  }
  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    hint?: string;
    story?: unknown;
  };
  if (!res.ok || !json.ok) {
    throw new AIGeneratorError(
      json.error || `/api/generate-story returned ${res.status}`,
      json.hint,
    );
  }
  return json.story as RawAIStory;
}
