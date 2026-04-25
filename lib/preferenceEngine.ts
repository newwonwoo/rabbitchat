import type { Preference } from "@/types/preference";

export const defaultPreference: Preference = {
  voiceVolume: 0.8,
  preferredCharacterId: null,
  preferredThemeId: null,
};

// Skeleton: persistence layer (localStorage / Supabase) deferred.
export function loadPreference(): Preference {
  return defaultPreference;
}

export function savePreference(_pref: Preference): void {
  // intentional no-op for MVP
}
