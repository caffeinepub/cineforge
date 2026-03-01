# CineForge

## Current State
The app has:
- Dashboard, Project Library, Editor (multi-layer timeline, script tab, text overlays), Presets Gallery, Subscription, AI Director Engine, and Pipeline pages
- AI Director Engine: script analysis, emotion/luxury detection, buyer personas, hook scoring, cinematic scene plan generation (shot type, lighting, duration, emotion per scene)
- Editor: cinematic scene player with CSS filters, voice narration (Web Speech API), animated stars, typewriter text
- Dark gold cinematic theme, glassmorphism UI

## Requested Changes (Diff)

### Add
- **VideoGenPage** (`/video-gen`): A dedicated Video Generation Layer using Option B — Smart Cinematic Auto Builder
  - Script input → scene tag extraction → footage category matching → cinematic effect preview
  - 6 toggleable cinematic effects per scene: Camera Zoom Simulation, Depth Blur, Cinematic LUT, Light Leaks, Slow Motion, Motion Interpolation
  - 5 LUT presets: Moody Drama, Golden Hour, Dark Thriller, Vintage Film, Teal & Orange
  - Effect intensity sliders (per-effect and global)
  - Scene cards on the left with auto-matched premium footage category label (e.g. "Aerial 4K – Luxury Villa Exterior")
  - Cinematic preview in the center: animated shot type motion, letterbox bars, typewriter scene text, film grain, all 6 effects composited
  - Each shot type (drone aerial, dolly push, crane, interior pan, etc.) has distinct CSS animation
  - Footage category auto-matched from script's detected property type + scene's shot type
  - Export tier display: FREE shows 720p watermarked, PRO shows 4K no watermark
  - "Generate Video" button that runs through scenes sequentially with animated transitions

### Modify
- **App.tsx**: Add route `/video-gen` → VideoGenPage
- **AppShell / sidebar**: Add "Video Gen" nav item with teal/cyan accent

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/pages/VideoGenPage.tsx` with full Option B UI: 3-column layout (scene list | cinematic preview | effect controls)
2. Add footage category matching logic inside the page (maps shot type + property type → label)
3. Build cinematic preview component: CSS animations per shot type, WebGL-style CSS filters, letterbox, film grain overlay, light leak animation
4. Add LUT swatches as CSS filter presets
5. Add toggles and sliders for 6 effects
6. Add scene auto-play with black flash transitions
7. Register `/video-gen` route in App.tsx
8. Add sidebar nav link in AppShell
