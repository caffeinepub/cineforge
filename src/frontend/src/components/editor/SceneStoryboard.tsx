import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DirectorScene } from "@/utils/scriptAnalysis";
import { getEmotionColor, getShotTypeLabel } from "@/utils/scriptAnalysis";
import {
  Aperture,
  Clapperboard,
  Grid3X3,
  Maximize2,
  Move,
  Triangle,
  Zap,
  ZoomIn,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useState } from "react";

// ─── Shot type icon mapping ───────────────────────────────────────────────────

function ShotIcon({
  shotType,
  className,
}: {
  shotType: DirectorScene["shotType"];
  className?: string;
}) {
  switch (shotType) {
    case "aerial-drone":
      return <Aperture className={className} />;
    case "dolly-push":
      return <Move className={className} />;
    case "interior-pan":
      return <Grid3X3 className={className} />;
    case "slow-motion":
      return <Zap className={className} />;
    case "static-wide":
      return <Maximize2 className={className} />;
    case "close-up":
      return <ZoomIn className={className} />;
    case "crane-shot":
      return <Triangle className={className} />;
  }
}

// ─── Duration input ───────────────────────────────────────────────────────────

function formatDurationSec(ms: number): number {
  return Math.round(ms / 1000);
}

// ─── Scene card ───────────────────────────────────────────────────────────────

interface SceneCardProps {
  scene: DirectorScene;
  index: number;
  onUpdateDuration: (id: string, durationMs: number) => void;
  onCycleShotType: (id: string) => void;
}

const SHOT_TYPES: DirectorScene["shotType"][] = [
  "aerial-drone",
  "dolly-push",
  "interior-pan",
  "slow-motion",
  "static-wide",
  "close-up",
  "crane-shot",
];

function SceneCard({
  scene,
  index,
  onUpdateDuration,
  onCycleShotType,
}: SceneCardProps) {
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState(
    formatDurationSec(scene.durationMs).toString(),
  );
  const emotionColor = getEmotionColor(scene.emotion);

  const handleDurationCommit = () => {
    const val = Number.parseFloat(durationInput);
    if (!Number.isNaN(val) && val >= 1) {
      onUpdateDuration(scene.id, Math.round(val * 1000));
    } else {
      setDurationInput(formatDurationSec(scene.durationMs).toString());
    }
    setEditingDuration(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group glass-panel rounded-xl overflow-hidden relative"
      style={{
        borderColor: `${emotionColor}30`,
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      {/* Emotion color top accent line */}
      <div
        className="absolute top-0 inset-x-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${emotionColor}, transparent)`,
          opacity: 0.6,
        }}
      />

      {/* Aspect-video thumbnail preview */}
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: "56.25%" }} // 16:9 ratio
      >
        <div
          className="absolute inset-0"
          style={{ background: scene.backgroundStyle }}
        />
        {/* Film grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.8'/%3E%3C/svg%3E")`,
            opacity: 0.12,
            mixBlendMode: "overlay",
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Scene number badge */}
        <div
          className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono"
          style={{
            background: "rgba(0,0,0,0.75)",
            border: `1.5px solid ${emotionColor}`,
            color: emotionColor,
            backdropFilter: "blur(8px)",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* Shot type icon */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: `1px solid ${emotionColor}44`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span style={{ color: emotionColor }}>
            <ShotIcon shotType={scene.shotType} className="w-2.5 h-2.5" />
          </span>
          <span
            className="text-[8px] font-mono font-bold tracking-widest uppercase"
            style={{ color: emotionColor }}
          >
            {getShotTypeLabel(scene.shotType)}
          </span>
        </div>

        {/* Center text snippet */}
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <p
            className="text-center text-white/80 line-clamp-2 leading-snug select-none"
            style={{
              fontSize: "clamp(0.5rem, 1.5vw, 0.65rem)",
              fontFamily: '"Fraunces", serif',
              textShadow: "0 1px 8px rgba(0,0,0,0.9)",
            }}
          >
            {scene.text}
          </p>
        </div>
      </div>

      {/* Card info */}
      <div className="p-2.5 space-y-1.5">
        {/* Camera + duration row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-[9px] font-semibold truncate"
              style={{ color: emotionColor }}
            >
              {scene.cameraMove}
            </p>
            <p className="text-[9px] text-muted-foreground/50 truncate">
              {scene.lighting}
            </p>
          </div>

          {/* Editable duration badge */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 cursor-pointer bg-transparent border-0 p-0"
                  onClick={() => {
                    setEditingDuration(true);
                    setDurationInput(
                      formatDurationSec(scene.durationMs).toString(),
                    );
                  }}
                >
                  {editingDuration ? (
                    <input
                      // biome-ignore lint/a11y/noAutofocus: intentional focus for inline edit
                      autoFocus
                      type="number"
                      min={1}
                      max={60}
                      value={durationInput}
                      onChange={(e) => setDurationInput(e.target.value)}
                      onBlur={handleDurationCommit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleDurationCommit();
                        if (e.key === "Escape") setEditingDuration(false);
                      }}
                      className="w-12 text-[10px] font-mono text-center rounded px-1 py-0.5 bg-black/60 border focus:outline-none"
                      style={{ borderColor: emotionColor, color: emotionColor }}
                    />
                  ) : (
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors hover:brightness-125"
                      style={{
                        color: emotionColor,
                        borderColor: `${emotionColor}44`,
                        background: `${emotionColor}12`,
                      }}
                    >
                      {formatDurationSec(scene.durationMs)}s
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px]">
                Click to edit duration
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Director notes */}
        <p className="text-[9px] text-muted-foreground/50 italic leading-snug line-clamp-2">
          &ldquo;{scene.directorNotes}&rdquo;
        </p>

        {/* Cycle shot type button */}
        <button
          type="button"
          onClick={() => onCycleShotType(scene.id)}
          className="w-full flex items-center justify-center gap-1 py-1 rounded text-[8px] font-semibold uppercase tracking-widest transition-colors hover:bg-white/[0.05] text-muted-foreground/40 hover:text-muted-foreground/80"
        >
          <ShotIcon shotType={scene.shotType} className="w-2 h-2" />
          Change Shot
        </button>
      </div>
    </motion.div>
  );
}

// ─── SceneStoryboard ──────────────────────────────────────────────────────────

interface SceneStoryboardProps {
  scenes: DirectorScene[];
  onLaunch: () => void;
  onUpdateScenes?: (scenes: DirectorScene[]) => void;
}

export default function SceneStoryboard({
  scenes,
  onLaunch,
  onUpdateScenes,
}: SceneStoryboardProps) {
  const [localScenes, setLocalScenes] = useState<DirectorScene[]>(scenes);

  // Sync if parent updates
  React.useEffect(() => {
    setLocalScenes(scenes);
  }, [scenes]);

  const handleUpdateDuration = (id: string, durationMs: number) => {
    const updated = localScenes.map((s) =>
      s.id === id ? { ...s, durationMs } : s,
    );
    setLocalScenes(updated);
    onUpdateScenes?.(updated);
  };

  const handleCycleShotType = (id: string) => {
    const updated = localScenes.map((s) => {
      if (s.id !== id) return s;
      const currentIdx = SHOT_TYPES.indexOf(s.shotType);
      const nextShotType = SHOT_TYPES[(currentIdx + 1) % SHOT_TYPES.length];
      return { ...s, shotType: nextShotType };
    });
    setLocalScenes(updated);
    onUpdateScenes?.(updated);
  };

  const totalDurationSec = Math.round(
    localScenes.reduce((sum, s) => sum + s.durationMs, 0) / 1000,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="heading-cinematic text-base text-foreground">
            Scene Storyboard
          </h3>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            {localScenes.length} scene{localScenes.length !== 1 ? "s" : ""} ·{" "}
            {totalDurationSec}s runtime · Click duration or shot to edit
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {localScenes.map((scene, index) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={index}
            onUpdateDuration={handleUpdateDuration}
            onCycleShotType={handleCycleShotType}
          />
        ))}
      </div>

      {/* Launch button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: localScenes.length * 0.06 + 0.1, duration: 0.4 }}
        className="flex justify-center pt-2"
      >
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={onLaunch}
            className="btn-gold gap-2.5 px-8 py-2.5 text-sm font-bold"
          >
            <Clapperboard className="w-4 h-4" />
            Launch Cinema
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
