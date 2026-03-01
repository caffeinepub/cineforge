import type { Project } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/contexts/AppContext";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Clapperboard,
  Clock,
  Crown,
  Film,
  FolderOpen,
  GitBranch,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate({
      to: "/editor/$projectId",
      params: { projectId: encodeURIComponent(project.title) },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4, scale: 1.015 }}
      className="glass-panel rounded-xl overflow-hidden cursor-pointer group cinematic-shadow relative"
      onClick={handleOpen}
    >
      {/* Gold top edge accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

      {/* Thumbnail area */}
      <div className="relative aspect-video bg-gradient-to-br from-zinc-900 via-zinc-800/80 to-zinc-900 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="w-10 h-10 text-muted-foreground/20" />
        </div>
        {/* Preset badge */}
        {project.activePreset && project.activePreset !== "none" && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-primary/30 text-primary text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wider">
            {project.activePreset}
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-250">
          <div className="w-11 h-11 rounded-full btn-gold flex items-center justify-center shadow-[0_0_32px_oklch(0.76_0.12_88/0.4)]">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <h3 className="font-semibold text-sm text-foreground/90 truncate">
          {project.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-muted-foreground/70">
            {formatDate(project.createdAt)}
          </span>
          <span className="text-[11px] text-muted-foreground/50">
            {project.clips.length} clips
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { isPro } = useAppContext();
  const isAuthenticated = !!identity;

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProjects();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const { data: usageStats } = useQuery({
    queryKey: ["usageStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUsageStats();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const recentProjects = (projects || []).slice(0, 4);

  const handleNewProject = () => {
    navigate({ to: "/editor/new" });
  };

  return (
    <div className="min-h-screen relative">
      {/* ── Cinematic hero ──────────────────────────────────────────────── */}
      <div
        className="relative h-72 md:h-88 overflow-hidden"
        style={{ height: "clamp(260px, 35vw, 380px)" }}
      >
        <img
          src="/assets/generated/cinematic-hero-bg.dim_1920x1080.jpg"
          alt="Cinematic background"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        {/* Multi-layer gradient for rich depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
        {/* Ambient gold glow from bottom-left */}
        <div className="absolute bottom-0 left-0 w-96 h-48 bg-gradient-to-tr from-primary/8 to-transparent blur-3xl" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-start justify-end h-full px-6 pb-10 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-4 mb-2"
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden glass-panel">
              <img
                src="/assets/generated/cineforge-logo-transparent.dim_200x200.png"
                alt="CineForge"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="heading-cinematic gold-gradient text-4xl md:text-5xl">
              CineForge
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-muted-foreground/80 text-sm tracking-[0.22em] uppercase font-medium"
          >
            Script → Cinematic Movie
          </motion.p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="px-6 md:px-10 pb-12 -mt-2 space-y-8">
        {/* Not authenticated welcome */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-elevated rounded-2xl p-8 text-center"
          >
            <div className="w-14 h-14 rounded-2xl glass-panel mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="heading-cinematic text-2xl gold-gradient mb-2">
              Welcome to CineForge
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
              Sign in to start crafting cinematic stories with
              professional-grade color grading
            </p>
          </motion.div>
        )}

        {/* Stats row */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <StatCard
              icon={<FolderOpen className="w-4 h-4 text-primary/80" />}
              label="Projects"
              value={
                usageStats ? Number(usageStats.projectCount).toString() : "—"
              }
              loading={!usageStats}
            />
            <StatCard
              icon={<Clock className="w-4 h-4 text-primary/80" />}
              label="Minutes"
              value={
                usageStats
                  ? Number(usageStats.totalUsageMinutes).toString()
                  : "—"
              }
              loading={!usageStats}
            />
            <StatCard
              icon={<Crown className="w-4 h-4 text-primary/80" />}
              label="Plan"
              value={isPro ? "PRO" : "FREE"}
              valueClass={isPro ? "gold-gradient" : "text-muted-foreground/80"}
              loading={false}
            />
            <StatCard
              icon={<Film className="w-4 h-4 text-primary/80" />}
              label="Clips"
              value={recentProjects
                .reduce((acc, p) => acc + p.clips.length, 0)
                .toString()}
              loading={projectsLoading}
            />
          </motion.div>
        )}

        {/* AI Director Engine CTA */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl cursor-pointer group w-full text-left"
          onClick={() => navigate({ to: "/ai-director" })}
          style={{
            background:
              "linear-gradient(135deg, oklch(0.12 0.010 88 / 0.9) 0%, oklch(0.10 0.005 275 / 0.8) 100%)",
            border: "1px solid oklch(0.76 0.12 88 / 0.25)",
          }}
        >
          {/* Gold gradient border glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              boxShadow:
                "inset 0 0 0 1px oklch(0.76 0.12 88 / 0.45), 0 0 32px oklch(0.76 0.12 88 / 0.12)",
            }}
          />
          {/* Background ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-0 right-0 w-64 h-32 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse at top right, oklch(0.76 0.12 88 / 0.2), transparent)",
              }}
            />
          </div>

          <div className="relative z-10 flex items-center gap-5 p-5 md:p-6">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{
                background: "oklch(0.76 0.12 88 / 0.15)",
                border: "1px solid oklch(0.76 0.12 88 / 0.35)",
                boxShadow: "0 0 20px oklch(0.76 0.12 88 / 0.15)",
              }}
            >
              <Clapperboard className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="heading-cinematic text-base md:text-lg text-foreground">
                  AI Director Engine
                </h3>
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.76 0.12 88 / 0.15)",
                    color: "oklch(0.76 0.12 88)",
                    border: "1px solid oklch(0.76 0.12 88 / 0.3)",
                  }}
                >
                  New
                </span>
              </div>
              <p className="text-[12px] md:text-sm text-muted-foreground/60 leading-snug">
                Paste a script. Get a cinematic movie — AI analyzes emotion,
                composes shot sequences, and generates a full scene plan.
              </p>
            </div>

            <div className="shrink-0 hidden sm:block">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  className="btn-gold gap-2 text-xs whitespace-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate({ to: "/ai-director" });
                  }}
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  Try AI Director
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.button>

        {/* Pipeline CTA */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl cursor-pointer group w-full text-left"
          onClick={() => navigate({ to: "/pipeline" })}
          style={{
            background:
              "linear-gradient(135deg, oklch(0.10 0.010 240 / 0.85) 0%, oklch(0.09 0.005 275 / 0.8) 100%)",
            border: "1px solid oklch(0.65 0.14 240 / 0.25)",
          }}
        >
          {/* Border glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              boxShadow:
                "inset 0 0 0 1px oklch(0.65 0.14 240 / 0.45), 0 0 32px oklch(0.65 0.14 240 / 0.10)",
            }}
          />
          <div className="relative z-10 flex items-center gap-5 p-5 md:p-6">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{
                background: "oklch(0.65 0.14 240 / 0.15)",
                border: "1px solid oklch(0.65 0.14 240 / 0.35)",
                boxShadow: "0 0 20px oklch(0.65 0.14 240 / 0.15)",
              }}
            >
              <GitBranch
                className="w-6 h-6 md:w-7 md:h-7"
                style={{ color: "oklch(0.65 0.14 240)" }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="heading-cinematic text-base md:text-lg text-foreground">
                  Orchestration Pipeline
                </h3>
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.65 0.14 240 / 0.15)",
                    color: "oklch(0.65 0.14 240)",
                    border: "1px solid oklch(0.65 0.14 240 / 0.3)",
                  }}
                >
                  Architecture
                </span>
              </div>
              <p className="text-[12px] md:text-sm text-muted-foreground/60 leading-snug">
                See how your script moves through 7 AI stages to become a movie
                — with Runway ML, ElevenLabs, and FFmpeg integration slots.
              </p>
            </div>

            <div className="shrink-0 hidden sm:block">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  className="gap-2 text-xs whitespace-nowrap"
                  style={{
                    background: "oklch(0.65 0.14 240 / 0.18)",
                    border: "1px solid oklch(0.65 0.14 240 / 0.40)",
                    color: "oklch(0.75 0.12 240)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate({ to: "/pipeline" });
                  }}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Open Pipeline
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.button>

        {/* Recent projects */}
        {isAuthenticated && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="heading-cinematic text-xl text-foreground">
                  Recent Projects
                </h2>
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/projects" })}
                  className="text-muted-foreground/60 hover:text-foreground gap-1 text-xs"
                >
                  View All <ChevronRight className="w-3 h-3" />
                </Button>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    onClick={handleNewProject}
                    className="btn-gold gap-2 h-8 text-xs px-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Project
                  </Button>
                </motion.div>
              </div>
            </div>

            {projectsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["a", "b", "c", "d"] as const).map((key) => (
                  <div
                    key={key}
                    className="glass-panel rounded-xl overflow-hidden"
                  >
                    <Skeleton className="aspect-video bg-white/[0.04]" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-3.5 w-3/4 bg-white/[0.05]" />
                      <Skeleton className="h-2.5 w-1/2 bg-white/[0.03]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel rounded-2xl p-14 text-center"
              >
                <div className="w-16 h-16 rounded-2xl glass-panel mx-auto mb-5 flex items-center justify-center">
                  <Film className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h3 className="font-semibold text-base text-foreground/70 mb-1">
                  No projects yet
                </h3>
                <p className="text-muted-foreground/50 text-sm mb-6">
                  Create your first cinematic project
                </p>
                <Button onClick={handleNewProject} className="btn-gold gap-2">
                  <Plus className="w-4 h-4" />
                  Create Project
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentProjects.map((project, i) => (
                  <ProjectCard
                    key={project.title}
                    project={project}
                    index={i}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="pt-6 border-t border-white/[0.05] text-center text-[11px] text-muted-foreground/30">
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
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading: boolean;
  valueClass?: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-2.5 relative overflow-hidden">
      {/* Subtle bottom-right glow for depth */}
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-primary/5 blur-2xl rounded-full pointer-events-none" />
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="label-cinematic">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-14 bg-white/[0.06]" />
      ) : (
        <span className={`stat-value ${valueClass ?? "text-foreground"}`}>
          {value}
        </span>
      )}
    </div>
  );
}
