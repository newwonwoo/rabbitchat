// Provider factory. Driven by NEXT_PUBLIC_PROVIDER env (default "mock").
// Real providers are intentionally NOT bundled in MVP — when a real
// provider is added, register it here and gate the import behind the env.
//
// Allowed values:
//   - "mock"  (default; offline, no network)
//   - "real"  (reserved; throws until wired)

import type { LLMProvider } from "./llmProvider";
import type { STTProvider } from "./sttProvider";
import type { TTSProvider } from "./ttsProvider";
import {
  mockLLMProvider,
  mockSTTProvider,
  mockTTSProvider,
} from "./mockProviders";

export type ProviderMode = "mock" | "real";

export function getProviderMode(): ProviderMode {
  const raw = process.env.NEXT_PUBLIC_PROVIDER;
  return raw === "real" ? "real" : "mock";
}

function notWired(name: string): never {
  throw new Error(
    `[providers] real ${name} provider is not wired yet. ` +
      "Set NEXT_PUBLIC_PROVIDER=mock or implement the real adapter.",
  );
}

export function getSTTProvider(): STTProvider {
  if (getProviderMode() === "real") notWired("STT");
  return mockSTTProvider;
}

export function getLLMProvider(): LLMProvider {
  if (getProviderMode() === "real") notWired("LLM");
  return mockLLMProvider;
}

export function getTTSProvider(): TTSProvider {
  if (getProviderMode() === "real") notWired("TTS");
  return mockTTSProvider;
}
