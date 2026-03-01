import { Button } from "@/components/ui/button";
import { CINEMATIC_PRESETS } from "@/data/presets";
import { useNavigate } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

export default function PresetsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Demo Mode Banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 flex items-center gap-3"
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-primary/90 font-medium">
          <span className="font-bold text-primary">Demo Mode Active</span> — All
          Pro presets are unlocked for preview. Apply any preset in the Editor.
        </p>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <p className="label-cinematic mb-2">Collection</p>
        <h1 className="heading-cinematic gold-gradient text-4xl md:text-5xl">
          Cinematic Presets
        </h1>
        <p className="text-muted-foreground/70 text-sm mt-2 max-w-md">
          Professional color grades inspired by the world's greatest
          cinematographers
        </p>
      </motion.div>

      {/* Presets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {CINEMATIC_PRESETS.map((preset, i) => {
          return (
            <motion.div
              key={preset.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel rounded-2xl overflow-hidden cinematic-shadow relative group"
            >
              {/* Gold shimmer top edge on hover */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-10" />

              {/* Mood strip — taller, more atmospheric */}
              <div
                className="h-32 relative overflow-hidden"
                style={{ background: preset.moodGradient }}
              >
                {/* Film grain */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                    opacity: 0.25,
                    mixBlendMode: "overlay",
                  }}
                />
                {/* Bottom fade into card */}
                <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Unlocked badge — top-right */}
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1 btn-gold px-2 py-1 rounded-full text-[10px] font-bold tracking-widest">
                    <Sparkles className="w-2.5 h-2.5" />
                    UNLOCKED
                  </div>
                </div>

                {/* Temperature bottom-left */}
                <div className="absolute bottom-2.5 left-3">
                  <span className="text-[10px] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/60 border border-white/10 tracking-widest uppercase">
                    {preset.temperature}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 pb-5">
                <h3 className="font-display font-semibold text-base text-foreground/95 tracking-tight">
                  {preset.name}
                </h3>
                <p className="text-[12px] text-muted-foreground/60 mt-1 leading-relaxed">
                  {preset.description}
                </p>

                {/* Filter specs — refined grid */}
                <div className="grid grid-cols-3 gap-1.5 mt-3.5">
                  <FilterSpec
                    label="Contrast"
                    value={preset.filters.contrast.toFixed(1)}
                  />
                  <FilterSpec
                    label="Saturate"
                    value={preset.filters.saturate.toFixed(1)}
                  />
                  <FilterSpec
                    label="Brightness"
                    value={preset.filters.brightness.toFixed(2)}
                  />
                  <FilterSpec
                    label="Vignette"
                    value={`${Math.round(preset.filters.vignette * 100)}%`}
                  />
                  <FilterSpec
                    label="Grain"
                    value={`${Math.round(preset.filters.filmGrain * 100)}%`}
                  />
                  {preset.filters.sepia > 0 && (
                    <FilterSpec
                      label="Sepia"
                      value={preset.filters.sepia.toFixed(1)}
                    />
                  )}
                </div>

                {/* Action */}
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate({ to: "/editor/new" })}
                    className="w-full border-primary/25 text-primary/90 hover:bg-primary/10 hover:border-primary/40 text-xs gap-2 h-8 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Use in Editor
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-white/[0.05] text-center text-[11px] text-muted-foreground/30">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground/60 transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function FilterSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1.5 text-center">
      <div className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-0.5">
        {label}
      </div>
      <div className="text-[11px] font-semibold text-foreground/80 tabular-nums">
        {value}
      </div>
    </div>
  );
}
