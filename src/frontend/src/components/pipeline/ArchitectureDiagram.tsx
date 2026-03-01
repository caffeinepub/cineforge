import React from "react";

// ─── Architecture Diagram — static production layout ─────────────────────────

export default function ArchitectureDiagram() {
  return (
    <div className="space-y-4">
      <p
        className="text-[11px] text-muted-foreground/50 leading-relaxed"
        style={{ fontFamily: "var(--font-mono, monospace)" }}
      >
        Production architecture showing where real cloud GPU services integrate.
        Browser simulation runs in-memory — replace API slots with real
        endpoints for production.
      </p>

      {/* Top row: User → ICP → Orchestration */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* User Browser */}
        <ArchBox
          title="User Browser"
          description="React + WebGL canvas + Browser TTS"
          badge="CURRENT"
          badgeColor="oklch(0.72 0.18 142)"
          borderColor="oklch(0.72 0.18 142 / 0.35)"
          bgColor="oklch(0.11 0.008 142 / 0.6)"
          flex={1}
        />

        <Arrow />

        {/* ICP Canister */}
        <ArchBox
          title="ICP Canister"
          description="Motoko — User auth, project storage, subscription tier, usage tracking"
          badge="ICP BLOCKCHAIN"
          badgeColor="oklch(0.65 0.14 240)"
          borderColor="oklch(0.65 0.14 240 / 0.35)"
          bgColor="oklch(0.10 0.008 240 / 0.6)"
          flex={2}
        />

        <Arrow />

        {/* AI Orchestration */}
        <ArchBox
          title="AI Orchestration Layer"
          description="Pipeline coordinator — schedules and routes jobs to external AI services"
          badge="PRODUCTION LAYER"
          badgeColor="oklch(0.76 0.12 88)"
          borderColor="oklch(0.76 0.12 88 / 0.40)"
          bgColor="oklch(0.12 0.008 88 / 0.6)"
          flex={2}
        />
      </div>

      {/* Center arrow down */}
      <div className="flex justify-center lg:justify-end lg:pr-0">
        <DownArrow />
      </div>

      {/* AI Services grid */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: "oklch(0.09 0.004 275 / 0.8)",
          border: "1px solid oklch(0.76 0.12 88 / 0.20)",
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-bold tracking-[0.18em] uppercase"
            style={{ color: "oklch(0.76 0.12 88 / 0.7)" }}
          >
            External AI Service Layer
          </span>
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.55 0.20 27 / 0.15)",
              color: "oklch(0.55 0.20 27)",
              border: "1px solid oklch(0.55 0.20 27 / 0.30)",
            }}
          >
            INTEGRATION SLOTS
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <ServiceBox
            title="Scene Visuals"
            service="Runway ML / Sora"
            color="oklch(0.55 0.20 27)"
            slot="VIDEO GEN"
          />
          <ServiceBox
            title="Voice TTS"
            service="ElevenLabs"
            color="oklch(0.68 0.16 155)"
            slot="AUDIO GEN"
          />
          <ServiceBox
            title="Music Score"
            service="Suno AI / Udio"
            color="oklch(0.55 0.18 290)"
            slot="MUSIC GEN"
          />
          <ServiceBox
            title="Video Stitch"
            service="FFmpeg Cloud"
            color="oklch(0.70 0.18 50)"
            slot="PROCESSING"
          />
        </div>
      </div>

      {/* Arrow down */}
      <div className="flex justify-center">
        <DownArrow />
      </div>

      {/* GPU Export */}
      <ArchBox
        title="Cloud GPU Export Farm"
        description="NVIDIA A100 / H100 — Real-time 4K H.265 encoding at scale. AWS MediaConvert or dedicated GPU cluster."
        badge="CLOUD GPU"
        badgeColor="oklch(0.72 0.15 60)"
        borderColor="oklch(0.72 0.15 60 / 0.35)"
        bgColor="oklch(0.11 0.006 60 / 0.6)"
        flex={1}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        <LegendItem
          color="oklch(0.72 0.18 142)"
          label="NOW: Browser Simulation"
        />
        <LegendItem
          color="oklch(0.76 0.12 88)"
          label="PRODUCTION: AI Pipeline"
        />
        <LegendItem
          color="oklch(0.55 0.20 27)"
          label="INTEGRATION SLOT: Replace with real API"
        />
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArchBox({
  title,
  description,
  badge,
  badgeColor,
  borderColor,
  bgColor,
  flex = 1,
}: {
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  flex?: number;
}) {
  return (
    <div
      className="rounded-lg p-3 space-y-1.5"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        flex,
        minWidth: 0,
      }}
    >
      <div className="flex items-start gap-2 justify-between">
        <span
          className="text-[11px] font-bold font-mono"
          style={{ color: badgeColor }}
        >
          {title}
        </span>
        <span
          className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded shrink-0"
          style={{
            background: `${badgeColor.replace(")", " / 0.15)")}`,
            color: badgeColor,
            border: `1px solid ${badgeColor.replace(")", " / 0.30)")}`,
          }}
        >
          {badge}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground/50 leading-snug font-mono">
        {description}
      </p>
    </div>
  );
}

function ServiceBox({
  title,
  service,
  color,
  slot,
}: {
  title: string;
  service: string;
  color: string;
  slot: string;
}) {
  return (
    <div
      className="rounded-lg p-2.5 space-y-1"
      style={{
        background: `${color.replace(")", " / 0.08)")}`,
        border: `1px solid ${color.replace(")", " / 0.25)")}`,
      }}
    >
      <div
        className="text-[8px] font-bold tracking-widest uppercase"
        style={{ color: `${color.replace(")", " / 0.6)")}` }}
      >
        {slot}
      </div>
      <div className="text-[10px] font-semibold font-mono" style={{ color }}>
        {service}
      </div>
      <div className="text-[9px] text-muted-foreground/40">{title}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center shrink-0 text-muted-foreground/30 lg:mx-1">
      <svg
        width="24"
        height="16"
        viewBox="0 0 24 16"
        fill="none"
        role="presentation"
        aria-hidden="true"
      >
        <path
          d="M0 8H20M20 8L14 2M20 8L14 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function DownArrow() {
  return (
    <svg
      width="16"
      height="24"
      viewBox="0 0 16 24"
      fill="none"
      className="text-muted-foreground/25"
      role="presentation"
      aria-hidden="true"
    >
      <path
        d="M8 0V20M8 20L2 14M8 20L14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2.5 h-2.5 rounded-sm shrink-0"
        style={{ background: color }}
      />
      <span className="text-[9px] text-muted-foreground/40 font-mono">
        {label}
      </span>
    </div>
  );
}
