# CineForge — Human Voice Engine

## Current State
CineForge is a cinematic video editor web app on ICP (Motoko + React). It has:
- Dashboard, Projects, Editor, Presets, Subscription pages
- AI Director Engine (scene planning, emotion detection)
- Pipeline page (7-stage orchestration simulation)
- Video Gen page (Option B cinematic auto-builder)
- Sidebar navigation with 7 items

## Requested Changes (Diff)

### Add
- New `/voice-engine` page: "Human Voice Engine"
- Voice profile selector: Male Luxury, Female Premium, Corporate Investor, Dramatic Trailer (4 preset voices)
- Emotional tone control: Dramatic, Soft, Neutral, Intense, Warm, Authoritative (6 options with visual selectors)
- Accent selection: American, British, Australian, Indian, European (5 accents)
- Speed control: slider (0.5x — 2.0x) with labeled presets (Slow / Normal / Fast)
- Pitch control: slider (-5 to +5 semitones)
- Volume control: slider
- Natural breathing toggle
- Script editor with inline markup support:
  - [dramatic] tag — triggers dramatic tone shift on that segment
  - [soft tone] tag — triggers softer delivery on that segment
  - [pause] tag — inserts a pause at that point
- Live script preview panel showing parsed segments with color-coded tag highlights
- "Synthesize Voice" button triggering Web Speech API with applied settings
- Playback panel: play/pause/stop controls, waveform visualization (CSS/canvas animated)
- Tag insertion toolbar (buttons to insert [dramatic], [soft tone], [pause] at cursor)
- Voice Engine added to sidebar navigation (purple accent)

### Modify
- Sidebar: add "Voice Engine" nav item with Mic icon and purple accent color
- App.tsx: add `/voice-engine` route

### Remove
- Nothing removed
