export type Choice = {
  id: string;
  emoji: string;
  nextSceneId: string | null;
  parentLabel: string;
};

export type Scene = {
  id: string;
  placeId: string;
  visual: string;
  parentSummary: string;
  // Optional pre-recorded mp3 played when this scene loads.
  // Bypasses TTS when present — used for the parent's recorded voice
  // (handoff §1.2 "엄마 유사 목소리"). Path is relative to /public.
  audioFile?: string;
  choices: Choice[];
};

export type StoryTag = "회상" | "모험" | "일상" | "잠자기" | "먹기" | "놀이";

export type Story = {
  id: string;
  themeId: string;
  title: string;
  // Premium metadata
  subtitle?: string;          // 짧은 한 줄 설명 (e.g. "오늘 어린이집에서 있었던 일")
  coverEmoji?: string;        // 이미지 없을 때 폴백 (e.g. "🏫")
  coverImageQuery?: string;   // Pexels 검색용 키워드 (e.g. "korean kindergarten")
  tags?: StoryTag[];
  estimatedMinutes?: number;
  scenes: Scene[];
  startSceneId: string;
};
