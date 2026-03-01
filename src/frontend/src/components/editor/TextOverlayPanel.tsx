import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEditorContext } from "@/contexts/EditorContext";
import { useProjectContext } from "@/contexts/ProjectContext";
import type { LocalTextOverlay } from "@/contexts/ProjectContext";
import { Plus, Trash2, Type } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";

const FONT_FAMILIES = [
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "Fraunces",
  "Cabinet Grotesk",
  "Outfit",
];

export default function TextOverlayPanel() {
  const { textOverlays, addTextOverlay, removeTextOverlay, updateTextOverlay } =
    useProjectContext();
  const { selectedTextOverlayId, setSelectedTextOverlayId } =
    useEditorContext();

  const selectedOverlay = textOverlays.find(
    (o) => o.id === selectedTextOverlayId,
  );

  const handleAdd = () => {
    const newOverlay: LocalTextOverlay = {
      id: `text-${Date.now()}`,
      text: "New Text",
      xPercent: 10,
      yPercent: 10,
      color: "#ffffff",
      fontSize: BigInt(24),
      fontFamily: "sans-serif",
    };
    addTextOverlay(newOverlay);
    setSelectedTextOverlayId(newOverlay.id);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Text Overlays
        </span>
        <span className="text-xs text-muted-foreground">
          {textOverlays.length}
        </span>
      </div>

      <Button
        size="sm"
        onClick={handleAdd}
        className="btn-gold w-full gap-2 text-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Text
      </Button>

      <ScrollArea className="flex-1">
        <div className="space-y-1.5 pr-1">
          <AnimatePresence>
            {textOverlays.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground/40 text-xs">
                <Type className="w-6 h-6 mx-auto mb-1 opacity-30" />
                No text overlays
              </div>
            ) : (
              textOverlays.map((overlay) => {
                const isSelected = selectedTextOverlayId === overlay.id;
                return (
                  <motion.div
                    key={overlay.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer group border transition-colors ${
                      isSelected
                        ? "bg-primary/15 border-primary/30"
                        : "hover:bg-muted/30 border-transparent"
                    }`}
                    onClick={() =>
                      setSelectedTextOverlayId(isSelected ? null : overlay.id)
                    }
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: overlay.color }}
                    />
                    <span className="text-xs text-foreground truncate flex-1">
                      {overlay.text}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTextOverlay(overlay.id);
                        if (selectedTextOverlayId === overlay.id)
                          setSelectedTextOverlayId(null);
                      }}
                      className="p-0.5 rounded text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
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

      {/* Edit selected overlay */}
      {selectedOverlay && (
        <>
          <Separator className="bg-border/40" />
          <div className="space-y-3 pb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Edit Selected
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Text</Label>
              <Input
                value={selectedOverlay.text}
                onChange={(e) =>
                  updateTextOverlay(selectedOverlay.id, {
                    text: e.target.value,
                  })
                }
                className="h-7 text-xs bg-muted/20 border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={selectedOverlay.color}
                    onChange={(e) =>
                      updateTextOverlay(selectedOverlay.id, {
                        color: e.target.value,
                      })
                    }
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <Input
                    value={selectedOverlay.color}
                    onChange={(e) =>
                      updateTextOverlay(selectedOverlay.id, {
                        color: e.target.value,
                      })
                    }
                    className="h-7 text-xs bg-muted/20 border-border/50 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Font Size
                </Label>
                <Input
                  type="number"
                  value={Number(selectedOverlay.fontSize)}
                  min={8}
                  max={120}
                  onChange={(e) =>
                    updateTextOverlay(selectedOverlay.id, {
                      fontSize: BigInt(Number.parseInt(e.target.value) || 24),
                    })
                  }
                  className="h-7 text-xs bg-muted/20 border-border/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Font Family
              </Label>
              <select
                value={selectedOverlay.fontFamily}
                onChange={(e) =>
                  updateTextOverlay(selectedOverlay.id, {
                    fontFamily: e.target.value,
                  })
                }
                className="w-full h-7 text-xs bg-muted/20 border border-border/50 rounded-md px-2 text-foreground"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
