export type CharacterMood =
  | "happy"
  | "listening"
  | "waving"
  | "thinking"
  | "jumping"
  | "sleepy";

export type Character = {
  id: string;
  name: string;
  emoji: string;
  bodyColor: string;
  earColor: string;
  defaultMood: CharacterMood;
  isPrimary: boolean;
};
