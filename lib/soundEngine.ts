"use client";

// Lightweight HTML5 Audio playback. SSR-guarded. Honors voice volume from
// preferenceEngine. Falls back to no-op when the file is missing or audio
// is blocked (some browsers require user gesture before play).

import { loadPreference } from "@/lib/preferenceEngine";

// Browsers block audio playback until the user interacts with the page.
// We track whether the gesture has happened so the first scene's voice
// can wait if needed.
let userGestureHappened = false;
const pendingPlayQueue: Array<() => void> = [];

export function isUserGestureUnlocked(): boolean {
  return userGestureHappened;
}

export function unlockAudio(): void {
  if (userGestureHappened) return;
  userGestureHappened = true;
  // Drain any deferred plays
  while (pendingPlayQueue.length) {
    const fn = pendingPlayQueue.shift();
    if (fn) {
      try {
        fn();
      } catch {
        // ignore
      }
    }
  }
}

export function whenUnlocked(fn: () => void): void {
  if (userGestureHappened) {
    fn();
  } else {
    pendingPlayQueue.push(fn);
  }
}

export type SoundId =
  | "tap_pop"        // any tap / button click
  | "choice_chime"   // successful choice selected
  | "voice_coo"      // mock character voice "코오~"
  | "voice_ya"       // mock character voice "와아!"
  | "voice_um"       // mock character voice "음~"
  | "scene_end"      // story end ✨ chime
  | "parent_unlock"; // long-press unlock chime

const SOUND_PATHS: Record<SoundId, string> = {
  tap_pop: "/assets/sound/tap_pop.mp3",
  choice_chime: "/assets/sound/choice_chime.mp3",
  voice_coo: "/assets/sound/voice_coo.mp3",
  voice_ya: "/assets/sound/voice_ya.mp3",
  voice_um: "/assets/sound/voice_um.mp3",
  scene_end: "/assets/sound/scene_end.mp3",
  parent_unlock: "/assets/sound/parent_unlock.mp3",
};

const cache = new Map<SoundId, HTMLAudioElement>();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function getOrCreate(id: SoundId): HTMLAudioElement | null {
  if (!isBrowser()) return null;
  let el = cache.get(id);
  if (el) return el;
  el = new Audio(SOUND_PATHS[id]);
  el.preload = "auto";
  cache.set(id, el);
  return el;
}

export function playSound(id: SoundId): void {
  const el = getOrCreate(id);
  if (!el) return;
  try {
    el.currentTime = 0;
    el.volume = loadPreference().voiceVolume ?? 0.8;
    void el.play().catch(() => {
      // user-gesture restrictions or missing file — silent
    });
  } catch {
    // ignore
  }
}

// Pick a random "voice" sample so consecutive character presses don't
// sound mechanical.
const VOICE_POOL: SoundId[] = ["voice_coo", "voice_ya", "voice_um"];

export function playRandomVoice(): void {
  const i = Math.floor(Math.random() * VOICE_POOL.length);
  playSound(VOICE_POOL[i]);
}

export const SOUND_FILES = SOUND_PATHS;
