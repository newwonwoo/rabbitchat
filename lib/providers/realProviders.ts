// Real provider adapters. NOT bundled by default — only loaded when
// NEXT_PUBLIC_PROVIDER=real AND the corresponding API keys are present.
//
// Until the parent supplies keys these throw a friendly error so the
// switch in providers/index.ts can fall back to mocks. After keys land,
// flip the switch and these become live.
//
// Required environment variables (see .env.example):
//   OPENAI_API_KEY        — for STT (Whisper) + LLM (gpt-4o-mini)
//   ELEVENLABS_API_KEY    — for TTS (voice clone)
//   ELEVENLABS_VOICE_ID   — the cloned 엄마 voice id
//
// All keys must be server-side. The mock voice still runs on the client.

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
const NEED_ELEVEN = "ELEVENLABS_API_KEY";
const NEED_VOICE = "ELEVENLABS_VOICE_ID";

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
// Streams MP3 back; we wrap into a Blob URL and play via Audio.

async function playBlob(blob: Blob): Promise<void> {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = new Audio(url);
  await a.play().catch(() => undefined);
  a.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
}

// Shared fetch+cache for TTS. Used by both speak() (which then plays)
// and prefetch() (which only warms cache).
async function fetchOrCachedTTSBlob(text: string): Promise<Blob> {
  const voiceId = requireEnv(NEED_VOICE);
  const cacheKey = await hashKey(["tts", "elevenlabs", voiceId, text]);
  const hit = await getCachedBlob(cacheKey);
  if (hit) {
    bumpHit("tts");
    return hit;
  }
  bumpMiss("tts");

  const key = requireEnv(NEED_ELEVEN);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
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
    },
  );
  if (!res.ok) {
    throw new Error(`[tts] ElevenLabs returned ${res.status}`);
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
