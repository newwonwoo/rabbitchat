import type { Story } from "@/types/story";

const martBananaStory: Story = {
  id: "story_mart_banana",
  themeId: "theme_mart",
  title: "마트에서 바나나 고르기",
  subtitle: "오늘 마트에서 카트 밀고 과일 골랐어",
  coverEmoji: "🛒",
  coverImageQuery: "korean grocery store fruit aisle",
  tags: ["모험", "회상"],
  estimatedMinutes: 3,
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
  subtitle: "공원에서 나비랑 꽃이랑 만났어",
  coverEmoji: "🌳",
  coverImageQuery: "soft park path trees flowers",
  tags: ["모험", "놀이"],
  estimatedMinutes: 3,
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
  subtitle: "어린이집에서 무슨 놀이 했어?",
  coverEmoji: "🏫",
  coverImageQuery: "korean kindergarten classroom kids",
  tags: ["일상", "회상"],
  estimatedMinutes: 4,
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

// Bedtime routine — short, calm, uses parent voice if uploaded.
const bedtime: Story = {
  id: "story_bedtime",
  themeId: "theme_bedtime",
  title: "잘 자기 전",
  subtitle: "이불 덮고 인사하고 잠들기",
  coverEmoji: "🌙",
  coverImageQuery: "cozy kids bedroom night soft",
  tags: ["일상", "잠자기"],
  estimatedMinutes: 3,
  startSceneId: "b1",
  scenes: [
    {
      id: "b1",
      placeId: "bedroom",
      visual: "🌙✨",
      audioFile: "/assets/voice/bedtime_intro.mp3",
      parentSummary: "잘 시간이라고 알리고 이불 안내.",
      choices: [
        { id: "go_bed", emoji: "🛏️", nextSceneId: "b2", parentLabel: "이불 덮기" },
      ],
    },
    {
      id: "b2",
      placeId: "bedroom",
      visual: "🐰💗",
      audioFile: "/assets/voice/bedtime_kkang.mp3",
      parentSummary: "깡총이가 옆에 누워서 같이 자기.",
      choices: [
        { id: "hug", emoji: "🤗", nextSceneId: "b3", parentLabel: "안아주기" },
        { id: "kiss", emoji: "💋", nextSceneId: "b3", parentLabel: "뽀뽀해주기" },
      ],
    },
    {
      id: "b3",
      placeId: "bedroom",
      visual: "😴💫",
      audioFile: "/assets/voice/bedtime_close.mp3",
      parentSummary: "잘 자라고 인사하며 마무리.",
      choices: [],
    },
  ],
};

// Morning routine — wake up, hello, get ready.
const morning: Story = {
  id: "story_morning",
  themeId: "theme_morning",
  title: "아침에 일어나서",
  subtitle: "잘 잤어? 오늘도 좋은 하루 보내자",
  coverEmoji: "☀️",
  coverImageQuery: "soft morning sunrise kids bedroom",
  tags: ["일상"],
  estimatedMinutes: 3,
  startSceneId: "m1",
  scenes: [
    {
      id: "m1",
      placeId: "bedroom",
      visual: "☀️🐰",
      audioFile: "/assets/voice/morning_hi.mp3",
      parentSummary: "잘 잤는지 묻기.",
      choices: [
        { id: "wake_well", emoji: "😊", nextSceneId: "m2", parentLabel: "잘 잤어" },
        { id: "wake_tired", emoji: "🥱", nextSceneId: "m2", parentLabel: "조금 졸려" },
      ],
    },
    {
      id: "m2",
      placeId: "kitchen",
      visual: "🥣🥛",
      audioFile: "/assets/voice/morning_food.mp3",
      parentSummary: "아침으로 무엇을 먹을지.",
      choices: [
        { id: "cereal", emoji: "🥣", nextSceneId: "m3", parentLabel: "시리얼" },
        { id: "rice", emoji: "🍚", nextSceneId: "m3", parentLabel: "밥" },
      ],
    },
    {
      id: "m3",
      placeId: "home",
      visual: "🚪✨",
      audioFile: "/assets/voice/morning_close.mp3",
      parentSummary: "오늘도 좋은 하루 보내자.",
      choices: [],
    },
  ],
};

// Book reading — pretend to read a book together with 깡총이.
const bookReading: Story = {
  id: "story_book_reading",
  themeId: "theme_book",
  title: "책 읽어줄게",
  subtitle: "깡총이랑 그림책 한 권",
  coverEmoji: "📚",
  coverImageQuery: "kids picture book reading cozy",
  tags: ["놀이"],
  estimatedMinutes: 5,
  startSceneId: "r1",
  scenes: [
    {
      id: "r1",
      placeId: "reading_corner",
      visual: "📚🐰",
      audioFile: "/assets/voice/book_intro.mp3",
      parentSummary: "오늘은 어떤 책 읽을지 묻기.",
      choices: [
        { id: "book_animal", emoji: "🦁", nextSceneId: "r2", parentLabel: "동물 책" },
        { id: "book_car", emoji: "🚗", nextSceneId: "r2", parentLabel: "자동차 책" },
        { id: "book_food", emoji: "🍎", nextSceneId: "r2", parentLabel: "음식 책" },
      ],
    },
    {
      id: "r2",
      placeId: "reading_corner",
      visual: "👀💡",
      audioFile: "/assets/voice/book_question.mp3",
      parentSummary: "책 안의 무엇이 가장 좋았는지.",
      choices: [
        { id: "fav_color", emoji: "🌈", nextSceneId: "r3", parentLabel: "색깔" },
        { id: "fav_picture", emoji: "🖼️", nextSceneId: "r3", parentLabel: "그림" },
      ],
    },
    {
      id: "r3",
      placeId: "reading_corner",
      visual: "📚✨",
      audioFile: "/assets/voice/book_close.mp3",
      parentSummary: "재밌게 읽었구나 마무리.",
      choices: [],
    },
  ],
};

export const stories: Story[] = [
  todayKinder,
  bedtime,
  morning,
  bookReading,
  martBananaStory,
  parkWalk,
];
