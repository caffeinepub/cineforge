import type { FilterSettings } from "@/contexts/ProjectContext";

export interface CinematicPreset {
  id: string;
  name: string;
  description: string;
  temperature: "Cool" | "Neutral" | "Cold" | "Warm";
  proOnly: boolean;
  moodGradient: string;
  filters: FilterSettings;
}

export const CINEMATIC_PRESETS: CinematicPreset[] = [
  {
    id: "moody-drama",
    name: "Moody Drama",
    description: "Deep shadows with cool, desaturated tones for intense scenes",
    temperature: "Cool",
    proOnly: false,
    moodGradient:
      "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 40%, #0d1821 100%)",
    filters: {
      contrast: 1.4,
      saturate: 0.7,
      brightness: 0.85,
      sepia: 0.1,
      hueRotate: 0,
      vignette: 0.6,
      filmGrain: 0.3,
    },
  },
  {
    id: "warm-documentary",
    name: "Warm Documentary",
    description:
      "Natural warmth with subtle earth tones for authentic storytelling",
    temperature: "Warm",
    proOnly: false,
    moodGradient:
      "linear-gradient(135deg, #3d2000 0%, #8b4513 40%, #d4a017 100%)",
    filters: {
      contrast: 1.1,
      saturate: 1.2,
      brightness: 1.05,
      sepia: 0.2,
      hueRotate: 10,
      vignette: 0.3,
      filmGrain: 0.1,
    },
  },
  {
    id: "dark-thriller",
    name: "Dark Thriller",
    description: "Extreme contrast with near-zero saturation for suspense",
    temperature: "Cold",
    proOnly: false,
    moodGradient:
      "linear-gradient(135deg, #000000 0%, #0a0a0a 40%, #1a0505 100%)",
    filters: {
      contrast: 1.6,
      saturate: 0.4,
      brightness: 0.75,
      sepia: 0.05,
      hueRotate: 0,
      vignette: 0.8,
      filmGrain: 0.4,
    },
  },
  {
    id: "vintage-film",
    name: "Vintage Film",
    description:
      "Warm sepia tones with heavy grain for a nostalgic analog feel",
    temperature: "Warm",
    proOnly: false,
    moodGradient:
      "linear-gradient(135deg, #4a2c00 0%, #8b6914 40%, #c8a84b 100%)",
    filters: {
      contrast: 1.2,
      saturate: 0.8,
      brightness: 0.9,
      sepia: 0.4,
      hueRotate: -5,
      vignette: 0.5,
      filmGrain: 0.6,
    },
  },
  {
    id: "high-contrast-cinema",
    name: "High Contrast Cinema",
    description:
      "Bold, punchy colors with extreme contrast for blockbuster impact",
    temperature: "Neutral",
    proOnly: false,
    moodGradient:
      "linear-gradient(135deg, #000000 0%, #1a1a00 40%, #2d2d00 100%)",
    filters: {
      contrast: 1.8,
      saturate: 1.1,
      brightness: 0.95,
      sepia: 0,
      hueRotate: 0,
      vignette: 0.7,
      filmGrain: 0.2,
    },
  },
];

export function buildCssFilterString(f: FilterSettings): string {
  return [
    `contrast(${f.contrast})`,
    `saturate(${f.saturate})`,
    `brightness(${f.brightness})`,
    f.sepia > 0 ? `sepia(${f.sepia})` : "",
    f.hueRotate !== 0 ? `hue-rotate(${f.hueRotate}deg)` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
