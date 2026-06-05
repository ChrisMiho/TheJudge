# Slice D — AskAiWaitingPanel component

## Status: done

## Dependencies

- Slice A (`lib/askAiWaitStages.ts`)
- Slice B (`.wait-stage-*` CSS classes in `index.css`)
- Slice C (`hooks/useElapsedWaitTimer.ts`)

## Goal

Build the self-contained waiting panel component: elapsed timer display, `aria-live` escalating message region, and variant-keyed CSS animation class.

## Requirements

1. `AskAiWaitingPanel({ isSubmitting: boolean }): JSX.Element`.
2. Calls `useElapsedWaitTimer(isSubmitting)` internally to get `{ elapsed, stage }`.
3. Renders elapsed time via `formatElapsed(elapsed)` — e.g. `0:07`.
4. Applies `wait-stage-{stage.variant}` class to the root panel element.
5. Renders the stage message in a `<p aria-live="polite" aria-atomic="true">` element so screen readers announce transitions.
6. Styling matches the existing card-panel aesthetic: `rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4` (same as EnrichmentStep card rows).
7. Timer text is visually prominent (`text-2xl font-mono`).
8. No external animation library imports.

## Files touched

- `apps/frontend/src/components/AskAiWaitingPanel.tsx` (create)
- `apps/frontend/src/components/AskAiWaitingPanel.test.tsx` (create)

## Tests

Use `@testing-library/react` with fake timers where needed.

- Renders with `aria-live="polite"` region present
- Initial message matches WAIT_STAGES[0].message ("Consulting the stack…")
- After advancing 8s with fake timers: message updates to the 8s threshold message
- Timer display shows `"0:00"` initially
- After 65s: timer displays `"1:05"`
- Root element includes the `wait-stage-calm` class initially
- Root element includes `wait-stage-absurd` after 40s

## Acceptance criteria

- [ ] `aria-live="polite"` and `aria-atomic="true"` present on the message element
- [ ] Class on root element updates when stage changes (verifiable in DOM)
- [ ] Timer and message render without console errors
- [ ] All unit tests pass: `npm --workspace apps/frontend run test -- AskAiWaitingPanel`

## Verification

```bash
npm --workspace apps/frontend run test -- AskAiWaitingPanel
npm --workspace apps/frontend run typecheck
```
