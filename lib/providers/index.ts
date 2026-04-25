// Provider factory. NEXT_PUBLIC_PROVIDER selects between mock (default,
// fully offline) and real (OpenAI Whisper STT + chat LLM + ElevenLabs
// voice-clone TTS, requires API keys).

import type { LLMProvider } from "./llmProvider";
import type { STTProvider } from "./sttProvider";
import type { TTSProvider } from "./ttsProvider";
import {
  mockLLMProvider,
  mockSTTProvider,
  mockTTSProvider,
} from "./mockProviders";
import {
  elevenLabsTTSProvider,
  openAILLMProvider,
  openAISTTProvider,
} from "./realProviders";

export type ProviderMode = "mock" | "real";

export function getProviderMode(): ProviderMode {
  const raw = process.env.NEXT_PUBLIC_PROVIDER;
  return raw === "real" ? "real" : "mock";
}

export function getSTTProvider(): STTProvider {
  return getProviderMode() === "real" ? openAISTTProvider : mockSTTProvider;
}

export function getLLMProvider(): LLMProvider {
  return getProviderMode() === "real" ? openAILLMProvider : mockLLMProvider;
}

export function getTTSProvider(): TTSProvider {
  return getProviderMode() === "real" ? elevenLabsTTSProvider : mockTTSProvider;
}
