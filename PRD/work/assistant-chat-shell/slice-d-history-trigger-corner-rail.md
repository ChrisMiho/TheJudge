# Slice D — History trigger relocates into the Menu corner rail

## Status: done

## Goal

Move the history drawer's trigger from a full-width button in the
conversation workspace body into an icon-only second zone in the
feature-portal Menu's corner rail (`DEC-126`), and simplify saved-entry row
styling in the drawer itself.

## Requirements

1. Extend `PortalSlotContext`/`PortalSlot` so a destination can register an
   optional `historyTrigger` descriptor alongside its slot node — a stable
   getter (ref-backed, updated every render, no extra effect churn) so
   `FeaturePortalMenu` can read "does the currently visible destination have
   a history trigger, and what does it do" without new prop plumbing between
   `App.tsx` and each destination.
2. `FeaturePortalMenu.tsx` renders the corner rail as today's single hit-zone
   (Menu only) when the visible slot has no history trigger, or a two-zone
   `.portal-menu-rail-split` (Menu on top, History below, `1px` divider)
   when it does — same ambient-glow visual language as today, just taller
   and split, per the mock's `.rail.split`/`.rail-zone` rules (fluid
   `clamp()` height, no fixed breakpoint switch, satisfying NFR-001's 44px
   touch-target floor per zone at every viewport).
3. Both rail icons render as matching inline stroke-SVGs (`viewBox="0 0 24
   24"`, `stroke="currentColor"`, `stroke-width="2"`) — replace Menu's `☰`
   text glyph + `scaleX` hack with a three-line SVG hamburger; History gets
   a clock-in-circle SVG. `aria-label="Switch feature"` stays on Menu;
   History gets `aria-label="Conversation history"`.
4. `EnrichmentStep.tsx` and `StagedStepHeader.tsx` (threaded from
   `QuickLookupApp.tsx`) pass their existing `historyTrigger` value into the
   new slot registration, next to their existing `<PortalSlot />`. Destination
   without a history trigger (Life Tracker, Trade Balancer via
   `StagedStepHeader` with no `historyTrigger` prop) keep today's unmodified
   single-zone rail.
5. `ConversationWorkspace.tsx` drops the full-width `.conversation-history-trigger`
   button block entirely. `ConversationHistoryTriggerDescriptor` drops its
   now-unused `label` field; both call sites
   (`EnrichmentStep.tsx`'s parent, `QuickLookupApp.tsx`) become
   `historyTrigger={{ onOpen: openHistory }}`.
6. `ConversationHistoryDrawer.tsx`'s saved-entry rows drop their
   bordered-card styling for plain, unboxed rows with a quiet
   active/hover background highlight only (no border per entry) —
   `REQ-103`'s acceptance line, not the mock's illustrative group-label
   header.
7. Preserve every mechanic `DEC-125` already established and this decision
   does not touch: drawer open/close, Escape-to-close, focus trap,
   bottom-sheet `<768px` / left-drawer `768px`+ presentation, mutual
   exclusivity with the Menu drawer via `LeftEdgeDrawerContext`.

## Acceptance criteria

- [ ] On a destination with no active conversation, the corner rail renders
      exactly as it does today (single zone, Menu only).
- [ ] Once a conversation is active on In-Depth Question or Quick Question,
      the rail splits into two zones (Menu, History) with a visible divider;
      both icons are inline stroke-SVGs of matching weight/style, not a
      mixed text-glyph/SVG pair.
- [ ] Clicking the History zone opens the same drawer/bottom-sheet as before
      (entries, resume behavior, focus trap, Escape) with no regression;
      opening it closes an open Menu drawer and vice versa.
- [ ] Life Tracker and Trade Balancer render the original single-zone rail
      (no History zone, since they have no history trigger).
- [ ] The workspace body no longer renders any "Conversation history" button
      — `ConversationWorkspace.tsx` has no history-related JSX left.
- [ ] Drawer entries render as unboxed rows (no `border`) with a quiet
      background highlight only on the active/hovered entry.
- [ ] Both rail zones meet a 44×44px (or larger) touch target at a ~360px
      viewport width, with no icon clipping or overlap.
- [ ] `npx vitest run src/components/portal/FeaturePortalMenu.test.tsx src/components/ConversationWorkspace.test.tsx src/components/ConversationHistoryDrawer.test.tsx src/components/EnrichmentStep.test.tsx src/components/StagedStepHeader.test.tsx src/components/portal/quick-lookup/QuickLookupApp.test.tsx` passes, including new/updated cases for the split-rail rendering and the history zone's click/aria behavior.

## Verification

```bash
cd apps/frontend && npx vitest run \
  src/components/portal/FeaturePortalMenu.test.tsx \
  src/components/ConversationWorkspace.test.tsx \
  src/components/ConversationHistoryDrawer.test.tsx \
  src/components/EnrichmentStep.test.tsx \
  src/components/StagedStepHeader.test.tsx \
  src/components/portal/quick-lookup/QuickLookupApp.test.tsx
cd apps/frontend && npm run quality:check
```

Manual (dev server, `npm run dev`): for both In-Depth Question and Quick
Question, start a conversation, confirm the rail splits and both icons are
SVGs; confirm History opens/closes the drawer and coordinates with Menu;
confirm entries render unboxed with a quiet highlight; narrow the viewport to
confirm the rail stays usable and touch targets stay comfortable; confirm
Life Tracker/Trade Balancer are unaffected.

## Files touched

- `apps/frontend/src/lib/portal/slotContext.tsx`
- `apps/frontend/src/components/portal/PortalSlot.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/StagedStepHeader.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/ConversationWorkspace.tsx`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx`
- `apps/frontend/src/index.css`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/components/ConversationWorkspace.test.tsx`
- `apps/frontend/src/components/ConversationHistoryDrawer.test.tsx`
- `apps/frontend/src/components/EnrichmentStep.test.tsx`
- `apps/frontend/src/components/StagedStepHeader.test.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.test.tsx`
