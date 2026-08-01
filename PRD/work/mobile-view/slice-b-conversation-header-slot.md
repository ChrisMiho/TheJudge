# Slice B — Conversation-view Menu docking

## Status: planned

## Goal

Give the answered/conversation view (`isConversationActive` in `EnrichmentStep`) its own inline
header slot so the feature-portal Menu docks flush to the content card and scrolls away with the
page there too, instead of falling back to a viewport-fixed pill — per DEC-109.

## Requirements

1. `apps/frontend/src/components/EnrichmentStep.tsx` — in the `isConversationActive` branch, replace
   the current `<header><h1>...TheJudge...</h1></header>` with a header mirroring
   `StagedStepHeader.tsx`'s grid pattern: a 3-column grid (`grid-cols-[1fr_auto_1fr]`, same
   `items-center gap-x-3 gap-y-1` treatment) containing the existing brand `<h1>` (unchanged
   gradient/classes), a `<PortalSlot />` in the middle column, and an empty spacer `<div />` in the
   third column (no step name — brand-only, per FLOW-001's updated note; the empty column exists
   only so the slot stays centered top-middle exactly like the 4 staged screens).
2. Import `PortalSlot` from `./portal/PortalSlot` in `EnrichmentStep.tsx`.
3. No other change to the conversation branch: `FrozenContextSummary`, `AskAiWaitingPanel`,
   `ConversationThread`, error/retry block, `FollowUpComposer`, "Start Over", and status message all
   render exactly as before, in the same order.
4. Add an `<App />`-level integration test that drives the flow to the conversation-active state
   (mock `POST /api/ask-ai` success, matching the pattern already used in
   `App.interaction-flows.test.tsx` for reaching the answered view — search that file for its
   `fetchMock`/`/api/ask-ai` setup and the "Decrypt Stack" click flow) and asserts, once
   `ConversationThread` content is visible:
   - the Menu trigger (`role="button"`, `aria-label="Switch feature"`) is present
   - its containing element's `className` contains `"portal-slot-tab"` and does **not** contain
     `"fixed"` (mirrors the existing inline-docking assertion pattern in
     `FeaturePortalMenu.test.tsx`'s `"Slice B: portal chrome integration"` describe block)
   - the brand heading (`role="heading", name: "TheJudge"`) still renders

## Acceptance criteria

- [ ] The conversation/answered view's header renders a `<PortalSlot />` alongside the brand block
- [ ] With `FeaturePortalMenu` mounted (full `<App />`), reaching the conversation-active state docks
      the Menu trigger inline (`portal-slot-tab`, no `fixed` class) instead of the fixed fallback
- [ ] Menu still opens/closes and lists destinations + Theme section identically on this screen
      (no `FeaturePortalMenu.tsx` behavior change needed — confirms Slice A and B compose cleanly)
- [ ] No change to `FrozenContextSummary`, `ConversationThread`, `FollowUpComposer`, retry/error, or
      "Start Over" rendering or behavior
- [ ] `npm --workspace apps/frontend run test -- EnrichmentStep App` passes
- [ ] `npm --workspace apps/frontend run typecheck` passes

## Verification

```bash
npm --workspace apps/frontend run test -- EnrichmentStep App
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/App.interaction-flows.test.tsx` (or a new
  `apps/frontend/src/App.conversation-header.test.tsx` if that file is already large — implementer's
  call, match existing file-size conventions in the directory)

## PRD promotion checklist (executed by `thejudge-cleanup`, not this slice)

- [ ] Confirm DEC-109 and DEC-110 (`sections/decisions/navigation.md`) impact blocks match shipped
      behavior — both were already written with full `Impact:` detail during refinement, so this is
      a verification pass, not new authoring
- [ ] Update the **Feature-portal navigation** entry in `sections/system-map.md` (currently notes
      "top-right `ThemeControl`" and describes the fixed fallback as applying to "destinations
      without a header (e.g. Trade)") to drop the `ThemeControl` corner-control reference and confirm
      the conversation/answered view is no longer listed among headerless fallback cases
- [ ] Update the **Theme palettes** / density-adjacent entries in `sections/system-map.md` that cite
      `apps/frontend/src/components/ThemeControl.tsx` (now deleted) to point at
      `apps/frontend/src/components/portal/ThemeSection.tsx` instead
- [ ] Update the `MockModeBanner` entry in `sections/system-map.md` (currently: "the banner sits
      below `ThemeControl`'s z-index") to reference the Menu instead
- [ ] Flip the relevant `sections/system-map.md` entry/entries from `planned`/`partial` to `shipped`
      (gate: product code wired in `apps/frontend` **and** a cleanup receipt written)
- [ ] Write the cleanup receipt at `PRD/instructions/receipts/mobile-view-<YYYY-MM-DD>.md`
- [ ] Delete `PRD/work/mobile-view/` entirely

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/mobile-view/` ready to delete
