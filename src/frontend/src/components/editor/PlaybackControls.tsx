import { Slider } from "@/components/ui/slider";
import { useEditorContext } from "@/contexts/EditorContext";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlaybackControls() {
  const { isPlaying, setIsPlaying, currentTime, duration, setCurrentTime } =
    useEditorContext();

  const handleSeek = (values: number[]) => {
    const t = values[0];
    setCurrentTime(t);
    const video = document.querySelector("video") as HTMLVideoElement | null;
    if (video) {
      video.currentTime = t;
    }
  };

  return (
    <div className="flex flex-col gap-2 px-1">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            const video = document.querySelector(
              "video",
            ) as HTMLVideoElement | null;
            if (video) video.currentTime = Math.max(0, video.currentTime - 5);
          }}
        >
          <SkipBack className="w-4 h-4" />
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-primary" />
          ) : (
            <Play className="w-4 h-4 fill-primary ml-0.5" />
          )}
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            const video = document.querySelector(
              "video",
            ) as HTMLVideoElement | null;
            if (video)
              video.currentTime = Math.min(
                video.duration,
                video.currentTime + 5,
              );
          }}
        >
          <SkipForward className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
