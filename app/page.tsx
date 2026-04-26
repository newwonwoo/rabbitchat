"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChildStoryScreen } from "@/components/child-screen/ChildStoryScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { CharacterManager } from "@/components/parent-screen/CharacterManager";
import { ParentHome } from "@/components/parent-screen/ParentHome";
import { ParentLogViewer } from "@/components/parent-screen/ParentLogViewer";
import { ParentPlayMenu } from "@/components/parent-screen/ParentPlayMenu";
import { PipelineTester } from "@/components/parent-screen/PipelineTester";
import { PlaceManager } from "@/components/parent-screen/PlaceManager";
import { SettingsPanel } from "@/components/parent-screen/SettingsPanel";
import { StoryBuilder } from "@/components/parent-screen/StoryBuilder";
import { ThemeSelector } from "@/components/parent-screen/ThemeSelector";
import { SplashScreen } from "@/components/SplashScreen";
import { characters } from "@/data/characters";
import { stories } from "@/data/stories";
import { themes } from "@/data/themes";
import { loadProfile } from "@/lib/profile";
import { playMockVoice } from "@/lib/audioEngine";
import { loadPublishedStories } from "@/lib/storage/customStoryStore";
import {
  pickSceneBackground,
  resolveChoiceAssetMap,
} from "@/lib/imageAssetResolver";
import { playRandomVoice, playSound } from "@/lib/soundEngine";
import {
  appendTurn,
  clearTurns,
  createTurn,
  loadTurns,
  saveTurns,
} from "@/lib/logEngine";
import {
  clearPreference,
  loadPreference,
  savePreference,
} from "@/lib/preferenceEngine";
import {
  getStoryByTheme,
  nextScene as getNextScene,
  restartStory,
} from "@/lib/storyEngine";
import type { Scene } from "@/types/story";
import type { Turn } from "@/types/turn";
import type { UIMode } from "@/types/ui";

export default function HomePage() {
  const [uiMode, setUiMode] = useState<UIMode>("splash");
  const [childName, setChildName] = useState("원우");
  const [characterIdx, setCharacterIdx] = useState(0);
  const [themeIdx, setThemeIdx] = useState(0);
  const [sceneId, setSceneId] = useState<string>(() => {
    const initialStory = getStoryByTheme(themes[0].id);
    return initialStory ? initialStory.startSceneId : "s1";
  });
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);

  const cancelAudioRef = useRef<(() => void) | null>(null);

  const character = characters[characterIdx];
  const theme = themes[themeIdx];

  const story = useMemo(() => getStoryByTheme(theme.id), [theme.id]);

  const scene: Scene = useMemo(() => {
    if (story) {
      const found = story.scenes.find((s) => s.id === sceneId);
      if (found) return found;
      return story.scenes[0];
    }
    return {
      id: "empty",
      placeId: "none",
      visual: "✨",
      parentSummary: "이야기가 비어있음.",
      choices: [],
    };
  }, [story, sceneId]);

  const log = useCallback(
    (
      actor: Turn["actor"],
      event: Turn["event"],
      detail: string,
    ) => {
      const turn = createTurn(actor, event, detail);
      setTurns((prev) => appendTurn(prev, turn));
    },
    [],
  );

  // Hydrate persisted state on mount, then log session_start.
  useEffect(() => {
    const persisted = loadTurns();
    if (persisted.length > 0) setTurns(persisted);
    const profile = loadProfile();
    if (profile.name) setChildName(profile.name);
    const pref = loadPreference();
    if (pref.preferredCharacterId) {
      const idx = characters.findIndex((c) => c.id === pref.preferredCharacterId);
      if (idx >= 0) setCharacterIdx(idx);
    }
    if (pref.preferredThemeId) {
      const idx = themes.findIndex((t) => t.id === pref.preferredThemeId);
      if (idx >= 0) {
        setThemeIdx(idx);
        const s = getStoryByTheme(themes[idx].id);
        if (s) setSceneId(s.startSceneId);
      }
    }
    log(
      "system",
      "session_start",
      `theme=${theme.id} character=${character.id} scene=${sceneId}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveTurns(turns);
  }, [turns]);

  useEffect(() => {
    const pref = loadPreference();
    savePreference({
      ...pref,
      preferredCharacterId: characters[characterIdx].id,
      preferredThemeId: themes[themeIdx].id,
    });
  }, [characterIdx, themeIdx]);

  useEffect(() => {
    return () => {
      if (cancelAudioRef.current) cancelAudioRef.current();
    };
  }, []);

  const handleCharacterPress = useCallback(() => {
    log("character", "character_press", `${character.id} pressed`);
    if (cancelAudioRef.current) cancelAudioRef.current();
    cancelAudioRef.current = playMockVoice(setIsAudioPlaying);
    playRandomVoice();
    log("character", "mock_voice", `playing=${character.id}`);
  }, [character.id, log]);

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (!story) return;
      const next = getNextScene(story, scene.id, choiceId);
      log(
        "child",
        "choice",
        `choice=${choiceId} -> scene=${next ? next.id : "none"}`,
      );
      if (next) {
        setSceneId(next.id);
        playSound("choice_chime");
        if (next.choices.length === 0) playSound("scene_end");
      }
    },
    [story, scene.id, log],
  );

  const handleParentEnter = useCallback(() => {
    log("system", "parent_gate", `from scene=${scene.id}`);
    playSound("parent_unlock");
    setUiMode("parent_home");
  }, [scene.id, log]);

  const handleReturnToChild = useCallback(() => {
    setUiMode("home");
  }, []);

  const handleRestart = useCallback(() => {
    if (!story) return;
    const first = restartStory(story);
    if (!first) return;
    setSceneId(first.id);
    log("system", "restart_story", `restart to ${first.id}`);
  }, [story, log]);

  const handleCycleTheme = useCallback(() => {
    const nextIdx = (themeIdx + 1) % themes.length;
    setThemeIdx(nextIdx);
    const nextTheme = themes[nextIdx];
    const nextStory = getStoryByTheme(nextTheme.id);
    if (nextStory) setSceneId(nextStory.startSceneId);
    log("system", "change_theme", `theme=${nextTheme.id}`);
  }, [themeIdx, log]);

  const handleCycleCharacter = useCallback(() => {
    const nextIdx = (characterIdx + 1) % characters.length;
    setCharacterIdx(nextIdx);
    log("system", "change_character", `character=${characters[nextIdx].id}`);
  }, [characterIdx, log]);

  const handleSelectTheme = useCallback(
    (t: { id: string }) => {
      const idx = themes.findIndex((x) => x.id === t.id);
      if (idx < 0) return;
      setThemeIdx(idx);
      const nextStory = getStoryByTheme(themes[idx].id);
      if (nextStory) setSceneId(nextStory.startSceneId);
      log("system", "change_theme", `theme=${themes[idx].id}`);
    },
    [log],
  );

  const handleSelectCharacter = useCallback(
    (c: { id: string }) => {
      const idx = characters.findIndex((x) => x.id === c.id);
      if (idx < 0) return;
      setCharacterIdx(idx);
      log("system", "change_character", `character=${characters[idx].id}`);
    },
    [log],
  );

  const handleExportData = useCallback(() => {
    if (typeof window === "undefined") return;
    const payload = {
      exportedAt: new Date().toISOString(),
      preference: loadPreference(),
      turns: loadTurns(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rabbitchat-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDeleteData = useCallback(() => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "저장된 로그와 설정을 모두 삭제할까요? 되돌릴 수 없습니다.",
    );
    if (!ok) return;
    clearTurns();
    clearPreference();
    setTurns([]);
    setCharacterIdx(0);
    setThemeIdx(0);
    const s = getStoryByTheme(themes[0].id);
    if (s) setSceneId(s.startSceneId);
  }, []);

  if (uiMode === "splash") {
    return <SplashScreen onDone={() => setUiMode("home")} />;
  }

  if (uiMode === "home") {
    const published = loadPublishedStories();
    const todayStory = published[0] ?? null;
    const libraryStories = published.slice(1);
    return (
      <HomeScreen
        childName={childName}
        todayStory={todayStory}
        libraryStories={libraryStories}
        onPickStory={(s) => {
          // For published custom stories we set the scene/story directly.
          // The themeId may not match a registered theme — that's OK,
          // ChildStoryScreen renders from the scene we set.
          setSceneId(s.startSceneId);
          // try to align theme if matches
          const idx = themes.findIndex((t) => t.id === s.themeId);
          if (idx >= 0) setThemeIdx(idx);
          setUiMode("child");
        }}
        onParentEnter={handleParentEnter}
      />
    );
  }

  if (uiMode === "child") {
    const backgroundAsset = pickSceneBackground(
      scene.placeId,
      scene.parentSummary,
      theme.name,
    );
    const choiceAssets = resolveChoiceAssetMap(scene.choices);
    return (
      <ChildStoryScreen
        character={character}
        scene={scene}
        isAudioPlaying={isAudioPlaying}
        backgroundAsset={backgroundAsset}
        choiceAssets={choiceAssets}
        onCharacterPress={handleCharacterPress}
        onChoice={handleChoice}
        onParentEnter={handleParentEnter}
        onGoHome={() => setUiMode("home")}
        onReplay={handleRestart}
      />
    );
  }

  if (uiMode === "parent_home") {
    if (!story) return null;
    return (
      <ParentHome
        story={story}
        scene={scene}
        character={character}
        onOpenMenu={() => setUiMode("parent_menu")}
        onOpenLogs={() => setUiMode("parent_logs")}
        onOpenThemes={() => setUiMode("parent_themes")}
        onOpenCharacters={() => setUiMode("parent_characters")}
        onOpenPlaces={() => setUiMode("parent_places")}
        onOpenSettings={() => setUiMode("parent_settings")}
        onOpenBuilder={() => setUiMode("parent_builder")}
        onOpenPipeline={() => setUiMode("parent_pipeline")}
        onReturnToChild={handleReturnToChild}
      />
    );
  }

  if (uiMode === "parent_menu") {
    return (
      <ParentPlayMenu
        currentCharacter={character}
        currentTheme={theme}
        onRestart={handleRestart}
        onCycleTheme={handleCycleTheme}
        onCycleCharacter={handleCycleCharacter}
        onBack={() => setUiMode("parent_home")}
      />
    );
  }

  if (uiMode === "parent_logs") {
    return <ParentLogViewer turns={turns} onBack={() => setUiMode("parent_home")} />;
  }

  return (
    <main className="min-h-screen bg-kkang-ivory px-6 py-8 text-kkang-ink">
      <div className="mx-auto max-w-md">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{tabTitle(uiMode)}</h1>
          <button
            type="button"
            onClick={() => setUiMode("parent_home")}
            className="rounded-full bg-kkang-cream px-4 py-2 text-sm shadow-soft"
          >
            뒤로
          </button>
        </header>

        {uiMode === "parent_themes" ? (
          <ThemeSelector currentThemeId={theme.id} onSelect={handleSelectTheme} />
        ) : null}
        {uiMode === "parent_characters" ? (
          <CharacterManager
            currentCharacterId={character.id}
            onSelect={handleSelectCharacter}
          />
        ) : null}
        {uiMode === "parent_places" ? <PlaceManager /> : null}
        {uiMode === "parent_settings" ? (
          <SettingsPanel
            onExportData={handleExportData}
            onDeleteData={handleDeleteData}
          />
        ) : null}
        {uiMode === "parent_builder" ? <StoryBuilder /> : null}
        {uiMode === "parent_pipeline" ? <PipelineTester /> : null}
      </div>
    </main>
  );
}

function tabTitle(mode: UIMode): string {
  switch (mode) {
    case "parent_themes":
      return "테마 선택";
    case "parent_characters":
      return "캐릭터 선택";
    case "parent_places":
      return "장소 관리";
    case "parent_settings":
      return "설정";
    case "parent_builder":
      return "이야기 만들기";
    case "parent_pipeline":
      return "🧪 파이프라인 테스터";
    default:
      return "부모 화면";
  }
}
