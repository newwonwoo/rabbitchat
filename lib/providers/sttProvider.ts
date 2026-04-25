export type STTProvider = {
  name: string;
  transcribe: (audio: Blob) => Promise<string>;
};
