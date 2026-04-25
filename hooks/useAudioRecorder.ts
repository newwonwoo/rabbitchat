"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioRecorderError =
  | "unsupported"
  | "permission_denied"
  | "no_device"
  | "unknown";

export type UseAudioRecorder = {
  isRecording: boolean;
  isSupported: boolean;
  error: AudioRecorderError | null;
  lastBlob: Blob | null;
  start: () => Promise<void>;
  stop: () => void;
};

// Real MediaRecorder wiring. Browser-only — guards SSR by checking for window.
// On unsupported environments (iOS < 14.3 Safari without MediaRecorder, etc.)
// `start` no-ops and `error` is set to "unsupported" so the parent UI can
// display a message. The child screen never depends on this hook.
export function useAudioRecorder(): UseAudioRecorder {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<AudioRecorderError | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    if (!isSupported) {
      setError("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        setLastBlob(blob);
        cleanup();
        setIsRecording(false);
      };
      recorderRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("permission_denied");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError("no_device");
      } else {
        setError("unknown");
      }
      cleanup();
      setIsRecording(false);
    }
  }, [isSupported, cleanup]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    } else {
      cleanup();
      setIsRecording(false);
    }
  }, [cleanup]);

  return { isRecording, isSupported, error, lastBlob, start, stop };
}
