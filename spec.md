# CineForge

## Current State
The app has a fully functional AI Director page (`/ai-director`) with:
- Script input with style presets (Luxury Real Estate, Corporate, etc.)
- Script analysis: emotion, luxury level, buyer personas, hook score, time of day
- Storyboard generation: scenes with shot types, camera moves, lighting, director notes
- SceneStoryboard grid component with editable duration and cycling shot types
- `scriptAnalysis.ts` utility with all analysis and generation logic

Missing from the Director Engine:
- **Property type detection** (villa, penthouse, commercial office, etc.)
- **Explicit lighting mood labels** (currently generated per shot type, not displayed prominently)
- **Structured scene output card** matching the format: Scene N | Type | Lighting | Duration | Emotion

## Requested Changes (Diff)

### Add
- `propertyType` field to `ScriptAnalysis` interface with detection logic (villa, penthouse, commercial, residential, development, land, hotel, other)
- Property type detection function using keyword matching in `scriptAnalysis.ts`
- `lightingMood` field (short golden-hour-style label) to `DirectorScene` interface  
- Property type badge displayed in the AI Director Analysis panel
- Redesigned SceneStoryboard cards with explicit structured output labels: "Scene N", "Type:", "Lighting:", "Duration:", "Emotion:"
- A "Copy Scene Plan" button that exports the structured plan as plain text matching the user's requested format
- Prominent "Scene Plan Output" section in the storyboard showing the structured plan in a code-like panel

### Modify
- `ScriptAnalysis` interface: add `propertyType` field
- `DirectorScene` interface: add `lightingMood` string (short label like "Golden hour", "Blue hour")
- `analyzeScript()`: add property type detection
- `generateDirectorScenePlan()`: populate `lightingMood` as a short label
- `SceneStoryboard`: redesign cards to display Type/Lighting/Duration/Emotion structure clearly
- `AIDirectorPage`: show property type badge in the analysis panel

### Remove
- Nothing removed

## Implementation Plan
1. Update `scriptAnalysis.ts`:
   - Add `propertyType` to `ScriptAnalysis` interface
   - Add `lightingMood` to `DirectorScene` interface
   - Add property type keyword detection
   - Add `lightingMoodLabel` short-form mapping per shot type + time of day
   - Update `analyzeScript()` to populate `propertyType`
   - Update `generateDirectorScenePlan()` to populate `lightingMood`

2. Update `SceneStoryboard.tsx`:
   - Redesign SceneCard to show structured output: Scene N | Type | Lighting | Duration | Emotion
   - Add a "Structured Plan" panel below the grid with copyable text output

3. Update `AIDirectorPage.tsx`:
   - Add property type badge to the analysis panel (next to emotion badge)
   - Show property type icon and label
