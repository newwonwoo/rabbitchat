"use client";

import type { Turn } from "@/types/turn";

type Props = {
  turns: Turn[];
  onBack: () => void;
};

const ACTOR_LABEL: Record<Turn["actor"], string> = {
  child: "아이",
  character: "깡총이",
  system: "시스템",
};

const EVENT_LABEL: Record<Turn["event"], string> = {
  session_start: "세션 시작",
  character_press: "캐릭터 누름",
  mock_voice: "음성 재생",
  choice: "선택",
  parent_gate: "부모 진입",
  restart_story: "재시작",
  change_theme: "테마 변경",
  change_character: "캐릭터 변경",
};

export function ParentLogViewer({ turns, onBack }: Props) {
  const reversed = [...turns].reverse();
  return (
    <main className="min-h-screen bg-kkang-ivory px-6 py-8 text-kkang-ink">
      <div className="mx-auto max-w-md">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">턴 로그</h1>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-kkang-cream px-4 py-2 text-sm shadow-soft"
          >
            뒤로
          </button>
        </header>

        {reversed.length === 0 ? (
          <p className="text-sm text-kkang-ink/60">아직 기록된 턴이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {reversed.map((t) => (
              <li
                key={t.id}
                className="rounded-2xl bg-white/70 px-4 py-3 text-sm shadow-soft"
              >
                <div className="flex items-center justify-between text-xs text-kkang-ink/50">
                  <span>{new Date(t.at).toLocaleTimeString("ko-KR")}</span>
                  <span>
                    {ACTOR_LABEL[t.actor]} · {EVENT_LABEL[t.event]}
                  </span>
                </div>
                <div className="mt-1 break-words text-kkang-ink/80">{t.detail}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
