import type { UIMode } from "@/types/ui";

export const initialUIMode: UIMode = "child";

export function canEnterParent(mode: UIMode): boolean {
  return mode === "child";
}

export function canReturnToChild(mode: UIMode): boolean {
  return mode !== "child";
}

// NOTE: PlayPhase (INTRO_PLAYING / QUESTION_WAITING / RESPONSE_PLAYING / ...)
// will be layered on top once real STT/LLM/TTS providers are wired in.
// MVP keeps UIMode-only state.
