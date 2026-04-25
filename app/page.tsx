"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChildStoryScreen } from "@/components/child-screen/ChildStoryScreen";
import { ParentHome } from "@/components/parent-screen/ParentHome";
import { ParentLogViewer } from "@/components/parent-screen/ParentLogViewer";
import { ParentPlayMenu } from "@/components/parent-screen/ParentPlayMenu";
import { characters } from "@/data/characters";
import { themes } from "@/data/themes";
import { playMockVoice } from "@/lib/audioEngine";
import { appendTurn, createTurn } from "@/lib/logEngine";
import {
  getStoryByTheme,
  nextScene as getNextScene,
  restartStory,
} from "@/lib/storyEngine";
import type { Scene } from "@/types/story";
import type { Turn } from "@/types/turn";
import type { UIMode } from "@/types/ui";

export default function HomePage() {
  const [uiMode, setUiMode] = useState<UIMode>("child");
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

  // session_start (once on mount)
  useEffect(() => {
    log(
      "system",
      "session_start",
      `theme=${theme.id} character=${character.id} scene=${sceneId}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup any active mock-voice timer on unmount.
  useEffect(() => {
    return () => {
      if (cancelAudioRef.current) cancelAudioRef.current();
    };
  }, []);

  const handleCharacterPress = useCallback(() => {
    log("character", "character_press", `${character.id} pressed`);
    if (cancelAudioRef.current) cancelAudioRef.current();
    cancelAudioRef.current = playMockVoice(setIsAudioPlaying);
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
      }
    },
    [story, scene.id, log],
  );

  const handleParentEnter = useCallback(() => {
    log("system", "parent_gate", `from scene=${scene.id}`);
    setUiMode("parent_home");
  }, [scene.id, log]);

  const handleReturnToChild = useCallback(() => {
    setUiMode("child");
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
    if (nextStory) {
      setSceneId(nextStory.startSceneId);
    }
    log("system", "change_theme", `theme=${nextTheme.id}`);
  }, [themeIdx, log]);

  const handleCycleCharacter = useCallback(() => {
    const nextIdx = (characterIdx + 1) % characters.length;
    setCharacterIdx(nextIdx);
    log(
      "system",
      "change_character",
      `character=${characters[nextIdx].id}`,
    );
  }, [characterIdx, log]);

  if (uiMode === "child") {
    return (
      <ChildStoryScreen
        character={character}
        scene={scene}
        isAudioPlaying={isAudioPlaying}
        onCharacterPress={handleCharacterPress}
        onChoice={handleChoice}
        onParentEnter={handleParentEnter}
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

  // parent_logs
  return <ParentLogViewer turns={turns} onBack={() => setUiMode("parent_home")} />;
}
