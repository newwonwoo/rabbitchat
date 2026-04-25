// Pluggable turn storage. Local impl is the default; the Supabase impl
// is a stub so the call sites can be wired now and swapped later without
// touching app/page.tsx.

import { loadTurns, saveTurns, clearTurns } from "@/lib/logEngine";
import type { Turn } from "@/types/turn";

export type TurnStore = {
  name: string;
  load: () => Promise<Turn[]>;
  save: (turns: Turn[]) => Promise<void>;
  clear: () => Promise<void>;
};

export const localTurnStore: TurnStore = {
  name: "local",
  load: async () => loadTurns(),
  save: async (turns) => saveTurns(turns),
  clear: async () => clearTurns(),
};

// Stub: real Supabase wiring requires
//   - @supabase/supabase-js dep
//   - SUPABASE_URL / SUPABASE_ANON_KEY env
//   - "turns" table with RLS
// Not bundled in MVP per harness (no real DB).
export const supabaseTurnStoreStub: TurnStore = {
  name: "supabase-stub",
  load: async () => {
    throw new Error("[turnStore] supabase impl not wired yet");
  },
  save: async () => {
    throw new Error("[turnStore] supabase impl not wired yet");
  },
  clear: async () => {
    throw new Error("[turnStore] supabase impl not wired yet");
  },
};

export function getTurnStore(): TurnStore {
  // Hook: switch on NEXT_PUBLIC_TURN_STORE in the future.
  return localTurnStore;
}
