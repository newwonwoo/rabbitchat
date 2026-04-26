"use client";

import { useEffect, useRef, useState } from "react";

import { putCharacterPose, clearCharacterPoses } from "@/lib/aiCache";
import type { CharacterMood } from "@/types/character";

// Browser-side slicer. Loads the uploaded CI sheet, lets the parent drag
// 6 rectangles over each pose, and saves the resulting Blobs into
// IndexedDB ("character" store) keyed by mood.
//
// No coordinate guessing. No re-cropping needed when the sheet image
// resolution differs from what we expected.

const MOODS: { id: CharacterMood; label: string }[] = [
  { id: "happy", label: "HAPPY" },
  { id: "listening", label: "LISTENING" },
  { id: "waving", label: "WAVING" },
  { id: "thinking", label: "THINKING" },
  { id: "jumping", label: "JUMPING" },
  { id: "sleepy", label: "SLEEPY" },
];

const SHEET_SRC = "/assets/ci/character-sheet.png";

type Rect = { x: number; y: number; w: number; h: number };

// Reasonable initial layout assuming 6 poses across the lower middle band.
// Parent will drag/resize to fit their actual sheet.
function initialRect(index: number, sheetW: number, sheetH: number): Rect {
  const slotW = sheetW / 6;
  return {
    x: index * slotW + slotW * 0.05,
    y: sheetH * 0.55,
    w: slotW * 0.9,
    h: sheetH * 0.25,
  };
}

export function CharacterSlicer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [rects, setRects] = useState<Record<CharacterMood, Rect>>(
    () =>
      Object.fromEntries(MOODS.map((m) => [m.id, { x: 0, y: 0, w: 0, h: 0 }])) as Record<
        CharacterMood,
        Rect
      >,
  );
  const [activeMood, setActiveMood] = useState<CharacterMood>("happy");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Drag state (in display pixels, converted to intrinsic on save)
  const [dragMode, setDragMode] = useState<"move" | "resize" | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    rect: Rect;
  } | null>(null);

  const onImgLoad = () => {
    if (!imgRef.current) return;
    const w = imgRef.current.naturalWidth;
    const h = imgRef.current.naturalHeight;
    setImgSize({ w, h });
    const seed: Record<CharacterMood, Rect> = Object.fromEntries(
      MOODS.map((m, i) => [m.id, initialRect(i, w, h)]),
    ) as Record<CharacterMood, Rect>;
    setRects(seed);
  };

  // Convert display coords to intrinsic image coords
  const getDisplayScale = (): number => {
    if (!imgRef.current || !imgSize) return 1;
    return imgRef.current.clientWidth / imgSize.w;
  };

  const startDrag = (e: React.PointerEvent, mood: CharacterMood, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    setActiveMood(mood);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture?.(e.pointerId);
    const rect = rects[mood];
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rect: { ...rect },
    };
    setDragMode(mode);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragMode || !dragStartRef.current || !imgRef.current || !imgSize) return;
    const scale = getDisplayScale();
    const dx = (e.clientX - dragStartRef.current.x) / scale;
    const dy = (e.clientY - dragStartRef.current.y) / scale;
    setRects((prev) => {
      const next = { ...prev };
      const cur = next[activeMood];
      const start = dragStartRef.current!.rect;
      if (dragMode === "move") {
        next[activeMood] = {
          ...cur,
          x: Math.max(0, Math.min(imgSize.w - cur.w, start.x + dx)),
          y: Math.max(0, Math.min(imgSize.h - cur.h, start.y + dy)),
        };
      } else {
        next[activeMood] = {
          ...cur,
          w: Math.max(20, Math.min(imgSize.w - cur.x, start.w + dx)),
          h: Math.max(20, Math.min(imgSize.h - cur.y, start.h + dy)),
        };
      }
      return next;
    });
  };

  const endDrag = () => {
    setDragMode(null);
    dragStartRef.current = null;
  };

  const sliceAndSave = async () => {
    if (!imgRef.current || !imgSize) return;
    setBusy(true);
    setFeedback("자르는 중…");
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas not supported");
      let saved = 0;
      for (const mood of MOODS.map((m) => m.id)) {
        const r = rects[mood];
        if (r.w < 10 || r.h < 10) continue;
        canvas.width = Math.round(r.w);
        canvas.height = Math.round(r.h);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          imgRef.current,
          r.x,
          r.y,
          r.w,
          r.h,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png"),
        );
        if (blob) {
          await putCharacterPose(mood, blob);
          saved += 1;
        }
      }
      setFeedback(`${saved}개 표정 저장됨. 다시 메뉴로 돌아가서 새로고침하면 적용.`);
    } catch (e) {
      setFeedback(`실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    if (!imgRef.current || !imgSize) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      for (const mood of MOODS.map((m) => m.id)) {
        const r = rects[mood];
        if (r.w < 10 || r.h < 10) continue;
        canvas.width = Math.round(r.w);
        canvas.height = Math.round(r.h);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgRef.current, r.x, r.y, r.w, r.h, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/png"),
        );
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `kkang_${mood}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
      setFeedback("6개 PNG 다운로드 완료.");
    } finally {
      setBusy(false);
    }
  };

  const onClear = async () => {
    if (!window.confirm("저장된 캐릭터 컷을 지울까요?")) return;
    await clearCharacterPoses();
    setFeedback("저장된 캐릭터 컷 삭제됨.");
  };

  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-soft">
      <h2 className="text-base font-semibold">캐릭터 시트 자르기</h2>
      <p className="mt-1 text-xs text-kkang-ink/60">
        업로드된 CI 시트(<code>/assets/ci/character-sheet.png</code>)에서 6개 표정을
        직접 드래그로 잘라 IndexedDB에 저장합니다. 좌표 짐작 X. 파란색 사각형을 끌어
        포즈 위에 놓고, 우하단 손잡이로 크기 조절. 다 맞추면 "저장".
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActiveMood(m.id)}
            className={`rounded-lg px-3 py-1 text-xs ${
              activeMood === m.id
                ? "bg-kkang-pink font-semibold"
                : "bg-kkang-cream"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {imgError ? (
        <p className="mt-3 text-sm text-red-700">
          시트 파일을 찾을 수 없습니다. <code>public/assets/ci/character-sheet.png</code>{" "}
          업로드 후 다시 열어주세요.
        </p>
      ) : null}

      <div
        ref={containerRef}
        className="relative mt-3 inline-block max-w-full overflow-hidden rounded-xl border-2 border-kkang-beige"
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={SHEET_SRC}
          alt=""
          aria-hidden
          onLoad={onImgLoad}
          onError={() => setImgError(true)}
          className="block max-w-full select-none"
          draggable={false}
        />
        {imgSize
          ? MOODS.map((m) => {
              const r = rects[m.id];
              const scale = getDisplayScale();
              const display = {
                left: r.x * scale,
                top: r.y * scale,
                width: r.w * scale,
                height: r.h * scale,
              };
              const isActive = activeMood === m.id;
              return (
                <div
                  key={m.id}
                  className="absolute touch-none"
                  style={{
                    left: display.left,
                    top: display.top,
                    width: display.width,
                    height: display.height,
                  }}
                >
                  <div
                    className={`relative h-full w-full border-2 ${
                      isActive ? "border-pink-500 bg-pink-500/10" : "border-blue-400 bg-blue-400/5"
                    } cursor-move`}
                    onPointerDown={(e) => startDrag(e, m.id, "move")}
                  >
                    <span
                      className={`absolute left-1 top-1 rounded px-1 text-[10px] font-bold ${
                        isActive ? "bg-pink-500 text-white" : "bg-blue-400 text-white"
                      }`}
                    >
                      {m.label}
                    </span>
                    <div
                      className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize bg-pink-500"
                      onPointerDown={(e) => startDrag(e, m.id, "resize")}
                    />
                  </div>
                </div>
              );
            })
          : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={sliceAndSave}
          disabled={busy || imgError}
          className="rounded-xl bg-kkang-pink px-4 py-2 text-sm font-semibold shadow-pop active:scale-[0.99] disabled:opacity-50"
        >
          저장 (앱에 즉시 적용)
        </button>
        <button
          type="button"
          onClick={downloadAll}
          disabled={busy || imgError}
          className="rounded-xl bg-kkang-cream px-4 py-2 text-sm shadow-soft active:scale-[0.99] disabled:opacity-50"
        >
          PNG 6장 다운로드
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="rounded-xl bg-white px-4 py-2 text-sm shadow-soft active:scale-[0.99] disabled:opacity-50"
        >
          저장된 컷 지우기
        </button>
        {feedback ? (
          <span className="text-xs text-kkang-ink/70">{feedback}</span>
        ) : null}
      </div>
    </section>
  );
}
