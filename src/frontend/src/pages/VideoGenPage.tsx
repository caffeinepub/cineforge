import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/contexts/AppContext";
import {
  type DirectorScene,
  type PropertyType,
  analyzeScript,
  generateDirectorScenePlan,
  getEmotionColor,
  getShotTypeLabel,
} from "@/utils/scriptAnalysis";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Film,
  Pause,
  Play,
  Video,
  Wand2,
  Zap,
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VideoScene extends DirectorScene {
  footageCategory: string;
  sceneNumber: number;
}

type ShotType = DirectorScene["shotType"];

// ─── Footage category mapping ─────────────────────────────────────────────────

function getFootageCategory(
  shotType: ShotType,
  propertyType: PropertyType,
): string {
  switch (shotType) {
    case "aerial-drone":
      switch (propertyType) {
        case "villa":
          return "Aerial 4K — Luxury Villa Exterior";
        case "penthouse":
          return "Aerial 4K — Penthouse Rooftop Reveal";
        case "mansion":
          return "Aerial 4K — Grand Mansion Estate";
        case "commercial":
          return "Aerial 4K — Commercial District";
        default:
          return "Aerial 4K — Establishing Shot";
      }
    case "dolly-push":
      switch (propertyType) {
        case "villa":
          return "Dolly Push — Private Pool Entrance";
        case "penthouse":
          return "Dolly Push — High-Rise Lobby";
        case "mansion":
          return "Dolly Push — Manor Drive Approach";
        default:
          return "Dolly Push — Premium Property Reveal";
      }
    case "interior-pan":
      switch (propertyType) {
        case "villa":
          return "Interior Pan — Luxury Living Space";
        case "penthouse":
          return "Interior Pan — Sky-High Open Plan";
        case "hotel":
          return "Interior Pan — Boutique Hotel Suite";
        default:
          return "Interior Pan — Premium Interior";
      }
    case "slow-motion":
      return "Slow Mo — Lifestyle Cinematic";
    case "crane-shot":
      switch (propertyType) {
        case "villa":
          return "Crane — Villa Courtyard Rise";
        case "mansion":
          return "Crane — Grand Facade Reveal";
        default:
          return "Crane — Cinematic Elevation";
      }
    case "static-wide":
      return "Static Wide — Architectural Hero";
    case "close-up":
      return "Close Up — Craft & Detail";
  }
}

// ─── LUT presets ──────────────────────────────────────────────────────────────

interface LutPreset {
  id: string;
  label: string;
  filter: string;
  swatchColor: string;
}

const LUT_PRESETS: LutPreset[] = [
  {
    id: "moody-drama",
    label: "Moody Drama",
    filter: "contrast(1.15) saturate(0.75) brightness(0.90) sepia(0.08)",
    swatchColor: "oklch(0.30 0.06 280)",
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    filter:
      "contrast(1.05) saturate(1.25) brightness(1.05) sepia(0.15) hue-rotate(10deg)",
    swatchColor: "oklch(0.75 0.14 80)",
  },
  {
    id: "dark-thriller",
    label: "Dark Thriller",
    filter: "contrast(1.25) saturate(0.55) brightness(0.80) sepia(0.10)",
    swatchColor: "oklch(0.22 0.05 27)",
  },
  {
    id: "vintage-film",
    label: "Vintage Film",
    filter:
      "contrast(0.90) saturate(0.65) brightness(0.95) sepia(0.35) hue-rotate(-5deg)",
    swatchColor: "oklch(0.60 0.08 70)",
  },
  {
    id: "teal-orange",
    label: "Teal & Orange",
    filter: "contrast(1.10) saturate(1.30) brightness(1.00) hue-rotate(15deg)",
    swatchColor: "oklch(0.65 0.14 175)",
  },
];

// ─── Effect state ─────────────────────────────────────────────────────────────

interface EffectState {
  cameraZoom: boolean;
  depthBlur: boolean;
  cinematicLut: boolean;
  lightLeaks: boolean;
  slowMotion: boolean;
  motionInterp: boolean;
}

// ─── Shot-type background gradients (for visual variety in preview) ───────────

const SHOT_BG: Record<ShotType, string> = {
  "aerial-drone":
    "radial-gradient(ellipse at 50% 0%, #0d0800 0%, #060400 60%, #000 100%)",
  "dolly-push":
    "radial-gradient(ellipse at 30% 50%, #0a0600 0%, #050300 60%, #000 100%)",
  "interior-pan":
    "radial-gradient(ellipse at 70% 60%, #100800 0%, #080500 60%, #000 100%)",
  "slow-motion":
    "radial-gradient(ellipse at 50% 80%, #0d0a00 0%, #060500 60%, #000 100%)",
  "static-wide":
    "radial-gradient(ellipse at 20% 20%, #090700 0%, #050400 60%, #000 100%)",
  "close-up":
    "radial-gradient(ellipse at 60% 40%, #0e0900 0%, #070500 60%, #000 100%)",
  "crane-shot":
    "radial-gradient(ellipse at 50% 10%, #0c0800 0%, #070500 60%, #000 100%)",
};

// ─── CSS keyframe injection ────────────────────────────────────────────────────
// We inject a <style> tag once for the shot-type animations

const SHOT_ANIMATIONS: Record<
  ShotType,
  { name: string; css: string; duration: number }
> = {
  "aerial-drone": {
    name: "shot-aerial",
    duration: 8,
    css: `@keyframes shot-aerial {
      0%   { transform: scale(1.08) translateX(0px); }
      100% { transform: scale(1.00) translateX(20px); }
    }`,
  },
  "dolly-push": {
    name: "shot-dolly",
    duration: 7,
    css: `@keyframes shot-dolly {
      0%   { transform: scale(1.00); }
      100% { transform: scale(1.06); }
    }`,
  },
  "interior-pan": {
    name: "shot-interior",
    duration: 8,
    css: `@keyframes shot-interior {
      0%   { transform: translateX(-15px); }
      100% { transform: translateX(15px); }
    }`,
  },
  "slow-motion": {
    name: "shot-slow",
    duration: 10,
    css: `@keyframes shot-slow {
      0%   { transform: scale(1.00); }
      100% { transform: scale(1.04); }
    }`,
  },
  "static-wide": {
    name: "shot-static",
    duration: 6,
    css: `@keyframes shot-static {
      0%   { transform: scale(1.000); }
      50%  { transform: scale(1.015); }
      100% { transform: scale(1.000); }
    }`,
  },
  "close-up": {
    name: "shot-closeup",
    duration: 4,
    css: `@keyframes shot-closeup {
      0%   { filter: blur(2px); }
      50%  { filter: blur(0px); }
      100% { filter: blur(0px); }
    }`,
  },
  "crane-shot": {
    name: "shot-crane",
    duration: 7,
    css: `@keyframes shot-crane {
      0%   { transform: translateY(20px) scale(1.05); }
      100% { transform: translateY(0px) scale(1.00); }
    }`,
  },
};

const LIGHT_LEAK_CSS = `
@keyframes light-leak {
  0%   { opacity: 0; }
  30%  { opacity: 0.18; }
  70%  { opacity: 0.12; }
  100% { opacity: 0; }
}`;

function ensureAnimationsInjected() {
  if (document.getElementById("videogen-keyframes")) return;
  const style = document.createElement("style");
  style.id = "videogen-keyframes";
  style.textContent =
    Object.values(SHOT_ANIMATIONS)
      .map((a) => a.css)
      .join("\n") + LIGHT_LEAK_CSS;
  document.head.appendChild(style);
}

// ─── Cinematic Preview ────────────────────────────────────────────────────────

function CinematicPreview({
  scene,
  sceneIndex,
  totalScenes,
  effects,
  activeLut,
  globalIntensity,
  vignetteStrength,
  isPro,
  onPrev,
  onNext,
  isPlaying,
  onTogglePlay,
}: {
  scene: VideoScene | null;
  sceneIndex: number;
  totalScenes: number;
  effects: EffectState;
  activeLut: LutPreset;
  globalIntensity: number;
  vignetteStrength: number;
  isPro: boolean;
  onPrev: () => void;
  onNext: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  const [textKey, setTextKey] = useState(0);

  // Re-trigger typewriter when scene changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally using scene?.id as stable identity key
  useEffect(() => {
    setTextKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id]);

  useEffect(() => {
    ensureAnimationsInjected();
  }, []);

  const shotAnim = scene ? SHOT_ANIMATIONS[scene.shotType] : null;
  const intensity = globalIntensity / 100;
  const vigOpacity = (vignetteStrength / 100) * intensity;

  // Animation duration multiplied when slow-motion effect is on
  const animDuration = shotAnim
    ? effects.slowMotion
      ? shotAnim.duration * 2
      : shotAnim.duration
    : 0;

  const backgroundStyle = scene
    ? scene.backgroundStyle || SHOT_BG[scene.shotType]
    : "radial-gradient(ellipse at 50% 50%, #0a0700 0%, #000 100%)";

  // LUT filter applied when cinematicLut is enabled
  const lutFilter = effects.cinematicLut ? `${activeLut.filter}` : "none";

  const sceneText = scene
    ? scene.text.length > 80
      ? `${scene.text.slice(0, 77)}…`
      : scene.text
    : "";

  const emotionColor = scene
    ? getEmotionColor(scene.emotion)
    : "oklch(0.76 0.12 88)";

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Aspect ratio wrapper — 16:9 */}
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{ paddingBottom: "56.25%", background: "#000" }}
      >
        <div className="absolute inset-0">
          {/* ── Background scene gradient ─────────────────────────────── */}
          <div
            className="absolute inset-0"
            style={{
              background: backgroundStyle,
              filter: lutFilter,
              transition: "background 0.8s ease",
            }}
          />

          {/* ── Animated content layer (shot type motion) ─────────────── */}
          {scene && effects.cameraZoom && shotAnim && (
            <div
              key={`anim-${scene.id}`}
              className="absolute inset-0"
              style={{
                animationName: shotAnim.name,
                animationDuration: `${animDuration}s`,
                animationTimingFunction:
                  scene.shotType === "slow-motion" ? "linear" : "ease-in-out",
                animationFillMode: "forwards",
                animationIterationCount: "infinite",
                animationDirection:
                  scene.shotType === "static-wide" ? "alternate" : "normal",
                background: backgroundStyle,
                filter: lutFilter,
              }}
            />
          )}

          {/* ── Depth Blur ring ───────────────────────────────────────── */}
          {effects.depthBlur && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${vigOpacity}) 100%)`,
                backdropFilter: "blur(0px)",
              }}
            >
              {/* Outer blur ring */}
              <div
                className="absolute"
                style={{
                  inset: 0,
                  background: `radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,${vigOpacity * 0.6}) 60%, rgba(0,0,0,${vigOpacity}) 100%)`,
                  backdropFilter: `blur(${2 * intensity}px)`,
                  WebkitBackdropFilter: `blur(${2 * intensity}px)`,
                }}
              />
            </div>
          )}

          {/* ── Light leak overlay ────────────────────────────────────── */}
          {effects.lightLeaks && scene && (
            <div
              key={`leak-${scene.id}`}
              className="absolute pointer-events-none"
              style={{
                top: "-20%",
                left: "-10%",
                width: "60%",
                height: "120%",
                background:
                  "linear-gradient(45deg, rgba(255,160,40,0.3) 0%, rgba(255,100,20,0.15) 40%, transparent 70%)",
                transform: "rotate(45deg)",
                transformOrigin: "top left",
                animationName: "light-leak",
                animationDuration: "3s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                mixBlendMode: "screen",
              }}
            />
          )}

          {/* ── Film grain ───────────────────────────────────────────── */}
          <div
            className="absolute inset-0 pointer-events-none grain-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.18'/%3E%3C/svg%3E\")",
              opacity: 0.5 * intensity,
              mixBlendMode: "overlay",
            }}
          />

          {/* ── Letterbox bars ────────────────────────────────────────── */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{ height: "8%", background: "#000" }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{ height: "8%", background: "#000" }}
          />

          {/* ── Scene text ───────────────────────────────────────────── */}
          {scene && (
            <div className="absolute inset-0 flex items-center justify-center px-8 py-12">
              <AnimatePresence mode="wait">
                <motion.p
                  key={textKey}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center text-white font-display text-sm md:text-base lg:text-lg leading-relaxed max-w-lg"
                  style={{
                    textShadow:
                      "0 0 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5)",
                  }}
                >
                  {sceneText}
                </motion.p>
              </AnimatePresence>
            </div>
          )}

          {/* ── HUD overlays ─────────────────────────────────────────── */}
          {scene && (
            <>
              {/* Top-left: Scene counter */}
              <div
                className="absolute top-3 left-3 px-2 py-0.5 rounded border pointer-events-none"
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  color: "oklch(0.76 0.12 88)",
                  borderColor: "oklch(0.76 0.12 88 / 0.4)",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(4px)",
                  textTransform: "uppercase",
                }}
              >
                SCENE {String(sceneIndex + 1).padStart(2, "0")}/
                {String(totalScenes).padStart(2, "0")}
              </div>

              {/* Top-right: Shot type */}
              <div
                className="absolute top-3 right-3 px-2 py-0.5 rounded pointer-events-none"
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  letterSpacing: "0.10em",
                  color: "rgba(255,255,255,0.60)",
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(4px)",
                  textTransform: "uppercase",
                }}
              >
                {getShotTypeLabel(scene.shotType)}
              </div>

              {/* Bottom-left: Footage category */}
              <div
                className="absolute pointer-events-none"
                style={{
                  bottom: "calc(8% + 6px)",
                  left: "8px",
                  fontSize: "8px",
                  fontFamily: "monospace",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.45)",
                  background: "rgba(0,0,0,0.4)",
                  backdropFilter: "blur(4px)",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  textTransform: "uppercase",
                }}
              >
                {scene.footageCategory}
              </div>

              {/* Bottom-right: Quality badge */}
              <div
                className="absolute pointer-events-none"
                style={{
                  bottom: "calc(8% + 6px)",
                  right: "8px",
                  fontSize: "9px",
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  color: isPro
                    ? "oklch(0.76 0.12 88)"
                    : "rgba(255,255,255,0.45)",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(4px)",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  border: isPro
                    ? "1px solid oklch(0.76 0.12 88 / 0.4)"
                    : "none",
                  textTransform: "uppercase",
                }}
              >
                {isPro ? "4K" : "HD"}
              </div>

              {/* Watermark for free users */}
              {!isPro && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ transform: "rotate(-30deg)" }}
                >
                  <span
                    style={{
                      fontSize: "28px",
                      fontFamily: "Fraunces, serif",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.07)",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      userSelect: "none",
                    }}
                  >
                    CINEFORGE
                  </span>
                </div>
              )}
            </>
          )}

          {/* ── Empty state ───────────────────────────────────────────── */}
          {!scene && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Video className="w-10 h-10 text-muted-foreground/20" />
              <p className="text-muted-foreground/30 text-sm font-display">
                Generate scenes to preview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Playback controls ────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={onPrev}
          disabled={!scene || totalScenes === 0}
          className="w-8 h-8 rounded-full flex items-center justify-center glass-panel disabled:opacity-30 hover:border-primary/30 transition-colors"
          aria-label="Previous scene"
        >
          <ChevronLeft className="w-4 h-4 text-foreground/70" />
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onTogglePlay}
          disabled={!scene || totalScenes === 0}
          className="w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-30 transition-all"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.86 0.13 90) 0%, oklch(0.76 0.14 88) 50%, oklch(0.66 0.13 75) 100%)",
            boxShadow: isPlaying
              ? "0 0 24px oklch(0.76 0.12 88 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.30)"
              : "0 0 16px oklch(0.76 0.12 88 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.25)",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-black" />
          ) : (
            <Play className="w-5 h-5 text-black ml-0.5" />
          )}
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={onNext}
          disabled={!scene || totalScenes === 0}
          className="w-8 h-8 rounded-full flex items-center justify-center glass-panel disabled:opacity-30 hover:border-primary/30 transition-colors"
          aria-label="Next scene"
        >
          <ChevronRight className="w-4 h-4 text-foreground/70" />
        </motion.button>
      </div>

      {/* ── Duration / scene info strip ──────────────────────────────────── */}
      {scene && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: emotionColor }}
            />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {scene.emotion}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground/40">
              {(scene.durationMs / 1000).toFixed(1)}s
            </span>
            <span className="text-[10px] text-muted-foreground/30">
              {scene.lightingMood}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scene Card ───────────────────────────────────────────────────────────────

function SceneCard({
  scene,
  isActive,
  onClick,
}: {
  scene: VideoScene;
  isActive: boolean;
  onClick: () => void;
}) {
  const emotionColor = getEmotionColor(scene.emotion);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-lg p-3 transition-all duration-200 border"
      style={{
        background: isActive
          ? "oklch(0.16 0.008 88 / 0.8)"
          : "oklch(0.12 0.003 275 / 0.6)",
        borderColor: isActive
          ? "oklch(0.76 0.12 88 / 0.45)"
          : "oklch(0.22 0.005 275)",
        boxShadow: isActive
          ? "inset 3px 0 0 oklch(0.76 0.12 88 / 0.8)"
          : "none",
      }}
    >
      {/* Scene number + shot type */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[9px] font-bold font-mono tracking-widest uppercase"
          style={{
            color: isActive ? "oklch(0.76 0.12 88)" : "oklch(0.50 0 0)",
          }}
        >
          SCENE {String(scene.sceneNumber).padStart(2, "0")}
        </span>
        <span
          className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{
            background: "oklch(0.18 0.005 275)",
            color: "oklch(0.50 0 0)",
          }}
        >
          {getShotTypeLabel(scene.shotType)}
        </span>
      </div>

      {/* Footage category */}
      <p className="text-[10px] text-muted-foreground/60 mb-1 truncate">
        {scene.footageCategory}
      </p>

      {/* Text preview */}
      <p className="text-[10px] text-foreground/50 leading-snug line-clamp-2">
        {scene.text}
      </p>

      {/* Duration + emotion dot */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[9px] font-mono text-muted-foreground/30">
          {(scene.durationMs / 1000).toFixed(1)}s
        </span>
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: emotionColor }}
          title={scene.emotion}
        />
      </div>
    </motion.button>
  );
}

// ─── Effect Toggle Row ────────────────────────────────────────────────────────

function EffectToggle({
  label,
  description,
  checked,
  onCheckedChange,
  badge,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Label
            className="text-[11px] font-semibold text-foreground/80 cursor-pointer"
            htmlFor={`effect-${label}`}
          >
            {label}
          </Label>
          {badge && checked && (
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                background: "oklch(0.65 0.14 175 / 0.2)",
                color: "oklch(0.65 0.14 175)",
                border: "1px solid oklch(0.65 0.14 175 / 0.3)",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[9px] text-muted-foreground/35 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={`effect-${label}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="shrink-0 scale-90"
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VideoGenPage() {
  const { isPro } = useAppContext();

  // Script state
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState<VideoScene[]>([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Effects state
  const [effects, setEffects] = useState<EffectState>({
    cameraZoom: true,
    depthBlur: true,
    cinematicLut: true,
    lightLeaks: true,
    slowMotion: false,
    motionInterp: false,
  });
  const [activeLutId, setActiveLutId] = useState("moody-drama");
  const [globalIntensity, setGlobalIntensity] = useState(80);
  const [vignetteStrength, setVignetteStrength] = useState(65);

  const activeLut = useMemo(
    () => LUT_PRESETS.find((l) => l.id === activeLutId) ?? LUT_PRESETS[0],
    [activeLutId],
  );

  const activeScene = scenes[activeSceneIndex] ?? null;
  const totalScenes = scenes.length;

  // ── Generate scenes ─────────────────────────────────────────────────────────

  const handleGenerateScenes = useCallback(() => {
    if (!script.trim()) return;
    setIsGenerating(true);
    setIsPlaying(false);

    // Slight delay to show loading state
    setTimeout(() => {
      const analysis = analyzeScript(script);
      const directorScenes = generateDirectorScenePlan(
        script,
        analysis,
        "sentence",
      );

      const videoScenes: VideoScene[] = directorScenes.map((ds, idx) => ({
        ...ds,
        footageCategory: getFootageCategory(ds.shotType, analysis.propertyType),
        sceneNumber: idx + 1,
      }));

      setScenes(videoScenes);
      setActiveSceneIndex(0);
      setIsGenerating(false);
      toast.success(`${videoScenes.length} cinematic scenes generated`);
    }, 600);
  }, [script]);

  // ── Playback ────────────────────────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const scheduleNextScene = useCallback(
    (currentIndex: number, sceneList: VideoScene[]) => {
      const scene = sceneList[currentIndex];
      if (!scene) return;

      const duration = effects.slowMotion
        ? scene.durationMs * 2
        : scene.durationMs;

      playTimerRef.current = setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < sceneList.length) {
          setActiveSceneIndex(nextIndex);
          scheduleNextScene(nextIndex, sceneList);
        } else {
          // End of sequence
          setActiveSceneIndex(0);
          setIsPlaying(false);
        }
      }, duration);
    },
    [effects.slowMotion],
  );

  const handleTogglePlay = useCallback(() => {
    if (!activeScene || totalScenes === 0) return;

    if (isPlaying) {
      stopPlayback();
    } else {
      setIsPlaying(true);
      scheduleNextScene(activeSceneIndex, scenes);
    }
  }, [
    isPlaying,
    activeScene,
    totalScenes,
    activeSceneIndex,
    scenes,
    stopPlayback,
    scheduleNextScene,
  ]);

  // Stop playback when slow-motion toggled — timing changes require restart
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally watching only slowMotion toggle
  useEffect(() => {
    stopPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effects.slowMotion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, []);

  const handlePrevScene = useCallback(() => {
    if (totalScenes === 0) return;
    stopPlayback();
    setActiveSceneIndex((i) => (i - 1 + totalScenes) % totalScenes);
  }, [totalScenes, stopPlayback]);

  const handleNextScene = useCallback(() => {
    if (totalScenes === 0) return;
    stopPlayback();
    setActiveSceneIndex((i) => (i + 1) % totalScenes);
  }, [totalScenes, stopPlayback]);

  // ── Effect togglers ─────────────────────────────────────────────────────────

  const toggleEffect = useCallback(
    (key: keyof EffectState) => (v: boolean) => {
      setEffects((prev) => ({ ...prev, [key]: v }));
    },
    [],
  );

  // ── Copy scene plan ─────────────────────────────────────────────────────────

  const handleCopyPlan = useCallback(() => {
    if (!scenes.length) return;
    const plan = scenes
      .map(
        (s) =>
          `Scene ${s.sceneNumber}: ${getShotTypeLabel(s.shotType)} — ${s.footageCategory} — ${(s.durationMs / 1000).toFixed(1)}s — ${s.emotion}`,
      )
      .join("\n");
    navigator.clipboard.writeText(plan).then(() => {
      toast.success("Scene plan copied to clipboard");
    });
  }, [scenes]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden shrink-0"
        style={{ minHeight: "120px" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 0%, oklch(0.14 0.015 175 / 0.4) 0%, transparent 65%), radial-gradient(ellipse at 80% 100%, oklch(0.12 0.008 88 / 0.25) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 px-6 md:px-8 pt-8 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 glass-panel-elevated"
              style={{ boxShadow: "0 0 20px oklch(0.65 0.14 175 / 0.3)" }}
            >
              <Video
                className="w-5 h-5"
                style={{ color: "oklch(0.65 0.14 175)" }}
              />
            </div>
            <div>
              <h1 className="heading-cinematic text-2xl md:text-3xl text-foreground">
                <span className="gold-gradient">Video</span>{" "}
                <span style={{ color: "oklch(0.65 0.14 175)" }}>Gen</span>
              </h1>
              <p className="text-muted-foreground/50 text-xs mt-0.5 max-w-lg">
                Script → Scene tags → Cinematic FX (Option B — Smart Cinematic
                Builder)
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── 3-column layout ────────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* ── LEFT: Script + Scene List ─────────────────────────────────────── */}
        <div
          className="shrink-0 flex flex-col border-r border-white/[0.05]"
          style={{ width: "280px" }}
        >
          {/* Script input */}
          <div className="p-4 border-b border-white/[0.05] space-y-3">
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste your real estate or cinematic script here…"
              rows={6}
              className="resize-none bg-muted/15 border-border/40 text-xs leading-relaxed placeholder:text-muted-foreground/20 focus:border-primary/30 transition-colors font-body"
            />
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleGenerateScenes}
                disabled={!script.trim() || isGenerating}
                className="btn-gold w-full gap-2 text-xs h-9 disabled:opacity-40"
              >
                {isGenerating ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-pulse" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Generate Scenes
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Scene list header */}
          {scenes.length > 0 && (
            <div className="px-4 py-2 flex items-center justify-between border-b border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                {scenes.length} Scenes
              </span>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyPlan}
                className="flex items-center gap-1 text-[9px] text-muted-foreground/30 hover:text-primary/70 transition-colors"
              >
                <Copy className="w-3 h-3" />
                Copy Plan
              </motion.button>
            </div>
          )}

          {/* Scrollable scene list */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              <AnimatePresence>
                {scenes.map((scene, idx) => (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                  >
                    <SceneCard
                      scene={scene}
                      isActive={idx === activeSceneIndex}
                      onClick={() => {
                        stopPlayback();
                        setActiveSceneIndex(idx);
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {scenes.length === 0 && !isGenerating && (
                <div className="py-10 flex flex-col items-center gap-2 text-center">
                  <Film className="w-8 h-8 text-muted-foreground/10" />
                  <p className="text-[10px] text-muted-foreground/25 leading-snug">
                    Paste a script and click
                    <br />
                    Generate Scenes
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="py-10 flex flex-col items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "oklch(0.76 0.12 88)" }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 0.8,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/30">
                    Analyzing script…
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ── CENTER: Cinematic Preview ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col p-5 gap-4 overflow-auto min-w-0">
          <CinematicPreview
            scene={activeScene}
            sceneIndex={activeSceneIndex}
            totalScenes={totalScenes}
            effects={effects}
            activeLut={activeLut}
            globalIntensity={globalIntensity}
            vignetteStrength={vignetteStrength}
            isPro={isPro}
            onPrev={handlePrevScene}
            onNext={handleNextScene}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
          />

          {/* Thumbnail strip */}
          {scenes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
              {scenes.map((scene, idx) => {
                const isActive = idx === activeSceneIndex;
                return (
                  <motion.button
                    key={scene.id}
                    type="button"
                    onClick={() => {
                      stopPlayback();
                      setActiveSceneIndex(idx);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="shrink-0 rounded overflow-hidden transition-all"
                    style={{
                      width: 60,
                      height: 34,
                      background: scene.backgroundStyle,
                      border: isActive
                        ? "2px solid oklch(0.76 0.12 88)"
                        : "2px solid transparent",
                      boxShadow: isActive
                        ? "0 0 10px oklch(0.76 0.12 88 / 0.4)"
                        : "none",
                    }}
                    aria-label={`Scene ${scene.sceneNumber}`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <span
                        className="text-[7px] font-mono font-bold"
                        style={{
                          color: isActive
                            ? "oklch(0.76 0.12 88)"
                            : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {String(scene.sceneNumber).padStart(2, "0")}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Effect Controls ─────────────────────────────────────────── */}
        <div
          className="shrink-0 flex flex-col border-l border-white/[0.05] overflow-y-auto"
          style={{ width: "260px" }}
        >
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <h3 className="heading-cinematic text-sm text-foreground/80">
              Cinematic Effects
            </h3>
          </div>

          <div className="p-4 space-y-5 flex-1">
            {/* Effect toggles */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold mb-2">
                Effects
              </p>
              <div className="glass-panel rounded-lg px-3 py-1">
                <EffectToggle
                  label="Camera Zoom"
                  description="Shot-type motion simulation"
                  checked={effects.cameraZoom}
                  onCheckedChange={toggleEffect("cameraZoom")}
                />
                <EffectToggle
                  label="Depth Blur"
                  description="Radial vignette + edge blur"
                  checked={effects.depthBlur}
                  onCheckedChange={toggleEffect("depthBlur")}
                />
                <EffectToggle
                  label="Cinematic LUT"
                  description="Color grading filter"
                  checked={effects.cinematicLut}
                  onCheckedChange={toggleEffect("cinematicLut")}
                />
                <EffectToggle
                  label="Light Leaks"
                  description="Animated amber streak"
                  checked={effects.lightLeaks}
                  onCheckedChange={toggleEffect("lightLeaks")}
                />
                <EffectToggle
                  label="Slow Motion"
                  description="2× scene duration"
                  checked={effects.slowMotion}
                  onCheckedChange={toggleEffect("slowMotion")}
                />
                <EffectToggle
                  label="Motion Interp"
                  description="Smoothed transitions"
                  checked={effects.motionInterp}
                  onCheckedChange={toggleEffect("motionInterp")}
                  badge="Smooth 60fps"
                />
              </div>
            </div>

            {/* LUT presets */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold mb-2">
                LUT Preset
              </p>
              <div className="space-y-1.5">
                {LUT_PRESETS.map((lut) => {
                  const isActive = activeLutId === lut.id;
                  return (
                    <motion.button
                      key={lut.id}
                      type="button"
                      onClick={() => setActiveLutId(lut.id)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left"
                      style={{
                        background: isActive
                          ? "oklch(0.16 0.008 88 / 0.6)"
                          : "oklch(0.11 0.003 275 / 0.6)",
                        borderColor: isActive
                          ? "oklch(0.76 0.12 88 / 0.40)"
                          : "oklch(0.20 0.004 275)",
                        boxShadow: isActive
                          ? "inset 3px 0 0 oklch(0.76 0.12 88 / 0.7)"
                          : "none",
                      }}
                    >
                      {/* Color swatch */}
                      <div
                        className="w-5 h-5 rounded-md shrink-0 border"
                        style={{
                          background: lut.swatchColor,
                          borderColor: isActive
                            ? "oklch(0.76 0.12 88 / 0.3)"
                            : "transparent",
                        }}
                      />
                      <span
                        className="text-[11px] font-semibold"
                        style={{
                          color: isActive
                            ? "oklch(0.76 0.12 88)"
                            : "oklch(0.55 0 0)",
                        }}
                      >
                        {lut.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Intensity sliders */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/35 font-bold mb-2">
                Intensity
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground/60">
                      Global Intensity
                    </Label>
                    <span className="text-[10px] font-mono text-primary/70">
                      {globalIntensity}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[globalIntensity]}
                    onValueChange={([v]) => setGlobalIntensity(v)}
                    className="h-3"
                    aria-label="Global intensity"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground/60">
                      Vignette Strength
                    </Label>
                    <span className="text-[10px] font-mono text-primary/70">
                      {vignetteStrength}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[vignetteStrength]}
                    onValueChange={([v]) => setVignetteStrength(v)}
                    className="h-3"
                    aria-label="Vignette strength"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Export tier */}
          <div className="p-4 border-t border-white/[0.05] shrink-0">
            <div
              className="rounded-lg p-3"
              style={{
                background: isPro
                  ? "oklch(0.16 0.008 88 / 0.5)"
                  : "oklch(0.12 0.003 275 / 0.6)",
                border: isPro
                  ? "1px solid oklch(0.76 0.12 88 / 0.35)"
                  : "1px solid oklch(0.22 0.005 275)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40">
                  Export
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    background: isPro
                      ? "oklch(0.76 0.12 88 / 0.15)"
                      : "oklch(0.18 0.003 275)",
                    color: isPro ? "oklch(0.76 0.12 88)" : "oklch(0.45 0 0)",
                    border: isPro
                      ? "1px solid oklch(0.76 0.12 88 / 0.3)"
                      : "none",
                  }}
                >
                  {isPro ? "PRO" : "FREE"}
                </span>
              </div>
              <p
                className="text-xs font-semibold"
                style={{
                  color: isPro ? "oklch(0.76 0.12 88)" : "oklch(0.55 0 0)",
                }}
              >
                {isPro ? "4K · No Watermark" : "720p + Watermark"}
              </p>
              {!isPro && (
                <a
                  href="/subscription"
                  className="block mt-2 text-[9px] font-bold uppercase tracking-wider text-center py-1.5 rounded-md transition-colors"
                  style={{
                    background: "oklch(0.76 0.12 88 / 0.12)",
                    color: "oklch(0.76 0.12 88)",
                    border: "1px solid oklch(0.76 0.12 88 / 0.25)",
                  }}
                >
                  Upgrade to Pro →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-8 py-3 border-t border-white/[0.04] text-center text-[10px] text-muted-foreground/20 shrink-0">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground/40 transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
