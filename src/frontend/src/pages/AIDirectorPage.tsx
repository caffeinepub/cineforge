import SceneStoryboard from "@/components/editor/SceneStoryboard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjectContext } from "@/contexts/ProjectContext";
import {
  type DirectorScene,
  type ScriptAnalysis,
  analyzeScript,
  generateDirectorScenePlan,
  getEmotionColor,
  getMusicMoodLabel,
} from "@/utils/scriptAnalysis";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Clapperboard,
  Crown,
  Film,
  Lightbulb,
  Mic,
  Music,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wand2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useState, useMemo, useEffect } from "react";

// ─── Style preset options ─────────────────────────────────────────────────────

interface StylePreset {
  id: string;
  label: string;
  icon: React.ReactNode;
  hint: string;
  scriptHint: string;
  colorClass: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "luxury-real-estate",
    label: "Luxury Real Estate",
    icon: <Crown className="w-3.5 h-3.5" />,
    hint: "Gold palette, aerial shots, exclusive tone",
    scriptHint: "luxury villa estate premium exclusive",
    colorClass: "oklch(0.76 0.12 88)",
  },
  {
    id: "corporate-premium",
    label: "Corporate Premium",
    icon: <Building2 className="w-3.5 h-3.5" />,
    hint: "Steel blue, authoritative, investor-grade",
    scriptHint: "investment portfolio ROI returns growth",
    colorClass: "oklch(0.65 0.10 240)",
  },
  {
    id: "dramatic-cinematic",
    label: "Dramatic Cinematic",
    icon: <Film className="w-3.5 h-3.5" />,
    hint: "Crimson accents, intense, bold narrative",
    scriptHint: "dark powerful dramatic intense bold",
    colorClass: "oklch(0.55 0.20 27)",
  },
  {
    id: "warm-documentary",
    label: "Warm Documentary",
    icon: <Users className="w-3.5 h-3.5" />,
    hint: "Amber tones, authentic, community-driven",
    scriptHint: "family home warm community welcoming neighborhood",
    colorClass: "oklch(0.72 0.15 60)",
  },
  {
    id: "investor-pitch",
    label: "High-End Investor Pitch",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    hint: "Epic visuals, stunning scale, premium impact",
    scriptHint: "extraordinary breathtaking legendary premium investment",
    colorClass: "oklch(0.70 0.18 50)",
  },
];

// ─── Circular gauge ───────────────────────────────────────────────────────────

function CircularGauge({ value, size = 80 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;

  const color =
    value >= 70
      ? "oklch(0.65 0.18 140)"
      : value >= 40
        ? "oklch(0.76 0.12 88)"
        : "oklch(0.62 0.22 27)";

  const label = value >= 70 ? "Strong" : value >= 40 ? "Good" : "Needs Work";

  return (
    <div className="relative flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        role="img"
        aria-label={`Hook score: ${value} out of 100`}
      >
        <title>Hook Score: {value}/100</title>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.20 0.005 275)"
          strokeWidth={6}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            transform: "rotate(90deg)",
            transformOrigin: `${size / 2}px ${size / 2}px`,
            fill: color,
            fontSize: "14px",
            fontWeight: 700,
            fontFamily: "Fraunces, serif",
          }}
        >
          {value}
        </text>
      </svg>
      <span
        className="text-[9px] font-semibold uppercase tracking-widest"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Emotion badge ────────────────────────────────────────────────────────────

const EMOTION_ICONS: Record<ScriptAnalysis["emotion"], React.ReactNode> = {
  luxury: <Crown className="w-3.5 h-3.5" />,
  dramatic: <Film className="w-3.5 h-3.5" />,
  warm: <Sparkles className="w-3.5 h-3.5" />,
  corporate: <Building2 className="w-3.5 h-3.5" />,
  mysterious: <Star className="w-3.5 h-3.5" />,
  epic: <Wand2 className="w-3.5 h-3.5" />,
};

const EMOTION_LABELS: Record<ScriptAnalysis["emotion"], string> = {
  luxury: "Luxury",
  dramatic: "Dramatic",
  warm: "Warm",
  corporate: "Corporate",
  mysterious: "Mysterious",
  epic: "Epic",
};

// ─── Keyword highlighter ──────────────────────────────────────────────────────

const HIGHLIGHT_WORDS = [
  "luxury",
  "premium",
  "exclusive",
  "estate",
  "villa",
  "penthouse",
  "mansion",
  "stunning",
  "breathtaking",
  "extraordinary",
  "invest",
  "returns",
  "portfolio",
  "family",
  "home",
  "community",
  "dramatic",
  "dark",
  "intense",
  "legendary",
];

function HighlightedText({ text }: { text: string }) {
  if (!text.trim())
    return (
      <span className="text-muted-foreground/30 italic text-xs">
        No keywords detected yet
      </span>
    );

  // Produce position-stable keys using offset + first chars so biome is satisfied
  const segments = text.split(/(\s+)/).map((word, i) => ({
    word,
    key: `p${i}${word.replace(/\W/g, "").slice(0, 4)}`,
  }));
  return (
    <span className="text-xs leading-relaxed">
      {segments.map(({ word, key }) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, "");
        const isHighlight = HIGHLIGHT_WORDS.includes(clean);
        return (
          <span
            key={key}
            className={
              isHighlight
                ? "text-primary font-semibold"
                : "text-muted-foreground/60"
            }
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type FlowStep = "input" | "analysis" | "storyboard" | "playing";

export default function AIDirectorPage() {
  const navigate = useNavigate();
  const {
    setGeneratedScenes,
    setDirectorScenes,
    setScriptAnalysis,
    setCurrentSceneIndex,
    setIsScenePlaying,
    setDirectorModeActive,
    musicEnabled,
    setMusicEnabled,
    musicVolume,
    setMusicVolume,
  } = useProjectContext();

  const [step, setStep] = useState<FlowStep>("input");
  const [script, setScript] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [luxuryOverride, setLuxuryOverride] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [directorScenes, setLocalDirectorScenes] = useState<DirectorScene[]>(
    [],
  );
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [splitMode] = useState<"line" | "sentence" | "paragraph">("sentence");

  // Auto-append style hint keywords
  const effectiveScript = useMemo(() => {
    if (!selectedStyle) return script;
    const preset = STYLE_PRESETS.find((p) => p.id === selectedStyle);
    if (!preset) return script;
    return script ? script : preset.scriptHint;
  }, [script, selectedStyle]);

  // Live keyword count
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedDurationSec = useMemo(() => {
    if (!directorScenes.length) return 0;
    return Math.round(
      directorScenes.reduce((sum, s) => sum + s.durationMs, 0) / 1000,
    );
  }, [directorScenes]);

  // Auto-analyze on input
  useEffect(() => {
    if (script.trim().length < 10) return;
    const timer = setTimeout(() => {
      const result = analyzeScript(script);
      setAnalysis(result);
    }, 600);
    return () => clearTimeout(timer);
  }, [script]);

  const handleAnalyze = () => {
    if (!script.trim()) return;
    const result = analyzeScript(effectiveScript);
    if (luxuryOverride !== null) result.luxuryLevel = luxuryOverride;
    setAnalysis(result);
    setStep("analysis");
  };

  const handleGenerateStoryboard = () => {
    if (!analysis || !script.trim()) return;
    const scenes = generateDirectorScenePlan(
      effectiveScript,
      analysis,
      splitMode,
    );
    setLocalDirectorScenes(scenes);
    setStep("storyboard");
  };

  const handleUpdateScenes = (updated: DirectorScene[]) => {
    setLocalDirectorScenes(updated);
  };

  const handleLaunchCinema = () => {
    if (!directorScenes.length || !analysis) return;

    // Push to project context so the editor's ScenePlayer can pick them up
    setDirectorScenes(directorScenes);
    setScriptAnalysis(analysis);
    setDirectorModeActive(true);

    // Also set as generatedScenes for compatibility with existing ScenePlayer
    setGeneratedScenes(
      directorScenes.map((s) => ({
        id: s.id,
        text: s.text,
        durationMs: s.durationMs,
        backgroundStyle: s.backgroundStyle,
      })),
    );
    setCurrentSceneIndex(0);
    setIsScenePlaying(true);

    // Navigate to editor with the director scenes
    navigate({ to: "/editor/new" });
  };

  const displayAnalysis = analysis
    ? { ...analysis, luxuryLevel: luxuryOverride ?? analysis.luxuryLevel }
    : null;

  const emotionColor = displayAnalysis
    ? getEmotionColor(displayAnalysis.emotion)
    : "oklch(0.76 0.12 88)";

  return (
    <div className="min-h-screen">
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: "180px" }}>
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 40% 0%, oklch(0.14 0.015 88 / 0.6) 0%, transparent 70%), radial-gradient(ellipse at 80% 100%, oklch(0.12 0.008 27 / 0.3) 0%, transparent 60%)",
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
              style={{ boxShadow: "0 0 24px oklch(0.76 0.12 88 / 0.3)" }}
            >
              <Clapperboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="heading-cinematic text-3xl md:text-4xl gold-gradient">
                AI Director Engine
              </h1>
              <p className="text-muted-foreground/60 text-sm mt-1 max-w-xl">
                Paste your script. The AI Director analyzes emotion, composes
                shot sequences, and generates a fully orchestrated cinematic
                scene plan.
              </p>
            </div>
          </motion.div>

          {/* Step indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mt-6"
          >
            {(["input", "analysis", "storyboard"] as FlowStep[]).map((s, i) => {
              const isActive = step === s;
              const isDone =
                ["input", "analysis", "storyboard"].indexOf(step) > i;
              return (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold font-mono transition-all duration-300"
                      style={{
                        background: isActive
                          ? "oklch(0.76 0.12 88)"
                          : isDone
                            ? "oklch(0.76 0.12 88 / 0.3)"
                            : "oklch(0.18 0.003 275)",
                        color: isActive
                          ? "oklch(0.07 0 0)"
                          : isDone
                            ? "oklch(0.76 0.12 88)"
                            : "oklch(0.50 0 0)",
                        boxShadow: isActive
                          ? "0 0 12px oklch(0.76 0.12 88 / 0.5)"
                          : "none",
                      }}
                    >
                      {isDone ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span
                      className="text-[11px] font-semibold capitalize hidden sm:block"
                      style={{
                        color: isActive
                          ? "oklch(0.76 0.12 88)"
                          : "oklch(0.45 0 0)",
                      }}
                    >
                      {s === "input"
                        ? "Script"
                        : s === "analysis"
                          ? "Analysis"
                          : "Storyboard"}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className="h-px flex-1 max-w-[40px] transition-all duration-500"
                      style={{
                        background: isDone
                          ? "oklch(0.76 0.12 88 / 0.5)"
                          : "oklch(0.22 0.003 275)",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="px-6 md:px-10 pb-16 space-y-6">
        {/* ── STEP 1: Script Input ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="glass-panel rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{
                background:
                  step === "input"
                    ? "oklch(0.76 0.12 88)"
                    : "oklch(0.76 0.12 88 / 0.3)",
                color: "oklch(0.07 0 0)",
              }}
            >
              1
            </span>
            <h2 className="heading-cinematic text-lg text-foreground">
              Script Input
            </h2>
          </div>

          {/* Style presets */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest font-semibold">
              Style Direction
            </p>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((preset) => {
                const isSelected = selectedStyle === preset.id;
                return (
                  <TooltipProvider key={preset.id} delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            setSelectedStyle(isSelected ? null : preset.id)
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-200"
                          style={{
                            background: isSelected
                              ? `${preset.colorClass}18`
                              : "oklch(0.12 0.003 275 / 0.6)",
                            borderColor: isSelected
                              ? `${preset.colorClass}66`
                              : "oklch(0.22 0.005 275)",
                            color: isSelected
                              ? preset.colorClass
                              : "oklch(0.55 0 0)",
                            boxShadow: isSelected
                              ? `0 0 12px ${preset.colorClass}28`
                              : "none",
                          }}
                        >
                          <span
                            style={{
                              color: isSelected ? preset.colorClass : "inherit",
                            }}
                          >
                            {preset.icon}
                          </span>
                          {preset.label}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[10px]">
                        {preset.hint}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>

          {/* Script textarea */}
          <div className="space-y-2">
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste your script here. The AI Director will analyze emotion, luxury level, shot types, and compose a complete cinematic scene plan..."
              rows={8}
              className="resize-none bg-muted/20 border-border/50 text-sm leading-relaxed placeholder:text-muted-foreground/25 focus:border-primary/40 focus:bg-muted/30 transition-colors font-body min-h-[200px]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/40 font-mono">
                {wordCount} words · {script.trim().length} chars
              </span>
              {analysis && (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: emotionColor }}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: emotionColor }}
                  >
                    {EMOTION_LABELS[analysis.emotion]} detected
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Analyze button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleAnalyze}
              disabled={!script.trim()}
              className="btn-gold gap-2.5 w-full sm:w-auto px-8 text-sm disabled:opacity-40"
            >
              <Wand2 className="w-4 h-4" />
              Analyze Script
            </Button>
          </motion.div>
        </motion.div>

        {/* ── STEP 2: Analysis Panel ──────────────────────────────────────── */}
        <AnimatePresence>
          {step !== "input" && displayAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel-elevated rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: "oklch(0.76 0.12 88)",
                    color: "oklch(0.07 0 0)",
                  }}
                >
                  2
                </span>
                <h2 className="heading-cinematic text-lg text-foreground">
                  AI Director Analysis
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Emotion + Luxury + Personas + Hook */}
                <div className="space-y-4">
                  {/* Emotion + mood */}
                  <div className="flex items-start gap-4">
                    {/* Large emotion badge */}
                    <div
                      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border shrink-0"
                      style={{
                        background: `${emotionColor}12`,
                        borderColor: `${emotionColor}44`,
                      }}
                    >
                      <span style={{ color: emotionColor }}>
                        {EMOTION_ICONS[displayAnalysis.emotion]}
                      </span>
                      <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: emotionColor }}
                      >
                        {EMOTION_LABELS[displayAnalysis.emotion]}
                      </span>
                    </div>

                    {/* Mood description + time of day */}
                    <div className="flex-1">
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {displayAnalysis.moodTone}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-semibold">
                          Time of Day:
                        </span>
                        <span
                          className="text-[10px] font-semibold capitalize"
                          style={{ color: emotionColor }}
                        >
                          {displayAnalysis.timeOfDay.replace("-", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Music className="w-3 h-3 text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground/50">
                          {getMusicMoodLabel(
                            displayAnalysis.emotion === "luxury"
                              ? "luxury-ambient"
                              : displayAnalysis.emotion === "dramatic"
                                ? "dramatic-swell"
                                : displayAnalysis.emotion === "corporate"
                                  ? "epic-rise"
                                  : displayAnalysis.emotion === "warm"
                                    ? "warm-resolve"
                                    : displayAnalysis.emotion === "epic"
                                      ? "epic-rise"
                                      : "tension-build",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Luxury intensity slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground/60 font-semibold uppercase tracking-widest">
                        Luxury Intensity
                      </span>
                      <span
                        className="text-sm font-bold font-mono"
                        style={{ color: emotionColor }}
                      >
                        {displayAnalysis.luxuryLevel}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[displayAnalysis.luxuryLevel]}
                      onValueChange={([v]) => setLuxuryOverride(v)}
                      className="h-3"
                      aria-label="Luxury intensity"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground/30 font-mono">
                      <span>SUBTLE</span>
                      <span>PREMIUM</span>
                      <span>ULTRA LUXURY</span>
                    </div>
                  </div>

                  {/* Persona tags */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground/50 font-semibold uppercase tracking-widest">
                        Buyer Personas
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {displayAnalysis.personaTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                          style={{
                            background: `${emotionColor}10`,
                            borderColor: `${emotionColor}33`,
                            color: emotionColor,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hook score */}
                  <div className="flex items-center gap-4">
                    <CircularGauge
                      value={displayAnalysis.hookScore}
                      size={72}
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground/80">
                        Psychological Hook Score
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5 leading-snug">
                        Based on power words,
                        <br />
                        emotional triggers, and opening impact
                      </p>
                    </div>
                  </div>

                  {/* Hook suggestions */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSuggestionsOpen((v) => !v)}
                      className="flex items-center justify-between w-full group"
                    >
                      <div className="flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3 text-primary/70" />
                        <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
                          Script Enhancement Tips
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3 h-3 text-muted-foreground/40 transition-transform ${suggestionsOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {suggestionsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-1.5 overflow-hidden"
                        >
                          {displayAnalysis.hookSuggestions.map((tip, i) => (
                            <motion.div
                              key={tip}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-start gap-2 p-2 rounded-lg"
                              style={{
                                background: "oklch(0.15 0.005 88 / 0.4)",
                                border: "1px solid oklch(0.76 0.12 88 / 0.12)",
                              }}
                            >
                              <AlertCircle className="w-3 h-3 text-primary/60 mt-px shrink-0" />
                              <span className="text-[10px] text-foreground/70 leading-snug">
                                {tip}
                              </span>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right: Keywords + stats */}
                <div className="space-y-4">
                  {/* Keyword highlight */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                        Detected Keywords
                      </span>
                    </div>
                    <div
                      className="rounded-lg p-3 leading-relaxed max-h-32 overflow-y-auto"
                      style={{
                        background: "oklch(0.10 0.002 275 / 0.6)",
                        border: "1px solid oklch(0.22 0.005 275)",
                      }}
                    >
                      <HighlightedText text={script.slice(0, 300)} />
                      {script.length > 300 && (
                        <span className="text-muted-foreground/30 text-[10px]">
                          {" "}
                          …
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Words", value: wordCount.toString() },
                      {
                        label: "Est. Duration",
                        value:
                          estimatedDurationSec > 0
                            ? `${estimatedDurationSec}s`
                            : "—",
                      },
                      {
                        label: "Scenes",
                        value:
                          directorScenes.length > 0
                            ? directorScenes.length.toString()
                            : "—",
                      },
                      {
                        label: "Hook Score",
                        value: `${displayAnalysis.hookScore}/100`,
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg p-2.5"
                        style={{
                          background: "oklch(0.12 0.003 275 / 0.5)",
                          border: "1px solid oklch(0.22 0.005 275)",
                        }}
                      >
                        <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-semibold">
                          {stat.label}
                        </p>
                        <p
                          className="text-base font-bold font-display"
                          style={{ color: emotionColor }}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Music settings preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3 h-3 text-muted-foreground/40" />
                        <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                          Cinematic Music
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMusicEnabled(!musicEnabled)}
                        className={`relative w-8 h-4 rounded-full transition-colors ${musicEnabled ? "bg-primary" : "bg-muted/40"}`}
                      >
                        <span
                          className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform"
                          style={{ left: musicEnabled ? "18px" : "2px" }}
                        />
                      </button>
                    </div>
                    {musicEnabled && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground/40">
                            Volume
                          </span>
                          <span className="text-[10px] font-mono text-primary/70">
                            {Math.round(musicVolume * 100)}%
                          </span>
                        </div>
                        <Slider
                          min={0}
                          max={1}
                          step={0.05}
                          value={[musicVolume]}
                          onValueChange={([v]) => setMusicVolume(v)}
                          className="h-3"
                        />
                      </div>
                    )}
                  </div>

                  {/* Voice summary */}
                  <div
                    className="rounded-lg p-3 space-y-1"
                    style={{
                      background: "oklch(0.12 0.003 275 / 0.5)",
                      border: "1px solid oklch(0.22 0.005 275)",
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Mic className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                        Recommended Voice
                      </span>
                    </div>
                    {[
                      {
                        label: "Style",
                        value:
                          displayAnalysis.emotion === "luxury" ||
                          displayAnalysis.emotion === "epic"
                            ? "Luxury Premium"
                            : displayAnalysis.emotion === "corporate"
                              ? "Corporate Investor"
                              : displayAnalysis.emotion === "dramatic" ||
                                  displayAnalysis.emotion === "mysterious"
                                ? "Dramatic Trailer"
                                : "Warm Documentary",
                      },
                      {
                        label: "Tone",
                        value: displayAnalysis.moodTone.split("—")[0].trim(),
                      },
                      {
                        label: "Pace",
                        value:
                          displayAnalysis.luxuryLevel > 70
                            ? "Slow & Deliberate"
                            : displayAnalysis.luxuryLevel > 40
                              ? "Measured & Confident"
                              : "Natural & Warm",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[9px] text-muted-foreground/40 font-semibold uppercase tracking-widest">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-foreground/70 font-medium">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate storyboard button */}
              <div className="flex gap-3 pt-2">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleGenerateStoryboard}
                    className="btn-gold gap-2.5 px-8 text-sm"
                  >
                    <Film className="w-4 h-4" />
                    Generate Scene Plan
                  </Button>
                </motion.div>
                <Button
                  variant="outline"
                  onClick={() => setStep("input")}
                  className="gap-2 text-sm border-border/40 text-muted-foreground/60 hover:text-foreground"
                >
                  Edit Script
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STEP 3: Storyboard ──────────────────────────────────────────── */}
        <AnimatePresence>
          {step === "storyboard" && directorScenes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: "oklch(0.76 0.12 88)",
                    color: "oklch(0.07 0 0)",
                  }}
                >
                  3
                </span>
                <h2 className="heading-cinematic text-lg text-foreground">
                  Director's Scene Plan
                </h2>
              </div>

              <SceneStoryboard
                scenes={directorScenes}
                onLaunch={handleLaunchCinema}
                onUpdateScenes={handleUpdateScenes}
              />
            </motion.div>
          )}
        </AnimatePresence>
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
