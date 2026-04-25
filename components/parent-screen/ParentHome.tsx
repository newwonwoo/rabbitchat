"use client";

import type { Character } from "@/types/character";
import type { Scene, Story } from "@/types/story";

type Props = {
  story: Story;
  scene: Scene;
  character: Character;
  onOpenMenu: () => void;
  onOpenLogs: () => void;
  onReturnToChild: () => void;
};

export function ParentHome({
  story,
  scene,
  character,
  onOpenMenu,
  onOpenLogs,
  onReturnToChild,
}: Props) {
  return (
    <main className="min-h-screen bg-kkang-ivory px-6 py-8 text-kkang-ink">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <p className="text-sm text-kkang-ink/60">부모 화면</p>
          <h1 className="mt-1 text-2xl font-bold">깡총이와 함께</h1>
        </header>

        <section className="mb-6 rounded-3xl bg-white/70 p-5 shadow-soft">
          <div className="mb-3 text-sm text-kkang-ink/60">현재 이야기</div>
          <div className="text-lg font-semibold">{story.title}</div>
          <div className="mt-2 text-sm text-kkang-ink/70">
            {scene.parentSummary}
          </div>
          <div className="mt-3 text-xs text-kkang-ink/50">
            캐릭터: {character.name} · 장면: {scene.id}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-2xl bg-kkang-cream px-5 py-4 text-left shadow-soft active:scale-[0.99]"
          >
            <div className="text-base font-semibold">놀이 메뉴</div>
            <div className="text-xs text-kkang-ink/60">재시작 · 테마 · 캐릭터 변경</div>
          </button>
          <button
            type="button"
            onClick={onOpenLogs}
            className="rounded-2xl bg-kkang-cream px-5 py-4 text-left shadow-soft active:scale-[0.99]"
          >
            <div className="text-base font-semibold">턴 로그 보기</div>
            <div className="text-xs text-kkang-ink/60">아이의 선택과 이벤트 누적</div>
          </button>
          <button
            type="button"
            onClick={onReturnToChild}
            className="rounded-2xl bg-kkang-pink px-5 py-4 text-left text-kkang-ink shadow-pop active:scale-[0.99]"
          >
            <div className="text-base font-semibold">아동 화면으로 돌아가기</div>
            <div className="text-xs text-kkang-ink/60">놀이 계속하기</div>
          </button>
        </div>
      </div>
    </main>
  );
}
