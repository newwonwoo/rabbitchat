import { stories } from "@/data/stories";
import { themes } from "@/data/themes";
import type { Scene, Story } from "@/types/story";

export function getStoryById(storyId: string): Story | undefined {
  return stories.find((s) => s.id === storyId);
}

export function getStoryByTheme(themeId: string): Story | undefined {
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return undefined;
  return stories.find((s) => s.id === theme.storyId);
}

export function getScene(story: Story, sceneId: string): Scene | undefined {
  return story.scenes.find((sc) => sc.id === sceneId);
}

export function nextScene(story: Story, sceneId: string, choiceId: string): Scene | null {
  const scene = getScene(story, sceneId);
  if (!scene) return null;
  const choice = scene.choices.find((c) => c.id === choiceId);
  if (!choice || !choice.nextSceneId) return null;
  return getScene(story, choice.nextSceneId) ?? null;
}

export function restartStory(story: Story): Scene | undefined {
  return getScene(story, story.startSceneId);
}
