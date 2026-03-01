// ─── Pipeline Engine ─────────────────────────────────────────────────────────
// Simulation layer for AI Orchestration Pipeline
// Shows architecture and connects to real GPU APIs in production

export type PipelineStageId =
  | "script-analysis"
  | "ai-director"
  | "scene-visuals"
  | "voice-synthesis"
  | "music-generation"
  | "video-stitching"
  | "final-export";

export type StageStatus = "idle" | "queued" | "processing" | "done" | "error";

export interface PipelineStageResult {
  stageId: PipelineStageId;
  status: StageStatus;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  output?: string; // human-readable result summary
  log: string[]; // array of log lines added during processing
}

export interface PipelineJob {
  id: string;
  scriptText: string;
  sceneCount: number;
  status: "queued" | "processing" | "done" | "failed";
  stages: Record<PipelineStageId, PipelineStageResult>;
  createdAt: number;
  completedAt?: number;
  totalDurationMs?: number;
}

export interface PipelineStageDefinition {
  id: PipelineStageId;
  label: string;
  description: string;
  apiSlot: string; // e.g. "ElevenLabs / Azure TTS"
  apiSlotColor: string; // oklch color for the badge
  icon: string; // lucide icon name as string
  simDurationMs: number; // how long this stage takes in simulation
  simLogs: string[]; // log lines to emit one by one during simulation
}

export const PIPELINE_STAGES: PipelineStageDefinition[] = [
  {
    id: "script-analysis",
    label: "Script Analysis",
    description:
      "Analyzes emotion, luxury level, buyer persona, hook score, time-of-day and mood tone from the script using NLP keyword extraction.",
    apiSlot: "Built-in NLP Engine",
    apiSlotColor: "oklch(0.65 0.10 240)",
    icon: "ScanText",
    simDurationMs: 1200,
    simLogs: [
      "Tokenizing script input...",
      "Running emotion classification...",
      "Scoring luxury intensity keywords...",
      "Detecting time-of-day markers...",
      "Computing psychological hook score...",
      "Generating buyer persona profiles...",
      "Analysis complete.",
    ],
  },
  {
    id: "ai-director",
    label: "AI Director Engine",
    description:
      "Converts analysis into a structured scene plan with shot types (aerial drone, dolly push, interior pan), camera movements, and lighting directives per scene.",
    apiSlot: "Director Logic Engine",
    apiSlotColor: "oklch(0.76 0.12 88)",
    icon: "Clapperboard",
    simDurationMs: 1800,
    simLogs: [
      "Loading director scene templates...",
      "Assigning shot sequence for emotion profile...",
      "Computing camera movement per scene...",
      "Setting lighting directives...",
      "Calculating scene durations from word count...",
      "Writing director notes...",
      "Scene plan generated.",
    ],
  },
  {
    id: "scene-visuals",
    label: "Scene Visuals",
    description:
      "Generates cinematic visual backgrounds per scene. In production: Runway ML Gen-3, Sora, or Pika Labs for photo-realistic video generation with depth-of-field and camera simulation.",
    apiSlot: "Runway ML / Sora [SLOT]",
    apiSlotColor: "oklch(0.55 0.20 27)",
    icon: "ImagePlay",
    simDurationMs: 3500,
    simLogs: [
      "Initializing visual generation pipeline...",
      "Building scene prompt from director notes...",
      "Rendering scene 1: Aerial drone — sunrise backlight...",
      "Rendering scene 2: Dolly push — warm interior...",
      "Rendering scene 3: Interior pan — luxury ambient...",
      "Applying cinematic color grading (LUT)...",
      "Adding depth-of-field blur pass...",
      "Scene visuals ready. [API SLOT: Runway ML / Sora]",
    ],
  },
  {
    id: "voice-synthesis",
    label: "Voice Synthesis",
    description:
      "Synthesizes human-quality narration with emotional tone control, accent selection, natural breathing patterns, and pause detection. In production: ElevenLabs or Azure Neural TTS.",
    apiSlot: "ElevenLabs / Azure TTS [SLOT]",
    apiSlotColor: "oklch(0.68 0.16 155)",
    icon: "Mic",
    simDurationMs: 2200,
    simLogs: [
      "Loading voice persona profile...",
      "Applying emotional tone settings...",
      "Injecting natural breathing pauses...",
      "Synthesizing narration for scene 1...",
      "Synthesizing narration for scene 2...",
      "Synthesizing narration for scene 3...",
      "Post-processing: noise reduction, normalization...",
      "Voice audio ready. [API SLOT: ElevenLabs]",
    ],
  },
  {
    id: "music-generation",
    label: "Music Generation",
    description:
      "Composes emotion-synced cinematic score with smooth rise and fall, fade in/out control. In production: Suno AI or Udio for full orchestral generation.",
    apiSlot: "Suno AI / Udio [SLOT]",
    apiSlotColor: "oklch(0.55 0.18 290)",
    icon: "Music2",
    simDurationMs: 2800,
    simLogs: [
      "Loading music mood profile: luxury-ambient...",
      "Generating chord progression...",
      "Adding orchestral layer: strings + brass...",
      "Syncing tempo to scene durations...",
      "Building dynamic arc: intro → crescendo → resolve...",
      "Rendering stems: melody, harmony, rhythm...",
      "Mixing and mastering...",
      "Cinematic score ready. [API SLOT: Suno AI]",
    ],
  },
  {
    id: "video-stitching",
    label: "Video Stitching",
    description:
      "Assembles scenes, voice narration, music, and transitions into a timeline. In production: FFmpeg Cloud or AWS MediaConvert for GPU-accelerated video encoding.",
    apiSlot: "FFmpeg Cloud / AWS MediaConvert [SLOT]",
    apiSlotColor: "oklch(0.70 0.18 50)",
    icon: "Layers",
    simDurationMs: 3000,
    simLogs: [
      "Initializing video assembly pipeline...",
      "Loading scene clips into timeline...",
      "Aligning voice narration to scene timing...",
      "Mixing music layer at -18dB background...",
      "Applying cross-dissolve transitions between scenes...",
      "Rendering letterbox bars (cinematic 2.35:1)...",
      "Adding color grade LUT pass...",
      "Assembly complete. [API SLOT: FFmpeg Cloud]",
    ],
  },
  {
    id: "final-export",
    label: "Final Export",
    description:
      "Encodes the final video at selected resolution (720p / 1080p / 4K) with H.264 or H.265 codec. In production: Cloud GPU farm for real-time 4K encoding.",
    apiSlot: "Cloud GPU / NVIDIA A100 [SLOT]",
    apiSlotColor: "oklch(0.72 0.15 60)",
    icon: "Download",
    simDurationMs: 2000,
    simLogs: [
      "Initializing GPU encoder...",
      "Encoding at 1080p H.264 (Pro: 4K H.265)...",
      "Writing metadata and chapter markers...",
      "Generating thumbnail...",
      "Uploading to CDN...",
      "Export complete. Ready to download.",
    ],
  },
];

// ─── Factory: create a new job with all stages idle ───────────────────────────

export function createPipelineJob(
  scriptText: string,
  sceneCount: number,
): PipelineJob {
  const stages = {} as Record<PipelineStageId, PipelineStageResult>;
  for (const stage of PIPELINE_STAGES) {
    stages[stage.id] = {
      stageId: stage.id,
      status: "idle",
      log: [],
    };
  }

  return {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    scriptText,
    sceneCount,
    status: "queued",
    stages,
    createdAt: Date.now(),
  };
}

// ─── Async simulation runner ──────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function* runPipelineSimulation(
  job: PipelineJob,
  onUpdate: (job: PipelineJob) => void,
): AsyncGenerator<{
  stageId: PipelineStageId;
  logLine: string;
  done: boolean;
}> {
  // Mutable working copy — we mutate and call onUpdate each step
  const current: PipelineJob = {
    ...job,
    status: "processing",
    stages: { ...job.stages },
  };

  // Mark all as queued first
  for (const stage of PIPELINE_STAGES) {
    current.stages[stage.id] = {
      ...current.stages[stage.id],
      status: "queued",
      log: [],
    };
  }
  onUpdate({ ...current });
  await delay(120);

  for (const stageDef of PIPELINE_STAGES) {
    const stageId = stageDef.id;
    const logInterval = Math.floor(
      stageDef.simDurationMs / stageDef.simLogs.length,
    );

    // Transition to processing
    current.stages[stageId] = {
      ...current.stages[stageId],
      status: "processing",
      startedAt: Date.now(),
      log: [],
    };
    onUpdate({ ...current });
    await delay(80);

    // Emit log lines one by one
    for (const logLine of stageDef.simLogs) {
      await delay(logInterval);
      current.stages[stageId] = {
        ...current.stages[stageId],
        log: [...current.stages[stageId].log, logLine],
      };
      onUpdate({ ...current });

      yield { stageId, logLine, done: false };
    }

    // Transition to done
    const completedAt = Date.now();
    const startedAt = current.stages[stageId].startedAt ?? completedAt;
    current.stages[stageId] = {
      ...current.stages[stageId],
      status: "done",
      completedAt,
      durationMs: completedAt - startedAt,
      output: stageDef.simLogs[stageDef.simLogs.length - 1],
    };
    onUpdate({ ...current });

    yield { stageId, logLine: "", done: true };

    await delay(200); // brief pause between stages
  }

  // Job complete
  const completedAt = Date.now();
  current.status = "done";
  current.completedAt = completedAt;
  current.totalDurationMs = completedAt - job.createdAt;
  onUpdate({ ...current });
}
