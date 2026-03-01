import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorContext } from "@/contexts/EditorContext";
import { useProjectContext } from "@/contexts/ProjectContext";
import { Film, Loader2, Trash2, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// We use ExternalBlob for uploading - checking if available
// If not available, we'll store locally as blob URLs

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m > 0
    ? `${m}:${sec.toString().padStart(2, "0")}`
    : `0:${sec.toString().padStart(2, "0")}`;
}

export default function ClipsPanel() {
  const { clips, addClip, removeClip } = useProjectContext();
  const { selectedClipId, setSelectedClipId } = useEditorContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create local blob URL for preview
      const localUrl = URL.createObjectURL(file);

      // Get video duration
      const duration = await getVideoDuration(localUrl);

      // Generate a local ID
      const blobId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      addClip({
        blobId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        durationSeconds: duration,
        orderIndex: BigInt(clips.length),
        startTrim: 0,
        endTrim: duration,
        localUrl,
      });

      setUploadProgress(100);
      toast.success(`"${file.name}" added to timeline`);
    } catch (err) {
      toast.error("Failed to process video file");
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Clips
        </span>
        <span className="text-xs text-muted-foreground">{clips.length}</span>
      </div>

      <Button
        size="sm"
        onClick={handleUploadClick}
        disabled={uploading}
        className="btn-gold w-full gap-2 mb-3 text-xs"
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        {uploading ? "Processing…" : "Upload Video"}
      </Button>

      {uploading && (
        <div className="mb-2">
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <ScrollArea className="flex-1">
        <div className="space-y-1.5 pr-1">
          <AnimatePresence>
            {clips.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground/40 text-xs">
                <Film className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No clips yet
              </div>
            ) : (
              clips.map((clip) => {
                const isSelected = selectedClipId === clip.blobId;
                return (
                  <motion.div
                    key={clip.blobId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`
                      flex items-center gap-2 p-2 rounded-md cursor-pointer group transition-colors
                      ${
                        isSelected
                          ? "bg-primary/15 border border-primary/30"
                          : "hover:bg-muted/30 border border-transparent"
                      }
                    `}
                    onClick={() =>
                      setSelectedClipId(isSelected ? null : clip.blobId)
                    }
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-7 rounded bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {clip.localUrl ? (
                        <video
                          src={clip.localUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <Film className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {clip.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDuration(clip.durationSeconds)}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeClip(clip.blobId);
                      }}
                      className="p-1 rounded text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

function getVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve(video.duration || 0);
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      resolve(0);
    };
    video.src = url;
  });
}
