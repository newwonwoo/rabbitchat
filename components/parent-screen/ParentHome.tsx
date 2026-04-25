"use client";

import type { Character } from "@/types/character";
import type { Scene, Story } from "@/types/story";

type Props = {
  story: Story;
  scene: Scene;
  character: Character;
  onOpenMenu: () => void;
  onOpenLogs: () => void;
  onOpenThemes: () => void;
  onOpenCharacters: () => void;
  onOpenPlaces: () => void;
  onOpenSettings: () => void;
  onOpenBuilder: () => void;
  onReturnToChild: () => void;
};

export function ParentHome({
  story,
  scene,
  character,
  onOpenMenu,
  onOpenLogs,
  onOpenThemes,
  onOpenCharacters,
  onOpenPlaces,
  onOpenSettings,
  onOpenBuilder,
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

        <div className="grid grid-cols-2 gap-3">
          <MenuTile label="놀이 메뉴" hint="재시작·테마·캐릭터" onPress={onOpenMenu} />
          <MenuTile label="턴 로그" hint="아이의 선택 기록" onPress={onOpenLogs} />
          <MenuTile label="테마 선택" hint="이야기 테마 변경" onPress={onOpenThemes} />
          <MenuTile label="캐릭터 선택" hint="깡총이/딸딸이" onPress={onOpenCharacters} />
          <MenuTile label="장소 관리" hint="장소 카탈로그" onPress={onOpenPlaces} />
          <MenuTile label="이야기 만들기" hint="새 이야기 추가" onPress={onOpenBuilder} />
          <MenuTile label="설정" hint="볼륨·안전·데이터" onPress={onOpenSettings} className="col-span-2" />
        </div>

        <button
          type="button"
          onClick={onReturnToChild}
          className="mt-6 w-full rounded-2xl bg-kkang-pink px-5 py-4 text-base font-semibold shadow-pop active:scale-[0.99]"
        >
          아동 화면으로 돌아가기
        </button>
      </div>
    </main>
  );
}

function MenuTile({
  label,
  hint,
  onPress,
  className = "",
}: {
  label: string;
  hint: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`rounded-2xl bg-kkang-cream px-4 py-3 text-left shadow-soft active:scale-[0.99] ${className}`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-kkang-ink/60">{hint}</div>
    </button>
  );
}
