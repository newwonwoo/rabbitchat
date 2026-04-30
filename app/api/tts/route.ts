// Server-side ElevenLabs TTS proxy. Owns ELEVENLABS_API_KEY and
// ELEVENLABS_VOICE_ID (NOT NEXT_PUBLIC_*, so the client bundle cannot
// read them). The client calls this route via lib/providers/realProviders.ts.
//
// Mirrors the pattern in /api/generate-story: friendly Korean status
// hints on failure so the parent screen can surface actionable copy
// instead of a raw HTTP code.

import { NextResponse } from "next/server";

const ELEVEN_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";

function statusHint(status: number, body: string): string {
  if (status === 401) {
    return "ELEVENLABS_API_KEY가 잘못됐거나 만료됨. .env.local 확인 + dev 서버 재시작.";
  }
  if (status === 422) {
    return "ELEVENLABS_VOICE_ID가 이 키로 접근 가능한 voice가 아님. 대시보드에서 voice id 다시 복사.";
  }
  if (status === 429) {
    return body.includes("quota") || body.includes("character_limit")
      ? "월 char quota 소진. ElevenLabs 대시보드에서 플랜 확인."
      : "rate limit 초과. 1~2분 대기.";
  }
  if (status === 403) return "권한 부족. 키의 voice 접근 권한 확인.";
  if (status === 404) return "voice id를 찾을 수 없음. ELEVENLABS_VOICE_ID 재확인.";
  if (status >= 500) return "ElevenLabs 서버 일시 장애. 잠시 후 재시도.";
  return body.slice(0, 240);
}

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  const defaultVoice = process.env.ELEVENLABS_VOICE_ID;

  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        error: "ELEVENLABS_API_KEY가 서버에 설정되지 않았습니다.",
        hint: ".env.local 에 키를 추가하고 dev 서버를 반드시 재시작하세요.",
      },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    voiceId?: string;
  };
  const text = (body.text ?? "").trim();
  const voiceId = (body.voiceId ?? defaultVoice ?? "").trim();

  if (!text) {
    return NextResponse.json(
      { ok: false, error: "text가 필요합니다." },
      { status: 400 },
    );
  }
  if (!voiceId) {
    return NextResponse.json(
      {
        ok: false,
        error: "ELEVENLABS_VOICE_ID가 설정되지 않았습니다.",
        hint: ".env.local 의 ELEVENLABS_VOICE_ID 또는 요청 body의 voiceId.",
      },
      { status: 503 },
    );
  }

  let res: Response;
  try {
    res = await fetch(`${ELEVEN_ENDPOINT}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.85 },
      }),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: "ElevenLabs 호출 실패",
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
        error: `ElevenLabs returned ${res.status}`,
        hint: statusHint(res.status, errBody),
      },
      { status: 502 },
    );
  }

  // Stream the mp3 binary back as-is. The client wraps it in a Blob.
  const arrayBuf = await res.arrayBuffer();
  return new Response(arrayBuf, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
