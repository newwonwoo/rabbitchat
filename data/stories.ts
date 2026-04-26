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

// 원우 전용 회상 동화 — 엄마가 녹음한 mp3 7개를 장면별로 재생.
// 파일은 public/assets/voice/ 에 동일한 이름으로 업로드.
const todayKinder: Story = {
  id: "story_today_kinder",
  themeId: "theme_today",
  title: "오늘 어린이집",
  startSceneId: "k1",
  scenes: [
    {
      id: "k1",
      placeId: "kinder_intro",
      visual: "🐰💗",
      audioFile: "/assets/voice/hi.mp3",
      parentSummary: "인사 — '안녕 원우야'",
      choices: [
        {
          id: "go",
          emoji: "▶️",
          nextSceneId: "k2",
          parentLabel: "시작",
        },
      ],
    },
    {
      id: "k2",
      placeId: "kinder",
      visual: "🏫",
      audioFile: "/assets/voice/kinder.mp3",
      parentSummary: "어린이집에서 무슨 놀이 했는지 묻기.",
      choices: [
        {
          id: "play_block",
          emoji: "🧱",
          nextSceneId: "k3",
          parentLabel: "블록 놀이",
        },
        {
          id: "play_ball",
          emoji: "⚽",
          nextSceneId: "k3",
          parentLabel: "공놀이",
        },
        {
          id: "play_book",
          emoji: "📚",
          nextSceneId: "k3",
          parentLabel: "책 읽기",
        },
      ],
    },
    {
      id: "k3",
      placeId: "kinder_lunch",
      visual: "🍱",
      audioFile: "/assets/voice/lunch.mp3",
      parentSummary: "점심에 무슨 반찬 먹었는지 묻기.",
      choices: [
        {
          id: "food_chicken",
          emoji: "🍗",
          nextSceneId: "k4",
          parentLabel: "닭고기",
        },
        {
          id: "food_kimchi",
          emoji: "🥬",
          nextSceneId: "k4",
          parentLabel: "김치",
        },
        {
          id: "food_noodle",
          emoji: "🍜",
          nextSceneId: "k4",
          parentLabel: "국수",
        },
      ],
    },
    {
      id: "k4",
      placeId: "kinder_lunch",
      visual: "😋",
      audioFile: "/assets/voice/goodfood.mp3",
      parentSummary: "맛있었구나 반응.",
      choices: [
        {
          id: "next",
          emoji: "▶️",
          nextSceneId: "k5",
          parentLabel: "다음",
        },
      ],
    },
    {
      id: "k5",
      placeId: "kinder",
      visual: "👫",
      audioFile: "/assets/voice/whowith.mp3",
      parentSummary: "어떤 친구랑 가장 재미있게 놀았는지 묻기.",
      choices: [
        {
          id: "with_sihyun",
          emoji: "🧒",
          nextSceneId: "k6_sihyun",
          parentLabel: "시현이",
        },
        {
          id: "with_other",
          emoji: "👦",
          nextSceneId: "k7",
          parentLabel: "다른 친구",
        },
      ],
    },
    {
      id: "k6_sihyun",
      placeId: "kinder",
      visual: "🤝",
      audioFile: "/assets/voice/withsihyun.mp3",
      parentSummary: "시현이랑 놀았구나 반응.",
      choices: [
        {
          id: "next",
          emoji: "▶️",
          nextSceneId: "k7",
          parentLabel: "다음",
        },
      ],
    },
    {
      id: "k7",
      placeId: "kinder",
      visual: "🌟",
      audioFile: "/assets/voice/wonwoobestwithfriend.mp3",
      parentSummary: "마무리 — 친구들과 사이좋게 보냈어요.",
      choices: [],
    },
  ],
};

export const stories: Story[] = [todayKinder, martBananaStory, parkWalk];
