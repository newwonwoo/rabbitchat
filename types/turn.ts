export type TurnActor = "child" | "character" | "system";

export type TurnEvent =
  | "session_start"
  | "character_press"
  | "mock_voice"
  | "choice"
  | "parent_gate"
  | "restart_story"
  | "change_theme"
  | "change_character";

export type Turn = {
  id: string;
  at: string;
  actor: TurnActor;
  event: TurnEvent;
  detail: string;
};
