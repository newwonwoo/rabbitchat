"use client";

import { useEffect, useState } from "react";

import { ParentGate } from "@/components/child-screen/ParentGate";
import { useSearchedImage } from "@/lib/imageSearcher";
import type { Story } from "@/types/story";

type Props = {
  childName: string;
  todayStory: Story | null;
  libraryStories: Story[];
  onPickStory: (story: Story) => void;
  onParentEnter: () => void;
};

// Curated home screen — premium subscription feel.
// Top: greeting with child's name + 깡총이 mini avatar.
// Hero: "오늘의 이야기" big card.
// Below: "다른 이야기" library grid.
//
// Empty state: when there's no published story (todayStory == null) we
// show a 깡총이 holding an empty book + a soft message asking the
// parent to create one. The 🔒 parent gate stays in the corner so the
// adult can long-press into the authoring wizard.
export function HomeScreen({
  childName,
  todayStory,
  libraryStories,
  onPickStory,
  onParentEnter,
}: Props) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const dateLabel = now
    ? `${now.getMonth() + 1}월 ${now.getDate()}일 ${dayName(now.getDay())}`
    : "";

  return (
    <main
      aria-label="home"
      className="relative flex min-h-screen flex-col bg-gradient-to-b from-kkang-ivory via-kkang-cream to-kkang-beige px-6 pb-10 pt-8"
    >
      {/* Parent gate (top right) */}
      <div className="absolute right-4 top-4 z-10">
        <ParentGate onUnlock={onParentEnter} />
      </div>

      {/* Greeting header */}
      <header className="mx-auto w-full max-w-2xl">
        <p className="text-sm font-medium text-kkang-ink/60">{dateLabel}</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-kkang-ink">
          <span aria-hidden className="text-5xl">🐰</span>
          안녕, {childName || "친구"}야!
        </h1>
        <p className="mt-1 text-base text-kkang-ink/70">
          {todayStory
            ? "오늘은 깡총이랑 어떤 이야기 해볼까?"
            : "깡총이가 새 이야기를 기다리고 있어요"}
        </p>
      </header>

      {todayStory ? (
        <>
          {/* Hero — Today's story */}
          <section className="mx-auto mt-8 w-full max-w-2xl">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-kkang-ink/50">
              오늘의 이야기
            </h2>
            <HeroCard story={todayStory} onPick={() => onPickStory(todayStory)} />
          </section>

          {/* Library grid */}
          {libraryStories.length > 0 ? (
            <section className="mx-auto mt-8 w-full max-w-2xl">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-kkang-ink/50">
                다른 이야기
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {libraryStories.map((s) => (
                  <LibraryCard key={s.id} story={s} onPick={() => onPickStory(s)} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyHome childName={childName} />
      )}
    </main>
  );
}

function EmptyHome({ childName }: { childName: string }) {
  return (
    <section className="mx-auto mt-12 flex w-full max-w-xl flex-col items-center text-center">
      <div className="relative mb-6">
        <span aria-hidden className="text-[120px]">🐰</span>
        <span aria-hidden className="absolute -right-4 bottom-2 text-5xl">📖</span>
      </div>
      <h2 className="text-2xl font-bold text-kkang-ink">
        아직 이야기가 없어요
      </h2>
      <p className="mt-2 max-w-md text-base leading-relaxed text-kkang-ink/70">
        엄마·아빠가 첫 이야기를 만들어 주시면
        <br />
        깡총이가 {childName || "친구"}이를 위해 들려드릴게요.
      </p>
      <div className="mt-6 rounded-2xl bg-white/80 p-4 text-sm text-kkang-ink/70 shadow-soft">
        <div className="font-semibold text-kkang-ink">📖 부모님께</div>
        <div className="mt-1 text-xs">
          우상단의 🔒 아이콘을 3초간 눌러 부모 화면으로 들어간 뒤
          <br />
          <strong>"이야기 만들기"</strong>에서 첫 이야기를 만들어 주세요.
        </div>
      </div>
    </section>
  );
}

function HeroCard({ story, onPick }: { story: Story; onPick: () => void }) {
  const { url } = useSearchedImage(
    story.coverImageQuery ?? story.title,
    "landscape",
  );
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`${story.title} 시작`}
      className="group relative flex h-72 w-full overflow-hidden rounded-3xl bg-kkang-pink shadow-pop transition-transform active:scale-[0.99]"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {!url ? (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center text-9xl">
          {story.coverEmoji ?? "✨"}
        </span>
      ) : null}
      {/* Gradient overlay for legibility */}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-kkang-ink/70 via-kkang-ink/20 to-transparent"
      />
      {/* Text on top */}
      <div className="relative mt-auto p-5 text-left">
        <div className="mb-2 flex items-center gap-2">
          {story.tags?.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-kkang-ink"
            >
              {t}
            </span>
          ))}
          {story.estimatedMinutes ? (
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-kkang-ink/80">
              약 {story.estimatedMinutes}분
            </span>
          ) : null}
        </div>
        <h3 className="text-2xl font-bold text-white drop-shadow-md">
          {story.title}
        </h3>
        {story.subtitle ? (
          <p className="mt-1 text-sm text-white/90 drop-shadow">
            {story.subtitle}
          </p>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-kkang-ink shadow-pop">
          ▶ 지금 시작
        </span>
      </div>
    </button>
  );
}

function LibraryCard({ story, onPick }: { story: Story; onPick: () => void }) {
  const { url } = useSearchedImage(
    story.coverImageQuery ?? story.title,
    "square",
  );
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`${story.title} 시작`}
      className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-soft transition-transform active:scale-[0.98]"
    >
      <div className="relative h-32 w-full overflow-hidden bg-kkang-cream">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center text-6xl"
          >
            {story.coverEmoji ?? "✨"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-1">
          {story.tags?.slice(0, 1).map((t) => (
            <span
              key={t}
              className="rounded-full bg-kkang-pink/30 px-2 py-0.5 text-[10px] font-semibold text-kkang-ink"
            >
              {t}
            </span>
          ))}
          {story.estimatedMinutes ? (
            <span className="text-[10px] text-kkang-ink/50">
              {story.estimatedMinutes}분
            </span>
          ) : null}
        </div>
        <h3 className="text-sm font-bold leading-tight text-kkang-ink">
          {story.title}
        </h3>
        {story.subtitle ? (
          <p className="line-clamp-2 text-xs text-kkang-ink/60">
            {story.subtitle}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function dayName(dow: number): string {
  return ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][dow];
}
