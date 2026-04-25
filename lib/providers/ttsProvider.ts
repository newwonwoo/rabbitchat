export type TTSProvider = {
  name: string;
  speak: (text: string) => Promise<void>;
};
