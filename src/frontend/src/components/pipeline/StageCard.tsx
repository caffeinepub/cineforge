import type {
  PipelineStageDefinition,
  PipelineStageResult,
} from "@/utils/pipelineEngine";
import {
  Clapperboard,
  Download,
  ImagePlay,
  Layers,
  Mic,
  Music2,
  Plug,
  ScanText,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useRef } from "react";

// ─── Icon mapping from string name ───────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ScanText,
  Clapperboard,
  ImagePlay,
  Mic,
  Music2,
  Layers,
  Download,
};

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  idle: {
    label: "IDLE",
    color: "oklch(0.45 0 0)",
    bg: "oklch(0.18 0 0 / 0.6)",
  },
  queued: {
    label: "QUEUED",
    color: "oklch(0.80 0.14 80)",
    bg: "oklch(0.25 0.06 80 / 0.4)",
  },
  processing: {
    label: "PROCESSING",
    color: "oklch(0.72 0.14 230)",
    bg: "oklch(0.20 0.08 230 / 0.4)",
  },
  done: {
    label: "DONE",
    color: "oklch(0.72 0.18 142)",
    bg: "oklch(0.20 0.08 142 / 0.4)",
  },
  error: {
    label: "ERROR",
    color: "oklch(0.62 0.22 27)",
    bg: "oklch(0.20 0.10 27 / 0.4)",
  },
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface StageCardProps {
  definition: PipelineStageDefinition;
  result: PipelineStageResult;
  index: number;
  isActive: boolean;
}

// ─── StageCard ────────────────────────────────────────────────────────────────

export default function StageCard({
  definition,
  result,
  index,
  isActive,
}: StageCardProps) {
  const IconComp = ICON_MAP[definition.icon] ?? ScanText;
  const statusCfg = STATUS_CONFIG[result.status];
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log to bottom when new lines appear
  const logLength = result.log.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: logLength is the derived value we want to react to
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logLength]);

  // Show last 5 log lines
  const visibleLogs = result.log.slice(-5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: isActive
          ? "oklch(0.14 0.006 275 / 0.92)"
          : "oklch(0.12 0.003 275 / 0.80)",
        border: isActive
          ? `1px solid ${definition.apiSlotColor.replace("oklch(", "").replace(")", "")} opacity border`
          : "1px solid oklch(0.24 0.006 275 / 0.6)",
        borderColor: isActive
          ? definition.apiSlotColor.replace(")", " / 0.45)")
          : "oklch(0.24 0.006 275 / 0.6)",
        boxShadow: isActive
          ? `0 0 32px ${definition.apiSlotColor.replace(")", " / 0.15)")}, 0 4px 16px oklch(0 0 0 / 0.5)`
          : "0 2px 8px oklch(0 0 0 / 0.4)",
      }}
    >
      {/* Active glow animation */}
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${definition.apiSlotColor.replace(")", " / 0.08)")} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
        style={{ background: definition.apiSlotColor }}
      />

      <div className="pl-4 pr-4 pt-4 pb-3 space-y-3">
        {/* Top row: icon + label + status badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Stage number */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{
                background:
                  result.status === "done"
                    ? "oklch(0.72 0.18 142 / 0.25)"
                    : result.status === "processing"
                      ? "oklch(0.72 0.14 230 / 0.25)"
                      : "oklch(0.20 0.003 275)",
                color:
                  result.status === "done"
                    ? "oklch(0.72 0.18 142)"
                    : result.status === "processing"
                      ? "oklch(0.72 0.14 230)"
                      : "oklch(0.50 0 0)",
                border: `1px solid ${
                  result.status === "done"
                    ? "oklch(0.72 0.18 142 / 0.4)"
                    : result.status === "processing"
                      ? "oklch(0.72 0.14 230 / 0.4)"
                      : "oklch(0.28 0.005 275)"
                }`,
              }}
            >
              {index + 1}
            </div>

            {/* Icon */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `${definition.apiSlotColor.replace(")", " / 0.12)")}`,
                border: `1px solid ${definition.apiSlotColor.replace(")", " / 0.28)")}`,
                color: definition.apiSlotColor,
              }}
            >
              <IconComp className="w-3.5 h-3.5" />
            </div>

            {/* Label */}
            <span className="text-sm font-semibold text-foreground/90 truncate font-display">
              {definition.label}
            </span>
          </div>

          {/* Status badge */}
          <motion.div
            animate={
              result.status === "processing"
                ? { opacity: [1, 0.5, 1] }
                : { opacity: 1 }
            }
            transition={
              result.status === "processing"
                ? { duration: 1.2, repeat: Number.POSITIVE_INFINITY }
                : {}
            }
            className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: statusCfg.bg,
              border: `1px solid ${statusCfg.color}40`,
            }}
          >
            {result.status === "processing" && (
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: statusCfg.color }}
              />
            )}
            <span
              className="text-[9px] font-bold tracking-widest"
              style={{ color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
          </motion.div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground/50 leading-relaxed pl-0.5">
          {definition.description}
        </p>

        {/* API Slot badge */}
        <div className="space-y-1">
          <span className="text-[8px] font-bold tracking-[0.18em] uppercase text-muted-foreground/30">
            Integration Ready
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: `${definition.apiSlotColor.replace(")", " / 0.10)")}`,
                border: `1px solid ${definition.apiSlotColor.replace(")", " / 0.30)")}`,
                color: definition.apiSlotColor,
              }}
            >
              <Plug className="w-2.5 h-2.5" />
              <span className="text-[10px] font-semibold font-mono">
                {definition.apiSlot}
              </span>
            </div>
          </div>
        </div>

        {/* Log output area — terminal style */}
        {(result.log.length > 0 ||
          result.status === "processing" ||
          result.status === "done") && (
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: "oklch(0.07 0.002 275 / 0.9)",
              border: "1px solid oklch(0.18 0.005 275)",
            }}
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.04]">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
              <span className="text-[9px] text-muted-foreground/30 ml-1 font-mono">
                pipeline.log
              </span>
            </div>
            <div className="p-3 min-h-[60px] max-h-[90px] overflow-y-auto">
              {visibleLogs.length === 0 && result.status === "processing" && (
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{
                      duration: 0.8,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="text-[10px] font-mono text-muted-foreground/30"
                  >
                    ▋
                  </motion.span>
                </div>
              )}
              {visibleLogs.map((line) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-muted-foreground/25 text-[9px] font-mono shrink-0 mt-px select-none">
                    $
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/60 leading-relaxed break-all">
                    {line}
                  </span>
                </motion.div>
              ))}
              {result.status === "done" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 mt-1 pt-1 border-t border-white/[0.04]"
                >
                  <span className="text-[10px] font-mono font-semibold text-[oklch(0.72_0.18_142)]">
                    ✓ Stage complete
                  </span>
                  {result.durationMs && (
                    <span className="text-[9px] font-mono text-muted-foreground/30">
                      ({result.durationMs}ms)
                    </span>
                  )}
                </motion.div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
