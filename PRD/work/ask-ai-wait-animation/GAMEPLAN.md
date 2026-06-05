# GAMEPLAN — ask-ai-wait-animation

## Architecture

Pure frontend-only feature. No backend, API, or data contract changes.

### Module map

```
lib/askAiWaitStages.ts          — threshold config + stage selector (pure, no React)
hooks/useElapsedWaitTimer.ts    — setInterval hook; returns elapsed seconds + current stage
components/AskAiWaitingPanel.tsx — timer display, aria-live message region, CSS variant classes
index.css                       — @keyframes for wait-stage-* animation classes
components/EnrichmentStep.tsx   — conditionally renders WaitingPanel in place of submit form
```

### Data flow

```
useAskAiSubmitOrchestration
  └── isSubmitting: boolean
        │
        ▼ passed to EnrichmentStep
  EnrichmentStep
    ├── isSubmitting=false → renders existing submit form (unchanged)
    └── isSubmitting=true  → renders <AskAiWaitingPanel />
                                └── useElapsedWaitTimer(isSubmitting)
                                      ├── setInterval 1s tick while isSubmitting
                                      ├── elapsed: number (seconds since submission start)
                                      └── stage: WaitStage  ← selectStage(elapsed, WAIT_STAGES)
```

### Stage config shape

```ts
type WaitStage = {
  threshold: number;  // seconds
  message: string;
  variant: "calm" | "curious" | "absurd";
}
```

Variant drives the CSS class `.wait-stage-calm`, `.wait-stage-curious`, `.wait-stage-absurd` applied to the panel — lightweight keyframe changes only.

### CSS keyframe approach

Three named keyframe animations, each applied via a utility class:

- `.wait-stage-calm` — gentle opacity pulse (stages 0–8s)
- `.wait-stage-curious` — slightly faster pulse (stages 15s+)
- `.wait-stage-absurd` — playful drift (stages 40s)

NFR-006 explicitly permits CSS keyframes for functional wait states.

### `aria-live` region

A `<p aria-live="polite" aria-atomic="true">` wraps the threshold message. React re-renders on stage change; the DOM text update triggers an announcement without managing focus.

## Verification checklist

- [ ] `npm --workspace apps/frontend run test` passes
- [ ] `npm --workspace apps/frontend run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Waiting panel renders in place of the submit form while `isSubmitting`
- [ ] Submit form returns when `isSubmitting` goes false (response or error)
- [ ] Elapsed timer increments visually in the browser
- [ ] Messages escalate at the correct thresholds (manual timing spot-check)
- [ ] `aria-live` region present in DOM (inspect element)
- [ ] Card list and wizard context above the form remain visible during wait
- [ ] No animation library added to `package.json`
