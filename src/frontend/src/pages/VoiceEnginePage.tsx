import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  Download,
  Mic,
  Pause,
  Play,
  Square,
  User,
  Volume2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type VoiceProfile = "male-luxury" | "female-premium" | "corporate" | "dramatic";
type EmotionalTone =
  | "dramatic"
  | "soft"
  | "neutral"
  | "intense"
  | "warm"
  | "authoritative";
type Accent = "american" | "british" | "australian" | "indian" | "european";
type PlaybackStatus = "idle" | "speaking" | "paused";

interface VoiceProfileConfig {
  id: VoiceProfile;
  label: string;
  description: string;
  icon: string;
  basePitch: number;
  baseRate: number;
  voiceHints: string[];
}

interface ToneAdjustment {
  rateOffset: number;
  pitchOffset: number;
  volumeMultiplier: number;
}

interface ScriptSegment {
  text: string;
  tag: "normal" | "dramatic" | "soft" | "[pause]";
}

// ─── Voice Profile Configs ───────────────────────────────────────────────────

const VOICE_PROFILES: VoiceProfileConfig[] = [
  {
    id: "male-luxury",
    label: "Male Luxury",
    description: "Deep · Slow · Dramatic",
    icon: "🎙",
    basePitch: 0.8,
    baseRate: 0.9,
    voiceHints: [
      "Google UK English Male",
      "Daniel",
      "Arthur",
      "Microsoft David",
      "Alex",
    ],
  },
  {
    id: "female-premium",
    label: "Female Premium",
    description: "Smooth · Warm · Elegant",
    icon: "✨",
    basePitch: 1.1,
    baseRate: 0.95,
    voiceHints: [
      "Google UK English Female",
      "Samantha",
      "Karen",
      "Microsoft Zira",
      "Victoria",
    ],
  },
  {
    id: "corporate",
    label: "Corporate Investor",
    description: "Neutral · Authoritative",
    icon: "💼",
    basePitch: 1.0,
    baseRate: 1.0,
    voiceHints: ["Google US English", "Alex", "Fred", "Microsoft Mark", "Tom"],
  },
  {
    id: "dramatic",
    label: "Dramatic Trailer",
    description: "Intense · Deep · Cinematic",
    icon: "🎬",
    basePitch: 0.7,
    baseRate: 0.85,
    voiceHints: [
      "Google UK English Male",
      "Daniel",
      "Arthur",
      "Alex",
      "Thomas",
    ],
  },
];

// ─── Tone adjustments ────────────────────────────────────────────────────────

const TONE_ADJUSTMENTS: Record<EmotionalTone, ToneAdjustment> = {
  dramatic: { rateOffset: -0.15, pitchOffset: -0.1, volumeMultiplier: 1.0 },
  soft: { rateOffset: -0.1, pitchOffset: 0.15, volumeMultiplier: 0.8 },
  neutral: { rateOffset: 0, pitchOffset: 0, volumeMultiplier: 1.0 },
  intense: { rateOffset: 0.1, pitchOffset: 0.05, volumeMultiplier: 1.0 },
  warm: { rateOffset: -0.05, pitchOffset: 0.1, volumeMultiplier: 0.95 },
  authoritative: {
    rateOffset: -0.05,
    pitchOffset: -0.05,
    volumeMultiplier: 1.0,
  },
};

const TONES: { id: EmotionalTone; label: string; color: string }[] = [
  { id: "dramatic", label: "Dramatic", color: "oklch(0.70 0.18 45)" },
  { id: "soft", label: "Soft", color: "oklch(0.65 0.15 230)" },
  { id: "neutral", label: "Neutral", color: "oklch(0.55 0.00 0)" },
  { id: "intense", label: "Intense", color: "oklch(0.62 0.22 27)" },
  { id: "warm", label: "Warm", color: "oklch(0.75 0.15 60)" },
  {
    id: "authoritative",
    label: "Authoritative",
    color: "oklch(0.65 0.18 300)",
  },
];

const ACCENTS: { id: Accent; label: string; flag: string }[] = [
  { id: "american", label: "American", flag: "🇺🇸" },
  { id: "british", label: "British", flag: "🇬🇧" },
  { id: "australian", label: "Australian", flag: "🇦🇺" },
  { id: "indian", label: "Indian", flag: "🇮🇳" },
  { id: "european", label: "European", flag: "🇪🇺" },
];

// Accent → voice name keyword hints
const ACCENT_VOICE_HINTS: Record<Accent, string[]> = {
  american: ["US English", "American", "Alex", "Samantha", "Microsoft"],
  british: ["UK English", "British", "Daniel", "Arthur", "Kate"],
  australian: ["Australian", "Karen", "Lee"],
  indian: ["Indian", "Rishi", "Lekha"],
  european: ["French", "German", "Spanish", "Italian", "Google"],
};

// ─── Script parser ────────────────────────────────────────────────────────────

function parseScript(script: string): ScriptSegment[] {
  const TAG_RE = /(\[dramatic\]|\[soft tone\]|\[pause\])/gi;
  const parts = script.split(TAG_RE);
  const segments: ScriptSegment[] = [];

  let currentTag: ScriptSegment["tag"] = "normal";

  for (const part of parts) {
    const lower = part.toLowerCase().trim();
    if (lower === "[dramatic]") {
      currentTag = "dramatic";
    } else if (lower === "[soft tone]") {
      currentTag = "soft";
    } else if (lower === "[pause]") {
      segments.push({ text: "", tag: "[pause]" });
      currentTag = "normal";
    } else if (part.trim()) {
      segments.push({ text: part, tag: currentTag });
      currentTag = "normal";
    }
  }

  return segments.filter(
    (s) => s.tag === "[pause]" || s.text.trim().length > 0,
  );
}

// ─── Voice selection helper ───────────────────────────────────────────────────

function selectVoice(
  voices: SpeechSynthesisVoice[],
  profile: VoiceProfileConfig,
  accent: Accent,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const accentHints = ACCENT_VOICE_HINTS[accent];
  const profileHints = profile.voiceHints;

  // Try to match accent + profile hints
  for (const ph of profileHints) {
    for (const ah of accentHints) {
      const found = voices.find(
        (v) =>
          v.name.toLowerCase().includes(ph.toLowerCase()) &&
          v.name.toLowerCase().includes(ah.toLowerCase()),
      );
      if (found) return found;
    }
  }

  // Try accent hints only
  for (const ah of accentHints) {
    const found = voices.find((v) =>
      v.name.toLowerCase().includes(ah.toLowerCase()),
    );
    if (found) return found;
  }

  // Try profile hints only
  for (const ph of profileHints) {
    const found = voices.find((v) =>
      v.name.toLowerCase().includes(ph.toLowerCase()),
    );
    if (found) return found;
  }

  return voices[0] ?? null;
}

// ─── Waveform Visualizer ─────────────────────────────────────────────────────

const WAVEFORM_BAR_COUNT = 20;
// Stable IDs for waveform bars — never reordered, fixed count
const WAVEFORM_BAR_IDS: string[] = Array.from(
  { length: WAVEFORM_BAR_COUNT },
  (_, idx) => `wb${idx}`,
);

function WaveformVisualizer({ isActive }: { isActive: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(WAVEFORM_BAR_COUNT).fill(4));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setBars(Array(WAVEFORM_BAR_COUNT).fill(4));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const animate = () => {
      setBars(
        Array.from({ length: WAVEFORM_BAR_COUNT }, (_, i) => {
          const base = 4 + Math.random() * 44;
          // Center bars taller for realistic voice shape
          const centerBoost =
            1 + 0.6 * Math.exp(-((i - WAVEFORM_BAR_COUNT / 2) ** 2) / 30);
          return Math.min(52, base * centerBoost);
        }),
      );
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive]);

  return (
    <div
      className="flex items-center justify-center gap-[3px] h-16 w-full"
      aria-label="Voice waveform visualizer"
      role="img"
    >
      {WAVEFORM_BAR_IDS.map((barId, i) => (
        <motion.div
          key={barId}
          className="rounded-full shrink-0"
          style={{
            width: 3,
            height: bars[i],
            background: isActive
              ? `oklch(0.65 0.18 ${290 + i * 2} / 0.9)`
              : "oklch(0.25 0.005 275)",
            boxShadow: isActive
              ? `0 0 ${(bars[i] ?? 4) * 0.4}px oklch(0.65 0.18 300 / 0.4)`
              : "none",
            transition: "height 0.08s ease, background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─── Script Preview ───────────────────────────────────────────────────────────

function ScriptPreview({ segments }: { segments: ScriptSegment[] }) {
  if (!segments.length)
    return (
      <p className="text-muted-foreground/25 text-xs italic">
        Your tagged script will appear here...
      </p>
    );

  return (
    <p className="text-sm leading-relaxed break-words">
      {segments.map((seg, i) => {
        const segKey = `seg-${i}-${seg.tag}`;
        if (seg.tag === "[pause]")
          return (
            <span
              key={segKey}
              className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded text-[10px] font-bold align-middle"
              style={{
                background: "oklch(0.20 0.005 275)",
                color: "oklch(0.50 0 0)",
                border: "1px solid oklch(0.26 0.005 275)",
              }}
              title="Pause"
            >
              ⏸ pause
            </span>
          );
        if (seg.tag === "dramatic")
          return (
            <span
              key={segKey}
              className="rounded px-0.5"
              style={{
                background: "oklch(0.70 0.18 45 / 0.15)",
                color: "oklch(0.85 0.14 55)",
                borderBottom: "1.5px solid oklch(0.70 0.18 45 / 0.5)",
              }}
            >
              {seg.text}
            </span>
          );
        if (seg.tag === "soft")
          return (
            <span
              key={segKey}
              className="rounded px-0.5"
              style={{
                background: "oklch(0.65 0.15 230 / 0.15)",
                color: "oklch(0.80 0.12 230)",
                borderBottom: "1.5px solid oklch(0.65 0.15 230 / 0.5)",
              }}
            >
              {seg.text}
            </span>
          );
        return (
          <span key={segKey} className="text-foreground/75">
            {seg.text}
          </span>
        );
      })}
    </p>
  );
}

// ─── Voice Profile Card ───────────────────────────────────────────────────────

function VoiceProfileCard({
  profile,
  isSelected,
  onSelect,
}: {
  profile: VoiceProfileConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left p-3 rounded-xl border transition-all duration-200"
      style={{
        background: isSelected
          ? "oklch(0.14 0.012 300 / 0.7)"
          : "oklch(0.12 0.003 275 / 0.6)",
        borderColor: isSelected
          ? "oklch(0.65 0.18 300 / 0.55)"
          : "oklch(0.22 0.005 275)",
        boxShadow: isSelected
          ? "0 0 20px oklch(0.65 0.18 300 / 0.20), inset 0 1px 0 oklch(1 0 0 / 0.08)"
          : "none",
      }}
      aria-pressed={isSelected}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl leading-none">{profile.icon}</span>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-bold truncate"
            style={{
              color: isSelected ? "oklch(0.80 0.15 300)" : "oklch(0.75 0 0)",
            }}
          >
            {profile.label}
          </p>
          <p className="text-[9px] text-muted-foreground/40 truncate">
            {profile.description}
          </p>
        </div>
        {isSelected && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "oklch(0.65 0.18 300)" }}
          />
        )}
      </div>
    </motion.button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VoiceEnginePage() {
  // ── Voice Config State ──────────────────────────────────────────────────────
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>("male-luxury");
  const [tone, setTone] = useState<EmotionalTone>("dramatic");
  const [accent, setAccent] = useState<Accent>("british");
  const [speed, setSpeed] = useState(0.9);
  const [pitch, setPitch] = useState(0.9);
  const [naturalBreathing, setNaturalBreathing] = useState(true);

  // ── Script State ───────────────────────────────────────────────────────────
  const [script, setScript] = useState(
    "Welcome to an extraordinary property that redefines luxury living. [dramatic] This architectural masterpiece rises above the city skyline, offering breathtaking panoramic views that stretch to the horizon. [pause] Step inside and discover interiors crafted with obsessive attention to detail. [soft tone] Every surface, every material, every curve has been chosen to create a sense of serene, timeless elegance. [pause] This is not just a home. [dramatic] This is a statement of who you are.",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Playback State ─────────────────────────────────────────────────────────
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isCancelledRef = useRef(false);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeProfile = useMemo(
    () =>
      VOICE_PROFILES.find((p) => p.id === voiceProfile) ?? VOICE_PROFILES[0],
    [voiceProfile],
  );

  const activeToneConfig = useMemo(() => TONE_ADJUSTMENTS[tone], [tone]);

  const segments = useMemo(() => parseScript(script), [script]);

  const selectedVoice = useMemo(
    () => selectVoice(voices, activeProfile, accent),
    [voices, activeProfile, accent],
  );

  // ── Tag insertion ──────────────────────────────────────────────────────────
  const insertTag = useCallback(
    (tag: string) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart ?? script.length;
      const end = el.selectionEnd ?? script.length;
      const before = script.slice(0, start);
      const after = script.slice(end);
      const newScript = `${before}${tag}${after}`;
      setScript(newScript);
      // Restore cursor after tag
      requestAnimationFrame(() => {
        el.focus();
        const newPos = start + tag.length;
        el.setSelectionRange(newPos, newPos);
      });
    },
    [script],
  );

  // ── Build utterance for a segment ─────────────────────────────────────────
  const buildUtterance = useCallback(
    (text: string, segTag: ScriptSegment["tag"]): SpeechSynthesisUtterance => {
      const utt = new SpeechSynthesisUtterance(text);

      let segRate = activeProfile.baseRate + activeToneConfig.rateOffset;
      let segPitch = activeProfile.basePitch + activeToneConfig.pitchOffset;
      let segVolume = activeToneConfig.volumeMultiplier;

      // Apply user speed/pitch (normalize: user 1.0 = no extra change)
      segRate *= speed;
      segPitch = segPitch * (pitch / 1.0);

      // Override per-segment tag
      if (segTag === "dramatic") {
        segRate = Math.max(0.5, segRate - 0.1);
        segPitch = Math.max(0.5, segPitch - 0.1);
        segVolume = 1.0;
      } else if (segTag === "soft") {
        segRate = Math.max(0.5, segRate - 0.05);
        segPitch = Math.min(2.0, segPitch + 0.15);
        segVolume = Math.min(1.0, segVolume * 0.8);
      }

      utt.rate = Math.max(0.5, Math.min(2.0, segRate));
      utt.pitch = Math.max(0.0, Math.min(2.0, segPitch));
      utt.volume = Math.max(0.0, Math.min(1.0, segVolume));

      if (selectedVoice) utt.voice = selectedVoice;

      return utt;
    },
    [activeProfile, activeToneConfig, speed, pitch, selectedVoice],
  );

  // ── Play ───────────────────────────────────────────────────────────────────
  const handlePlay = useCallback(() => {
    if (!script.trim()) return;
    window.speechSynthesis.cancel();
    isCancelledRef.current = false;
    utteranceQueueRef.current = [];

    const filteredSegments = segments.filter(
      (s) => s.tag === "[pause]" || s.text.trim(),
    );

    if (!filteredSegments.length) {
      toast.error("No speakable text found");
      return;
    }

    // Build queue
    const queue: SpeechSynthesisUtterance[] = [];

    filteredSegments.forEach((seg, idx) => {
      if (seg.tag === "[pause]") {
        // Insert pause via empty utterance + tiny text
        const pauseUtt = new SpeechSynthesisUtterance(" ");
        pauseUtt.rate = 0.1;
        pauseUtt.volume = 0;
        queue.push(pauseUtt);
      } else {
        const utt = buildUtterance(seg.text, seg.tag);

        utt.onstart = () => {
          if (!isCancelledRef.current) setStatus("speaking");
        };

        if (idx === filteredSegments.length - 1) {
          utt.onend = () => {
            if (!isCancelledRef.current) setStatus("idle");
          };
          utt.onerror = () => {
            if (!isCancelledRef.current) setStatus("idle");
          };
        }

        // Natural breathing: add subtle pause between sentences
        if (
          naturalBreathing &&
          seg.text.trim().match(/[.!?]$/) &&
          idx < filteredSegments.length - 1
        ) {
          const breathUtt = new SpeechSynthesisUtterance(" ");
          breathUtt.rate = 0.1;
          breathUtt.volume = 0;
          queue.push(utt);
          queue.push(breathUtt);
          return;
        }

        queue.push(utt);
      }
    });

    utteranceQueueRef.current = queue;
    setStatus("speaking");

    for (const utt of queue) {
      window.speechSynthesis.speak(utt);
    }
  }, [script, segments, buildUtterance, naturalBreathing]);

  // ── Pause ──────────────────────────────────────────────────────────────────
  const handlePause = useCallback(() => {
    if (status === "speaking") {
      window.speechSynthesis.pause();
      setStatus("paused");
    } else if (status === "paused") {
      window.speechSynthesis.resume();
      setStatus("speaking");
    }
  }, [status]);

  // ── Stop ───────────────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    isCancelledRef.current = true;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, []);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    toast.info("Audio export requires a Pro plan with cloud rendering", {
      duration: 4000,
    });
  }, []);

  // ── Status styles ──────────────────────────────────────────────────────────
  const statusConfig = {
    idle: {
      label: "Idle",
      dotColor: "oklch(0.45 0 0)",
      textColor: "oklch(0.45 0 0)",
    },
    speaking: {
      label: "Speaking…",
      dotColor: "oklch(0.65 0.18 300)",
      textColor: "oklch(0.75 0.15 300)",
    },
    paused: {
      label: "Paused",
      dotColor: "oklch(0.70 0.18 45)",
      textColor: "oklch(0.75 0.14 55)",
    },
  };

  const currentStatus = statusConfig[status];
  const purpleColor = "oklch(0.65 0.18 300)";

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden shrink-0"
        style={{ minHeight: "110px" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 0%, oklch(0.14 0.018 300 / 0.45) 0%, transparent 65%), radial-gradient(ellipse at 80% 100%, oklch(0.12 0.008 88 / 0.20) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 px-6 md:px-8 pt-7 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 glass-panel-elevated"
              style={{ boxShadow: `0 0 20px ${purpleColor} / 0.3` }}
            >
              <Mic className="w-5 h-5" style={{ color: purpleColor }} />
            </div>
            <div>
              <h1 className="heading-cinematic text-2xl md:text-3xl text-foreground">
                <span className="gold-gradient">Voice</span>{" "}
                <span style={{ color: purpleColor }}>Engine</span>
              </h1>
              <p className="text-muted-foreground/50 text-xs mt-0.5 max-w-lg">
                Neural voice synthesis · Emotional tone controls · Tag-driven
                delivery
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── 3-column layout ────────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* ────────────────────────────────────────────────────────────────────
            LEFT: Voice Configuration
            ──────────────────────────────────────────────────────────────── */}
        <ScrollArea
          className="shrink-0 border-r border-white/[0.05]"
          style={{ width: "272px" }}
        >
          <div className="p-4 space-y-5">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5" style={{ color: purpleColor }} />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: purpleColor }}
              >
                Voice Configuration
              </span>
            </div>

            {/* ── Voice Profile ──────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold">
                Voice Profile
              </p>
              <div className="space-y-1.5">
                {VOICE_PROFILES.map((profile) => (
                  <VoiceProfileCard
                    key={profile.id}
                    profile={profile}
                    isSelected={voiceProfile === profile.id}
                    onSelect={() => setVoiceProfile(profile.id)}
                  />
                ))}
              </div>
            </div>

            {/* ── Emotional Tone ─────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold">
                Emotional Tone
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {TONES.map((t) => {
                  const isActive = tone === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      className="py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center"
                      style={{
                        background: isActive
                          ? `${t.color.replace(")", " / 0.20)")}`.replace(
                              "oklch(",
                              "oklch(",
                            )
                          : "oklch(0.12 0.003 275 / 0.6)",
                        color: isActive ? t.color : "oklch(0.45 0 0)",
                        border: `1px solid ${
                          isActive
                            ? t.color
                                .replace(")", " / 0.45)")
                                .replace("oklch(", "oklch(")
                            : "oklch(0.22 0.005 275)"
                        }`,
                        boxShadow: isActive
                          ? `0 0 12px ${t.color.replace(")", " / 0.20)").replace("oklch(", "oklch(")}`
                          : "none",
                      }}
                      aria-pressed={isActive}
                    >
                      {t.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ── Accent ─────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold">
                Accent
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ACCENTS.map((a) => {
                  const isActive = accent === a.id;
                  return (
                    <motion.button
                      key={a.id}
                      type="button"
                      onClick={() => setAccent(a.id)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-semibold transition-all"
                      style={{
                        background: isActive
                          ? "oklch(0.14 0.012 300 / 0.7)"
                          : "oklch(0.12 0.003 275 / 0.5)",
                        color: isActive
                          ? "oklch(0.80 0.15 300)"
                          : "oklch(0.50 0 0)",
                        border: `1px solid ${
                          isActive
                            ? "oklch(0.65 0.18 300 / 0.45)"
                            : "oklch(0.22 0.005 275)"
                        }`,
                      }}
                      aria-pressed={isActive}
                    >
                      <span>{a.flag}</span>
                      <span>{a.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ── Speed ──────────────────────────────────────────────────── */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold">
                  Speed
                </p>
                <span
                  className="text-[10px] font-mono font-bold"
                  style={{ color: purpleColor }}
                >
                  {speed.toFixed(1)}×
                </span>
              </div>
              <Slider
                min={0.5}
                max={2.0}
                step={0.1}
                value={[speed]}
                onValueChange={([v]) => setSpeed(v)}
                aria-label="Speech speed"
              />
              <div className="flex justify-between text-[8px] text-muted-foreground/30 font-semibold uppercase tracking-wider">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            {/* ── Pitch ──────────────────────────────────────────────────── */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold">
                  Pitch
                </p>
                <span
                  className="text-[10px] font-mono font-bold"
                  style={{ color: purpleColor }}
                >
                  {pitch.toFixed(1)}
                </span>
              </div>
              <Slider
                min={0}
                max={2.0}
                step={0.1}
                value={[pitch]}
                onValueChange={([v]) => setPitch(v)}
                aria-label="Voice pitch"
              />
              <div className="flex justify-between text-[8px] text-muted-foreground/30 font-semibold uppercase tracking-wider">
                <span>Low</span>
                <span>Normal</span>
                <span>High</span>
              </div>
            </div>

            {/* ── Natural Breathing ─────────────────────────────────────── */}
            <div
              className="flex items-center justify-between py-3 px-3 rounded-xl"
              style={{
                background: "oklch(0.12 0.003 275 / 0.5)",
                border: "1px solid oklch(0.22 0.005 275)",
              }}
            >
              <div>
                <Label
                  htmlFor="natural-breathing"
                  className="text-xs font-semibold text-foreground/70 cursor-pointer"
                >
                  Natural Breathing
                </Label>
                <p className="text-[9px] text-muted-foreground/35 mt-0.5">
                  Insert micro-pauses between sentences
                </p>
              </div>
              <Switch
                id="natural-breathing"
                checked={naturalBreathing}
                onCheckedChange={setNaturalBreathing}
                className="shrink-0"
              />
            </div>

            {/* Voice availability note */}
            {selectedVoice && (
              <div
                className="rounded-lg px-3 py-2"
                style={{
                  background: "oklch(0.14 0.012 300 / 0.15)",
                  border: "1px solid oklch(0.65 0.18 300 / 0.20)",
                }}
              >
                <p className="text-[9px] text-muted-foreground/40 leading-snug">
                  <span style={{ color: purpleColor }} className="font-bold">
                    Active:
                  </span>{" "}
                  {selectedVoice.name}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ────────────────────────────────────────────────────────────────────
            CENTER: Script Editor + Tag Controls
            ──────────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 flex flex-col p-5 gap-4 overflow-auto min-w-0"
        >
          {/* Script Editor header */}
          <div className="flex items-center justify-between">
            <h2 className="heading-cinematic text-base text-foreground/80">
              Script Editor
            </h2>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground/30 font-semibold uppercase tracking-wider">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: "oklch(0.70 0.18 45 / 0.7)" }}
              />
              dramatic
              <span
                className="w-2 h-2 rounded-sm ml-1"
                style={{ background: "oklch(0.65 0.15 230 / 0.7)" }}
              />
              soft tone
              <span
                className="w-2 h-2 rounded-sm ml-1"
                style={{ background: "oklch(0.30 0.005 275)" }}
              />
              pause
            </div>
          </div>

          {/* Tag toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/30 font-bold mr-1">
              Insert Tag:
            </span>
            <motion.button
              type="button"
              onClick={() => insertTag("[dramatic]")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: "oklch(0.70 0.18 45 / 0.15)",
                color: "oklch(0.85 0.14 55)",
                border: "1px solid oklch(0.70 0.18 45 / 0.35)",
              }}
            >
              [dramatic]
            </motion.button>
            <motion.button
              type="button"
              onClick={() => insertTag("[soft tone]")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: "oklch(0.65 0.15 230 / 0.15)",
                color: "oklch(0.80 0.12 230)",
                border: "1px solid oklch(0.65 0.15 230 / 0.35)",
              }}
            >
              [soft tone]
            </motion.button>
            <motion.button
              type="button"
              onClick={() => insertTag("[pause]")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: "oklch(0.20 0.005 275)",
                color: "oklch(0.55 0 0)",
                border: "1px solid oklch(0.30 0.005 275)",
              }}
            >
              [pause]
            </motion.button>
          </div>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste or type your script here. Use [dramatic], [soft tone], and [pause] tags to control voice delivery..."
            rows={9}
            className="resize-none bg-muted/10 border-border/40 text-sm leading-relaxed placeholder:text-muted-foreground/20 focus:border-purple-500/30 transition-colors font-body"
            style={{
              fontFamily: "Outfit, sans-serif",
              color: "oklch(0.82 0 0)",
            }}
          />

          {/* Live preview */}
          <div
            className="rounded-xl p-4 flex-1 min-h-[120px]"
            style={{
              background: "oklch(0.10 0.003 275 / 0.7)",
              border: "1px solid oklch(0.22 0.005 275)",
            }}
          >
            <p
              className="text-[9px] uppercase tracking-widest font-bold mb-3"
              style={{ color: "oklch(0.40 0 0)" }}
            >
              Live Preview — Color-coded segments
            </p>
            <ScriptPreview segments={segments} />
          </div>

          {/* Segment count */}
          {segments.length > 0 && (
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground/30">
              <span>
                {segments.filter((s) => s.tag !== "[pause]").length} spoken
                segment
                {segments.filter((s) => s.tag !== "[pause]").length !== 1
                  ? "s"
                  : ""}
              </span>
              <span>·</span>
              <span>
                {segments.filter((s) => s.tag === "[pause]").length} pause
                {segments.filter((s) => s.tag === "[pause]").length !== 1
                  ? "s"
                  : ""}
              </span>
              <span>·</span>
              <span>
                {segments.filter((s) => s.tag === "dramatic").length} dramatic
              </span>
              <span>·</span>
              <span>
                {segments.filter((s) => s.tag === "soft").length} soft
              </span>
            </div>
          )}
        </motion.div>

        {/* ────────────────────────────────────────────────────────────────────
            RIGHT: Playback + Waveform
            ──────────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="shrink-0 flex flex-col border-l border-white/[0.05] overflow-y-auto"
          style={{ width: "256px" }}
        >
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <h3 className="heading-cinematic text-sm text-foreground/80">
              Playback
            </h3>
          </div>

          <div className="p-4 space-y-5 flex-1">
            {/* Waveform visualizer */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "oklch(0.09 0.003 300 / 0.5)",
                border: `1px solid ${status === "speaking" ? "oklch(0.65 0.18 300 / 0.35)" : "oklch(0.20 0.005 275)"}`,
                transition: "border-color 0.4s ease",
                boxShadow:
                  status === "speaking"
                    ? "0 0 30px oklch(0.65 0.18 300 / 0.10)"
                    : "none",
              }}
            >
              <WaveformVisualizer isActive={status === "speaking"} />

              {/* Status indicator */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={status}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: currentStatus.dotColor,
                      boxShadow:
                        status === "speaking"
                          ? `0 0 8px ${currentStatus.dotColor}`
                          : "none",
                    }}
                  />
                </AnimatePresence>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: currentStatus.textColor }}
                >
                  {currentStatus.label}
                </span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold">
                Controls
              </p>
              <div className="flex items-center justify-center gap-3">
                {/* Play */}
                <motion.button
                  type="button"
                  onClick={handlePlay}
                  disabled={!script.trim() || status === "speaking"}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-30 transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.75 0.20 300), oklch(0.55 0.18 285))",
                    boxShadow:
                      status === "idle"
                        ? "0 0 20px oklch(0.65 0.18 300 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.25)"
                        : "0 0 8px oklch(0.65 0.18 300 / 0.10)",
                  }}
                  aria-label="Play"
                >
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </motion.button>

                {/* Pause / Resume */}
                <motion.button
                  type="button"
                  onClick={handlePause}
                  disabled={status === "idle"}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center glass-panel disabled:opacity-30 transition-all hover:border-white/[0.15]"
                  aria-label={status === "paused" ? "Resume" : "Pause"}
                >
                  {status === "paused" ? (
                    <Play className="w-4 h-4 text-foreground/70 ml-0.5" />
                  ) : (
                    <Pause className="w-4 h-4 text-foreground/70" />
                  )}
                </motion.button>

                {/* Stop */}
                <motion.button
                  type="button"
                  onClick={handleStop}
                  disabled={status === "idle"}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center glass-panel disabled:opacity-30 transition-all hover:border-red-500/20"
                  aria-label="Stop"
                >
                  <Square className="w-3.5 h-3.5 text-foreground/70" />
                </motion.button>
              </div>
            </div>

            {/* Settings summary */}
            <div
              className="rounded-xl p-3.5 space-y-2.5"
              style={{
                background: "oklch(0.11 0.003 275 / 0.7)",
                border: "1px solid oklch(0.20 0.005 275)",
              }}
            >
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold mb-2">
                Current Settings
              </p>

              {[
                {
                  icon: <User className="w-3 h-3" />,
                  label: "Profile",
                  value: activeProfile.label,
                },
                {
                  icon: <Activity className="w-3 h-3" />,
                  label: "Tone",
                  value: `${tone.charAt(0).toUpperCase()}${tone.slice(1)}`,
                },
                {
                  icon: <Volume2 className="w-3 h-3" />,
                  label: "Accent",
                  value: `${ACCENTS.find((a) => a.id === accent)?.flag} ${accent.charAt(0).toUpperCase() + accent.slice(1)}`,
                },
                {
                  icon: null,
                  label: "Speed",
                  value: `${speed.toFixed(1)}×`,
                },
                {
                  icon: null,
                  label: "Pitch",
                  value: pitch.toFixed(1),
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 text-muted-foreground/40">
                    {row.icon}
                    <span className="text-[9px] font-semibold uppercase tracking-wider">
                      {row.label}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-semibold truncate max-w-[100px] text-right"
                    style={{ color: purpleColor }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

              {naturalBreathing && (
                <div className="pt-1">
                  <Badge
                    variant="outline"
                    className="text-[8px] h-4 px-1.5 border-white/[0.08] text-muted-foreground/40"
                  >
                    Natural Breathing ON
                  </Badge>
                </div>
              )}
            </div>

            {/* Export button */}
            <Button
              onClick={handleExport}
              variant="outline"
              className="w-full gap-2 text-xs h-9 border-white/[0.08] text-muted-foreground/50 hover:text-foreground hover:border-white/[0.15] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Audio
            </Button>
          </div>

          {/* Pro note */}
          <div
            className="m-4 mt-0 rounded-lg p-3"
            style={{
              background: "oklch(0.14 0.012 300 / 0.15)",
              border: "1px solid oklch(0.65 0.18 300 / 0.20)",
            }}
          >
            <p className="text-[9px] leading-relaxed text-muted-foreground/35">
              <span style={{ color: purpleColor }} className="font-bold">
                Production note:
              </span>{" "}
              Cloud rendering with ElevenLabs or Azure Neural TTS available on
              Pro plan.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
