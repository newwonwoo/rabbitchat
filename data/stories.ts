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

const parkWalk: Story = {
  id: "story_park_walk",
  themeId: "theme_park",
  title: "공원에서 산책하기",
  startSceneId: "p1",
  scenes: [
    {
      id: "p1",
      placeId: "park_path",
      visual: "🌳🦋",
      parentSummary: "공원 산책로 입구. 나비를 만남.",
      choices: [
        {
          id: "follow_butterfly",
          emoji: "🦋",
          nextSceneId: "p2",
          parentLabel: "나비 따라가기",
        },
        {
          id: "look_tree",
          emoji: "🌳",
          nextSceneId: "p2",
          parentLabel: "큰 나무 보기",
        },
      ],
    },
    {
      id: "p2",
      placeId: "park_path",
      visual: "🌼🐦",
      parentSummary: "꽃밭에서 새 소리를 들음.",
      choices: [
        {
          id: "smell_flower",
          emoji: "🌼",
          nextSceneId: "p3",
          parentLabel: "꽃 향기 맡기",
        },
        {
          id: "wave_bird",
          emoji: "👋",
          nextSceneId: "p3",
          parentLabel: "새에게 인사",
        },
      ],
    },
    {
      id: "p3",
      placeId: "park_path",
      visual: "🌳✨",
      parentSummary: "산책을 마치고 즐거운 마음으로 돌아감.",
      choices: [],
    },
  ],
};

export const stories: Story[] = [martBananaStory, parkWalk];
