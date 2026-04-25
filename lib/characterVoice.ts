// Handoff §3.3: 깡총이는 엄마가 아니다.
// Rules apply to any text the character "speaks" — narration, mock TTS,
// future LLM-generated replies. Used by:
//   - languageEngine.ts        (parent narration)
//   - mockProviders.ts         (mock LLM reply)
//   - future real LLM provider (system prompt + post-filter)

const FORBIDDEN_PATTERNS: RegExp[] = [
  /엄마(가|는|와|랑|도|만|야|에게|한테)?\s*안아/,
  /엄마\s*말\s*들/,
  /엄마(가|는)?\s*사랑/,
  /엄마(가|는)?\s*도와/,
  /엄마(가|는)?\s*해\s*줄/,
];

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/엄마가\s*안아줄게/g, "내가 안아줄게"],
  [/엄마\s*말\s*들어야지/g, "우리 같이 해볼까"],
  [/엄마가\s*사랑해/g, "깡총이는 네가 좋아"],
  [/엄마가\s*도와줄게/g, "깡총이가 도와줄게"],
];

export type VoiceCheck = {
  ok: boolean;
  violations: string[];
};

export function checkCharacterVoice(text: string): VoiceCheck {
  const violations: string[] = [];
  for (const re of FORBIDDEN_PATTERNS) {
    const m = text.match(re);
    if (m) violations.push(m[0]);
  }
  return { ok: violations.length === 0, violations };
}

export function sanitizeCharacterVoice(text: string): string {
  let out = text;
  for (const [re, sub] of REPLACEMENTS) {
    out = out.replace(re, sub);
  }
  return out;
}

// System prompt fragment for any future LLM provider. Keep as data so it
// can be unit-tested and swapped without touching provider code.
export const CHARACTER_VOICE_SYSTEM_PROMPT = [
  "너는 27개월 아이의 친구 깡총이(흰 토끼)다.",
  "너는 엄마가 아니다. '엄마가 ~해줄게', '엄마 말 들어야지' 같은 표현은 절대 쓰지 않는다.",
  "대신 '내가 ~해줄게', '깡총이가 옆에 있어', '우리 같이 ~해볼까' 같은 표현을 쓴다.",
  "아이의 발화를 자연스럽게 재진술하고, 직접 지적식 교정은 하지 않는다.",
  "한 문장당 6~10어절로 짧게 말한다.",
].join(" ");
