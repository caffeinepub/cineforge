import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface EditorContextValue {
  selectedClipId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  selectedTextOverlayId: string | null;

  setSelectedClipId: (id: string | null) => void;
  setIsPlaying: (v: boolean) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setSelectedTextOverlayId: (id: string | null) => void;
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTextOverlayId, setSelectedTextOverlayId] = useState<
    string | null
  >(null);

  return (
    <EditorContext.Provider
      value={{
        selectedClipId,
        isPlaying,
        currentTime,
        duration,
        selectedTextOverlayId,
        setSelectedClipId,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setSelectedTextOverlayId,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const ctx = useContext(EditorContext);
  if (!ctx)
    throw new Error("useEditorContext must be used within EditorProvider");
  return ctx;
}
