# Slice A — Shared overlay close and dismiss foundation

## Status: planned

## Goal

Give the overlay family one theme-derived close control and one authoritative
outside-dismiss implementation without weakening any existing focus or keyboard
contract.

## Requirements

1. Add one shared close-control component and migrate all six adopters:
   `AdaptiveContextDialog`, `ConversationHistoryDrawer`, `CardDetailPopup`,
   `FeedbackModal`, Life Tracker `CounterPanel`, and `GameSetupModal`.
2. Derive the control color from the existing theme-token / palette path; remove
   hardcoded zinc close chrome and both text **Close** controls. Keep each
   adopter's distinct accessible name and a minimum 44×44px hit area.
3. Add one shared outside-dismiss helper/hook and adopt it for every overlay or
   tray that currently dismisses outside: View Context, History, Feedback,
   Game Setup, Menu, and Card detail. Add outside dismissal to `CounterPanel`.
4. Preserve each surface's Escape path, close path, focus trap/restore, portal
   target, and inside-click behavior. Preserve `FeaturePortalMenu`'s document-
   listener reach and Menu↔History mutual exclusion.
5. Apply `screen-layout.md`'s View Context cap: at 390×844 the surface is at most
   `75dvh`, leaving at least 25% (211px) of viewport height as reachable,
   visually legible scrim. Do not shrink the frozen card to create this space.
6. Add focused component tests first; edited Vitest suites follow
   `PRD/instructions/test-naming.md`.

## Acceptance criteria

- [ ] Tests prove all six overlays render the shared close component, retain their distinct accessible names, and no overlay renders a text **Close** button
- [ ] Tests prove outside interaction uses the shared implementation; `CounterPanel` now closes on scrim interaction; inside interaction never closes any surface
- [ ] Tests prove Escape and explicit close still work and focus restore/trap assertions remain green
- [ ] At 390×844 and 1440×900, manually open each of View Context, History, Card detail, Feedback, CounterPanel, and Game Setup; for each, record that close is inside the surface, ≥44×44px, Escape closes, explicit close closes, an inside click does not close, and the supported outside/scrim path closes
- [ ] At 390×844 with long View Context content, measure surface height ≤633px (`75%` of 844) and a reachable dismissible scrim band ≥211px; confirm the band reads as scrim rather than exposed page header
- [ ] Switch through all six fixed palettes on a representative overlay at each viewport; record that the shared control changes with the active palette and remains legible, then confirm the other five surfaces consume the same component
- [ ] Menu outside-dismiss and Menu↔History mutual exclusion still work at both viewports
- [ ] `npm run quality:check` is green
- [ ] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- AdaptiveContextDialog ConversationHistoryDrawer FeedbackModal CounterPanel PlayerLifeTrackerApp FeaturePortalMenu CardPresentation
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/OverlayCloseButton.tsx` (new; exact name may follow existing shared-component conventions)
- `apps/frontend/src/hooks/useOutsideDismiss.ts` or `apps/frontend/src/lib/` equivalent (new, single authoritative definition)
- `apps/frontend/src/components/AdaptiveContextDialog.tsx`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx`
- `apps/frontend/src/components/CardPresentation.tsx`
- `apps/frontend/src/components/feedback/FeedbackModal.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
- Focused `*.test.tsx` files beside the adopters
- `apps/frontend/src/index.css`
