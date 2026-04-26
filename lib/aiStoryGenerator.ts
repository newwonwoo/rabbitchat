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

export type AuthorInput = {
  // Natural-language description from the parent. Either this OR the
  // structured fields below, or both.
  rawText?: string;
  // Optional structured form
  placeName?: string;
  eventText?: string;
  childName: string;
  childAgeMonths?: number;
  childPreference?: string;
};

export class AIGeneratorError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
    this.name = "AIGeneratorError";
  }
}

// Multi-provider config. xAI Grok exposes an OpenAI-compatible chat
// completions endpoint, so the same code path works for both — only
// base URL + model + key differ. Pick via LLM_VENDOR env.
type LLMVendor = "openai" | "grok";

type VendorConfig = {
  baseUrl: string;
  model: string;
  envKey: string;
};

const VENDOR_CONFIG: Record<LLMVendor, VendorConfig> = {
  openai: {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    envKey: "OPENAI_API_KEY",
  },
  grok: {
    baseUrl: "https://api.x.ai/v1/chat/completions",
    model: "grok-2-latest",
    envKey: "GROK_API_KEY",
  },
};

function getVendor(): LLMVendor {
  const raw = process.env.LLM_VENDOR;
  return raw === "grok" ? "grok" : "openai";
}

const SCHEMA_INSTRUCTION = `
Respond with ONLY a valid JSON object matching this exact schema:

{
  "title": string (max 12 chars, Korean),
  "subtitle": string (max 20 chars, Korean, e.g. "어린이집 다녀와서"),
  "tags": array of one or more from ["회상","모험","일상","잠자기","먹기","놀이"],
  "estimatedMinutes": integer between 2 and 7,
  "coverImageQuery": string (short English phrase for Pexels image search, e.g. "korean kindergarten classroom"),
  "themeId": one of "theme_today","theme_mart","theme_park","theme_bedtime","theme_morning","theme_book",
  "scenes": [
    {
      "id": "s1" | "s2" | ... (sequential),
      "placeId": short lowercase English id (e.g. "kinder_lunch"),
      "visual": string of 1-3 emojis only (no Korean text),
      "spokenLine": string in Korean — what 깡총이 says when this scene loads,
      "parentSummary": string in Korean — one-line note for the parent log,
      "choices": [
        {
          "id": short lowercase id,
          "emoji": single emoji character,
          "parentLabel": short Korean label (2-5 chars),
          "responseLine": string in Korean — what 깡총이 says immediately after this choice is tapped,
          "nextSceneId": next scene id or null on the final scene
        }
      ]
    }
  ]
}

Story rules:
- 3 to 5 scenes
- Each scene: 2 to 3 choices (the final scene may have an empty choices array to end the story)
- Korean lines must be very short and warm — like a picture book, suitable for 27-month-old
- Use the child's actual name (provided below) inside spokenLine and responseLine where natural
- Use 깡총이 voice throughout — never refer to 엄마 or use mother-style phrases
- All emojis must be single characters; no Korean text inside the visual / emoji fields
- nextSceneId on the LAST scene's choices must be null (or the choices array can be empty)
- Output ONLY the JSON, no markdown fences, no commentary
`.trim();

function buildUserMessage(input: AuthorInput): string {
  const lines: string[] = [];
  lines.push(`자녀 이름: ${input.childName}`);
  if (input.childAgeMonths) lines.push(`자녀 월령: ${input.childAgeMonths}개월`);
  if (input.childPreference) lines.push(`자녀 선호: ${input.childPreference}`);
  if (input.placeName) lines.push(`장소: ${input.placeName}`);
  if (input.eventText) lines.push(`있었던 일: ${input.eventText}`);
  if (input.rawText) {
    lines.push("부모 자유 메모:");
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

async function callLLM(systemPrompt: string, userMsg: string): Promise<{ content: string; vendor: LLMVendor; model: string }> {
  const vendor = getVendor();
  const cfg = VENDOR_CONFIG[vendor];
  const key = process.env[cfg.envKey];
  if (!key) {
    throw new AIGeneratorError(
      `${cfg.envKey}가 설정되지 않았습니다.`,
      ".env.local 에 키를 추가하고 dev 서버를 재시작해 주세요.",
    );
  }
  const res = await fetch(cfg.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AIGeneratorError(
      `${vendor} returned ${res.status}`,
      body.slice(0, 200),
    );
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return {
    content: json.choices?.[0]?.message?.content ?? "",
    vendor,
    model: cfg.model,
  };
}

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

  const systemPrompt = `${CHARACTER_VOICE_SYSTEM_PROMPT}\n\n${SCHEMA_INSTRUCTION}`;
  const userMsg = buildUserMessage(input);

  const vendor = getVendor();
  const model = VENDOR_CONFIG[vendor].model;

  const cacheKey = await hashKey(["aistory", vendor, model, systemPrompt, userMsg]);
  const cached = await getCachedText(cacheKey);
  let rawJson: string;
  if (cached) {
    rawJson = cached;
  } else {
    const result = await callLLM(systemPrompt, userMsg);
    rawJson = result.content;
    await putCachedText(cacheKey, rawJson);
  }

  let parsed: RawAIStory;
  try {
    parsed = JSON.parse(rawJson) as RawAIStory;
  } catch (e) {
    throw new AIGeneratorError(
      "AI 응답을 JSON으로 파싱하지 못했습니다.",
      (e as Error).message,
    );
  }

  if (!parsed.scenes || parsed.scenes.length === 0) {
    throw new AIGeneratorError("AI가 빈 시나리오를 반환했습니다.", "재시도 권장.");
  }

  return sanitizeStory(parsed, input);
}
