# Slice A — Always-visible History rail, no View Context overlap

## Status: done

## Goal

On In-Depth Question and Quick Question, make the History corner-rail control always present — every pre-submit step, empty history, and immediately after Start Over — and eliminate its collision with the answered-state View Context trigger, per REQ-107 / DEC-129.

## Requirements

1. Thread a `historyTrigger` (`{ onOpen: () => void }`) through to `StagedStepHeader`/`PortalSlot` on every screen state of both flows, not just the answered workspace:
   - `MtgAssistantApp.tsx:591` (game-context step) — pass `historyTrigger={{ onOpen: openHistory }}` (the `openHistory` function already exists at `:575`).
   - `ZoneCollectionStep.tsx` and `ZoneConfirmStep.tsx` — add a `historyTrigger?: ConversationHistoryTriggerDescriptor` prop, forward it to their `<StagedStepHeader />` call, and pass it from `MtgAssistantApp.tsx`'s render of each step.
   - `EnrichmentStep.tsx:424` — forward the `historyTrigger` prop the component already receives (currently only forwarded at `:385` inside the `isConversationActive` branch) to this pre-submit `<StagedStepHeader />` too.
   - `QuickLookupApp.tsx:281` — pass `historyTrigger={{ onOpen: openHistory }}` (the `openHistory` function already exists at `:217`) to this pre-submit `<StagedStepHeader />`, matching the answered branch at `:235`.
2. Opening History with an empty list must show the existing empty/zero-state drawer (`ConversationHistoryDrawer.tsx`'s "No saved conversations yet" state) rather than the control being hidden or disabled — this already works once the trigger renders; verify it holds at every step above.
3. Fix the corner-rail (`.portal-menu-rail-split`) vs. `.adaptive-context-trigger` visual collision at desktop and ~390×844 mobile widths. The rail is `position: absolute` at the card's top-left corner and grows taller once a `historyTrigger` is present (`index.css:71-152`); `.adaptive-context-trigger` (`index.css:395-397`) currently reserves no clearance for it. Because Requirement 1 makes the rail's two-zone (taller) form the default on every screen of these two destinations, the fix must hold generally, not just in the answered state.
4. Life Tracker and Trade Balancer must continue to render the single-zone Menu-only rail — do not pass a `historyTrigger` from either destination.
5. No change to DEC-125 drawer open/close mechanics, breakpoint sheet/drawer presentation, or Menu/History mutual exclusivity — those are unchanged and already correct.

## Acceptance criteria

- [ ] On In-Depth Question, the History icon is visible and openable on the game-context step, zone-collection step, zone-confirm step, the enrichment pre-submit (cards-review/question) step, and the answered workspace.
- [ ] On Quick Question, the History icon is visible and openable on the pre-submit form and the answered workspace.
- [ ] Immediately after Start Over on either flow, History remains visible and openable without a new successful submit.
- [ ] Opening History with zero saved conversations and no Draft shows the empty-state drawer, not a hidden/disabled control.
- [ ] At a desktop width and at ~390×844, the History hit-target does not overlap, clip into, or sit on the border of the View Context trigger, on both flows' answered states.
- [ ] Life Tracker and Trade Balancer still show the single-zone Menu-only rail (no History zone, no layout change).
- [ ] `npm --workspace apps/frontend run typecheck` and `npm --workspace apps/frontend run lint` pass.
- [ ] Existing tests for `FeaturePortalMenu`, `ConversationWorkspace`, `EnrichmentStep`, `QuickLookupApp` (component test files already in the repo) pass unmodified in behavior they don't target, updated where they assert the previous bare-header behavior.

## Verification

```bash
npm --workspace apps/frontend run typecheck
npm --workspace apps/frontend run lint
npm --workspace apps/frontend run test -- ConversationWorkspace FeaturePortalMenu EnrichmentStep QuickLookupApp ZoneCollectionStep ZoneConfirmStep
```

Manual check: run the app (`npm --workspace apps/frontend run dev`), walk In-Depth Question from game-context through to an answer, trigger Start Over, and confirm History stays visible at every step; repeat on Quick Question; resize to ~390×844 and confirm no overlap with View Context on the answered view.

## Files touched

- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/ZoneConfirmStep.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/index.css`
