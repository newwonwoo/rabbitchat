"use client";

import { useCallback, useState } from "react";

export type UseAudioRecorder = {
  isRecording: boolean;
  start: () => void;
  stop: () => void;
};

// Skeleton hook. MVP does not request mic permission or instantiate
// MediaRecorder. Real wiring point (future):
//   - request getUserMedia({ audio: true })
//   - new MediaRecorder(stream)
//   - collect blobs into chunks, expose via stop()
export function useAudioRecorder(): UseAudioRecorder {
  const [isRecording, setIsRecording] = useState(false);

  const start = useCallback(() => {
    setIsRecording(true);
  }, []);

  const stop = useCallback(() => {
    setIsRecording(false);
  }, []);

  return { isRecording, start, stop };
}
