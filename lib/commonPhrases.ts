// Frequently-spoken short lines that the parent can pre-warm into the
// TTS cache once. After warming, every replay of these is free.
//
// Categorized for easy editing. All lines pass through sanitizeCharacterVoice
// implicitly (no "엄마가 ~" patterns) and stay short enough to fit Free
// tier comfortably (avg 12 chars × ~30 lines = ~360 chars total).

export const COMMON_PHRASES = {
  greeting: [
    "안녕! 깡총이야.",
    "오늘도 같이 놀자!",
    "반가워, 친구야!",
    "기다렸어!",
  ],
  encouragement: [
    "잘했어!",
    "정말 멋져!",
    "참 잘했어!",
    "와, 멋지다!",
    "최고야!",
  ],
  progression: [
    "다음에 뭐 할까?",
    "한 번 더 해볼까?",
    "또 해볼래?",
    "우리 같이 해보자.",
  ],
  emotion_check: [
    "기분이 어땠어?",
    "재미있었어?",
    "어떤 게 좋았어?",
  ],
  food_reactions: [
    "냠냠!",
    "맛있다!",
    "한 입 더 먹어볼까?",
    "달콤해!",
  ],
  attention: [
    "이거 봐!",
    "여기 있어.",
    "보여줄게.",
  ],
  comfort: [
    "내가 옆에 있어.",
    "괜찮아, 친구야.",
    "깡총이가 도와줄게.",
  ],
  closing: [
    "오늘도 즐거웠어!",
    "또 만나자!",
    "잘 자, 친구야.",
  ],
} as const;

export type CommonPhraseCategory = keyof typeof COMMON_PHRASES;

export function getAllCommonPhrases(): string[] {
  const out: string[] = [];
  for (const cat of Object.keys(COMMON_PHRASES) as CommonPhraseCategory[]) {
    for (const line of COMMON_PHRASES[cat]) out.push(line);
  }
  return out;
}

export function getCommonPhraseStats(): {
  totalLines: number;
  totalChars: number;
} {
  const all = getAllCommonPhrases();
  return {
    totalLines: all.length,
    totalChars: all.reduce((sum, s) => sum + s.length, 0),
  };
}
