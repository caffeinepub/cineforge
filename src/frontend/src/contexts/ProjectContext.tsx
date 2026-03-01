import type { Clip, TextOverlay } from "@/backend.d";
import type { DirectorScene, ScriptAnalysis } from "@/utils/scriptAnalysis";
import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

export interface FilterSettings {
  contrast: number;
  saturate: number;
  brightness: number;
  vignette: number;
  filmGrain: number;
  hueRotate: number;
  sepia: number;
}

export interface LocalClip extends Clip {
  localUrl?: string; // blob URL for preview
  thumbnailUrl?: string;
}

export interface LocalTextOverlay extends TextOverlay {
  id: string;
}

export interface GeneratedScene {
  id: string;
  text: string;
  durationMs: number; // auto-calc: ~200ms per word, min 2500ms
  backgroundStyle: string; // CSS gradient string
}

interface ProjectContextValue {
  projectId: string | null;
  projectTitle: string;
  clips: LocalClip[];
  textOverlays: LocalTextOverlay[];
  activePreset: string;
  filterSettings: FilterSettings;

  // Scene playback state
  generatedScenes: GeneratedScene[];
  currentSceneIndex: number;
  isScenePlaying: boolean;
  ttsVoice: string;
  ttsRate: number;
  ttsPitch: number;
  ttsVolume: number;

  // Director engine state
  directorScenes: DirectorScene[];
  setDirectorScenes: (scenes: DirectorScene[]) => void;
  scriptAnalysis: ScriptAnalysis | null;
  setScriptAnalysis: (a: ScriptAnalysis | null) => void;
  musicEnabled: boolean;
  setMusicEnabled: (v: boolean) => void;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
  directorModeActive: boolean;
  setDirectorModeActive: (v: boolean) => void;

  setProjectId: (id: string | null) => void;
  setProjectTitle: (title: string) => void;
  setClips: (clips: LocalClip[]) => void;
  setTextOverlays: (overlays: LocalTextOverlay[]) => void;
  setActivePreset: (preset: string) => void;
  setFilterSettings: (settings: FilterSettings) => void;
  updateFilterSetting: <K extends keyof FilterSettings>(
    key: K,
    value: FilterSettings[K],
  ) => void;
  addClip: (clip: LocalClip) => void;
  removeClip: (blobId: string) => void;
  reorderClips: (fromIdx: number, toIdx: number) => void;
  addTextOverlay: (overlay: LocalTextOverlay) => void;
  removeTextOverlay: (id: string) => void;
  updateTextOverlay: (id: string, updates: Partial<LocalTextOverlay>) => void;
  resetProject: () => void;

  // Scene playback setters
  setGeneratedScenes: (scenes: GeneratedScene[]) => void;
  setCurrentSceneIndex: (i: number) => void;
  setIsScenePlaying: (v: boolean) => void;
  setTtsVoice: (v: string) => void;
  setTtsRate: (v: number) => void;
  setTtsPitch: (v: number) => void;
  setTtsVolume: (v: number) => void;
}

const defaultFilter: FilterSettings = {
  contrast: 1,
  saturate: 1,
  brightness: 1,
  vignette: 0,
  filmGrain: 0,
  hueRotate: 0,
  sepia: 0,
};

const ProjectContext = createContext<ProjectContextValue | undefined>(
  undefined,
);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [clips, setClips] = useState<LocalClip[]>([]);
  const [textOverlays, setTextOverlays] = useState<LocalTextOverlay[]>([]);
  const [activePreset, setActivePreset] = useState("none");
  const [filterSettings, setFilterSettings] =
    useState<FilterSettings>(defaultFilter);

  // Scene playback state
  const [generatedScenes, setGeneratedScenes] = useState<GeneratedScene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isScenePlaying, setIsScenePlaying] = useState(false);
  const [ttsVoice, setTtsVoice] = useState("");
  const [ttsRate, setTtsRate] = useState(0.95);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [ttsVolume, setTtsVolume] = useState(1.0);

  // Director engine state
  const [directorScenes, setDirectorScenes] = useState<DirectorScene[]>([]);
  const [scriptAnalysis, setScriptAnalysis] = useState<ScriptAnalysis | null>(
    null,
  );
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const [directorModeActive, setDirectorModeActive] = useState(false);

  const updateFilterSetting = useCallback(
    <K extends keyof FilterSettings>(key: K, value: FilterSettings[K]) => {
      setFilterSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const addClip = useCallback((clip: LocalClip) => {
    setClips((prev) => [...prev, clip]);
  }, []);

  const removeClip = useCallback((blobId: string) => {
    setClips((prev) => prev.filter((c) => c.blobId !== blobId));
  }, []);

  const reorderClips = useCallback((fromIdx: number, toIdx: number) => {
    setClips((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr.map((c, i) => ({ ...c, orderIndex: BigInt(i) }));
    });
  }, []);

  const addTextOverlay = useCallback((overlay: LocalTextOverlay) => {
    setTextOverlays((prev) => [...prev, overlay]);
  }, []);

  const removeTextOverlay = useCallback((id: string) => {
    setTextOverlays((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const updateTextOverlay = useCallback(
    (id: string, updates: Partial<LocalTextOverlay>) => {
      setTextOverlays((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...updates } : o)),
      );
    },
    [],
  );

  const resetProject = useCallback(() => {
    setProjectId(null);
    setProjectTitle("Untitled Project");
    setClips([]);
    setTextOverlays([]);
    setActivePreset("none");
    setFilterSettings(defaultFilter);
    setGeneratedScenes([]);
    setCurrentSceneIndex(0);
    setIsScenePlaying(false);
    setDirectorScenes([]);
    setScriptAnalysis(null);
    setDirectorModeActive(false);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        projectTitle,
        clips,
        textOverlays,
        activePreset,
        filterSettings,
        generatedScenes,
        currentSceneIndex,
        isScenePlaying,
        ttsVoice,
        ttsRate,
        ttsPitch,
        ttsVolume,
        directorScenes,
        setDirectorScenes,
        scriptAnalysis,
        setScriptAnalysis,
        musicEnabled,
        setMusicEnabled,
        musicVolume,
        setMusicVolume,
        directorModeActive,
        setDirectorModeActive,
        setProjectId,
        setProjectTitle,
        setClips,
        setTextOverlays,
        setActivePreset,
        setFilterSettings,
        updateFilterSetting,
        addClip,
        removeClip,
        reorderClips,
        addTextOverlay,
        removeTextOverlay,
        updateTextOverlay,
        resetProject,
        setGeneratedScenes,
        setCurrentSceneIndex,
        setIsScenePlaying,
        setTtsVoice,
        setTtsRate,
        setTtsPitch,
        setTtsVolume,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx)
    throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}
