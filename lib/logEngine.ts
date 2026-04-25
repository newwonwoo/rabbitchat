import { STORAGE_KEYS, loadJSON, removeKey, saveJSON } from "@/lib/storage/localStore";
import type { Turn, TurnActor, TurnEvent } from "@/types/turn";

const MAX_TURNS = 100;

export function createTurn(actor: TurnActor, event: TurnEvent, detail: string): Turn {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    at: new Date().toISOString(),
    actor,
    event,
    detail,
  };
}

export function appendTurn(turns: Turn[], turn: Turn): Turn[] {
  const next = [...turns, turn];
  if (next.length <= MAX_TURNS) return next;
  return next.slice(next.length - MAX_TURNS);
}

export function loadTurns(): Turn[] {
  return loadJSON<Turn[]>(STORAGE_KEYS.turns, []);
}

export function saveTurns(turns: Turn[]): void {
  saveJSON(STORAGE_KEYS.turns, turns);
}

export function clearTurns(): void {
  removeKey(STORAGE_KEYS.turns);
}
