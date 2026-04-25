import type { Scene } from "@/types/story";

export function parentNarration(scene: Scene): string {
  return `${scene.parentSummary} (scene=${scene.id})`;
}
