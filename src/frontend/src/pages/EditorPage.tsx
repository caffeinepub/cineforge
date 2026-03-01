import type { Clip, Project, TextOverlay } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectContext } from "@/contexts/ProjectContext";
import type { LocalClip, LocalTextOverlay } from "@/contexts/ProjectContext";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  FileText,
  Film,
  Loader2,
  Save,
  Sliders,
  Sparkles,
  Type,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import ClipsPanel from "@/components/editor/ClipsPanel";
import ExportModal from "@/components/editor/ExportModal";
import FilterPanel from "@/components/editor/FilterPanel";
import PlaybackControls from "@/components/editor/PlaybackControls";
import ScriptPanel from "@/components/editor/ScriptPanel";
import TextOverlayPanel from "@/components/editor/TextOverlayPanel";
import Timeline from "@/components/editor/Timeline";
import VideoPreview from "@/components/editor/VideoPreview";

interface EditorPageProps {
  projectId?: string;
}

export default function EditorPage({ projectId }: EditorPageProps) {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const isNew = !projectId || projectId === "new";
  const decodedId =
    projectId && projectId !== "new" ? decodeURIComponent(projectId) : null;

  const {
    projectTitle,
    setProjectTitle,
    clips,
    textOverlays,
    activePreset,
    setClips,
    setTextOverlays,
    setActivePreset,
    resetProject,
  } = useProjectContext();

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  // Load existing project
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["project", decodedId],
    queryFn: async () => {
      if (!actor || !decodedId) throw new Error("No actor/id");
      return actor.getProject(decodedId);
    },
    enabled: !!actor && !isFetching && !isNew && !!decodedId,
  });

  // Sync project data into context
  // biome-ignore lint/correctness/useExhaustiveDependencies: setters are stable, project/isNew are the real deps
  useEffect(() => {
    if (project) {
      setProjectTitle(project.title);
      setActivePreset(project.activePreset);
      const localClips: LocalClip[] = project.clips.map((c) => ({
        ...c,
        localUrl: undefined,
      }));
      setClips(localClips);
      const localOverlays: LocalTextOverlay[] = project.textOverlays.map(
        (o, i) => ({
          ...o,
          id: `loaded-${i}`,
        }),
      );
      setTextOverlays(localOverlays);
    } else if (isNew) {
      resetProject();
    }
  }, [project, isNew]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const backendClips: Clip[] = clips.map((c, i) => ({
        blobId: c.blobId,
        name: c.name,
        durationSeconds: c.durationSeconds,
        orderIndex: BigInt(i),
        startTrim: c.startTrim,
        endTrim: c.endTrim,
      }));
      const backendOverlays: TextOverlay[] = textOverlays.map((o) => ({
        text: o.text,
        xPercent: o.xPercent,
        yPercent: o.yPercent,
        color: o.color,
        fontSize: o.fontSize,
        fontFamily: o.fontFamily,
      }));

      if (isNew) {
        return actor.createProject(
          projectTitle,
          backendClips,
          backendOverlays,
          activePreset,
        );
      }
      return actor.updateProject(
        decodedId!,
        projectTitle,
        backendClips,
        backendOverlays,
        activePreset,
      );
    },
    onSuccess: (saved) => {
      setSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project saved");
      if (isNew) {
        navigate({
          to: "/editor/$projectId",
          params: { projectId: encodeURIComponent(saved.title) },
        });
      }
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: (e) => {
      setSaveStatus("idle");
      toast.error(`Save failed: ${e.message}`);
    },
  });

  const handleSave = () => {
    if (!isAuthenticated) {
      toast.error("Sign in to save projects");
      return;
    }
    setSaveStatus("saving");
    saveMutation.mutate();
  };

  if (!isNew && projectLoading) {
    return (
      <div className="h-full flex flex-col gap-4 p-6">
        <Skeleton className="h-10 w-48 bg-white/[0.05]" />
        <Skeleton className="flex-1 bg-white/[0.04] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.07] glass-panel-dark shrink-0">
        <button
          type="button"
          onClick={() => navigate({ to: "/projects" })}
          className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Separator orientation="vertical" className="h-5 bg-white/[0.08]" />

        {/* Project title */}
        <div className="flex items-center gap-2 flex-1">
          <Sparkles className="w-3.5 h-3.5 text-primary/50 shrink-0" />
          <Input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="h-8 text-sm font-semibold bg-transparent border-transparent hover:border-white/[0.10] focus:border-primary/40 focus:bg-white/[0.04] w-52 px-2 font-display tracking-tight"
            placeholder="Project title…"
          />
        </div>

        <div className="flex-1" />

        {/* Save indicator */}
        {saveStatus === "saved" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-green-400/70 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400/80 animate-pulse" />
            Saved
          </motion.span>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="gap-1.5 text-xs text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.06]"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Save
        </Button>

        <Button
          size="sm"
          onClick={() => setExportModalOpen(true)}
          className="btn-gold gap-1.5 text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      {/* ── Main editor layout ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Clips / Text tabs */}
        <div className="w-52 shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden glass-panel-dark">
          <Tabs defaultValue="clips" className="flex flex-col h-full">
            <TabsList className="w-full grid grid-cols-3 h-8 bg-white/[0.04] mx-2 mt-2 mb-0 rounded-md shrink-0 border border-white/[0.06]">
              <TabsTrigger
                value="clips"
                className="text-xs gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <Film className="w-3 h-3" />
                Clips
              </TabsTrigger>
              <TabsTrigger
                value="text"
                className="text-xs gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <Type className="w-3 h-3" />
                Text
              </TabsTrigger>
              <TabsTrigger
                value="script"
                className="text-xs gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <FileText className="w-3 h-3" />
                Script
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-hidden p-3">
              <TabsContent
                value="clips"
                className="h-full mt-0 overflow-hidden"
              >
                <ClipsPanel />
              </TabsContent>
              <TabsContent value="text" className="h-full mt-0 overflow-hidden">
                <TextOverlayPanel />
              </TabsContent>
              <TabsContent
                value="script"
                className="h-full mt-0 overflow-hidden"
              >
                <ScriptPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Center: video preview + playback + timeline */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Video preview */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-transparent to-black/20">
            <div className="w-full max-w-4xl">
              <VideoPreview />
            </div>
          </div>

          {/* Playback controls */}
          <div className="px-4 pb-2 glass-panel-dark border-t border-white/[0.06] shrink-0">
            <div className="py-2 max-w-4xl mx-auto">
              <PlaybackControls />
            </div>
          </div>

          {/* Timeline */}
          <div className="h-20 border-t border-white/[0.06] glass-panel-dark shrink-0 px-3">
            <div className="flex items-center gap-2 h-5 px-1 mt-1.5">
              <span className="label-cinematic">Timeline</span>
            </div>
            <div className="h-12">
              <Timeline />
            </div>
          </div>
        </div>

        {/* Right panel: filters */}
        <div className="w-56 shrink-0 border-l border-white/[0.06] flex flex-col overflow-hidden glass-panel-dark">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] shrink-0">
            <Sliders className="w-3.5 h-3.5 text-primary/70" />
            <span className="label-cinematic">Filters</span>
          </div>
          <div className="flex-1 overflow-hidden p-3">
            <FilterPanel />
          </div>
        </div>
      </div>

      {/* Export modal */}
      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
}
