export type UIMode =
  | "splash"
  | "home"
  | "child"
  | "parent_home"
  | "parent_menu"
  | "parent_logs"
  | "parent_themes"
  | "parent_characters"
  | "parent_places"
  | "parent_settings"
  | "parent_builder";

// Reserved for future expansion (harness §8). Currently MVP uses UIMode only.
// type PlayPhase =
//   | "IDLE"
//   | "INTRO_PLAYING"
//   | "QUESTION_WAITING"
//   | "CHILD_RESPONDING"
//   | "PROCESSING"
//   | "RESPONSE_PLAYING"
//   | "NEXT_READY"
//   | "COMPLETED";
