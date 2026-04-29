// Server-side story generator. Owns the OpenAI/Grok API key (which is
// NOT NEXT_PUBLIC_*, so client code cannot read it). The client calls
// this route via lib/aiStoryGenerator.ts.

import { NextResponse } from "next/server";

import { CHARACTER_VOICE_SYSTEM_PROMPT, sanitizeCharacterVoice } from "@/lib/characterVoice";

type LLMVendor = "openai" | "grok";

const VENDOR_CONFIG: Record<LLMVendor, { url: string; model: string; envKey: string }> = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    envKey: "OPENAI_API_KEY",
  },
  grok: {
    url: "https://api.x.ai/v1/chat/completions",
    model: "grok-2-latest",
    envKey: "GROK_API_KEY",
  },
};

function getVendor(): LLMVendor {
  return process.env.LLM_VENDOR === "grok" ? "grok" : "openai";
}

const SCHEMA_INSTRUCTION = `
JSON 스키마 (이 형식만 출력. 마크다운 펜스/주석/설명 금지):

{
  "title": "한국어, 8자 이내",
  "subtitle": "한국어, 20자 이내",
  "tags": ["회상","모험","일상","잠자기","먹기","놀이"] 중 1개 이상,
  "estimatedMinutes": 2~7 정수,
  "coverImageQuery": "Pexels 영어 키워드",
  "themeId": "theme_today" | "theme_mart" | "theme_park" | "theme_bedtime" | "theme_morning" | "theme_book",
  "scenes": [
    {
      "id": "s1" | "s2" | ...,
      "placeId": "kinder_lunch" 같은 영어 lowercase,
      "visual": "이모지 1~3개만",
      "spokenLine": "장면 진입 시 깡총이가 말하는 한국어 한 문장",
      "parentSummary": "부모 로그용 한 줄",
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

【작가 룰 — 영화 시나리오 수준】
1. 동화책 한 페이지처럼 따뜻하고 6~10어절. 깡총이는 엄마가 아니다.
2. 자녀 이름·친구 이름·실제 말 자연스럽게 인용. 좋아한 것 반복 노출.
3. 장면 3~5개, 한 화면 선택지 2~3개. 마지막 scene은 choices 빈 배열 또는 nextSceneId=null.
4. 회상→순서 / 어휘→반복 / 감정→묻기 / 사회성→상호작용 목표 반영.
5. visual은 이모지만, 한글 금지.
6. 출력은 오직 JSON.
`.trim();

function statusHint(status: number, body: string, vendor: LLMVendor): string {
  if (status === 401) return "API 키가 잘못됐거나 만료됨. .env.local 다시 확인 + dev 서버 재시작.";
  if (status === 429) {
    return body.includes("insufficient_quota") || body.includes("billing")
      ? "잔액 부족 또는 결제 미완료. 플랫폼 콘솔에서 충전 후 재시도."
      : "rate limit 초과. 1~2분 대기.";
  }
  if (status === 403) return "권한 부족. 키 권한(scope) 확인.";
  if (status === 404) return `모델 접근 불가. 키가 해당 모델 사용 권한이 있는지 확인.`;
  if (status >= 500) return `${vendor} 서버 일시 장애. 잠시 후 재시도.`;
  return body.slice(0, 240);
}

export async function POST(req: Request) {
  const vendor = getVendor();
  const cfg = VENDOR_CONFIG[vendor];
  const key = process.env[cfg.envKey];
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        error: `${cfg.envKey}가 서버에 설정되지 않았습니다.`,
        hint: ".env.local 에 키를 추가하고 dev 서버를 반드시 재시작하세요.",
      },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { userMessage?: string };
  const userMessage = (body.userMessage ?? "").trim();
  if (!userMessage) {
    return NextResponse.json(
      { ok: false, error: "userMessage가 필요합니다." },
      { status: 400 },
    );
  }

  const systemPrompt = `${CHARACTER_VOICE_SYSTEM_PROMPT}\n\n${SCHEMA_INSTRUCTION}`;

  let res: Response;
  try {
    res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `${vendor} 호출 실패`, hint: (e as Error).message },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    return NextResponse.json(
      {
        ok: false,
        error: `${vendor} returned ${res.status}`,
        hint: statusHint(res.status, errBody, vendor),
      },
      { status: 502 },
    );
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawContent = json.choices?.[0]?.message?.content ?? "";

  // Apply §3.3 sanitization here (server-side) so the client never sees
  // un-sanitized output.
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    return NextResponse.json(
      { ok: false, error: "AI 응답을 JSON으로 파싱하지 못했습니다." },
      { status: 502 },
    );
  }

  // Walk scenes/choices and sanitize spoken/response lines.
  const scenes = parsed.scenes;
  if (Array.isArray(scenes)) {
    for (const s of scenes) {
      if (s && typeof s === "object") {
        const sc = s as Record<string, unknown>;
        if (typeof sc.spokenLine === "string") {
          sc.spokenLine = sanitizeCharacterVoice(sc.spokenLine);
        }
        if (Array.isArray(sc.choices)) {
          for (const c of sc.choices) {
            if (c && typeof c === "object") {
              const ch = c as Record<string, unknown>;
              if (typeof ch.responseLine === "string") {
                ch.responseLine = sanitizeCharacterVoice(ch.responseLine);
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, story: parsed, vendor, model: cfg.model });
}
