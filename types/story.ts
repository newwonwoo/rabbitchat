export type Choice = {
  id: string;
  emoji: string;
  nextSceneId: string | null;
  parentLabel: string;
  // What 깡총이 says immediately after the child picks this choice.
  // Sent to TTS provider, cached forever per text.
  responseLine?: string;
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
  // Fallback: when audioFile is missing or 404s, this short Korean line
  // is sent to the TTS provider (ElevenLabs voice clone in real mode)
  // and played in the parent's cloned voice. Cached forever per text
  // (lib/aiCache.ts → "tts" store).
  spokenLine?: string;
  choices: Choice[];
};

export type StoryTag = "회상" | "모험" | "일상" | "잠자기" | "먹기" | "놀이";

export type StoryStatus = "draft" | "published";

export type Story = {
  id: string;
  themeId: string;
  title: string;
  subtitle?: string;
  coverEmoji?: string;
  coverImageQuery?: string;
  tags?: StoryTag[];
  estimatedMinutes?: number;
  scenes: Scene[];
  startSceneId: string;
  // Authoring lifecycle
  status?: StoryStatus;           // undefined for built-in stories
  draftAt?: string;               // ISO when AI first generated
  publishedAt?: string;           // ISO when parent deployed to child
  generatedFromInput?: string;    // raw natural-language input (audit)
};
