// Parse the parent's free-form Korean note into the structured AuthorInput
// fields. Saves them from re-typing into 9 sections when they already
// captured the day in one paragraph.
//
// Uses the same LLM provider (OpenAI / Grok) that the story generator
// uses. Server-side so the API key stays out of the client bundle.

import { NextResponse } from "next/server";

type Vendor = "openai" | "grok";

const VENDOR_CONFIG: Record<Vendor, { url: string; model: string; envKey: string }> = {
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

const SYSTEM = `너는 부모가 자녀의 하루를 자유롭게 적은 한국어 메모를 받아
9개 항목으로 구조화하는 도우미다.

입력에서 추출/추론할 수 있는 것만 채우고, 정보가 없는 필드는 빈 배열 또는 빈 문자열로 둔다.
이름·친구·기타 사람 이름은 메모에 명시된 것만. 추측 금지.

응답은 반드시 다음 JSON 스키마를 정확히 따른다 (다른 텍스트 일체 출력 금지):

{
  "placeType": string (어린이집 / 마트 / 공원 / 집 / 친척집 / 병원 / 산 / 기타 중 하나, 없으면 ""),
  "placeDetail": string (예: "교실", "과일 코너", "꽃밭", 없으면 ""),
  "eventText": string (한 문장으로 정리, 없으면 ""),
  "friends": string[] (자녀가 함께한 친구 이름, 메모에 있을 때만),
  "others": string[] (가족, 선생님 등 기타 사람),
  "childActions": string[] (아이가 한 행동을 짧은 구로 2~5개),
  "childPreferences": string[] (좋아한 사물·음식·사람 키워드),
  "childQuote": string (메모에 인용된 아이의 실제 말, 없으면 ""),
  "emotions": string[] (신남, 뿌듯함, 즐거움, 호기심, 졸림 등 감정 키워드),
  "goals": string[] (회상/순서/어휘/감정/사회성 중 의미 있는 것 0~3개),
  "repeatMode": "variation" | "repeat" | "new" (메모 결로 가장 어울리는 것 1개)
}`;

function pickVendor(): Vendor {
  return process.env.LLM_VENDOR === "grok" ? "grok" : "openai";
}

export async function POST(req: Request) {
  const vendor = pickVendor();
  const cfg = VENDOR_CONFIG[vendor];
  const key = process.env[cfg.envKey];
  if (!key) {
    return NextResponse.json(
      { ok: false, error: `${cfg.envKey} 미설정. .env.local 확인 후 dev 서버 재시작.` },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { rawText?: string };
  const rawText = (body.rawText ?? "").trim();
  if (!rawText) {
    return NextResponse.json({ ok: false, error: "rawText 필요" }, { status: 400 });
  }

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
          { role: "system", content: SYSTEM },
          { role: "user", content: rawText },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `${vendor} 호출 실패: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    return NextResponse.json(
      { ok: false, error: `${vendor} ${res.status}: ${errBody.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content ?? "";
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "LLM JSON 파싱 실패" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, fields: parsed });
}
