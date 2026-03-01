# CineForge – AI Orchestration Pipeline Layer

## Current State

CineForge has:
- Full AI Director Engine page (`/ai-director`) with 3-step flow: Script → Analysis → Storyboard
- ScriptPanel with Director Mode toggle, voice settings, music engine
- ScenePlayer with director overlays (shot type badges, camera move, lighting, music mood)
- CinematicMusicEngine (Web Audio API ambient pads)
- analyzeScript + generateDirectorScenePlan utilities
- ICP backend: user profiles, projects, subscriptions

What it does NOT have:
- A visible "pipeline" UI showing the orchestration flow
- A render queue / job management system
- API integration status indicators (shows where real AI APIs would plug in)
- A simulated render pipeline with stage-by-stage progress
- A "Render Job" concept stored in backend
- Pipeline architecture visualization for the creator/admin

## Requested Changes (Diff)

### Add

1. **AI Pipeline page** (`/pipeline`) — full orchestration dashboard:
   - Visual pipeline flow diagram: Script Input → AI Director → Scene Planner → Voice Engine → Music Engine → Video Stitch → Final Export
   - Each stage is a card with: status indicator (ready/processing/done/error), description of what it does, "Connect API" slot showing what real service would go here (e.g. "ElevenLabs", "Runway ML", "Sora", "FFmpeg Cloud")
   - Live animated connection lines between stages when pipeline is running
   - A "Run Full Pipeline" button that triggers a simulated run
   - Stage-by-stage progress with timing simulation

2. **Render Job system**:
   - `PipelineJob` type: id, scriptText, status (queued/processing/done/failed), stages (array of stage results), createdAt, completedAt
   - Jobs list sidebar showing last 5 runs with status badges
   - Each job expandable to show per-stage logs

3. **Pipeline Stage Cards** (7 stages):
   - **Stage 1 — Script Analysis**: "Analyzing emotion, luxury level, shot composition..." → shows analysis result when done
   - **Stage 2 — AI Director**: "Generating scene plan with shot types, camera moves, lighting..." → shows scene count when done
   - **Stage 3 — Scene Visuals**: "Generating cinematic backgrounds per scene..." [API SLOT: Runway ML / Sora] → in MVP shows gradient previews
   - **Stage 4 — Voice Synthesis**: "Synthesizing human-quality narration..." [API SLOT: ElevenLabs / Azure TTS] → in MVP uses Web Speech API
   - **Stage 5 — Music Generation**: "Composing emotion-synced cinematic score..." [API SLOT: Suno AI / Udio] → in MVP uses Web Audio Engine
   - **Stage 6 — Video Stitching**: "Assembling scenes, audio, transitions..." [API SLOT: FFmpeg Cloud / AWS MediaConvert] → in MVP shows assembly preview
   - **Stage 7 — Final Export**: "Encoding 4K output with color grade..." [API SLOT: Cloud GPU] → in MVP shows export modal

4. **API Slot indicators**: Each stage card has a pill badge showing the real-world API that would power it, styled as "INTEGRATION READY" with a plug icon. These make it clear to investors/creators that the slots are pre-built for real APIs.

5. **Pipeline Stats bar** at top of pipeline page:
   - Total pipeline runs, avg duration, success rate, scenes processed — all from local state

6. **Architecture Diagram panel** on the pipeline page:
   - A simplified horizontal flow diagram showing: ICP Canister ↔ Frontend ↔ [AI Services] ↔ [Cloud GPU]
   - Labels explaining what each layer does
   - "Current: Browser simulation" vs "Production: Cloud GPU" toggle view

7. **Render Queue widget** on Dashboard (small card):
   - Shows last pipeline run status
   - "New Pipeline Run" button linking to /pipeline

### Modify

- **Navigation**: Add "Pipeline" nav item with a `GitBranch` or `Workflow` icon
- **DashboardPage**: Add render queue status card in the stats row area
- **App.tsx**: Add `/pipeline` route

### Remove

Nothing removed.

## Implementation Plan

1. Create `src/utils/pipelineEngine.ts` — simulation engine: `PipelineJob` type, `runPipeline(script, analysis, directorScenes)` async generator that yields stage-by-stage progress events with realistic timing delays
2. Create `src/pages/PipelinePage.tsx` — main pipeline orchestration page with all 7 stage cards, architecture diagram, job history sidebar
3. Create `src/components/pipeline/StageCard.tsx` — individual pipeline stage card component
4. Create `src/components/pipeline/PipelineFlow.tsx` — animated SVG/div flow diagram with connection lines
5. Create `src/components/pipeline/ArchitectureDiagram.tsx` — static architecture overview panel
6. Add `/pipeline` route to App.tsx and nav item to AppShell
7. Update DashboardPage with render queue widget
