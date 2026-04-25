const PLAY_DURATION_MS = 700;

export type AudioStateListener = (isPlaying: boolean) => void;

export function playMockVoice(setIsPlaying: AudioStateListener): () => void {
  setIsPlaying(true);
  const handle = setTimeout(() => {
    setIsPlaying(false);
  }, PLAY_DURATION_MS);
  return () => {
    clearTimeout(handle);
    setIsPlaying(false);
  };
}
