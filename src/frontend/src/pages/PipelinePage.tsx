import ArchitectureDiagram from "@/components/pipeline/ArchitectureDiagram";
import PipelineFlow from "@/components/pipeline/PipelineFlow";
import StageCard from "@/components/pipeline/StageCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  PIPELINE_STAGES,
  type PipelineJob,
  type StageStatus,
  createPipelineJob,
  runPipelineSimulation,
} from "@/utils/pipelineEngine";
import {
  analyzeScript,
  generateDirectorScenePlan,
} from "@/utils/scriptAnalysis";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  Clapperboard,
  GitBranch,
  Play,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Pipeline stats from job history ─────────────────────────────────────────

function useJobStats(jobs: PipelineJob[]) {
  return useMemo(() => {
    const done = jobs.filter((j) => j.status === "done");
    const totalRuns = jobs.length;
    const avgDuration =
      done.length > 0
        ? Math.round(
            done.reduce((a, j) => a + (j.totalDurationMs ?? 0), 0) /
              done.length /
              1000,
          )
        : 0;
    const scenesProcessed = jobs.reduce((a, j) => a + j.sceneCount, 0);
    const successRate =
      totalRuns > 0 ? Math.round((done.length / totalRuns) * 100) : 0;

    return { totalRuns, avgDuration, scenesProcessed, successRate };
  }, [jobs]);
}

// ─── Job history item ─────────────────────────────────────────────────────────

function JobHistoryItem({
  job,
  isActive,
}: {
  job: PipelineJob;
  isActive: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    queued: "oklch(0.80 0.14 80)",
    processing: "oklch(0.72 0.14 230)",
    done: "oklch(0.72 0.18 142)",
    failed: "oklch(0.62 0.22 27)",
  };
  const color = statusColors[job.status] ?? "oklch(0.45 0 0)";

  const durationSec = job.totalDurationMs
    ? (job.totalDurationMs / 1000).toFixed(1)
    : null;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: isActive
          ? "oklch(0.14 0.006 88 / 0.4)"
          : "oklch(0.11 0.003 275 / 0.6)",
        border: isActive
          ? "1px solid oklch(0.76 0.12 88 / 0.35)"
          : "1px solid oklch(0.20 0.005 275)",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-3 space-y-1.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/50 truncate">
            {job.id.replace("job-", "").slice(0, 16)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{
                color,
                background: `${color.replace(")", " / 0.12)")}`,
                border: `1px solid ${color.replace(")", " / 0.28)")}`,
              }}
            >
              {job.status}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground/30 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        <p className="text-[11px] text-foreground/60 truncate leading-snug">
          {job.scriptText.slice(0, 40)}
          {job.scriptText.length > 40 ? "…" : ""}
        </p>

        <div className="flex items-center gap-3 text-[9px] text-muted-foreground/35 font-mono">
          <span>{job.sceneCount} scenes</span>
          {durationSec && <span>{durationSec}s</span>}
          <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
        </div>
      </button>

      {/* Expandable stage table */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-3 pb-3 space-y-1"
              style={{ borderTop: "1px solid oklch(0.18 0.005 275)" }}
            >
              <p className="text-[9px] text-muted-foreground/30 uppercase tracking-widest pt-2 font-semibold">
                Stage Results
              </p>
              {PIPELINE_STAGES.map((stage) => {
                const r = job.stages[stage.id];
                const stageStatusColors: Record<string, string> = {
                  idle: "oklch(0.35 0 0)",
                  queued: "oklch(0.60 0.10 80)",
                  processing: "oklch(0.60 0.12 230)",
                  done: "oklch(0.60 0.14 142)",
                  error: "oklch(0.55 0.18 27)",
                };
                const sc = stageStatusColors[r?.status ?? "idle"];
                return (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-[9px] text-muted-foreground/50 truncate flex-1">
                      {stage.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[8px] font-mono font-bold"
                        style={{ color: sc }}
                      >
                        {r?.status?.toUpperCase() ?? "IDLE"}
                      </span>
                      {r?.durationMs && (
                        <span className="text-[8px] font-mono text-muted-foreground/25">
                          {r.durationMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function PipelineStatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number | string;
  unit?: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-xl p-3.5 space-y-1 relative overflow-hidden"
      style={{
        background: "oklch(0.11 0.003 275 / 0.8)",
        border: "1px solid oklch(0.20 0.005 275)",
      }}
    >
      <div
        className="absolute bottom-0 right-0 w-12 h-12 blur-2xl rounded-full pointer-events-none"
        style={{
          background: color
            ? `${color.replace(")", " / 0.15)")}`
            : "oklch(0.76 0.12 88 / 0.08)",
        }}
      />
      <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-semibold">
        {label}
      </p>
      <p
        className="text-2xl font-bold font-display leading-none"
        style={{ color: color ?? "oklch(0.76 0.12 88)" }}
      >
        {value}
        {unit && (
          <span className="text-sm text-muted-foreground/40 ml-1">{unit}</span>
        )}
      </p>
    </div>
  );
}

// ─── Main PipelinePage ────────────────────────────────────────────────────────

export default function PipelinePage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [script, setScript] = useState("");
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const runningRef = useRef(false);

  const stats = useJobStats(jobs);

  // Active job
  const activeJob = useMemo(
    () => jobs.find((j) => j.id === activeJobId),
    [jobs, activeJobId],
  );

  // Stage statuses for PipelineFlow
  const stageStatuses = useMemo((): Record<string, StageStatus> => {
    if (!activeJob) {
      const idleMap: Record<string, StageStatus> = {};
      for (const s of PIPELINE_STAGES) idleMap[s.id] = "idle";
      return idleMap;
    }
    const map: Record<string, StageStatus> = {};
    for (const s of PIPELINE_STAGES) {
      map[s.id] = activeJob.stages[s.id]?.status ?? "idle";
    }
    return map;
  }, [activeJob]);

  // Update a job in the list
  const updateJob = useCallback((updated: PipelineJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }, []);

  // Run the pipeline
  const handleRun = useCallback(async () => {
    if (!script.trim()) {
      toast.error("Please paste a script to run the pipeline.");
      return;
    }
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);

    // Analyze script to get scene count
    const analysis = analyzeScript(script);
    const scenes = generateDirectorScenePlan(script, analysis, "sentence");
    const sceneCount = Math.max(1, scenes.length);

    // Create job
    const newJob = createPipelineJob(script, sceneCount);
    setJobs((prev) => [newJob, ...prev].slice(0, 10));
    setActiveJobId(newJob.id);

    // Run simulation
    try {
      const gen = runPipelineSimulation(newJob, updateJob);
      // Drain the generator
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const result = await gen.next();
        if (result.done) break;
      }
      toast.success("Pipeline complete! Your cinematic video is ready.", {
        duration: 4000,
      });
    } catch (_err) {
      toast.error("Pipeline encountered an error.");
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }, [script, updateJob]);

  const handleClearHistory = useCallback(() => {
    setJobs([]);
    setActiveJobId(null);
  }, []);

  const handleLaunchCinema = useCallback(() => {
    navigate({ to: "/ai-director" });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: "160px" }}>
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 0%, oklch(0.12 0.012 240 / 0.5) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, oklch(0.10 0.008 88 / 0.3) 0%, transparent 60%)",
          }}
        />
        {/* Animated background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.76 0.12 88) 1px, transparent 1px), linear-gradient(90deg, oklch(0.76 0.12 88) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 px-6 md:px-10 pt-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 glass-panel-elevated"
              style={{ boxShadow: "0 0 24px oklch(0.65 0.14 240 / 0.3)" }}
            >
              <GitBranch
                className="w-6 h-6"
                style={{ color: "oklch(0.65 0.14 240)" }}
              />
            </div>
            <div>
              <h1 className="heading-cinematic text-3xl md:text-4xl gold-gradient">
                AI Orchestration Pipeline
              </h1>
              <p className="text-muted-foreground/60 text-sm mt-1 max-w-xl">
                Production-grade pipeline visualization. Paste a script to watch
                each AI stage process in real time — with API integration slots
                showing exactly where Runway ML, ElevenLabs, and FFmpeg Cloud
                would connect.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 lg:px-10 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: Pipeline content ──────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <PipelineStatCard
                label="Total Runs"
                value={stats.totalRuns}
                color="oklch(0.65 0.14 240)"
              />
              <PipelineStatCard
                label="Avg Duration"
                value={stats.avgDuration}
                unit="s"
                color="oklch(0.72 0.15 60)"
              />
              <PipelineStatCard
                label="Scenes Processed"
                value={stats.scenesProcessed}
                color="oklch(0.68 0.16 155)"
              />
              <PipelineStatCard
                label="Success Rate"
                value={`${stats.successRate}%`}
                color="oklch(0.72 0.18 142)"
              />
            </motion.div>

            {/* Pipeline Flow Diagram */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="glass-panel rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Workflow className="w-4 h-4 text-primary/70" />
                <h2 className="heading-cinematic text-base text-foreground">
                  Pipeline Flow
                </h2>
                {isRunning && (
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="flex items-center gap-1.5 ml-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.14_230)] animate-pulse" />
                    <span className="text-[10px] font-semibold text-[oklch(0.72_0.14_230)]">
                      RUNNING
                    </span>
                  </motion.div>
                )}
              </div>
              <PipelineFlow
                stageStatuses={stageStatuses}
                isRunning={isRunning}
              />
            </motion.div>

            {/* Script Input */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="glass-panel rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-primary/70" />
                <h2 className="heading-cinematic text-base text-foreground">
                  Run Pipeline
                </h2>
              </div>
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your script here. The pipeline will analyze it through all 7 AI stages: Script Analysis → AI Director → Scene Visuals → Voice Synthesis → Music Generation → Video Stitching → Final Export..."
                rows={5}
                className="resize-none bg-muted/20 border-border/50 text-sm leading-relaxed placeholder:text-muted-foreground/25 focus:border-primary/40 font-body"
              />
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    onClick={handleRun}
                    disabled={isRunning || !script.trim()}
                    className="btn-gold gap-2.5 px-6 text-sm disabled:opacity-40"
                  >
                    {isRunning ? (
                      <>
                        <Zap className="w-4 h-4 animate-pulse" />
                        Processing Pipeline...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Run Full Pipeline
                      </>
                    )}
                  </Button>
                </motion.div>
                <span className="text-[11px] text-muted-foreground/40">
                  {script.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </motion.div>

            {/* Stage Cards */}
            <div className="space-y-3">
              {PIPELINE_STAGES.map((stage, index) => {
                const result = activeJob?.stages[stage.id] ?? {
                  stageId: stage.id,
                  status: "idle" as const,
                  log: [],
                };
                const isActive = result.status === "processing";

                return (
                  <StageCard
                    key={stage.id}
                    definition={stage}
                    result={result}
                    index={index}
                    isActive={isActive}
                  />
                );
              })}
            </div>

            {/* Launch Cinema button when done */}
            <AnimatePresence>
              {activeJob?.status === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-panel-elevated rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4"
                >
                  <div className="flex-1">
                    <h3 className="heading-cinematic text-lg gold-gradient">
                      Pipeline Complete!
                    </h3>
                    <p className="text-[12px] text-muted-foreground/60 mt-1">
                      All 7 stages finished in{" "}
                      {activeJob.totalDurationMs
                        ? (activeJob.totalDurationMs / 1000).toFixed(1)
                        : "—"}
                      s. Launch the AI Director to view and play your cinematic
                      scenes.
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      onClick={handleLaunchCinema}
                      className="btn-gold gap-2 whitespace-nowrap"
                    >
                      <Clapperboard className="w-4 h-4" />
                      Launch Cinema
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Architecture Diagram — collapsible */}
            <div className="glass-panel rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setArchitectureOpen((v) => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <GitBranch
                    className="w-4 h-4"
                    style={{ color: "oklch(0.65 0.14 240)" }}
                  />
                  <h2 className="heading-cinematic text-base text-foreground">
                    Production Architecture Diagram
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/40 hidden sm:block">
                    {architectureOpen ? "Hide" : "Show diagram"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-200 ${architectureOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {architectureOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-5 pb-5"
                      style={{
                        borderTop: "1px solid oklch(0.18 0.005 275)",
                      }}
                    >
                      <div className="pt-4">
                        <ArchitectureDiagram />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right: Job History Sidebar ───────────────────────────────── */}
          <div className="lg:w-72 xl:w-80 space-y-4 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="glass-panel rounded-2xl overflow-hidden"
              style={{ position: "sticky", top: "1.5rem" }}
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-primary/60" />
                  <h3 className="heading-cinematic text-sm text-foreground">
                    Pipeline History
                  </h3>
                </div>
                {jobs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              {jobs.length === 0 ? (
                <div className="p-6 text-center">
                  <div
                    className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{
                      background: "oklch(0.14 0.003 275)",
                      border: "1px solid oklch(0.20 0.005 275)",
                    }}
                  >
                    <GitBranch className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-[11px] text-muted-foreground/40">
                    No runs yet. Paste a script and run the pipeline.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="p-3 space-y-2">
                    {jobs.slice(0, 5).map((job) => (
                      <JobHistoryItem
                        key={job.id}
                        job={job}
                        isActive={job.id === activeJobId}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </motion.div>

            {/* Info panel */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="glass-panel rounded-2xl p-4 space-y-3"
            >
              <h4 className="heading-cinematic text-sm text-foreground/80">
                API Integration Slots
              </h4>
              <div className="space-y-1.5">
                {PIPELINE_STAGES.filter((s) =>
                  s.apiSlot.includes("[SLOT]"),
                ).map((stage) => (
                  <div key={stage.id} className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: stage.apiSlotColor }}
                    />
                    <span className="text-[10px] text-muted-foreground/50 font-mono truncate">
                      {stage.apiSlot.replace(" [SLOT]", "")}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/35 leading-relaxed">
                Replace [SLOT] entries with real API keys to upgrade from
                simulation to live production rendering.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-10 pb-8 pt-4 border-t border-white/[0.04] text-center text-[11px] text-muted-foreground/25">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground/50 transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
