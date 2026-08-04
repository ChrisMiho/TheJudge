# GAMEPLAN — center-menu-tab-prominence

Source: `DESIGN-BRIEF.md`, DEC-122 (`PRD/sections/decisions/navigation.md`).

## Architecture

Two independent concerns inside the same header, split into two sequential slices:

1. **Content/DOM structure** — where the brand block and the step-name text sit.
   Touches `StagedStepHeader.tsx`, `BrandMark.tsx`, a new shared `StepEyebrow.tsx`,
   and every step screen that currently passes `stepName` into `StagedStepHeader`.
2. **Trigger visual + interaction** — how the Menu trigger looks and opens.
   Touches only `FeaturePortalMenu.tsx`, `PortalSlot.tsx` (doc comment only), and
   the rail/drawer CSS. Does not depend on where the brand or step-name render,
   only on which grid column the slot lands in from slice A.

Sequential order: A before B, because B's rail sits in the same header grid
column slice A repositions (`PortalSlot` moves from the middle column to the
left column). Implementing B first would mean rebuilding the rail's position
twice.

## Data flow

- `stepName` currently flows: destination screen → `StagedStepHeader` prop →
  rendered as `<h2 class="staged-step-name">` in the header's right column.
- After slice A: destination screen renders `<StepEyebrow>{stepName}</StepEyebrow>`
  itself, positioned above its own first content line. `StagedStepHeader` no
  longer accepts or renders `stepName` at all — it only renders the brand block
  (now centered) and the `<PortalSlot />` (now left-anchored).
- `FeaturePortalMenu`'s slot-registration mechanism (`registerSlot` /
  `unregisterSlot` / `visibleSlotNode`) is unchanged by slice B — only the
  trigger's own markup (radial-gradient rail instead of pill button) and the
  open-state markup (sliding drawer instead of dropdown box) change. The fixed
  fallback (destinations with no header) keeps the same defensive role DEC-109
  already established, repositioned to the top-left corner to match the rail.

## Non-goals (carried from DESIGN-BRIEF.md, do not implement)

- Drawer/dropdown *contents*, the destination registry, or the Theme section.
- Consolidating `EnrichmentStep.tsx`'s pre-existing duplicated brand-block JSX.
- Any part of DEC-121's border/glow-ring visual treatment.
- A step-progress indicator (dots/breadcrumb).
- Backend, contract, prompt, scan, or destination-behavior changes.

## Verification checklist (full package)

```bash
cd apps/frontend && npm run quality:check
```

- `StagedStepHeader.test.tsx`, `FeaturePortalMenu.test.tsx`, and each touched
  step's own test file pass.
- Manual check (dev server): every destination header reads as centered on the
  brand block; the rail is discoverable at the top-left corner with no border;
  the drawer visibly slides in from the left edge; each step's eyebrow label
  sits above that step's own first content line; Life Tracker and the
  conversation view show no eyebrow and are otherwise unaffected.
- `prefers-reduced-motion` still covered for the drawer's open transition
  (mirrors the existing `.portal-menu-motion` reduced-motion coverage test).

## Slices

| Slice | Objective | Depends on | Files |
| --- | --- | --- | --- |
| A | Recenter brand block; relocate step-name into an in-flow `StepEyebrow` above each step's own content | none | `StagedStepHeader.tsx`, `BrandMark.tsx`, `StepEyebrow.tsx` (new), `StepEyebrow.test.tsx` (new), `StagedStepHeader.test.tsx`, `ZoneConfirmStep.tsx`, `ZoneCollectionStep.tsx`, `EnrichmentStep.tsx`, `trade/TradeBalancer.tsx`, `portal/MtgAssistantApp.tsx`, `index.css` |
| B | Rebuild Menu trigger as a top-left corner rail opening a sliding drawer | A (shares the header's left grid column) | `portal/FeaturePortalMenu.tsx`, `portal/PortalSlot.tsx` (doc comment), `portal/FeaturePortalMenu.test.tsx`, `index.css` |

Final slice: B. Carries the Ship gates block and PRD promotion checklist.
