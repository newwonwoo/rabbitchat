import type { LLMProvider } from "./llmProvider";
import type { STTProvider } from "./sttProvider";
import type { TTSProvider } from "./ttsProvider";

// MVP mocks. No network calls.
// Future swap-in points:
//   STT  -> OpenAI / on-device whisper
//   LLM  -> OpenAI text model
//   TTS  -> ElevenLabs voice clone

export const mockSTTProvider: STTProvider = {
  name: "mock-stt",
  transcribe: async (_audio: Blob): Promise<string> => {
    return "(mock-transcript)";
  },
};

export const mockLLMProvider: LLMProvider = {
  name: "mock-llm",
  generateReply: async (prompt: string): Promise<string> => {
    return `(mock-reply) ${prompt.slice(0, 30)}`;
  },
};

export const mockTTSProvider: TTSProvider = {
  name: "mock-tts",
  speak: async (_text: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 200));
  },
};
