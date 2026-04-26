export type Theme = {
  id: string;
  name: string;
  emoji: string;
  storyId: string;
};

export const themes: Theme[] = [
  {
    id: "theme_today",
    name: "오늘 하루",
    emoji: "🌟",
    storyId: "story_today_kinder",
  },
  {
    id: "theme_mart",
    name: "마트 모험",
    emoji: "🛒",
    storyId: "story_mart_banana",
  },
  {
    id: "theme_park",
    name: "공원 산책",
    emoji: "🌳",
    storyId: "story_park_walk",
  },
];
