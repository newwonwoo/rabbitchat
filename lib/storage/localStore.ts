// SSR-safe localStorage helpers. Returns fallback when window is undefined.
// All RabbitChat persistence keys live under the "rabbitchat:" namespace.

const NS = "rabbitchat:";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(NS + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // Quota / private mode — silently noop (data is non-critical for MVP).
  }
}

export function removeKey(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(NS + key);
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  turns: "turns",
  preference: "preference",
  customStories: "custom_stories",
  customPlaces: "custom_places",
} as const;
