// ─── Script Analysis Utility ─────────────────────────────────────────────────
// Pure utility — no React, no side effects

export type PropertyType =
  | "villa"
  | "penthouse"
  | "mansion"
  | "commercial"
  | "residential"
  | "development"
  | "land"
  | "hotel"
  | "other";

export interface ScriptAnalysis {
  emotion: "luxury" | "dramatic" | "warm" | "corporate" | "mysterious" | "epic";
  luxuryLevel: number; // 0-100
  propertyType: PropertyType;
  personaTags: string[]; // e.g. ["High-end Investor", "Luxury Buyer"]
  hookScore: number; // 0-100
  hookSuggestions: string[]; // 3 improvement tips
  timeOfDay: "sunrise" | "golden-hour" | "daytime" | "night";
  moodTone: string; // short description
}

export interface DirectorScene {
  id: string;
  text: string;
  durationMs: number;
  emotion: ScriptAnalysis["emotion"];
  shotType:
    | "aerial-drone"
    | "dolly-push"
    | "interior-pan"
    | "slow-motion"
    | "static-wide"
    | "close-up"
    | "crane-shot";
  cameraMove: string;
  lighting: string;
  lightingMood: string; // Short label e.g. "Golden hour", "Blue hour"
  musicMood:
    | "epic-rise"
    | "luxury-ambient"
    | "tension-build"
    | "warm-resolve"
    | "dramatic-swell";
  backgroundStyle: string; // css gradient
  directorNotes: string;
}

// ─── Keyword Banks ────────────────────────────────────────────────────────────

const LUXURY_WORDS = [
  "luxury",
  "luxurious",
  "premium",
  "exclusive",
  "finest",
  "elite",
  "opulent",
  "villa",
  "estate",
  "penthouse",
  "mansion",
  "grand",
  "magnificent",
  "exquisite",
  "bespoke",
  "refined",
  "prestige",
  "prestigious",
  "premier",
  "lavish",
  "sophisticated",
  "elegant",
  "palatial",
  "immaculate",
  "impeccable",
];

const DRAMATIC_WORDS = [
  "dark",
  "shadow",
  "mystery",
  "mysterious",
  "thrilling",
  "edge",
  "danger",
  "power",
  "intense",
  "dramatic",
  "tension",
  "conflict",
  "crisis",
  "urgent",
  "relentless",
  "uncompromising",
  "raw",
  "bold",
  "stark",
  "haunting",
  "gripping",
  "riveting",
  "compelling",
];

const CORPORATE_WORDS = [
  "invest",
  "investment",
  "roi",
  "returns",
  "portfolio",
  "growth",
  "revenue",
  "profit",
  "market",
  "opportunity",
  "strategy",
  "performance",
  "capital",
  "yield",
  "asset",
  "value",
  "business",
  "enterprise",
  "venture",
  "fund",
  "dividend",
  "equity",
  "acquisition",
  "stakeholder",
];

const WARM_WORDS = [
  "family",
  "cozy",
  "warm",
  "home",
  "community",
  "welcoming",
  "comfortable",
  "neighborhood",
  "together",
  "gather",
  "memories",
  "children",
  "joy",
  "laughter",
  "peaceful",
  "tranquil",
  "serene",
  "gentle",
  "nurturing",
  "heartfelt",
  "soulful",
  "intimate",
  "personal",
];

const EPIC_WORDS = [
  "stunning",
  "breathtaking",
  "extraordinary",
  "legendary",
  "monumental",
  "spectacular",
  "magnificent",
  "awe-inspiring",
  "majestic",
  "incredible",
  "unparalleled",
  "unrivaled",
  "ultimate",
  "supreme",
  "iconic",
  "revolutionary",
  "transformative",
  "visionary",
  "pioneering",
];

const MYSTERIOUS_WORDS = [
  "hidden",
  "secret",
  "enigmatic",
  "mystical",
  "obscure",
  "veiled",
  "cryptic",
  "elusive",
  "ethereal",
  "otherworldly",
  "surreal",
  "dreamlike",
  "otherworldly",
  "whisper",
  "shadow",
  "midnight",
  "obscured",
];

// ─── Property type keyword banks ─────────────────────────────────────────────

const PROPERTY_KEYWORDS: Record<PropertyType, string[]> = {
  villa: [
    "villa",
    "mediterranean",
    "tuscany",
    "provencal",
    "resort villa",
    "beach villa",
    "poolside",
    "terrace villa",
  ],
  penthouse: [
    "penthouse",
    "rooftop",
    "sky residence",
    "top floor",
    "skyline",
    "panoramic city",
    "skyscraper",
    "high rise",
    "highrise",
  ],
  mansion: [
    "mansion",
    "manor",
    "chateau",
    "estate house",
    "grand estate",
    "stately home",
    "heritage home",
  ],
  commercial: [
    "office",
    "commercial",
    "corporate",
    "workspace",
    "co-working",
    "business park",
    "headquarters",
    "retail",
    "showroom",
  ],
  residential: [
    "apartment",
    "condo",
    "condominium",
    "townhouse",
    "terraced",
    "semi-detached",
    "family home",
    "suburban",
    "neighbourhood",
  ],
  development: [
    "development",
    "project",
    "launch",
    "under construction",
    "new build",
    "off-plan",
    "pre-launch",
    "masterplan",
  ],
  land: [
    "land",
    "plot",
    "acre",
    "hectare",
    "parcel",
    "farmland",
    "countryside",
    "agricultural",
  ],
  hotel: [
    "hotel",
    "boutique hotel",
    "resort",
    "hospitality",
    "spa",
    "amenities",
    "concierge",
    "suite",
  ],
  other: [],
};

function detectPropertyType(text: string): PropertyType {
  const lower = text.toLowerCase();
  const scores: Partial<Record<PropertyType, number>> = {};

  for (const [type, keywords] of Object.entries(PROPERTY_KEYWORDS) as [
    PropertyType,
    string[],
  ][]) {
    if (type === "other") continue;
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.split(" ").length; // multi-word = higher weight
    }
    if (score > 0) scores[type] = score;
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return sorted.length > 0 ? (sorted[0][0] as PropertyType) : "other";
}

// ─── Lighting mood short labels ───────────────────────────────────────────────

const LIGHTING_MOOD_LABELS: Record<DirectorScene["shotType"], string[]> = {
  "aerial-drone": ["Golden hour", "Blue hour", "High noon"],
  "dolly-push": ["Warm side-light", "Soft daylight", "Cinematic key"],
  "interior-pan": ["Warm practicals", "Raking window", "Ambient layered"],
  "slow-motion": ["Ethereal backlit", "Silhouette rim", "Low-key moody"],
  "static-wide": ["Magic hour", "Overcast diffused", "High contrast"],
  "close-up": ["Clean ring-light", "Rim separation", "Warm intimate key"],
  "crane-shot": ["Sky fill", "Sunset gradient", "Dawn blue-hour"],
};

const SENSORY_WORDS = [
  "feel",
  "touch",
  "smell",
  "taste",
  "hear",
  "see",
  "glisten",
  "shimmer",
  "resonate",
  "echo",
  "breathe",
  "texture",
  "scent",
  "aroma",
  "sound",
];

const URGENCY_WORDS = [
  "now",
  "today",
  "limited",
  "exclusive",
  "rare",
  "once",
  "opportunity",
  "urgent",
  "immediately",
  "act",
  "deadline",
  "offer",
  "last",
  "only",
];

const SOCIAL_PROOF_WORDS = [
  "award",
  "recognized",
  "acclaimed",
  "trusted",
  "proven",
  "certified",
  "endorsed",
  "featured",
  "renowned",
  "established",
  "reputable",
  "testimonial",
  "rated",
  "recommended",
  "ranked",
];

// ─── Time-of-day detection ────────────────────────────────────────────────────

function detectTimeOfDay(text: string): ScriptAnalysis["timeOfDay"] {
  const lower = text.toLowerCase();
  if (/sunrise|dawn|morning|first light|daybreak/.test(lower)) return "sunrise";
  if (/golden hour|dusk|sunset|twilight|late afternoon/.test(lower))
    return "golden-hour";
  if (/night|midnight|evening|dark sky|stars|moonlight/.test(lower))
    return "night";
  return "daytime";
}

// ─── Count keyword matches ────────────────────────────────────────────────────

function countMatches(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lower.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

// ─── analyzeScript ────────────────────────────────────────────────────────────

export function analyzeScript(text: string): ScriptAnalysis {
  if (!text.trim()) {
    return {
      emotion: "luxury",
      luxuryLevel: 50,
      propertyType: "other" as PropertyType,
      personaTags: ["General Audience"],
      hookScore: 0,
      hookSuggestions: [
        "Add an emotionally resonant opening line",
        "Include specific sensory details to immerse the viewer",
        "Lead with your strongest benefit or unique selling point",
      ],
      timeOfDay: "daytime",
      moodTone: "Neutral — add more descriptive language",
    };
  }

  // Count matches per category
  const luxuryScore = countMatches(text, LUXURY_WORDS);
  const dramaticScore = countMatches(text, DRAMATIC_WORDS);
  const corporateScore = countMatches(text, CORPORATE_WORDS);
  const warmScore = countMatches(text, WARM_WORDS);
  const epicScore = countMatches(text, EPIC_WORDS);
  const mysteriousScore = countMatches(text, MYSTERIOUS_WORDS);

  // Determine dominant emotion
  const scores: Record<ScriptAnalysis["emotion"], number> = {
    luxury: luxuryScore * 2,
    dramatic: dramaticScore,
    corporate: corporateScore,
    warm: warmScore,
    epic: epicScore * 1.5,
    mysterious: mysteriousScore * 1.2,
  };

  const dominantEmotion = Object.entries(scores).sort(
    ([, a], [, b]) => b - a,
  )[0][0] as ScriptAnalysis["emotion"];
  const totalWords = text.trim().split(/\s+/).length;

  // Luxury level: weighted blend of luxury + epic + dramatic signals
  const rawLuxury =
    (luxuryScore * 3 + epicScore * 2 + dramaticScore) /
    Math.max(totalWords / 10, 1);
  const luxuryLevel = Math.min(100, Math.round(rawLuxury * 15 + 20));

  // Persona tags based on dominant emotion
  const personaMap: Record<ScriptAnalysis["emotion"], string[]> = {
    luxury: [
      "Luxury Property Buyer",
      "High-Net-Worth Investor",
      "Lifestyle Seeker",
    ],
    dramatic: [
      "Cinematic Storyteller",
      "Brand Builder",
      "Impact-Driven Creator",
    ],
    corporate: [
      "Institutional Investor",
      "Business Decision Maker",
      "Portfolio Manager",
    ],
    warm: [
      "Family Home Buyer",
      "Community-Oriented Buyer",
      "First-Time Homeowner",
    ],
    epic: ["Premium Investor", "Luxury Lifestyle Brand", "Aspirational Buyer"],
    mysterious: [
      "Boutique Brand Enthusiast",
      "Exclusive Access Seeker",
      "Tastemaker",
    ],
  };

  const personaTags = personaMap[dominantEmotion].slice(0, 3);

  // Hook score: power words in first sentence × 10, capped at 100
  const firstSentence = text.split(/[.!?]/)[0] || text.slice(0, 120);
  const powerWords = [...LUXURY_WORDS, ...EPIC_WORDS, ...DRAMATIC_WORDS];
  const firstSentencePower = countMatches(firstSentence, powerWords);
  const hookScore = Math.min(
    100,
    firstSentencePower * 12 + (firstSentence.length > 20 ? 10 : 0),
  );

  // Hook suggestions based on what's missing
  const hasSensory = countMatches(text, SENSORY_WORDS) > 0;
  const hasUrgency = countMatches(text, URGENCY_WORDS) > 0;
  const hasSocialProof = countMatches(text, SOCIAL_PROOF_WORDS) > 0;
  const hasStrongOpening = firstSentencePower >= 2;

  const suggestions: string[] = [];
  if (!hasStrongOpening)
    suggestions.push(
      "Open with a powerful, evocative statement that commands attention immediately",
    );
  if (!hasSensory)
    suggestions.push(
      "Add vivid sensory details — what does it look, feel, and sound like?",
    );
  if (!hasUrgency)
    suggestions.push(
      "Inject time-sensitivity or scarcity to create compelling momentum",
    );
  if (!hasSocialProof)
    suggestions.push(
      "Include social proof — awards, recognition, or trusted testimonials",
    );
  suggestions.push(
    "Use the rule of three: group benefits in sets of three for rhythmic impact",
  );

  const timeOfDay = detectTimeOfDay(text);

  // Mood tone description
  const moodToneMap: Record<ScriptAnalysis["emotion"], string> = {
    luxury:
      "Opulent & Refined — Speaks to discerning tastes and elevated lifestyle",
    dramatic: "Intense & Cinematic — Creates visceral emotional impact",
    corporate:
      "Authoritative & Strategic — Builds trust and drives investment decisions",
    warm: "Heartfelt & Inviting — Evokes belonging and emotional connection",
    epic: "Majestic & Inspiring — Commands awe and aspiration",
    mysterious:
      "Enigmatic & Alluring — Creates intrigue and exclusive mystique",
  };

  const propertyType = detectPropertyType(text);

  return {
    emotion: dominantEmotion,
    luxuryLevel,
    propertyType,
    personaTags,
    hookScore,
    hookSuggestions: suggestions.slice(0, 3),
    timeOfDay,
    moodTone: moodToneMap[dominantEmotion],
  };
}

// ─── Text splitting (mirrors ScriptPanel logic) ───────────────────────────────

type SegmentMode = "line" | "sentence" | "paragraph";

function splitText(text: string, mode: SegmentMode): string[] {
  let raw: string[];
  switch (mode) {
    case "line":
      raw = text.split("\n");
      break;
    case "sentence":
      raw = text.split(/[.!?]+/);
      break;
    case "paragraph":
      raw = text.split(/\n\s*\n/);
      break;
  }
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function calcDurationMs(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2500, wordCount * 220 + 1000);
}

// ─── Shot type rotation logic ─────────────────────────────────────────────────

const SHOT_SEQUENCE_LUXURY: DirectorScene["shotType"][] = [
  "aerial-drone",
  "dolly-push",
  "interior-pan",
  "close-up",
  "slow-motion",
  "crane-shot",
  "static-wide",
];
const SHOT_SEQUENCE_CORPORATE: DirectorScene["shotType"][] = [
  "dolly-push",
  "static-wide",
  "close-up",
  "interior-pan",
  "crane-shot",
  "aerial-drone",
  "slow-motion",
];
const SHOT_SEQUENCE_WARM: DirectorScene["shotType"][] = [
  "interior-pan",
  "close-up",
  "static-wide",
  "dolly-push",
  "slow-motion",
  "aerial-drone",
  "crane-shot",
];
const SHOT_SEQUENCE_DRAMATIC: DirectorScene["shotType"][] = [
  "close-up",
  "slow-motion",
  "crane-shot",
  "dolly-push",
  "aerial-drone",
  "interior-pan",
  "static-wide",
];
const SHOT_SEQUENCE_EPIC: DirectorScene["shotType"][] = [
  "aerial-drone",
  "crane-shot",
  "slow-motion",
  "dolly-push",
  "static-wide",
  "close-up",
  "interior-pan",
];

function getShotSequence(
  emotion: ScriptAnalysis["emotion"],
): DirectorScene["shotType"][] {
  switch (emotion) {
    case "luxury":
      return SHOT_SEQUENCE_LUXURY;
    case "corporate":
      return SHOT_SEQUENCE_CORPORATE;
    case "warm":
      return SHOT_SEQUENCE_WARM;
    case "dramatic":
      return SHOT_SEQUENCE_DRAMATIC;
    case "epic":
    case "mysterious":
      return SHOT_SEQUENCE_EPIC;
  }
}

// ─── Camera move descriptions ─────────────────────────────────────────────────

const CAMERA_MOVES: Record<DirectorScene["shotType"], string[]> = {
  "aerial-drone": [
    "Sweeping aerial arc — 180° reveal",
    "Ascending drone rise from ground level",
    "Slow orbital circle with subtle tilt",
  ],
  "dolly-push": [
    "Slow push forward — building anticipation",
    "Smooth tracking dolly through space",
    "Creeping forward reveal with rack focus",
  ],
  "interior-pan": [
    "Graceful horizontal pan across the space",
    "Slow reveal from left to right",
    "Wide-angle sweep capturing depth and volume",
  ],
  "slow-motion": [
    "Ultra-slow motion at 240fps — frozen elegance",
    "Time-stretch capture of ambient movement",
    "Slow-mo reveal with motion blur trails",
  ],
  "static-wide": [
    "Locked-off wide establishing shot",
    "Symmetrical composition — architectural stillness",
    "Grand tableau — hero frame",
  ],
  "close-up": [
    "Macro detail shot — texture and craft",
    "Intimate close-up — human connection",
    "Shallow depth of field — isolated perfection",
  ],
  "crane-shot": [
    "Rising crane — ascending reveal",
    "God's eye descend from height",
    "Sweeping jib arc over the landscape",
  ],
};

// ─── Lighting descriptions ────────────────────────────────────────────────────

const LIGHTING_STYLES: Record<DirectorScene["shotType"], string[]> = {
  "aerial-drone": [
    "Golden hour backlight",
    "Blue hour atmospheric haze",
    "Midday sun — high contrast",
  ],
  "dolly-push": [
    "Motivated side light — cinematic key",
    "Warm tungsten interior",
    "Soft daylight through glass",
  ],
  "interior-pan": [
    "Raking window light",
    "Layered ambient + accent",
    "Luxury warm practicals",
  ],
  "slow-motion": [
    "High-key backlit — ethereal glow",
    "Silhouette against bright window",
    "Moody low-key chiaroscuro",
  ],
  "static-wide": [
    "Magic hour warmth",
    "Dramatic overcast — diffused",
    "High contrast architectural",
  ],
  "close-up": [
    "Macro ring light — clean detail",
    "Rim light separation",
    "Intimate warm-toned key",
  ],
  "crane-shot": [
    "Expansive sky fill",
    "Sunset gradient wash",
    "Soft dawn blue-hour",
  ],
};

// ─── Music mood mapping ────────────────────────────────────────────────────────

function getMusicMood(
  emotion: ScriptAnalysis["emotion"],
): DirectorScene["musicMood"] {
  switch (emotion) {
    case "luxury":
      return "luxury-ambient";
    case "dramatic":
      return "dramatic-swell";
    case "corporate":
      return "epic-rise";
    case "warm":
      return "warm-resolve";
    case "epic":
      return "epic-rise";
    case "mysterious":
      return "tension-build";
  }
}

// ─── Background gradients ─────────────────────────────────────────────────────

const BG_GRADIENTS: Record<ScriptAnalysis["emotion"], string[]> = {
  luxury: [
    "radial-gradient(ellipse at 30% 30%, #1a1000 0%, #0d0a00 40%, #000000 100%)",
    "radial-gradient(ellipse at 60% 40%, #150c00 0%, #080500 50%, #000000 100%)",
    "radial-gradient(ellipse at 50% 20%, #1a1200 0%, #0a0800 50%, #000000 100%)",
  ],
  dramatic: [
    "radial-gradient(ellipse at 40% 30%, #1a0000 0%, #0d0000 40%, #000000 100%)",
    "radial-gradient(ellipse at 60% 50%, #180000 0%, #0a0000 50%, #000000 100%)",
    "radial-gradient(ellipse at 30% 60%, #150000 0%, #080000 50%, #000000 100%)",
  ],
  warm: [
    "radial-gradient(ellipse at 40% 50%, #1c0e00 0%, #0e0700 50%, #000000 100%)",
    "radial-gradient(ellipse at 55% 35%, #1a0c00 0%, #0c0600 50%, #000000 100%)",
    "radial-gradient(ellipse at 45% 60%, #180d00 0%, #0d0800 50%, #000000 100%)",
  ],
  corporate: [
    "radial-gradient(ellipse at 50% 30%, #00061a 0%, #000510 50%, #000000 100%)",
    "radial-gradient(ellipse at 40% 50%, #000818 0%, #000412 50%, #000000 100%)",
    "radial-gradient(ellipse at 60% 40%, #00071c 0%, #000510 50%, #000000 100%)",
  ],
  mysterious: [
    "radial-gradient(ellipse at 40% 40%, #0a001a 0%, #050010 50%, #000000 100%)",
    "radial-gradient(ellipse at 55% 30%, #080018 0%, #04000e 50%, #000000 100%)",
    "radial-gradient(ellipse at 35% 55%, #0c001e 0%, #060012 50%, #000000 100%)",
  ],
  epic: [
    "radial-gradient(ellipse at 50% 30%, #1a0800 0%, #0d0400 40%, #000000 100%)",
    "radial-gradient(ellipse at 40% 40%, #180900 0%, #0c0500 50%, #000000 100%)",
    "radial-gradient(ellipse at 60% 30%, #1c0a00 0%, #0e0500 50%, #000000 100%)",
  ],
};

// ─── Director notes ───────────────────────────────────────────────────────────

const DIRECTOR_NOTES: Record<DirectorScene["shotType"], string[]> = {
  "aerial-drone": [
    "Open on majesty — let the scale breathe before cutting.",
    "The sky is your canvas. Hold the reveal a beat longer than feels comfortable.",
    "Let the property emerge from its landscape — reveal, don't announce.",
  ],
  "dolly-push": [
    "Slow is cinematic. Resist the urge to rush the movement.",
    "The push should feel like an invitation, not a presentation.",
    "Frame the hero element at the end of the move — reward the eye.",
  ],
  "interior-pan": [
    "Capture light playing across surfaces — texture tells the story of quality.",
    "Follow the natural flow of the space; don't fight the architecture.",
    "Let the room reveal itself — each frame should recontextualize the last.",
  ],
  "slow-motion": [
    "Slow motion transforms the ordinary into poetry. Choose your subject carefully.",
    "Find the hidden movement: dust motes, fabric, water — amplify the moment.",
    "The slower the motion, the more intentional it must feel.",
  ],
  "static-wide": [
    "Stillness commands attention. Let the composition do the work.",
    "A perfectly composed frame is a statement of confidence.",
    "Hold on this frame — symmetry and proportion are their own language.",
  ],
  "close-up": [
    "Details justify premium. Show the craftsmanship that distance conceals.",
    "Get closer than you think you need to. The micro contains the macro.",
    "This frame should make the viewer want to reach out and touch.",
  ],
  "crane-shot": [
    "The rise should feel earned — build to it with context from below.",
    "Height creates perspective, not just scale. Show what only height reveals.",
    "Let the crane movement choreograph the landscape.",
  ],
};

// ─── generateDirectorScenePlan ────────────────────────────────────────────────

export function generateDirectorScenePlan(
  text: string,
  analysis: ScriptAnalysis,
  splitMode: SegmentMode,
): DirectorScene[] {
  const segments = splitText(text, splitMode);
  const shotSequence = getShotSequence(analysis.emotion);
  const musicMood = getMusicMood(analysis.emotion);
  const bgGradients = BG_GRADIENTS[analysis.emotion];

  return segments.map((segText, index) => {
    const shotType = shotSequence[index % shotSequence.length];
    const shotIndex = index % 3; // cycle through 3 variations
    const bgIndex = index % bgGradients.length;

    const cameraOptions = CAMERA_MOVES[shotType];
    const lightingOptions = LIGHTING_STYLES[shotType];
    const notesOptions = DIRECTOR_NOTES[shotType];

    const lightingMoodOptions = LIGHTING_MOOD_LABELS[shotType];

    return {
      id: `director-scene-${Date.now()}-${index}`,
      text: segText,
      durationMs: calcDurationMs(segText),
      emotion: analysis.emotion,
      shotType,
      cameraMove: cameraOptions[shotIndex % cameraOptions.length],
      lighting: lightingOptions[shotIndex % lightingOptions.length],
      lightingMood: lightingMoodOptions[shotIndex % lightingMoodOptions.length],
      musicMood,
      backgroundStyle: bgGradients[bgIndex],
      directorNotes: notesOptions[shotIndex % notesOptions.length],
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getShotTypeLabel(shotType: DirectorScene["shotType"]): string {
  switch (shotType) {
    case "aerial-drone":
      return "AERIAL DRONE";
    case "dolly-push":
      return "DOLLY PUSH";
    case "interior-pan":
      return "INTERIOR PAN";
    case "slow-motion":
      return "SLOW MOTION";
    case "static-wide":
      return "STATIC WIDE";
    case "close-up":
      return "CLOSE UP";
    case "crane-shot":
      return "CRANE SHOT";
  }
}

export function getEmotionColor(emotion: ScriptAnalysis["emotion"]): string {
  switch (emotion) {
    case "luxury":
      return "oklch(0.76 0.12 88)";
    case "dramatic":
      return "oklch(0.55 0.20 27)";
    case "warm":
      return "oklch(0.72 0.15 60)";
    case "corporate":
      return "oklch(0.65 0.10 240)";
    case "mysterious":
      return "oklch(0.55 0.18 290)";
    case "epic":
      return "oklch(0.70 0.18 50)";
  }
}

export function getPropertyTypeLabel(type: PropertyType): string {
  switch (type) {
    case "villa":
      return "Villa / Resort";
    case "penthouse":
      return "Penthouse";
    case "mansion":
      return "Mansion / Manor";
    case "commercial":
      return "Commercial";
    case "residential":
      return "Residential";
    case "development":
      return "Development";
    case "land":
      return "Land / Plot";
    case "hotel":
      return "Hotel / Resort";
    case "other":
      return "General";
  }
}

export function getMusicMoodLabel(mood: DirectorScene["musicMood"]): string {
  switch (mood) {
    case "epic-rise":
      return "Epic Rise";
    case "luxury-ambient":
      return "Luxury Ambient";
    case "tension-build":
      return "Tension Build";
    case "warm-resolve":
      return "Warm Resolve";
    case "dramatic-swell":
      return "Dramatic Swell";
  }
}
