import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DirectorScene } from "@/utils/scriptAnalysis";
import { getEmotionColor, getShotTypeLabel } from "@/utils/scriptAnalysis";
import { AnimatePresence, motion } from "motion/react";
import React from "react";

interface EmotionalTimelineProps {
  scenes: DirectorScene[];
  currentIndex: number;
  onSceneClick: (index: number) => void;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60 > 0 ? `${s % 60}s` : ""}`;
}

export default function EmotionalTimeline({
  scenes,
  currentIndex,
  onSceneClick,
}: EmotionalTimelineProps) {
  if (!scenes.length) return null;

  // Total duration for proportional segment widths
  const totalMs = scenes.reduce((sum, s) => sum + s.durationMs, 0);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
            Emotional Timeline
          </span>
          <span className="text-[9px] text-muted-foreground/40 font-mono">
            {formatDuration(totalMs)} total
          </span>
        </div>

        {/* Timeline bar */}
        <div
          className="relative flex items-stretch rounded-lg overflow-hidden"
          style={{ height: "36px" }}
          aria-label="Scene timeline"
        >
          {scenes.map((scene, index) => {
            const widthPct = (scene.durationMs / totalMs) * 100;
            const isActive = index === currentIndex;
            const isPast = index < currentIndex;
            const emotionColor = getEmotionColor(scene.emotion);

            return (
              <Tooltip key={scene.id}>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    aria-selected={isActive}
                    aria-label={`Scene ${index + 1}: ${getShotTypeLabel(scene.shotType)}`}
                    style={{ width: `${widthPct}%` }}
                    className="relative flex items-center justify-center cursor-pointer transition-all duration-200 group overflow-hidden focus-visible:outline-none"
                    onClick={() => onSceneClick(index)}
                    whileHover={{ scaleY: 1.08 }}
                    whileTap={{ scaleY: 0.96 }}
                  >
                    {/* Background fill */}
                    <div
                      className="absolute inset-0 transition-opacity duration-300"
                      style={{
                        background: emotionColor,
                        opacity: isActive ? 0.55 : isPast ? 0.3 : 0.18,
                      }}
                    />

                    {/* Divider line */}
                    {index > 0 && (
                      <div
                        className="absolute left-0 inset-y-0 w-px"
                        style={{ background: "oklch(0 0 0 / 0.4)" }}
                      />
                    )}

                    {/* Active glow ring */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          key="active-ring"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            boxShadow: `inset 0 0 0 2px ${emotionColor}, 0 0 12px ${emotionColor}`,
                          }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Pulse animation for active */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: emotionColor }}
                        animate={{ opacity: [0.0, 0.12, 0.0] }}
                        transition={{
                          duration: 1.8,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      />
                    )}

                    {/* Scene number */}
                    <span
                      className="relative z-10 font-mono text-[9px] font-bold tracking-wide select-none"
                      style={{
                        color: isActive
                          ? "oklch(1 0 0 / 0.95)"
                          : isPast
                            ? "oklch(1 0 0 / 0.5)"
                            : "oklch(1 0 0 / 0.35)",
                        textShadow: isActive
                          ? `0 0 8px ${emotionColor}`
                          : "none",
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                      style={{ background: "oklch(1 0 0 / 0.06)" }}
                    />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="text-[10px] py-1.5 px-2.5 space-y-0.5"
                  style={{
                    background: "oklch(0.12 0.003 275 / 0.98)",
                    border: `1px solid ${emotionColor}44`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="font-mono font-bold text-[9px] tracking-widest"
                    style={{ color: emotionColor }}
                  >
                    {getShotTypeLabel(scene.shotType)}
                  </div>
                  <div className="text-foreground/80 font-medium">
                    Scene {index + 1} · {formatDuration(scene.durationMs)}
                  </div>
                  <div className="text-muted-foreground/60 line-clamp-2 max-w-[180px]">
                    {scene.text.slice(0, 60)}
                    {scene.text.length > 60 ? "…" : ""}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Scene label below active */}
        {scenes[currentIndex] && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-0.5"
          >
            <span
              className="font-mono text-[9px] font-bold tracking-widest uppercase"
              style={{ color: getEmotionColor(scenes[currentIndex].emotion) }}
            >
              [{getShotTypeLabel(scenes[currentIndex].shotType)}]
            </span>
            <span className="text-[9px] text-muted-foreground/50 truncate">
              {scenes[currentIndex].lighting}
            </span>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}
