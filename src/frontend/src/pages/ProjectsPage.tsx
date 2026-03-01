import type { Project } from "@/backend.d";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/contexts/AppContext";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  Crown,
  Edit3,
  Film,
  Layers,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import { toast } from "sonner";

const FREE_PROJECT_LIMIT = 3;

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { isPro } = useAppContext();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProjects();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast.error(`Failed to delete: ${e.message}`);
    },
  });

  const filtered = (projects || []).filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenProject = (project: Project) => {
    navigate({
      to: "/editor/$projectId",
      params: { projectId: encodeURIComponent(project.title) },
    });
  };

  const handleNewProject = () => {
    if (!isPro && (projects?.length ?? 0) >= FREE_PROJECT_LIMIT) {
      toast.error(
        "Free plan limit reached. Upgrade to Pro for unlimited projects.",
      );
      return;
    }
    navigate({ to: "/editor/new" });
  };

  const projectCount = projects?.length ?? 0;
  const atLimit = !isPro && projectCount >= FREE_PROJECT_LIMIT;

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between mb-10"
      >
        <div>
          <p className="label-cinematic mb-2">Library</p>
          <h1 className="heading-cinematic gold-gradient text-4xl md:text-5xl">
            Projects
          </h1>
          <p className="text-muted-foreground/60 text-sm mt-1.5">
            {isAuthenticated
              ? `${projectCount} project${projectCount !== 1 ? "s" : ""}`
              : "Sign in to manage your projects"}
          </p>
        </div>
        {isAuthenticated && (
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={handleNewProject} className="btn-gold gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Free plan warning */}
      {isAuthenticated && atLimit && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass-panel-elevated rounded-xl p-4 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-yellow-900/30 border border-yellow-600/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-400/90">
              {projectCount}/{FREE_PROJECT_LIMIT} projects used — Free plan
              limit reached
            </p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">
              Upgrade to Pro for unlimited projects
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate({ to: "/subscription" })}
            className="btn-gold gap-1.5 shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            Upgrade
          </Button>
        </motion.div>
      )}

      {/* Search */}
      {isAuthenticated && (
        <div className="relative mb-7 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.04] border-white/[0.08] focus:border-primary/40 focus:bg-white/[0.06] placeholder:text-muted-foreground/30"
          />
        </div>
      )}

      {/* Projects grid */}
      {!isAuthenticated ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel rounded-2xl p-14 text-center"
        >
          <div className="w-16 h-16 rounded-2xl glass-panel mx-auto mb-5 flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground/25" />
          </div>
          <h3 className="font-semibold text-base text-foreground/60 mb-1">
            Sign in to view your projects
          </h3>
          <p className="text-muted-foreground/40 text-sm">
            Your cinematic library awaits
          </p>
        </motion.div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(["a", "b", "c", "d", "e", "f"] as const).map((key) => (
            <div key={key} className="glass-panel rounded-xl overflow-hidden">
              <Skeleton className="aspect-video bg-white/[0.04]" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-3.5 w-3/4 bg-white/[0.05]" />
                <Skeleton className="h-2.5 w-1/2 bg-white/[0.03]" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel rounded-2xl p-14 text-center"
        >
          <div className="w-16 h-16 rounded-2xl glass-panel mx-auto mb-5 flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground/25" />
          </div>
          <h3 className="heading-cinematic text-lg text-foreground/70 mb-1">
            {search ? "No matching projects" : "No projects yet"}
          </h3>
          <p className="text-muted-foreground/40 text-sm mb-6">
            {search
              ? "Try a different search term"
              : "Create your first cinematic project"}
          </p>
          {!search && !atLimit && (
            <Button onClick={handleNewProject} className="btn-gold gap-2">
              <Plus className="w-4 h-4" />
              Create Project
            </Button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((project, i) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, scale: 1.01 }}
                className="glass-panel rounded-xl overflow-hidden group cinematic-shadow relative"
              >
                {/* Gold shimmer edge on hover */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                {/* Thumbnail */}
                <button
                  type="button"
                  className="relative aspect-video bg-gradient-to-br from-zinc-900 via-zinc-800/70 to-zinc-900 cursor-pointer overflow-hidden w-full block p-0 border-0"
                  onClick={() => handleOpenProject(project)}
                >
                  <Film className="absolute inset-0 m-auto w-10 h-10 text-muted-foreground/15" />
                  {project.activePreset && project.activePreset !== "none" && (
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md border border-primary/30 text-primary text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wider">
                      {project.activePreset}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-all duration-250 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full btn-gold flex items-center justify-center shadow-[0_0_24px_oklch(0.76_0.12_88/0.35)]">
                      <Edit3 className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* Info */}
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground/90 truncate">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                          <Calendar className="w-3 h-3" />
                          {formatDate(project.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground/40">
                          <Layers className="w-3 h-3" />
                          {project.clips.length}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(project)}
                      className="p-1.5 rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Delete dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="glass-panel border-white/[0.10]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/60">
              Are you sure you want to delete "{deleteTarget?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/[0.04] border-white/[0.10] hover:bg-white/[0.08] text-foreground/70">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.title)
              }
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-white/[0.05] text-center text-[11px] text-muted-foreground/30">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground/60 transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
