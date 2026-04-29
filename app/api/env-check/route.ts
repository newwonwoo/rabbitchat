// Tells the parent which env vars are actually loaded by the running
// dev server. Useful when "키는 .env.local 에 넣었는데 호출이 실패한다" —
// usually .env.local typo / save / restart issue.
//
// Returns only presence flags + length, NEVER the value.

import { NextResponse } from "next/server";

function check(name: string): { present: boolean; length: number } {
  const v = process.env[name];
  return { present: !!v, length: v ? v.length : 0 };
}

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_PROVIDER: process.env.NEXT_PUBLIC_PROVIDER ?? null,
    LLM_VENDOR: process.env.LLM_VENDOR ?? "openai",
    OPENAI_API_KEY: check("OPENAI_API_KEY"),
    GROK_API_KEY: check("GROK_API_KEY"),
    ELEVENLABS_API_KEY: check("ELEVENLABS_API_KEY"),
    ELEVENLABS_VOICE_ID: check("ELEVENLABS_VOICE_ID"),
    PEXELS_API_KEY: check("PEXELS_API_KEY"),
  });
}
