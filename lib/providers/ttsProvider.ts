export type TTSProvider = {
  name: string;
  speak: (text: string) => Promise<void>;
  // Cache-warm without playing audio. Optional — providers without
  // network cost (mock) can omit.
  prefetch?: (text: string) => Promise<void>;
};
