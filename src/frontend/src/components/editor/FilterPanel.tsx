import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useProjectContext } from "@/contexts/ProjectContext";
import type { FilterSettings } from "@/contexts/ProjectContext";
import { CINEMATIC_PRESETS } from "@/data/presets";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

export default function FilterPanel() {
  const {
    activePreset,
    setActivePreset,
    filterSettings,
    updateFilterSetting,
    setFilterSettings,
  } = useProjectContext();

  const handlePresetSelect = (presetId: string) => {
    const preset = CINEMATIC_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePreset(presetId);
    setFilterSettings(preset.filters);
  };

  const handleSlider = (key: keyof FilterSettings) => (values: number[]) => {
    updateFilterSetting(key, values[0]);
  };

  return (
    <ScrollArea className="h-full pr-1">
      <div className="space-y-4 pb-4">
        {/* Presets section */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Cinematic Presets
          </p>
          <div className="space-y-1.5">
            {/* None option */}
            <button
              type="button"
              onClick={() => {
                setActivePreset("none");
                setFilterSettings({
                  contrast: 1,
                  saturate: 1,
                  brightness: 1,
                  vignette: 0,
                  filmGrain: 0,
                  hueRotate: 0,
                  sepia: 0,
                });
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors border ${
                activePreset === "none"
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "border-transparent hover:bg-muted/30 text-muted-foreground"
              }`}
            >
              No Filter
            </button>

            {CINEMATIC_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;

              return (
                <motion.button
                  key={preset.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`w-full text-left rounded-md overflow-hidden border transition-all ${
                    isActive
                      ? "border-primary/40 ring-1 ring-primary/30"
                      : "border-border/30 hover:border-border/60"
                  }`}
                >
                  {/* Mood strip */}
                  <div
                    className="h-6 relative"
                    style={{ background: preset.moodGradient }}
                  >
                    {isActive && (
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="px-2 py-1.5 bg-card/60 flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground truncate">
                      {preset.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60">
                      {preset.temperature}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Manual sliders */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Manual Adjustments
          </p>
          <div className="space-y-3">
            <FilterSlider
              label="Contrast"
              value={filterSettings.contrast}
              min={0.5}
              max={2.0}
              step={0.05}
              onChange={handleSlider("contrast")}
            />
            <FilterSlider
              label="Saturation"
              value={filterSettings.saturate}
              min={0}
              max={2.0}
              step={0.05}
              onChange={handleSlider("saturate")}
            />
            <FilterSlider
              label="Brightness"
              value={filterSettings.brightness}
              min={0.5}
              max={1.5}
              step={0.05}
              onChange={handleSlider("brightness")}
            />
            <FilterSlider
              label="Sepia"
              value={filterSettings.sepia}
              min={0}
              max={1}
              step={0.05}
              onChange={handleSlider("sepia")}
            />
            <FilterSlider
              label="Vignette"
              value={filterSettings.vignette}
              min={0}
              max={1.0}
              step={0.05}
              onChange={handleSlider("vignette")}
            />
            <FilterSlider
              label="Film Grain"
              value={filterSettings.filmGrain}
              min={0}
              max={1.0}
              step={0.05}
              onChange={handleSlider("filmGrain")}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function FilterSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (values: number[]) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono text-primary/80">
          {value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={onChange}
        className="h-3"
      />
    </div>
  );
}
