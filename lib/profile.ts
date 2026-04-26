import { STORAGE_KEYS, loadJSON, removeKey, saveJSON } from "@/lib/storage/localStore";
import type { ChildProfile } from "@/types/profile";

export const defaultProfile: ChildProfile = {
  name: "원우",
  ageMonths: 27,
  preferredStoryIds: [],
  onboardedAt: null,
};

const KEY = "child_profile";

export function loadProfile(): ChildProfile {
  return loadJSON<ChildProfile>(KEY, defaultProfile);
}

export function saveProfile(p: ChildProfile): void {
  saveJSON(KEY, p);
}

export function clearProfile(): void {
  removeKey(KEY);
}

export function isOnboarded(): boolean {
  const p = loadProfile();
  return !!p.onboardedAt;
}

// Re-export STORAGE_KEYS for callers that need to inspect raw storage
export { STORAGE_KEYS };
