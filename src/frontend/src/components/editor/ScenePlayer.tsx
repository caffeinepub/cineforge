import type { GeneratedScene } from "@/contexts/ProjectContext";
import { CinematicMusicEngine } from "@/utils/musicEngine";
import type { DirectorScene } from "@/utils/scriptAnalysis";
import {
  getEmotionColor,
  getMusicMoodLabel,
  getShotTypeLabel,
} from "@/utils/scriptAnalysis";
import { Music, Square } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState, useCallback } from "react";

// Preset-specific background gradients
function getPresetBackground(preset: string): string {
  switch (preset) {
    case "moody-drama":
      return "radial-gradient(ellipse at 30% 40%, #1a0a2e 0%, #0a0010 50%, #000000 100%)";
    case "dark-thriller":
      return "radial-gradient(ellipse at 60% 30%, #1a0000 0%, #0d0000 40%, #000000 100%)";
    case "warm-documentary":
      return "radial-gradient(ellipse at 40% 50%, #1c0e00 0%, #0e0700 50%, #000000 100%)";
    case "vintage-film":
      return "radial-gradient(ellipse at 50% 50%, #1a1200 0%, #0d0900 50%, #000000 100%)";
    case "high-contrast":
      return "radial-gradient(ellipse at 50% 50%, #111111 0%, #000000 100%)";
    default:
      return "radial-gradient(ellipse at 40% 40%, #0a0a1a 0%, #000000 100%)";
  }
}

function getPresetAccentColor(preset: string): string {
  switch (preset) {
    case "moody-drama":
      return "oklch(0.65 0.18 290)";
    case "dark-thriller":
      return "oklch(0.55 0.20 27)";
    case "warm-documentary":
      return "oklch(0.70 0.15 60)";
    case "vintage-film":
      return "oklch(0.68 0.12 80)";
    case "high-contrast":
      return "oklch(0.90 0 0)";
    default:
      return "oklch(0.76 0.12 88)";
  }
}

// Particle system for canvas star animation
interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string; // white or gold
}

function initParticles(w: number, h: number): Particle[] {
  const PARTICLE_COUNT = 80;
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.3 + 0.05,
    opacity: Math.random() * 0.6 + 0.1,
    twinkleSpeed: Math.random() * 0.02 + 0.005,
    twinkleOffset: Math.random() * Math.PI * 2,
    color: Math.random() > 0.7 ? "gold" : "white",
  }));
}

interface ScenePlayerProps {
  scenes: GeneratedScene[] | DirectorScene[];
  currentIndex: number;
  activePreset: string;
  ttsVoice: string;
  ttsRate: number;
  ttsPitch: number;
  ttsVolume: number;
  onSceneEnd: () => void;
  onStop: () => void;
  musicEnabled?: boolean;
  musicVolume?: number;
  directorScenes?: DirectorScene[];
}

export default function ScenePlayer({
  scenes,
  currentIndex,
  activePreset,
  ttsVoice,
  ttsRate,
  ttsPitch,
  ttsVolume,
  onSceneEnd,
  onStop,
  musicEnabled = false,
  musicVolume = 0.4,
  directorScenes,
}: ScenePlayerProps) {
  const scene = scenes[currentIndex];
  const [progress, setProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Music engine ref
  const musicEngineRef = useRef<CinematicMusicEngine | null>(null);

  // Canvas ref for star particles
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  // Store callbacks in refs so they don't trigger re-runs of the main effect
  const onSceneEndRef = useRef(onSceneEnd);
  const onStopRef = useRef(onStop);
  useEffect(() => {
    onSceneEndRef.current = onSceneEnd;
  }, [onSceneEnd]);
  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  // Mutable refs for timers
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const sceneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typewriterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechDoneRef = useRef(false);
  const timerDoneRef = useRef(false);

  // ── Canvas star animation ────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    canvas.width = rect.width || 640;
    canvas.height = rect.height || 360;
    particlesRef.current = initParticles(canvas.width, canvas.height);
  }, []);

  const animateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    timeRef.current += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particlesRef.current) {
      // Float upward
      p.y -= p.speed;
      if (p.y < -p.size) {
        p.y = canvas.height + p.size;
        p.x = Math.random() * canvas.width;
      }

      // Twinkle
      const twinkle = Math.sin(
        timeRef.current * p.twinkleSpeed + p.twinkleOffset,
      );
      const alpha = p.opacity * (0.5 + 0.5 * twinkle);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color === "gold" ? "#c8a84b" : "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow for larger particles
      if (p.size > 1.5) {
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    rafRef.current = requestAnimationFrame(animateCanvas);
  }, []);

  // Start/stop canvas animation
  useEffect(() => {
    initCanvas();
    animateCanvas();

    const handleResize = () => initCanvas();
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [initCanvas, animateCanvas]);

  // ── Typewriter effect ─────────────────────────────────────────────
  const startTypewriter = useCallback((text: string) => {
    if (typewriterTimerRef.current) clearTimeout(typewriterTimerRef.current);
    setDisplayedText("");
    let i = 0;
    const type = () => {
      if (i <= text.length) {
        setDisplayedText(text.slice(0, i));
        i++;
        typewriterTimerRef.current = setTimeout(type, 38);
      }
    };
    type();
  }, []);

  // ── Scene transition flash ────────────────────────────────────────
  const triggerTransition = useCallback((cb: () => void) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      cb();
    }, 300);
  }, []);

  // ── Main scene effect ─────────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — scene?.id is the stable key; triggerTransition and startTypewriter are stable callbacks
  useEffect(() => {
    if (!scene) return;

    // Brief black flash transition
    triggerTransition(() => {
      setProgress(0);
      speechDoneRef.current = false;
      timerDoneRef.current = false;

      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      const { durationMs, text } = scene;
      const startTime = Date.now();

      // Start typewriter
      startTypewriter(text);

      const maybeAdvance = () => {
        if (speechDoneRef.current && timerDoneRef.current) {
          onSceneEndRef.current();
        }
      };

      // Progress bar
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min((elapsed / durationMs) * 100, 100));
      }, 50);

      // Scene duration timer
      sceneTimerRef.current = setTimeout(() => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setProgress(100);
        timerDoneRef.current = true;
        maybeAdvance();
      }, durationMs);

      // Text-to-speech
      if (window.speechSynthesis) {
        try {
          const utter = new SpeechSynthesisUtterance(text);
          utter.rate = ttsRate;
          utter.pitch = ttsPitch;
          utter.volume = ttsVolume;
          if (ttsVoice) {
            const found = window.speechSynthesis
              .getVoices()
              .find((v) => v.name === ttsVoice);
            if (found) utter.voice = found;
          }
          utter.onend = () => {
            speechDoneRef.current = true;
            maybeAdvance();
          };
          utter.onerror = () => {
            speechDoneRef.current = true;
            maybeAdvance();
          };
          window.speechSynthesis.speak(utter);
        } catch {
          speechDoneRef.current = true;
        }
      } else {
        speechDoneRef.current = true;
      }
    });

    return () => {
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
      if (typewriterTimerRef.current) clearTimeout(typewriterTimerRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id, ttsVoice, ttsRate, ttsPitch, ttsVolume]); // eslint-disable-line

  // ── Music engine lifecycle ────────────────────────────────────────
  useEffect(() => {
    if (musicEnabled) {
      if (!musicEngineRef.current) {
        musicEngineRef.current = new CinematicMusicEngine();
      }
    }
  }, [musicEnabled]);

  // Play music when scene changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — scene?.id and musicEnabled are the stable keys
  useEffect(() => {
    if (!scene || !musicEnabled) return;
    const engine = musicEngineRef.current;
    if (!engine) return;

    // Get mood from director scene if available
    const dirScene = directorScenes?.[currentIndex];
    const mood = dirScene?.musicMood ?? "luxury-ambient";
    engine.setVolume(musicVolume);
    engine.play(mood);
  }, [scene?.id, musicEnabled, musicVolume, currentIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      if (sceneTimerRef.current) clearTimeout(sceneTimerRef.current);
      if (typewriterTimerRef.current) clearTimeout(typewriterTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      // Fade out music
      if (musicEngineRef.current) {
        musicEngineRef.current.fadeOut(800);
        setTimeout(() => {
          musicEngineRef.current?.destroy();
          musicEngineRef.current = null;
        }, 1200);
      }
    };
  }, []);

  if (!scene) return null;

  // Director scene enrichment
  const dirScene = directorScenes?.[currentIndex];
  const hasDirectorData = !!dirScene;

  const bgGradient = hasDirectorData
    ? dirScene.backgroundStyle
    : getPresetBackground(activePreset);
  const accentColor = hasDirectorData
    ? getEmotionColor(dirScene.emotion)
    : getPresetAccentColor(activePreset);
  const totalScenes = scenes.length;

  // Format scene number as SCENE 01 / 05
  const sceneNumStr = String(currentIndex + 1).padStart(2, "0");
  const totalNumStr = String(totalScenes).padStart(2, "0");

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: bgGradient }}
      aria-live="polite"
      aria-label={`Scene ${currentIndex + 1} of ${totalScenes}`}
    >
      {/* Black flash transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="transition-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black z-[60]"
          />
        )}
      </AnimatePresence>

      {/* Cinematic letterbox — top bar */}
      <div className="shrink-0 bg-black" style={{ height: "8%" }} />

      {/* Main scene area */}
      <div className="flex-1 relative flex items-center justify-center px-8 overflow-hidden">
        {/* Star particle canvas — behind everything */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.65 }}
        />

        {/* Film grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none grain-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: 0.18,
            mixBlendMode: "overlay",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        {/* Director: Shot type badge — top left */}
        {hasDirectorData && (
          <div
            className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded"
            style={{
              background: "rgba(0,0,0,0.75)",
              border: `1px solid ${accentColor}55`,
              backdropFilter: "blur(10px)",
            }}
          >
            <span
              className="font-mono text-[9px] font-bold tracking-[0.22em] uppercase"
              style={{ color: accentColor }}
            >
              [{getShotTypeLabel(dirScene.shotType)}]
            </span>
          </div>
        )}

        {/* Director: Music mood indicator — top right corner (if music enabled) */}
        {hasDirectorData && musicEnabled && (
          <div
            className="absolute top-3 right-28 flex items-center gap-1 px-2 py-1 rounded"
            style={{
              background: "rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Music className="w-2.5 h-2.5" style={{ color: accentColor }} />
            <span className="font-mono text-[9px] text-white/50 tracking-wide">
              {getMusicMoodLabel(dirScene.musicMood)}
            </span>
          </div>
        )}

        {/* Cinematic scene counter badge — SCENE 01 / 05 */}
        <div
          className="absolute top-3 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(10px)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{
              background: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
            }}
          />
          <span
            className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase"
            style={{
              color: accentColor,
              textShadow: `0 0 12px ${accentColor}`,
            }}
          >
            SCENE {sceneNumStr}
          </span>
          <span className="text-white/30 font-mono text-[10px]">/</span>
          <span className="font-mono text-[11px] text-white/50 tracking-widest">
            {totalNumStr}
          </span>
        </div>

        {/* Director: Lighting descriptor — bottom left */}
        {hasDirectorData && (
          <div
            className="absolute bottom-6 left-4 px-2 py-1 rounded"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="text-[9px] text-white/40 italic tracking-wide">
              {dirScene.lighting}
            </span>
          </div>
        )}

        {/* Animated scene text with typewriter */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`scene-text-${currentIndex}`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 1.01 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center max-w-3xl"
          >
            {/* Accent line above */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="h-px mx-auto mb-6"
              style={{
                width: "60px",
                background: accentColor,
                transformOrigin: "left",
                boxShadow: `0 0 12px ${accentColor}`,
              }}
            />

            {/* Typewriter text */}
            <p
              className="font-display leading-[1.35] tracking-wide select-none"
              style={{
                fontSize: "clamp(1.25rem, 3.5vw, 2.2rem)",
                fontFamily: '"Fraunces", serif',
                fontWeight: 600,
                color: "rgba(255,255,255,0.95)",
                textShadow:
                  "0 2px 32px rgba(0,0,0,0.8), 0 0 60px rgba(255,200,100,0.08)",
                letterSpacing: "-0.01em",
                minHeight: "2.5em",
              }}
            >
              {displayedText}
              {/* Blinking cursor while typing */}
              {displayedText.length < scene.text.length && (
                <span
                  className="inline-block w-0.5 h-[1em] ml-0.5 align-middle animate-pulse"
                  style={{ background: accentColor, verticalAlign: "middle" }}
                />
              )}
            </p>

            {/* Accent line below */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="h-px mx-auto mt-6"
              style={{
                width: "40px",
                background: accentColor,
                transformOrigin: "right",
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Stop button */}
        <button
          type="button"
          onClick={onStop}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:bg-white/10"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(10px)",
          }}
          aria-label="Stop playback"
        >
          <Square className="w-2.5 h-2.5" />
          Stop
        </button>
      </div>

      {/* Cinematic letterbox — bottom bar with progress */}
      <div
        className="shrink-0 bg-black relative overflow-hidden"
        style={{ height: "8%" }}
      >
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 h-0.5"
          style={{
            width: `${progress}%`,
            background: accentColor,
            boxShadow: `0 0 8px ${accentColor}`,
            transition: "width 0.05s linear",
          }}
        />

        {/* Scene dots */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5">
          {scenes.map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable scene indicator dots, index is correct key
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentIndex ? "16px" : "5px",
                height: "5px",
                background:
                  i === currentIndex
                    ? accentColor
                    : i < currentIndex
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
