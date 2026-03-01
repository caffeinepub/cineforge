import { PIPELINE_STAGES, type StageStatus } from "@/utils/pipelineEngine";
import { motion } from "motion/react";
import React from "react";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PipelineFlowProps {
  stageStatuses: Record<string, StageStatus>;
  isRunning: boolean;
}

// ─── Stage colors from definitions ───────────────────────────────────────────

const STAGE_COLORS = PIPELINE_STAGES.map((s) => s.apiSlotColor);

// ─── PipelineFlow ─────────────────────────────────────────────────────────────

export default function PipelineFlow({
  stageStatuses,
  isRunning,
}: PipelineFlowProps) {
  return (
    <>
      {/* Desktop: horizontal flow */}
      <div className="hidden lg:flex items-center gap-0 w-full overflow-x-auto pb-1">
        {PIPELINE_STAGES.map((stage, index) => {
          const status = stageStatuses[stage.id] ?? "idle";
          const isActive = status === "processing";
          const isDone = status === "done";
          const isQueued = status === "queued";

          const stageColor = STAGE_COLORS[index];
          const dotColor = isDone
            ? "oklch(0.72 0.18 142)"
            : isActive
              ? stageColor
              : isQueued
                ? "oklch(0.80 0.14 80)"
                : "oklch(0.30 0.005 275)";

          return (
            <React.Fragment key={stage.id}>
              {/* Stage node */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                {/* Circle indicator */}
                <motion.div
                  animate={
                    isActive
                      ? {
                          boxShadow: [
                            `0 0 8px ${stageColor.replace(")", " / 0.4)")}`,
                            `0 0 20px ${stageColor.replace(")", " / 0.7)")}`,
                            `0 0 8px ${stageColor.replace(")", " / 0.4)")}`,
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300"
                  style={{
                    background: isDone
                      ? "oklch(0.72 0.18 142 / 0.2)"
                      : isActive
                        ? `${stageColor.replace(")", " / 0.22)")}`
                        : isQueued
                          ? "oklch(0.80 0.14 80 / 0.12)"
                          : "oklch(0.15 0.003 275)",
                    border: `1.5px solid ${dotColor}`,
                    color: dotColor,
                  }}
                >
                  {isDone ? "✓" : index + 1}
                </motion.div>

                {/* Label */}
                <div
                  className="text-[9px] font-semibold tracking-wide text-center max-w-[64px] leading-tight"
                  style={{
                    color: isActive
                      ? stageColor
                      : isDone
                        ? "oklch(0.72 0.18 142)"
                        : isQueued
                          ? "oklch(0.80 0.14 80)"
                          : "oklch(0.38 0 0)",
                  }}
                >
                  {stage.label.split(" ").slice(0, 2).join(" ")}
                </div>
              </div>

              {/* Connector line */}
              {index < PIPELINE_STAGES.length - 1 && (
                <div className="relative flex-1 h-px mx-1 min-w-[12px] max-w-[48px] -mt-4">
                  {/* Base line */}
                  <div
                    className="absolute inset-y-0 inset-x-0 rounded-full"
                    style={{
                      background: isDone
                        ? "oklch(0.72 0.18 142 / 0.4)"
                        : "oklch(0.22 0.005 275)",
                    }}
                  />
                  {/* Animated flow when running */}
                  {isRunning && isActive && (
                    <motion.div
                      className="absolute inset-y-0 left-0 w-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${stageColor}, transparent)`,
                        backgroundSize: "60% 100%",
                      }}
                      animate={{ backgroundPosition: ["-60% 0%", "160% 0%"] }}
                      transition={{
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: 2-column grid */}
      <div className="lg:hidden grid grid-cols-4 gap-2">
        {PIPELINE_STAGES.map((stage, index) => {
          const status = stageStatuses[stage.id] ?? "idle";
          const isActive = status === "processing";
          const isDone = status === "done";
          const isQueued = status === "queued";

          const stageColor = STAGE_COLORS[index];
          const dotColor = isDone
            ? "oklch(0.72 0.18 142)"
            : isActive
              ? stageColor
              : isQueued
                ? "oklch(0.80 0.14 80)"
                : "oklch(0.30 0.005 275)";

          return (
            <div key={stage.id} className="flex flex-col items-center gap-1">
              <motion.div
                animate={
                  isActive
                    ? {
                        boxShadow: [
                          `0 0 6px ${stageColor.replace(")", " / 0.3)")}`,
                          `0 0 14px ${stageColor.replace(")", " / 0.6)")}`,
                          `0 0 6px ${stageColor.replace(")", " / 0.3)")}`,
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{
                  background: isDone
                    ? "oklch(0.72 0.18 142 / 0.2)"
                    : isActive
                      ? `${stageColor.replace(")", " / 0.18)")}`
                      : "oklch(0.15 0.003 275)",
                  border: `1.5px solid ${dotColor}`,
                  color: dotColor,
                }}
              >
                {isDone ? "✓" : index + 1}
              </motion.div>
              <span
                className="text-[8px] font-semibold text-center leading-tight"
                style={{ color: isActive ? stageColor : "oklch(0.35 0 0)" }}
              >
                {stage.label.split(" ").slice(0, 1).join("").slice(0, 6)}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
