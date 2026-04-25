import type { Story } from "@/types/story";

const martBananaStory: Story = {
  id: "story_mart_banana",
  themeId: "theme_mart",
  title: "마트에서 바나나 고르기",
  startSceneId: "s1",
  scenes: [
    {
      id: "s1",
      placeId: "mart_entrance",
      visual: "🏬🛒",
      parentSummary: "마트 입구에서 카트를 밀기 시작함.",
      choices: [
        {
          id: "push_cart",
          emoji: "🛒",
          nextSceneId: "s2",
          parentLabel: "카트 밀기",
        },
      ],
    },
    {
      id: "s2",
      placeId: "fruit_aisle",
      visual: "🍎🍌",
      parentSummary: "과일 코너에서 바나나와 사과 중 선택.",
      choices: [
        {
          id: "pick_banana",
          emoji: "🍌",
          nextSceneId: "s3",
          parentLabel: "바나나 고르기",
        },
        {
          id: "pick_apple",
          emoji: "🍎",
          nextSceneId: "s3",
          parentLabel: "사과 고르기",
        },
      ],
    },
    {
      id: "s3",
      placeId: "checkout",
      visual: "🍌✨",
      parentSummary: "고른 과일을 들고 즐거워함.",
      choices: [],
    },
  ],
};

const parkWalkSkeleton: Story = {
  id: "story_park_walk",
  themeId: "theme_park",
  title: "공원 산책 (skeleton)",
  startSceneId: "p1",
  scenes: [
    {
      id: "p1",
      placeId: "park_path",
      visual: "🌳🦋",
      parentSummary: "공원 산책로 입구. 추후 시나리오 확장 예정.",
      choices: [],
    },
  ],
};

export const stories: Story[] = [martBananaStory, parkWalkSkeleton];
