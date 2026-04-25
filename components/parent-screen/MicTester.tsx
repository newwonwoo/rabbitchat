"use client";

import { useEffect, useState } from "react";

import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { getProviderMode, getSTTProvider } from "@/lib/providers";

// Laptop / tablet mic test:
//  1. Press 녹음 시작 → asks for mic permission, then records.
//  2. Press 정지 → recording stops, the captured Blob is exposed.
//  3. Auto-plays the recording so the parent confirms the mic works.
//  4. If NEXT_PUBLIC_PROVIDER=real and OPENAI_API_KEY is present, sends
//     the blob to Whisper and shows the transcription.

export function MicTester() {
  const rec = useAudioRecorder();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rec.lastBlob) {
      const url = URL.createObjectURL(rec.lastBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [rec.lastBlob]);

  const onTranscribe = async () => {
    if (!rec.lastBlob) return;
    setError(null);
    setTranscript(null);
    setTranscribing(true);
    try {
      const stt = getSTTProvider();
      const text = await stt.transcribe(rec.lastBlob);
      setTranscript(text || "(빈 결과)");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTranscribing(false);
    }
  };

  const errLabel: Record<string, string> = {
    unsupported: "이 브라우저는 마이크 녹음을 지원하지 않습니다.",
    permission_denied: "마이크 권한이 거부되었습니다. 주소창 잠금 아이콘에서 허용하세요.",
    no_device: "마이크 장치를 찾을 수 없습니다.",
    unknown: "알 수 없는 오류입니다.",
  };

  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-soft">
      <h2 className="text-base font-semibold">마이크 테스트</h2>
      <p className="mt-1 text-xs text-kkang-ink/60">
        랩탑/태블릿 마이크가 동작하는지 확인합니다. 녹음한 음성은
        브라우저 안에서만 재생되며 외부로 전송되지 않습니다.
      </p>

      <div className="mt-3 flex items-center gap-2">
        {!rec.isRecording ? (
          <button
            type="button"
            onClick={() => rec.start()}
            className="rounded-xl bg-kkang-pink px-4 py-2 text-sm font-semibold shadow-pop active:scale-[0.99]"
          >
            🎙️ 녹음 시작
          </button>
        ) : (
          <button
            type="button"
            onClick={() => rec.stop()}
            className="rounded-xl bg-kkang-ink px-4 py-2 text-sm font-semibold text-white shadow-pop active:scale-[0.99]"
          >
            ⏹ 정지
          </button>
        )}
        <span className="text-xs text-kkang-ink/60">
          {rec.isRecording
            ? "녹음 중…"
            : rec.lastBlob
              ? `녹음 완료 (${(rec.lastBlob.size / 1024).toFixed(1)} KB)`
              : "대기 중"}
        </span>
      </div>

      {rec.error ? (
        <p className="mt-2 text-sm text-red-700">
          {errLabel[rec.error] ?? rec.error}
        </p>
      ) : null}

      {previewUrl ? (
        <div className="mt-3">
          <p className="text-xs text-kkang-ink/60">방금 녹음한 음성:</p>
          <audio controls src={previewUrl} className="mt-1 w-full" />
        </div>
      ) : null}

      <div className="mt-4 border-t border-kkang-beige/60 pt-3">
        <h3 className="text-sm font-semibold">음성 인식 (STT)</h3>
        <p className="mt-1 text-xs text-kkang-ink/60">
          provider 모드: <strong>{getProviderMode()}</strong>
          {getProviderMode() === "mock" ? (
            <>
              {" "}
              — mock 모드라 항상 <code>(mock-transcript)</code>가 반환됩니다. 실제
              음성 인식을 켜려면 <code>NEXT_PUBLIC_PROVIDER=real</code>{" "}
              + <code>OPENAI_API_KEY</code> 필요.
            </>
          ) : (
            " — OpenAI Whisper로 전송합니다."
          )}
        </p>
        <button
          type="button"
          onClick={onTranscribe}
          disabled={!rec.lastBlob || transcribing}
          className="mt-2 rounded-xl bg-kkang-cream px-4 py-2 text-sm shadow-soft active:scale-[0.99] disabled:opacity-50"
        >
          {transcribing ? "인식 중…" : "이 녹음을 텍스트로 변환"}
        </button>
        {transcript ? (
          <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-kkang-ivory p-2 text-sm text-kkang-ink">
            {transcript}
          </pre>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
