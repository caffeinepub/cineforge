import { useEditorContext } from "@/contexts/EditorContext";
import { useProjectContext } from "@/contexts/ProjectContext";
import type { LocalTextOverlay } from "@/contexts/ProjectContext";
import React, { useRef, useCallback } from "react";

export default function TextOverlayLayer() {
  const { textOverlays, updateTextOverlay } = useProjectContext();
  const { selectedTextOverlayId, setSelectedTextOverlayId } =
    useEditorContext();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {textOverlays.map((overlay) => (
        <DraggableTextOverlay
          key={overlay.id}
          overlay={overlay}
          isSelected={selectedTextOverlayId === overlay.id}
          onSelect={() => setSelectedTextOverlayId(overlay.id)}
          onUpdate={(updates) => updateTextOverlay(overlay.id, updates)}
        />
      ))}
    </div>
  );
}

interface DraggableTextOverlayProps {
  overlay: LocalTextOverlay;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<LocalTextOverlay>) => void;
}

function DraggableTextOverlay({
  overlay,
  isSelected,
  onSelect,
  onUpdate,
}: DraggableTextOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
      const container = ref.current?.parentElement;
      if (!container) return;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        startX: overlay.xPercent,
        startY: overlay.yPercent,
      };
      e.preventDefault();
    },
    [onSelect, overlay.xPercent, overlay.yPercent],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStart.current || !ref.current) return;
      const container = ref.current.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
      onUpdate({
        xPercent: Math.max(0, Math.min(90, dragStart.current.startX + dx)),
        yPercent: Math.max(0, Math.min(90, dragStart.current.startY + dy)),
      });
    },
    [onUpdate],
  );

  const handleMouseUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  React.useEffect(() => {
    if (isSelected) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isSelected, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={ref}
      className={`absolute text-overlay-item pointer-events-auto select-none ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-transparent rounded-sm" : ""}`}
      style={{
        left: `${overlay.xPercent}%`,
        top: `${overlay.yPercent}%`,
        color: overlay.color || "#ffffff",
        fontSize: `${Number(overlay.fontSize)}px`,
        fontFamily: overlay.fontFamily || "inherit",
        textShadow: "0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)",
        cursor: "move",
        maxWidth: "80%",
        whiteSpace: "nowrap",
        zIndex: 10,
      }}
      onMouseDown={handleMouseDown}
    >
      {overlay.text || "Text Overlay"}
    </div>
  );
}
