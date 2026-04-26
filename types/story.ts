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

export type Story = {
  id: string;
  themeId: string;
  title: string;
  scenes: Scene[];
  startSceneId: string;
};
