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
  choices: Choice[];
};

export type Story = {
  id: string;
  themeId: string;
  title: string;
  scenes: Scene[];
  startSceneId: string;
};
