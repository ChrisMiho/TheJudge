# Slice A — Header recenter and step-name eyebrow relocation

## Status: planned

## Goal

Recenter the brand block in the staged-step header and relocate the step-name
text out of header chrome into an in-flow `StepEyebrow` label rendered by each
step above its own first content line.

## Requirements

1. `StagedStepHeader.tsx` drops the `stepName` prop entirely and no longer
   renders any step-name text. Its grid keeps three columns (`PortalSlot`
   left, brand block center, empty spacer right) so the brand block sits at
   true center without any special centering logic — removing the
   variable-width step-name text from the opposite corner is what fixes the
   visual-weight mismatch (per DEC-122's root-cause note), not new alignment
   code.
2. The `MTG Assistant` subtitle paragraph (currently grouped with `BrandMark`
   in the header's first column) moves into the same centered column as the
   brand block.
3. New shared component `StepEyebrow.tsx` (`apps/frontend/src/components/StepEyebrow.tsx`):
   accepts a single `stepName: string` prop, renders `<h2 className="step-eyebrow ...">{stepName}</h2>`
   in the same accent-gradient family as `BrandMark` (small, uppercase), so all
   five call sites share one implementation instead of duplicating markup.
   Keep the `heading` role so existing `getByRole("heading", { name: ... })`
   query patterns keep working.
4. Update `index.css`: repurpose/rename the header-row-specific parts of
   `.staged-step-name` into a `.step-eyebrow` class sized for its new in-flow
   position (reuse the existing `clamp()` font-size scale; drop anything that
   assumed header-grid placement).
5. Each of the five callers below renders `<StepEyebrow stepName="..." />`
   itself, positioned directly above that step's own first content line —
   using the exact same string previously passed to `StagedStepHeader`:
   - `ZoneConfirmStep.tsx` — `"Zone confirmation"`, above the
     "Select all zones that apply..." paragraph.
   - `ZoneCollectionStep.tsx` — `"Add cards to zones"`, above the
     "Select a zone, then add cards..." paragraph (still gated by `!isScanOpen`).
   - `EnrichmentStep.tsx` — `"Context enrichment"`, above the
     view-toggle button row.
   - `trade/TradeBalancer.tsx` — `"Trade Balancer"`, above the "Difference" section.
   - `portal/MtgAssistantApp.tsx` — `"Game context"`, above the cat-easter-egg /
     player-roster block; keep the existing `onBrandClick` wiring on
     `StagedStepHeader` unchanged (unrelated to step-name).
6. Life Tracker and the conversation view render no `StepEyebrow` — unchanged
   from today's no-step-name-slot behavior; do not add one.

## Acceptance criteria

- [ ] `StagedStepHeader` no longer accepts or renders a `stepName` prop; TypeScript
      compiles with no callers still passing it.
- [ ] Brand block (`TheJudge` + `MTG Assistant`) renders in the header's center
      column; `PortalSlot` renders in the left column.
- [ ] Each of the five step screens renders its step-name string via
      `StepEyebrow` positioned above its own first content line, not in header chrome.
- [ ] Life Tracker and the conversation view are unaffected (no eyebrow rendered).
- [ ] `StepEyebrow` shares one implementation used by all five call sites (no
      duplicated eyebrow markup per file).

## Verification

```bash
cd apps/frontend && npx vitest run src/components/StagedStepHeader.test.tsx src/components/StepEyebrow.test.tsx src/components/ZoneConfirmStep.test.tsx src/components/ZoneCollectionStep.test.tsx src/components/EnrichmentStep.test.tsx src/components/trade/TradeBalancer.test.tsx
cd apps/frontend && npm run quality:check
```

## Files touched

- `apps/frontend/src/components/StagedStepHeader.tsx`
- `apps/frontend/src/components/StagedStepHeader.test.tsx`
- `apps/frontend/src/components/BrandMark.tsx` (only if grouping the subtitle requires a prop/wrapper change)
- `apps/frontend/src/components/StepEyebrow.tsx` (new)
- `apps/frontend/src/components/StepEyebrow.test.tsx` (new)
- `apps/frontend/src/components/ZoneConfirmStep.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/index.css`
