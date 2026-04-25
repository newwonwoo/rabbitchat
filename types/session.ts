import type { Character } from "./character";
import type { Story, Scene } from "./story";

export type Session = {
  id: string;
  startedAt: string;
  characterId: Character["id"];
  themeId: string;
  storyId: Story["id"];
  currentSceneId: Scene["id"];
};
