import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppContext } from "@/contexts/AppContext";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  Clapperboard,
  Crown,
  Download,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useState, useEffect } from "react";

type ExportState = "idle" | "exporting" | "done";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

const PRO_RESOLUTIONS = ["720p", "1080p", "4K"];

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const { isPro } = useAppContext();
  const navigate = useNavigate();

  const [exportState, setExportState] = useState<ExportState>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedResolution, setSelectedResolution] = useState("720p");

  // Reset on open
  useEffect(() => {
    if (open) {
      setExportState("idle");
      setProgress(0);
      setSelectedResolution(isPro ? "1080p" : "720p");
    }
  }, [open, isPro]);

  const handleExport = () => {
    setExportState("exporting");
    setProgress(0);

    // Simulate export progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setExportState("done"), 300);
      }
      setProgress(p);
    }, 200);
  };

  const resolution = isPro ? selectedResolution : "720p";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-panel border-primary/20 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Clapperboard className="w-5 h-5 text-primary" />
            Export Project
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {exportState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Resolution selector */}
              {isPro ? (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Export Resolution
                  </p>
                  <RadioGroup
                    value={selectedResolution}
                    onValueChange={setSelectedResolution}
                    className="flex gap-3"
                  >
                    {PRO_RESOLUTIONS.map((res) => (
                      <div key={res} className="flex items-center gap-1.5">
                        <RadioGroupItem value={res} id={`res-${res}`} />
                        <Label
                          htmlFor={`res-${res}`}
                          className="text-sm cursor-pointer"
                        >
                          {res}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ) : (
                <div className="glass-panel-dark rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="text-foreground font-medium">720p</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Watermark</span>
                    <span className="text-yellow-400 font-medium">
                      Yes (Free plan)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate({ to: "/subscription" });
                    }}
                    className="mt-1 w-full flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 py-1 rounded hover:bg-primary/10 transition-colors"
                  >
                    <Crown className="w-3 h-3" />
                    Upgrade for 4K + no watermark
                  </button>
                </div>
              )}

              <Button onClick={handleExport} className="btn-gold w-full gap-2">
                <Download className="w-4 h-4" />
                Export at {resolution}
              </Button>
            </motion.div>
          )}

          {exportState === "exporting" && (
            <motion.div
              key="exporting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 text-center py-2"
            >
              <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Exporting at {resolution}
                  {!isPro && " with watermark"}…
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.round(progress)}% complete
                </p>
              </div>
              <Progress value={progress} className="h-1.5" />
            </motion.div>
          )}

          {exportState === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-center py-2"
            >
              <div className="w-14 h-14 rounded-full bg-green-900/30 border border-green-500/40 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Export Complete!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your cinematic masterpiece is ready at {resolution}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-border/50 text-sm"
                >
                  Close
                </Button>
                <Button
                  className="btn-gold flex-1 gap-2 text-sm"
                  onClick={onClose}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
