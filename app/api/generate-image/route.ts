// Server-side OpenAI image generation. Used as a primary tier above
// Pexels search when the parent wants images that actually match the
// story context (Pexels often returns unrelated photos because the
// search vocabulary is too small).
//
// Why a server route: OPENAI_API_KEY is server-only. Mirrors the same
// pattern as /api/generate-story and /api/tts — friendly Korean status
// hints on failure so the parent screen can show actionable copy.
//
// Uses gpt-image-1 (the current general-purpose image model) at low
// quality / 1024x1024 to keep latency + cost reasonable for an MVP.
// Result returned as a base64 data: URL so the client can cache it
// alongside Pexels URLs through aiCache without an extra fetch hop.

import { NextResponse } from "next/server";

const ENDPOINT = "https://api.openai.com/v1/images/generations";

function statusHint(status: number, body: string): string {
  if (status === 401) return "OPENAI_API_KEY가 잘못됐거나 만료됨. .env.local 확인 + dev 서버 재시작.";
  if (status === 403) return "이 키는 image generation 권한이 없음. OpenAI 대시보드에서 권한 확인.";
  if (status === 429) {
    return body.includes("insufficient_quota") || body.includes("billing")
      ? "잔액 부족. OpenAI 콘솔에서 충전 후 재시도."
      : "rate limit 초과. 1~2분 대기.";
  }
  if (status === 400 && body.includes("safety")) {
    return "프롬프트가 안전 정책에 걸렸어요. 단어를 더 일반적으로 바꿔주세요.";
  }
  if (status >= 500) return "OpenAI 서버 일시 장애. 잠시 후 재시도.";
  return body.slice(0, 240);
}

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        error: "OPENAI_API_KEY가 서버에 설정되지 않았습니다.",
        hint: ".env.local 에 키를 추가하고 dev 서버를 반드시 재시작하세요.",
      },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    size?: "1024x1024" | "1024x1536" | "1536x1024";
  };
  const prompt = (body.prompt ?? "").trim();
  const size = body.size ?? "1024x1024";
  if (!prompt) {
    return NextResponse.json(
      { ok: false, error: "prompt가 필요합니다." },
      { status: 400 },
    );
  }

  // Bias every prompt toward the picture-book tone the rest of the
  // app uses. Avoids photoreal / scary / text-on-image outputs.
  const styled = `Soft, warm Korean children's picture book illustration, 2D flat style, gentle cream background, no text, no letters, friendly. Subject: ${prompt}`;

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: styled,
        size,
        quality: "low",
        n: 1,
      }),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: "OpenAI image 호출 실패",
        hint: (e as Error).message,
      },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    return NextResponse.json(
      {
        ok: false,
        error: `OpenAI image returned ${res.status}`,
        hint: statusHint(res.status, errBody),
      },
      { status: 502 },
    );
  }

  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const first = json.data?.[0];
  if (!first || (!first.b64_json && !first.url)) {
    return NextResponse.json(
      { ok: false, error: "OpenAI image 응답에 데이터가 없습니다." },
      { status: 502 },
    );
  }

  const url = first.b64_json
    ? `data:image/png;base64,${first.b64_json}`
    : (first.url as string);

  return NextResponse.json({ ok: true, url, model: "gpt-image-1" });
}
