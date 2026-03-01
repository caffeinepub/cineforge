import { useEditorContext } from "@/contexts/EditorContext";
import { useProjectContext } from "@/contexts/ProjectContext";
import { buildCssFilterString } from "@/data/presets";
import { Film, Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useRef, useEffect, useCallback, useState } from "react";
import { toast } from "sonner";
import ScenePlayer from "./ScenePlayer";
import TextOverlayLayer from "./TextOverlayLayer";

export default function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const {
    clips,
    filterSettings,
    generatedScenes,
    isScenePlaying,
    currentSceneIndex,
    activePreset,
    ttsVoice,
    ttsRate,
    ttsPitch,
    ttsVolume,
    setCurrentSceneIndex,
    setIsScenePlaying,
    setGeneratedScenes,
    directorScenes,
    musicEnabled,
    musicVolume,
  } = useProjectContext();

  const { isPlaying, setIsPlaying, setCurrentTime, setDuration } =
    useEditorContext();

  // CSS filter string
  const cssFilter = buildCssFilterString(filterSettings);

  // Apply filter to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.filter = cssFilter;
    }
  }, [cssFilter]);

  // Handle play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Load first clip with a local URL
  const firstClip = clips.find((c) => c.localUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (firstClip?.localUrl) {
      video.src = firstClip.localUrl;
      video.load();
    } else {
      video.src = "";
    }
  }, [firstClip?.localUrl]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, [setDuration]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  // Scene player handlers
  const handleSceneEnd = useCallback(() => {
    const nextIndex = currentSceneIndex + 1;
    if (nextIndex >= generatedScenes.length) {
      // Last scene — playback complete
      setIsScenePlaying(false);
      setGeneratedScenes([]);
      toast.success("🎬 Video complete!");
    } else {
      setCurrentSceneIndex(nextIndex);
    }
  }, [
    currentSceneIndex,
    generatedScenes.length,
    setCurrentSceneIndex,
    setIsScenePlaying,
    setGeneratedScenes,
  ]);

  const handleStop = useCallback(() => {
    setIsScenePlaying(false);
  }, [setIsScenePlaying]);

  const vignetteIntensity = filterSettings.vignette;
  const grainIntensity = filterSettings.filmGrain;

  const handlePlayPauseClick = useCallback(() => {
    if (firstClip?.localUrl) {
      setIsPlaying(!isPlaying);
    }
  }, [firstClip?.localUrl, isPlaying, setIsPlaying]);

  return (
    <div
      ref={containerRef}
      data-scene-player-container
      className="relative w-full bg-black rounded-lg overflow-hidden"
      style={{ aspectRatio: "16/9" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {firstClip?.localUrl ? (
        // biome-ignore lint/a11y/useMediaCaption: editor preview doesn't require captions
        // biome-ignore lint/a11y/useKeyWithClickEvents: video click-to-play is a common pattern; keyboard control is via PlaybackControls
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onClick={handlePlayPauseClick}
          playsInline
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-3">
            <Film
              className="w-8 h-8 text-muted-foreground/40"
              aria-hidden="true"
            />
          </div>
          <p className="text-muted-foreground/60 text-sm">
            Upload a video clip to preview
          </p>
          <p className="text-muted-foreground/40 text-xs mt-1">
            Filters will apply in real-time
          </p>
        </div>
      )}

      {/* Play/Pause overlay button */}
      {firstClip?.localUrl && !isScenePlaying && (
        <AnimatePresence>
          {(!isPlaying || isHovered) && (
            <motion.button
              key="play-pause-btn"
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={handlePlayPauseClick}
              className="absolute inset-0 flex items-center justify-center group z-20"
              aria-label={isPlaying ? "Pause video" : "Play video"}
              style={{
                background: isPlaying ? "transparent" : "rgba(0,0,0,0.2)",
              }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: isPlaying
                    ? "rgba(0,0,0,0.45)"
                    : "oklch(0.76 0.12 88 / 0.9)",
                  backdropFilter: "blur(8px)",
                  boxShadow: isPlaying
                    ? "none"
                    : "0 0 32px oklch(0.76 0.12 88 / 0.4), 0 4px 16px rgba(0,0,0,0.5)",
                  border: isPlaying
                    ? "1.5px solid rgba(255,255,255,0.2)"
                    : "1.5px solid oklch(0.76 0.12 88 / 0.6)",
                }}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white/90" />
                ) : (
                  <Play className="w-7 h-7 text-black/90 ml-0.5" />
                )}
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {/* Vignette overlay */}
      {vignetteIntensity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignetteIntensity}) 100%)`,
          }}
        />
      )}

      {/* Film grain overlay */}
      {grainIntensity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none grain-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: grainIntensity * 0.5,
            mixBlendMode: "overlay",
          }}
        />
      )}

      {/* Text overlays */}
      <TextOverlayLayer />

      {/* ── Scene Player (overlaid when active) ─────────────────────── */}
      {isScenePlaying && generatedScenes.length > 0 && (
        <ScenePlayer
          scenes={generatedScenes}
          currentIndex={currentSceneIndex}
          activePreset={activePreset}
          ttsVoice={ttsVoice}
          ttsRate={ttsRate}
          ttsPitch={ttsPitch}
          ttsVolume={ttsVolume}
          onSceneEnd={handleSceneEnd}
          onStop={handleStop}
          musicEnabled={musicEnabled}
          musicVolume={musicVolume}
          directorScenes={
            directorScenes.length > 0 ? directorScenes : undefined
          }
        />
      )}
    </div>
  );
}
