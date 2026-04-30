// Real provider adapters. NOT bundled by default — only loaded when
// NEXT_PUBLIC_PROVIDER=real AND the corresponding API keys are present.
//
// All third-party API calls go through Next.js server routes so that
// secrets stay on the server (NEXT_PUBLIC_* leaks to the client bundle;
// these keys deliberately are NOT prefixed):
//   /api/generate-story   — LLM (story generator)
//   /api/parse-natural    — LLM (free-form parent note → fields)
//   /api/tts              — ElevenLabs voice clone
//   /api/image-search     — Pexels
//   /api/generate-image   — OpenAI image generation
//
// Required server-only env vars (see .env.example):
//   OPENAI_API_KEY        — Whisper STT, gpt-4o-mini LLM, image gen
//   ELEVENLABS_API_KEY    — voice clone TTS
//   ELEVENLABS_VOICE_ID   — cloned 엄마 voice id
//
// The mock voice still runs purely on the client.

import {
  bumpHit,
  bumpMiss,
  getCachedBlob,
  getCachedText,
  hashKey,
  putCachedBlob,
  putCachedText,
} from "@/lib/aiCache";
import { CHARACTER_VOICE_SYSTEM_PROMPT, sanitizeCharacterVoice } from "@/lib/characterVoice";

import type { LLMProvider } from "./llmProvider";
import type { STTProvider } from "./sttProvider";
import type { TTSProvider } from "./ttsProvider";

const NEED_OPENAI = "OPENAI_API_KEY";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `[providers/real] ${name} is not set. Configure it in .env.local or your deploy env, then restart.`,
    );
  }
  return v;
}

// --- STT: OpenAI Whisper ---------------------------------------------------
// Sends a Blob via multipart/form-data to /v1/audio/transcriptions.

export const openAISTTProvider: STTProvider = {
  name: "openai-whisper",
  transcribe: async (audio: Blob): Promise<string> => {
    const key = requireEnv(NEED_OPENAI);
    const fd = new FormData();
    fd.append("file", audio, "voice.webm");
    fd.append("model", "whisper-1");
    fd.append("language", "ko");
    const res = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: fd,
      },
    );
    if (!res.ok) {
      throw new Error(`[stt] OpenAI returned ${res.status}`);
    }
    const json = (await res.json()) as { text?: string };
    return json.text ?? "";
  },
};

// --- LLM: OpenAI chat ------------------------------------------------------

const LLM_MODEL = "gpt-4o-mini";

export const openAILLMProvider: LLMProvider = {
  name: "openai-chat",
  generateReply: async (prompt: string): Promise<string> => {
    // Cache lookup — same model + system + prompt → same answer.
    // temperature=0 below makes the API deterministic on cache miss too.
    const cacheKey = await hashKey([
      "llm",
      LLM_MODEL,
      CHARACTER_VOICE_SYSTEM_PROMPT,
      prompt,
    ]);
    const hit = await getCachedText(cacheKey);
    if (hit !== null) {
      bumpHit("llm");
      return hit;
    }
    bumpMiss("llm");

    const key = requireEnv(NEED_OPENAI);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: CHARACTER_VOICE_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0,
      }),
    });
    if (!res.ok) {
      throw new Error(`[llm] OpenAI returned ${res.status}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const out = sanitizeCharacterVoice(raw);
    await putCachedText(cacheKey, out);
    return out;
  },
};

// --- TTS: ElevenLabs voice clone (엄마 목소리) ---------------------------
// Streams MP3 back via /api/tts (server route owns the api key); we
// wrap into a Blob URL and play via Audio.

async function playBlob(blob: Blob): Promise<void> {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = new Audio(url);
  await a.play().catch(() => undefined);
  a.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
}

// Shared fetch+cache for TTS. Used by both speak() (which then plays)
// and prefetch() (which only warms cache). Cache key uses just text +
// "default" voice marker — server side resolves the actual voice id
// from ELEVENLABS_VOICE_ID, so the client doesn't need to know it.
async function fetchOrCachedTTSBlob(text: string): Promise<Blob> {
  const cacheKey = await hashKey(["tts", "elevenlabs.v2", "default", text]);
  const hit = await getCachedBlob(cacheKey);
  if (hit) {
    bumpHit("tts");
    return hit;
  }
  bumpMiss("tts");

  let res: Response;
  try {
    res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    throw new Error(`[tts] /api/tts 호출 실패: ${(e as Error).message}`);
  }

  if (!res.ok) {
    // Server route returns JSON `{ ok: false, error, hint }` on failure.
    let detail = `${res.status}`;
    try {
      const j = (await res.json()) as { error?: string; hint?: string };
      if (j.error) detail = j.hint ? `${j.error} — ${j.hint}` : j.error;
    } catch {
      // ignore parse failure, keep status
    }
    throw new Error(`[tts] ${detail}`);
  }

  const blob = await res.blob();
  await putCachedBlob(cacheKey, blob);
  return blob;
}

export const elevenLabsTTSProvider: TTSProvider = {
  name: "elevenlabs-clone",
  speak: async (text: string): Promise<void> => {
    const blob = await fetchOrCachedTTSBlob(text);
    await playBlob(blob);
  },
  prefetch: async (text: string): Promise<void> => {
    await fetchOrCachedTTSBlob(text);
  },
};
