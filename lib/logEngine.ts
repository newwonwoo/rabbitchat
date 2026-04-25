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
