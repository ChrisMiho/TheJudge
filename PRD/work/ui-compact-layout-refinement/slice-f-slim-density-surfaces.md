# Slice F — Slim Density Surface Pass

## Status: pending

## Goal

Apply slim-density overrides to high-scroll components via CSS attribute selectors and targeted class updates. Chunky mode must remain a visual no-op vs pre-package behavior.

## Requirements

| Component | Slim change |
| --- | --- |
| `StagedStepHeader.tsx` | Brand `text-3xl` → `text-2xl`; step name smaller |
| `EnrichmentStep.tsx` | Tighter list scroll cap variable (builds on Slice D) |
| `ZoneCardPicker.tsx` | Tighter grid gap / tile height (builds on Slice B) |
| `ScanCameraSurface.tsx` | `.scan-video`: `aspect-[4/5]` + `max-h-[50dvh]` in slim |
| `CardSelectionPreview.tsx` | Placeholder `min-h-56` → `min-h-40` in slim |
| `ConversationThread.tsx` | `max-h-96` → `max-h-72` in slim |
| `FrozenContextSummary.tsx` | Tighter disclosure padding in slim |
| `App.tsx` game-context | Adopt `.panel-inner` for players section |

Lower priority: `ZoneConfirmStep` checkbox gaps, `AskAiWaitingPanel` padding.

## Acceptance criteria

- [ ] Chunky mode on all touched screens matches pre-slice visuals (spot-check or snapshot where available).
- [ ] Slim mode visibly tightens spacing on reference screens without breaking touch targets or readability.
- [ ] Zone card grid still shows 4 cards before scroll in both densities.

## Dependencies

- `sequential`: Slice E — density tokens and `PageShell` must exist

## Files touched

- Components listed above
- `apps/frontend/src/index.css`

## Verification

```bash
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
```

Manual: toggle Slim on mobile width for zone collection (scan open), enrichment list, answered conversation.
