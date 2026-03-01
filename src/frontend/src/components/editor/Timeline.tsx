import { useEditorContext } from "@/contexts/EditorContext";
import { useProjectContext } from "@/contexts/ProjectContext";
import { Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";

const CLIP_COLORS = [
  "bg-blue-800/60 border-blue-600/50",
  "bg-violet-800/60 border-violet-600/50",
  "bg-emerald-800/60 border-emerald-600/50",
  "bg-amber-800/60 border-amber-700/50",
  "bg-rose-800/60 border-rose-700/50",
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m${s}s` : `${s}s`;
}

function formatMs(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m${sec}s` : `${sec}s`;
}

export default function Timeline() {
  const {
    clips,
    reorderClips,
    removeClip,
    generatedScenes,
    currentSceneIndex,
    isScenePlaying,
  } = useProjectContext();
  const { selectedClipId, setSelectedClipId } = useEditorContext();

  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (dragIndex.current !== null && dragIndex.current !== targetIndex) {
        reorderClips(dragIndex.current, targetIndex);
      }
      dragIndex.current = null;
      setDragOverIndex(null);
    },
    [reorderClips],
  );

  const handleDragEnd = useCallback(() => {
    dragIndex.current = null;
    setDragOverIndex(null);
  }, []);

  // Show generated scenes when available
  if (generatedScenes.length > 0) {
    const totalMs = generatedScenes.reduce((sum, s) => sum + s.durationMs, 0);

    return (
      <div className="h-full flex items-center gap-0.5 overflow-x-auto pb-1 px-1">
        {generatedScenes.map((scene, i) => {
          const widthPct = (scene.durationMs / totalMs) * 100;
          const isActive = i === currentSceneIndex && isScenePlaying;
          const isPast = i < currentSceneIndex;

          return (
            <div
              key={scene.id}
              className="flex-shrink-0 h-12 rounded-sm border flex flex-col justify-between p-1 relative overflow-hidden transition-all duration-300"
              style={{
                minWidth: "40px",
                width: `${Math.max(4, widthPct)}%`,
                borderColor: isActive
                  ? "oklch(0.76 0.12 88 / 0.9)"
                  : isPast
                    ? "oklch(0.76 0.12 88 / 0.30)"
                    : "oklch(0.76 0.12 88 / 0.20)",
                background: isActive
                  ? "linear-gradient(135deg, oklch(0.76 0.14 88 / 0.30) 0%, oklch(0.66 0.13 75 / 0.15) 100%)"
                  : isPast
                    ? "oklch(0.76 0.12 88 / 0.08)"
                    : "oklch(0.76 0.12 88 / 0.05)",
                boxShadow: isActive
                  ? "0 0 8px oklch(0.76 0.12 88 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.10)"
                  : "none",
              }}
            >
              {/* Active shimmer */}
              {isActive && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, oklch(0.76 0.12 88 / 0.08) 50%, transparent 100%)",
                    animation: "shimmer 1.5s ease-in-out infinite",
                  }}
                />
              )}

              <span
                className="text-[9px] font-bold truncate leading-tight relative z-10"
                style={{
                  color: isActive
                    ? "oklch(0.86 0.13 88)"
                    : isPast
                      ? "oklch(0.65 0.10 88)"
                      : "oklch(0.55 0.08 88)",
                }}
              >
                {i + 1}
              </span>

              <span
                className="text-[8px] font-mono truncate relative z-10"
                style={{
                  color: isActive
                    ? "oklch(0.76 0.10 88 / 0.8)"
                    : "oklch(0.50 0 0 / 0.6)",
                }}
              >
                {formatMs(scene.durationMs)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground/40 text-xs">
        Upload clips to see them on the timeline
      </div>
    );
  }

  return (
    <div className="h-full flex items-center gap-1 overflow-x-auto pb-1 px-1">
      {clips.map((clip, i) => {
        const colorClass = CLIP_COLORS[i % CLIP_COLORS.length];
        const isSelected = selectedClipId === clip.blobId;
        const isDragTarget = dragOverIndex === i;

        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: drag-and-drop element uses mouse events
          <div
            key={clip.blobId || i}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onClick={() => setSelectedClipId(isSelected ? null : clip.blobId)}
            className={`
              timeline-clip flex-shrink-0 h-14 rounded-md border flex flex-col justify-between p-1.5 min-w-[80px] max-w-[160px] relative group
              ${colorClass}
              ${isSelected ? "clip-selected" : ""}
              ${isDragTarget ? "ring-1 ring-primary/70 scale-105" : ""}
              transition-all duration-150
            `}
            style={{
              width: `${Math.max(80, Math.min(160, (clip.durationSeconds || 5) * 16))}px`,
            }}
          >
            <span className="text-[10px] text-white/80 font-medium truncate leading-tight">
              {clip.name}
            </span>
            <span className="text-[10px] text-white/50 tabular-nums">
              {formatDuration(clip.durationSeconds)}
            </span>

            {/* Delete btn */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeClip(clip.blobId);
              }}
              className="absolute top-0.5 right-0.5 p-0.5 rounded text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>

            {/* Trim handles on selected */}
            {isSelected && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 rounded-l cursor-ew-resize" />
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary/60 rounded-r cursor-ew-resize" />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
