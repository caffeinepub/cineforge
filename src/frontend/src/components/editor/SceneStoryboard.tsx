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
  ChevronDown,
  Clapperboard,
  ClipboardCopy,
  Grid3X3,
  Maximize2,
  Move,
  Triangle,
  Zap,
  ZoomIn,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import { toast } from "sonner";

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

// Capitalize first letter of each word
function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

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

  // Structured data rows
  const dataRows: {
    label: string;
    value: React.ReactNode;
    isEditable?: boolean;
  }[] = [
    {
      label: "Type",
      value: (
        <span
          className="flex items-center gap-1"
          style={{ color: emotionColor }}
        >
          <ShotIcon
            shotType={scene.shotType}
            className="w-2.5 h-2.5 shrink-0"
          />
          <span className="font-semibold">
            {getShotTypeLabel(scene.shotType).replace(/_/g, " ")}
          </span>
        </span>
      ),
    },
    {
      label: "Lighting",
      value: (
        <span className="text-foreground/70 font-medium">
          {scene.lightingMood}
        </span>
      ),
    },
    {
      label: "Duration",
      isEditable: true,
      value: editingDuration ? (
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
          className="w-14 text-[10px] font-mono text-center rounded px-1 py-0.5 bg-black/60 border focus:outline-none"
          style={{ borderColor: emotionColor, color: emotionColor }}
        />
      ) : (
        <button
          type="button"
          className="cursor-pointer bg-transparent border-0 p-0"
          onClick={() => {
            setEditingDuration(true);
            setDurationInput(formatDurationSec(scene.durationMs).toString());
          }}
        >
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
        </button>
      ),
    },
    {
      label: "Emotion",
      value: (
        <span
          className="font-semibold capitalize"
          style={{ color: emotionColor }}
        >
          {titleCase(scene.emotion)}
        </span>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group glass-panel rounded-xl overflow-hidden relative flex flex-col"
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
        className="relative w-full overflow-hidden shrink-0"
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

      {/* ── Structured data grid ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Scene label heading */}
        <div
          className="px-2.5 pt-2.5 pb-1 flex items-center gap-1.5"
          style={{ borderBottom: `1px solid ${emotionColor}18` }}
        >
          <span
            className="text-[8px] font-mono font-bold uppercase tracking-[0.15em]"
            style={{ color: `${emotionColor}80` }}
          >
            SCENE {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Data rows */}
        <div className="px-2.5 py-2 space-y-1.5">
          {dataRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-1.5 min-h-[18px]"
            >
              <span
                className="text-[8px] font-mono font-semibold uppercase tracking-widest w-14 shrink-0"
                style={{ color: "oklch(0.45 0 0)" }}
              >
                {row.label}:
              </span>
              <div className="text-[10px] flex-1 min-w-0">{row.value}</div>
            </div>
          ))}

          {/* Divider */}
          <div
            className="my-1.5"
            style={{ borderTop: `1px solid ${emotionColor}18` }}
          />

          {/* Director notes */}
          <p className="text-[9px] text-muted-foreground/50 italic leading-snug line-clamp-2">
            &ldquo;{scene.directorNotes}&rdquo;
          </p>
        </div>

        {/* Cycle shot type button */}
        <div className="mt-auto px-2.5 pb-2.5">
          <button
            type="button"
            onClick={() => onCycleShotType(scene.id)}
            className="w-full flex items-center justify-center gap-1 py-1 rounded text-[8px] font-semibold uppercase tracking-widest transition-colors hover:bg-white/[0.05] text-muted-foreground/40 hover:text-muted-foreground/80"
            style={{ border: `1px solid ${emotionColor}14` }}
          >
            <ShotIcon shotType={scene.shotType} className="w-2 h-2" />
            Change Shot
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Structured Scene Plan Panel ──────────────────────────────────────────────

interface StructuredPlanPanelProps {
  scenes: DirectorScene[];
}

function StructuredPlanPanel({ scenes }: StructuredPlanPanelProps) {
  const [open, setOpen] = useState(true);

  const planText = scenes
    .map(
      (s, i) =>
        `Scene ${i + 1} | Type: ${getShotTypeLabel(s.shotType).replace(/_/g, " ")} | Lighting: ${s.lightingMood} | Duration: ${formatDurationSec(s.durationMs)}s | Emotion: ${titleCase(s.emotion)}`,
    )
    .join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(planText);
      toast.success("Scene plan copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "oklch(0.08 0.004 275 / 0.85)",
        border: "1px solid oklch(0.22 0.005 275 / 0.6)",
      }}
    >
      {/* Panel header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 group"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]"
            style={{ color: "oklch(0.76 0.12 88)" }}
          >
            ◆ Structured Scene Plan
          </span>
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded"
            style={{
              background: "oklch(0.76 0.12 88 / 0.12)",
              color: "oklch(0.76 0.12 88 / 0.7)",
              border: "1px solid oklch(0.76 0.12 88 / 0.2)",
            }}
          >
            {scenes.length} SCENES
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-semibold transition-all hover:brightness-125 active:scale-95"
                  style={{
                    background: "oklch(0.76 0.12 88 / 0.10)",
                    border: "1px solid oklch(0.76 0.12 88 / 0.25)",
                    color: "oklch(0.76 0.12 88)",
                  }}
                >
                  <ClipboardCopy className="w-3 h-3" />
                  Copy Plan
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px]">
                Copy full scene plan to clipboard
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform text-muted-foreground/40"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4"
              style={{ borderTop: "1px solid oklch(0.22 0.005 275 / 0.5)" }}
            >
              <pre
                className="mt-3 text-[10px] font-mono leading-[1.9] overflow-x-auto select-all"
                style={{
                  color: "oklch(0.70 0.005 275)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {scenes.map((s, i) => {
                  const shotLabel = getShotTypeLabel(s.shotType).replace(
                    /_/g,
                    " ",
                  );
                  const emotionLabel = titleCase(s.emotion);
                  const emotionColor = getEmotionColor(s.emotion);
                  return (
                    <span key={s.id} className="block">
                      <span style={{ color: "oklch(0.50 0 0)" }}>
                        Scene {i + 1}
                      </span>
                      <span style={{ color: "oklch(0.35 0 0)" }}> | </span>
                      <span style={{ color: "oklch(0.55 0 0)" }}>Type: </span>
                      <span style={{ color: emotionColor }}>{shotLabel}</span>
                      <span style={{ color: "oklch(0.35 0 0)" }}> | </span>
                      <span style={{ color: "oklch(0.55 0 0)" }}>
                        Lighting:{" "}
                      </span>
                      <span style={{ color: "oklch(0.65 0.02 88)" }}>
                        {s.lightingMood}
                      </span>
                      <span style={{ color: "oklch(0.35 0 0)" }}> | </span>
                      <span style={{ color: "oklch(0.55 0 0)" }}>
                        Duration:{" "}
                      </span>
                      <span style={{ color: "oklch(0.70 0.08 60)" }}>
                        {formatDurationSec(s.durationMs)}s
                      </span>
                      <span style={{ color: "oklch(0.35 0 0)" }}> | </span>
                      <span style={{ color: "oklch(0.55 0 0)" }}>
                        Emotion:{" "}
                      </span>
                      <span style={{ color: emotionColor }}>
                        {emotionLabel}
                      </span>
                    </span>
                  );
                })}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="heading-cinematic text-base text-foreground">
            Scene Storyboard
          </h3>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            {localScenes.length} scene{localScenes.length !== 1 ? "s" : ""} ·{" "}
            {totalDurationSec}s runtime · Click duration to edit · Click "Change
            Shot" to cycle
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

      {/* Structured Scene Plan panel */}
      {localScenes.length > 0 && <StructuredPlanPanel scenes={localScenes} />}

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
