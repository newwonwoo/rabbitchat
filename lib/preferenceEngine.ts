import { STORAGE_KEYS, loadJSON, removeKey, saveJSON } from "@/lib/storage/localStore";
import type { Preference } from "@/types/preference";

export const defaultPreference: Preference = {
  voiceVolume: 0.8,
  preferredCharacterId: null,
  preferredThemeId: null,
};

export function loadPreference(): Preference {
  return loadJSON<Preference>(STORAGE_KEYS.preference, defaultPreference);
}

export function savePreference(pref: Preference): void {
  saveJSON(STORAGE_KEYS.preference, pref);
}

export function clearPreference(): void {
  removeKey(STORAGE_KEYS.preference);
}
