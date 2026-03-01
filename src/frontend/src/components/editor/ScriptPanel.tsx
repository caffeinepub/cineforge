import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  GeneratedScene,
  LocalTextOverlay,
} from "@/contexts/ProjectContext";
import { useProjectContext } from "@/contexts/ProjectContext";
import {
  analyzeScript,
  generateDirectorScenePlan,
  getEmotionColor,
} from "@/utils/scriptAnalysis";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Film,
  Lightbulb,
  Mic,
  Music,
  Square,
  Video,
  Wand2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SegmentMode = "line" | "sentence" | "paragraph";
type VoiceStyle = "standard" | "cinematic" | "energetic";

interface VoiceStyleOption {
  value: VoiceStyle;
  label: string;
  description: string;
  rate: number;
  pitch: number;
}

const VOICE_STYLES: VoiceStyleOption[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Natural balanced delivery",
    rate: 0.95,
    pitch: 1.0,
  },
  {
    value: "cinematic",
    label: "Cinematic",
    description: "Slow, dramatic narration",
    rate: 0.8,
    pitch: 0.9,
  },
  {
    value: "energetic",
    label: "Energetic",
    description: "Upbeat, punchy delivery",
    rate: 1.15,
    pitch: 1.1,
  },
];

function splitText(text: string, mode: SegmentMode): string[] {
  let raw: string[];
  switch (mode) {
    case "line":
      raw = text.split("\n");
      break;
    case "sentence":
      raw = text.split(/[.!?]+/);
      break;
    case "paragraph":
      raw = text.split(/\n\s*\n/);
      break;
  }
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function calcDurationMs(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2500, wordCount * 200 + 1000);
}

const PRESET_BACKGROUNDS: Record<string, string> = {
  "moody-drama": "deep-purple-black",
  "dark-thriller": "red-black",
  "warm-documentary": "amber-black",
  "vintage-film": "sepia-dark",
  "high-contrast": "pure-black",
  none: "cinematic-default",
};

const SEGMENT_MODE_OPTIONS: { value: SegmentMode; label: string }[] = [
  { value: "line", label: "By Line" },
  { value: "sentence", label: "By Sentence" },
  { value: "paragraph", label: "By Paragraph" },
];

export default function ScriptPanel() {
  const {
    addTextOverlay,
    activePreset,
    isScenePlaying,
    setGeneratedScenes,
    setCurrentSceneIndex,
    setIsScenePlaying,
    ttsVoice,
    setTtsVoice,
    ttsRate,
    setTtsRate,
    ttsPitch,
    setTtsPitch,
    ttsVolume,
    setTtsVolume,
    setDirectorScenes,
    setScriptAnalysis,
    musicEnabled,
    setMusicEnabled,
    musicVolume,
    setMusicVolume,
    directorModeActive,
    setDirectorModeActive,
  } = useProjectContext();

  const [script, setScript] = useState("");
  const [mode, setMode] = useState<SegmentMode>("sentence");
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(true);
  const [musicSettingsOpen, setMusicSettingsOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [hasTts, setHasTts] = useState(true);
  const [activeVoiceStyle, setActiveVoiceStyle] =
    useState<VoiceStyle>("standard");

  // Live analysis
  const liveAnalysis = useMemo(() => {
    if (script.trim().length < 10) return null;
    return analyzeScript(script);
  }, [script]);

  const segments = useMemo(() => splitText(script, mode), [script, mode]);

  // Load TTS voices
  const loadVoices = useCallback(() => {
    if (!window.speechSynthesis) {
      setHasTts(false);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      setAvailableVoices(voices);
      // Default to first English voice if none selected
      if (!ttsVoice) {
        const enVoice = voices.find((v) => v.lang.startsWith("en"));
        if (enVoice) setTtsVoice(enVoice.name);
      }
    }
  }, [ttsVoice, setTtsVoice]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setHasTts(false);
      return;
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [loadVoices]);

  const handleVoiceStyleChange = (style: VoiceStyle) => {
    setActiveVoiceStyle(style);
    const opt = VOICE_STYLES.find((s) => s.value === style);
    if (opt) {
      setTtsRate(opt.rate);
      setTtsPitch(opt.pitch);
    }
  };

  const handlePreviewVoice = () => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech not available in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "Welcome to CineForge. Your cinematic story begins here.",
    );
    utterance.rate = ttsRate;
    utterance.pitch = ttsPitch;
    utterance.volume = ttsVolume;
    if (ttsVoice) {
      const voice = availableVoices.find((v) => v.name === ttsVoice);
      if (voice) utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
    toast.success("Voice preview playing…");
  };

  const handleGenerateCinematicVideo = () => {
    if (segments.length === 0) {
      toast.error("Paste some script text first");
      return;
    }

    if (directorModeActive && liveAnalysis) {
      // Director mode: use AI-generated scene plan
      const analysis = liveAnalysis;
      const dirScenes = generateDirectorScenePlan(script, analysis, mode);
      setDirectorScenes(dirScenes);
      setScriptAnalysis(analysis);

      // Also set as generatedScenes for base compatibility
      const genScenes: GeneratedScene[] = dirScenes.map((s) => ({
        id: s.id,
        text: s.text,
        durationMs: s.durationMs,
        backgroundStyle: s.backgroundStyle,
      }));
      setGeneratedScenes(genScenes);
      setCurrentSceneIndex(0);
      setIsScenePlaying(true);

      toast.success(
        `🎬 AI Director generating ${dirScenes.length} cinematic scene${dirScenes.length !== 1 ? "s" : ""}…`,
      );
    } else {
      const bgStyle = PRESET_BACKGROUNDS[activePreset] ?? "cinematic-default";

      const scenes: GeneratedScene[] = segments.map((text, i) => ({
        id: `scene-${Date.now()}-${i}`,
        text,
        durationMs: calcDurationMs(text),
        backgroundStyle: bgStyle,
      }));

      setGeneratedScenes(scenes);
      setCurrentSceneIndex(0);
      setIsScenePlaying(true);

      if (!hasTts) {
        toast.warning(
          `Visual slideshow starting (${scenes.length} scenes) — TTS not available in this browser`,
        );
      } else {
        toast.success(
          `🎬 Generating cinematic video with ${scenes.length} scene${scenes.length !== 1 ? "s" : ""}…`,
        );
      }
    }
  };

  const handleRecordSceneToVideo = () => {
    handleGenerateCinematicVideo();
    toast.info(
      "Scene playback started — use your browser's screen recording (or OBS) to capture the cinematic video.",
      { duration: 6000 },
    );
  };

  const handleStopPlayback = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsScenePlaying(false);
    setGeneratedScenes([]);
    toast("Playback stopped");
  };

  const handleAddAsOverlays = () => {
    if (segments.length === 0) {
      toast.error("Paste some script text first");
      return;
    }
    const count = segments.length;
    const yStep = count === 1 ? 0 : 80 / (count - 1);
    segments.forEach((text, i) => {
      const overlay: LocalTextOverlay = {
        id: `script-${Date.now()}-${i}`,
        text,
        xPercent: 10,
        yPercent: count === 1 ? 50 : 10 + i * yStep,
        color: "#ffffff",
        fontSize: BigInt(28),
        fontFamily: "sans-serif",
      };
      addTextOverlay(overlay);
    });
    toast.success(
      `Added ${count} text overlay${count !== 1 ? "s" : ""} from script`,
    );
    setScript("");
  };

  return (
    <ScrollArea className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col gap-3 pb-2"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Script
          </span>
          <div className="flex items-center gap-2">
            {/* Director Mode toggle */}
            <div className="flex items-center gap-1.5">
              <Film className="w-3 h-3 text-primary/60" />
              <span className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider hidden">
                Director
              </span>
              <Switch
                checked={directorModeActive}
                onCheckedChange={setDirectorModeActive}
                className="scale-75"
              />
            </div>
            <Clapperboard className="w-3 h-3 text-muted-foreground/40" />
          </div>
        </div>

        {/* Director Mode badge */}
        {directorModeActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md overflow-hidden"
            style={{
              background: "oklch(0.76 0.12 88 / 0.08)",
              border: "1px solid oklch(0.76 0.12 88 / 0.25)",
            }}
          >
            <Film className="w-2.5 h-2.5 text-primary shrink-0" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
              AI Director Mode Active
            </span>
          </motion.div>
        )}

        {/* ── Voice Settings (collapsible) ─────────────────────────────── */}
        <div className="rounded-lg border border-border/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setVoiceSettingsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-2.5 py-2 bg-muted/10 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Mic className="w-3 h-3 text-primary/60" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Voice Settings
              </span>
            </div>
            {voiceSettingsOpen ? (
              <ChevronUp className="w-3 h-3 text-muted-foreground/40" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {voiceSettingsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-2.5 py-2.5 space-y-3 border-t border-border/30">
                  {!hasTts && (
                    <p className="text-[10px] text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-1.5 leading-snug">
                      TTS not available — visual playback only
                    </p>
                  )}

                  {/* Voice Style preset selector */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">
                      Voice Style
                    </Label>
                    <div className="grid grid-cols-3 gap-1">
                      {VOICE_STYLES.map((style) => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => handleVoiceStyleChange(style.value)}
                          className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-md border text-center transition-colors ${
                            activeVoiceStyle === style.value
                              ? "bg-primary/20 border-primary/50 text-primary"
                              : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                          }`}
                        >
                          <span className="text-[9px] font-bold tracking-wide">
                            {style.label}
                          </span>
                          <span className="text-[8px] opacity-60 leading-tight">
                            {style.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voice selector */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Voice
                    </Label>
                    {availableVoices.length > 0 ? (
                      <Select value={ttsVoice} onValueChange={setTtsVoice}>
                        <SelectTrigger className="h-7 text-[10px] bg-muted/20 border-border/40 focus:border-primary/40">
                          <SelectValue placeholder="Select voice…" />
                        </SelectTrigger>
                        <SelectContent className="max-h-44">
                          {availableVoices.map((v) => (
                            <SelectItem
                              key={v.name}
                              value={v.name}
                              className="text-[10px] py-1"
                            >
                              {v.name} ({v.lang})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-7 flex items-center px-2 rounded-md bg-muted/10 border border-border/30">
                        <span className="text-[10px] text-muted-foreground/50">
                          Loading voices…
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Speed slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] text-muted-foreground">
                        Speed
                      </Label>
                      <span className="text-[10px] font-mono text-primary/80">
                        {ttsRate.toFixed(2)}×
                      </span>
                    </div>
                    <Slider
                      min={0.5}
                      max={2.0}
                      step={0.05}
                      value={[ttsRate]}
                      onValueChange={([v]) => {
                        setTtsRate(v);
                        setActiveVoiceStyle("standard"); // manual override
                      }}
                      className="h-3"
                    />
                  </div>

                  {/* Pitch slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] text-muted-foreground">
                        Pitch
                      </Label>
                      <span className="text-[10px] font-mono text-primary/80">
                        {ttsPitch.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      value={[ttsPitch]}
                      onValueChange={([v]) => {
                        setTtsPitch(v);
                        setActiveVoiceStyle("standard"); // manual override
                      }}
                      className="h-3"
                    />
                  </div>

                  {/* Volume slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] text-muted-foreground">
                        Volume
                      </Label>
                      <span className="text-[10px] font-mono text-primary/80">
                        {Math.round(ttsVolume * 100)}%
                      </span>
                    </div>
                    <Slider
                      min={0.05}
                      max={1.0}
                      step={0.05}
                      value={[ttsVolume]}
                      onValueChange={([v]) => setTtsVolume(v)}
                      className="h-3"
                    />
                  </div>

                  {/* Preview voice */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePreviewVoice}
                    disabled={!hasTts}
                    className="w-full h-7 gap-1.5 text-[10px] border-border/40 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:text-foreground"
                  >
                    <Mic className="w-3 h-3" />
                    Preview Voice
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── AI Director Analysis (live) ───────────────────────────────── */}
        <AnimatePresence>
          {directorModeActive && liveAnalysis && script.trim().length > 10 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-lg border border-primary/20"
            >
              <button
                type="button"
                onClick={() => setAnalysisOpen((v) => !v)}
                className="w-full flex items-center justify-between px-2.5 py-2 bg-primary/[0.06] hover:bg-primary/[0.10] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Wand2 className="w-3 h-3 text-primary/70" />
                  <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider">
                    AI Director Analysis
                  </span>
                </div>
                {analysisOpen ? (
                  <ChevronUp className="w-3 h-3 text-primary/40" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-primary/40" />
                )}
              </button>
              <AnimatePresence initial={false}>
                {analysisOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2.5 py-2 space-y-2 border-t border-primary/15">
                      {/* Emotion + luxury */}
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border"
                          style={{
                            color: getEmotionColor(liveAnalysis.emotion),
                            borderColor: `${getEmotionColor(liveAnalysis.emotion)}44`,
                            background: `${getEmotionColor(liveAnalysis.emotion)}10`,
                          }}
                        >
                          {liveAnalysis.emotion}
                        </span>
                        <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${liveAnalysis.luxuryLevel}%`,
                              background: getEmotionColor(liveAnalysis.emotion),
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground/50">
                          {liveAnalysis.luxuryLevel}
                        </span>
                      </div>

                      {/* Persona tags */}
                      <div className="flex flex-wrap gap-1">
                        {liveAnalysis.personaTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[8px] px-1.5 py-0.5 rounded-full border text-muted-foreground/60"
                            style={{ borderColor: "oklch(0.30 0.005 275)" }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Hook score */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-semibold">
                          Hook:
                        </span>
                        <span
                          className="text-[10px] font-bold font-mono"
                          style={{
                            color:
                              liveAnalysis.hookScore >= 70
                                ? "oklch(0.65 0.18 140)"
                                : liveAnalysis.hookScore >= 40
                                  ? "oklch(0.76 0.12 88)"
                                  : "oklch(0.62 0.22 27)",
                          }}
                        >
                          {liveAnalysis.hookScore}/100
                        </span>
                      </div>

                      {/* Suggestions */}
                      {liveAnalysis.hookSuggestions.slice(0, 2).map((tip) => (
                        <div key={tip} className="flex items-start gap-1">
                          <Lightbulb className="w-2.5 h-2.5 text-primary/50 mt-px shrink-0" />
                          <span className="text-[8px] text-muted-foreground/50 leading-snug">
                            {tip}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Music Settings ───────────────────────────────────────────── */}
        <div className="rounded-lg border border-border/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setMusicSettingsOpen((v) => !v)}
            className="w-full flex items-center justify-between px-2.5 py-2 bg-muted/10 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Music className="w-3 h-3 text-primary/60" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Music
              </span>
              <span
                className={`text-[8px] px-1 py-0.5 rounded font-bold ${musicEnabled ? "text-primary/80 bg-primary/10" : "text-muted-foreground/40 bg-muted/10"}`}
              >
                {musicEnabled ? "ON" : "OFF"}
              </span>
            </div>
            {musicSettingsOpen ? (
              <ChevronUp className="w-3 h-3 text-muted-foreground/40" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {musicSettingsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-2.5 py-2.5 space-y-2.5 border-t border-border/30">
                  {/* Music on/off toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground">
                      Cinematic Music
                    </Label>
                    <Switch
                      checked={musicEnabled}
                      onCheckedChange={setMusicEnabled}
                      className="scale-75"
                    />
                  </div>

                  {/* Volume */}
                  {musicEnabled && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground">
                          Music Volume
                        </Label>
                        <span className="text-[10px] font-mono text-primary/80">
                          {Math.round(musicVolume * 100)}%
                        </span>
                      </div>
                      <Slider
                        min={0.05}
                        max={1.0}
                        step={0.05}
                        value={[musicVolume]}
                        onValueChange={([v]) => setMusicVolume(v)}
                        className="h-3"
                      />
                    </div>
                  )}

                  {!musicEnabled && (
                    <p className="text-[9px] text-muted-foreground/40 italic">
                      Enable to add ambient cinematic music to scenes
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Script Input ─────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Split Mode
          </Label>
          <div className="flex gap-1">
            {SEGMENT_MODE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex-1 text-[9px] py-1 px-1 rounded-md border transition-colors font-semibold ${
                  mode === value
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-muted/10 border-border/40 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Script Text
          </Label>
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your cinematic script here…"
            rows={6}
            className="resize-none bg-muted/20 border-border/50 text-xs leading-relaxed placeholder:text-muted-foreground/30 focus:border-primary/40 focus:bg-muted/30 transition-colors"
          />
          <p className="text-[10px] text-muted-foreground/50 tabular-nums">
            {script.trim().length === 0
              ? "Paste script to preview segments"
              : `${segments.length} scene${segments.length !== 1 ? "s" : ""} · ~${Math.round(segments.reduce((sum, s) => sum + calcDurationMs(s), 0) / 1000)}s total`}
          </p>
        </div>

        {/* ── Segment preview list ─────────────────────────────────────── */}
        <AnimatePresence>
          {segments.length > 0 && !isScenePlaying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1 overflow-hidden"
            >
              <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider font-semibold">
                Scenes Preview
              </p>
              <div className="space-y-0.5">
                {segments.slice(0, 5).map((seg, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable preview list
                    key={i}
                    className="flex items-start gap-1.5 p-1.5 rounded-md bg-muted/10 border border-border/30"
                  >
                    <span className="text-[9px] text-primary/50 font-mono mt-px shrink-0 w-4 text-right font-semibold">
                      {i + 1}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 leading-snug line-clamp-2">
                      {seg}
                    </span>
                  </div>
                ))}
                {segments.length > 5 && (
                  <p className="text-[9px] text-muted-foreground/40 text-center py-0.5">
                    +{segments.length - 5} more scenes
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action Buttons ───────────────────────────────────────────── */}
        <div className="space-y-2">
          {isScenePlaying ? (
            <Button
              size="sm"
              onClick={handleStopPlayback}
              className="w-full gap-2 text-xs bg-red-900/60 hover:bg-red-900/80 text-red-200 border border-red-700/40"
            >
              <Square className="w-3.5 h-3.5" />
              Stop Playback
            </Button>
          ) : (
            <>
              {/* Primary: Generate Cinematic Video */}
              <Button
                size="sm"
                onClick={handleGenerateCinematicVideo}
                disabled={segments.length === 0}
                className="btn-gold w-full gap-2 text-xs disabled:opacity-40"
              >
                {directorModeActive ? (
                  <Film className="w-3.5 h-3.5" />
                ) : (
                  <Clapperboard className="w-3.5 h-3.5" />
                )}
                {directorModeActive
                  ? "Generate with AI Director"
                  : "Generate Cinematic Video"}
              </Button>

              {/* Record Scene to Video */}
              {segments.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRecordSceneToVideo}
                  className="w-full gap-2 text-[10px] border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary/80 hover:text-primary transition-colors"
                >
                  <Video className="w-3 h-3" />
                  Record Scene to Video
                </Button>
              )}

              {/* Secondary: Add as Text Overlays */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddAsOverlays}
                disabled={segments.length === 0}
                className="w-full gap-2 text-[10px] border-border/40 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <Wand2 className="w-3 h-3" />
                Add as Text Overlays
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </ScrollArea>
  );
}
