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

export function upsertCustomStory(story: Story): Story[] {
  const list = loadCustomStories();
  const idx = list.findIndex((s) => s.id === story.id);
  if (idx >= 0) list[idx] = story;
  else list.push(story);
  saveCustomStories(list);
  return list;
}

export function removeCustomStory(id: string): Story[] {
  const list = loadCustomStories().filter((s) => s.id !== id);
  saveCustomStories(list);
  return list;
}

export function publishStory(id: string): Story[] {
  const list = loadCustomStories();
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return list;
  list[idx] = {
    ...list[idx],
    status: "published",
    publishedAt: new Date().toISOString(),
  };
  saveCustomStories(list);
  return list;
}

export function loadPublishedStories(): Story[] {
  return loadCustomStories().filter((s) => s.status === "published");
}

export function loadDraftStories(): Story[] {
  return loadCustomStories().filter((s) => s.status === "draft");
}
