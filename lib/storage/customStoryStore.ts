import { STORAGE_KEYS, loadJSON, saveJSON } from "@/lib/storage/localStore";
import type { Story } from "@/types/story";

export function loadCustomStories(): Story[] {
  return loadJSON<Story[]>(STORAGE_KEYS.customStories, []);
}

export function saveCustomStories(stories: Story[]): void {
  saveJSON(STORAGE_KEYS.customStories, stories);
}

export function appendCustomStory(story: Story): Story[] {
  const next = [...loadCustomStories(), story];
  saveCustomStories(next);
  return next;
}
