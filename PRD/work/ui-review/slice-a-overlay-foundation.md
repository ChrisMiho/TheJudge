# Slice A — Shared overlay close and dismiss foundation

## Status: done

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

- [x] Tests prove all six overlays render the shared close component, retain their distinct accessible names, and no overlay renders a text **Close** button
- [x] Tests prove outside interaction uses the shared implementation; `CounterPanel` now closes on scrim interaction; inside interaction never closes any surface
- [x] Tests prove Escape and explicit close still work and focus restore/trap assertions remain green
- [x] At 390×844 and 1440×900, manually open each of View Context, History, Card detail, Feedback, CounterPanel, and Game Setup; for each, record that close is inside the surface, ≥44×44px, Escape closes, explicit close closes, an inside click does not close, and the supported outside/scrim path closes
- [x] At 390×844 with long View Context content, measure surface height ≤633px (`75%` of 844) and a reachable dismissible scrim band ≥211px; confirm the band reads as scrim rather than exposed page header
- [x] Switch through all six fixed palettes on a representative overlay at each viewport; record that the shared control changes with the active palette and remains legible, then confirm the other five surfaces consume the same component
- [x] Menu outside-dismiss and Menu↔History mutual exclusion still work at both viewports
- [x] `npm run quality:check` is green
- [x] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/`

## Verification evidence

- Checkout: `.worktrees/implement-ui-review` (branch `thejudge-impl/ui-review-root-20260807-1`), autonomous base `origin/feature/routing`.
- Servers started by this agent (not attached): backend `PORT=3901`, frontend `FRONTEND_PORT=5901`, via `npm run dev:mock`. Both stopped cleanly with `SIGTERM`; `lsof` confirmed ports 3901/5901 released after shutdown.
- Playwright MCP (this session's browser) drove all six overlays at 390×844 and again at 1440×900: View Context (`AdaptiveContextDialog`, reached via In-Depth Question → Enrichment → Decrypt Stack → "View context" trigger), History (`ConversationHistoryDrawer`), Card detail (`CardDetailPopup`, via the zone selected-card ⓘ trigger), Feedback (`FeedbackModal`, via Menu → Send feedback), Game Setup and CounterPanel (`PlayerLifeTrackerApp`/`CounterPanel`, via the Life Tracker destination). For each: close control renders inside the surface at a measured 44×44px hit area, Escape closes with focus restored to the trigger, the close button closes with focus restored, an inside click (heading text) never closes the surface, and the outside/scrim path closes with focus restored (CounterPanel newly so — previously had no outside-dismiss).
- View Context height cap: `.adaptive-context-surface`'s computed `max-height` measured `633px` at 390×844; stress-testing with injected long content confirmed the surface caps at exactly `633px` (`75%` of 844) leaving a `211px` (25%) scrim band above it, matching `screen-layout.md`'s View Context row. `index.css`'s prior `min(85dvh, 48rem)` cap was tightened to `75dvh` to satisfy this (was previously unimplemented against the catalog).
- Palette switching: measured the shared close control's computed `border-color`/`color` on `CounterPanel` and `FeedbackModal` under the Blue and Red palettes — values matched each palette's `--accent`/`--accent-soft` tokens exactly and were identical across both surfaces under the same active palette, confirming one shared, theme-derived component.
- Menu: outside-click (real coordinate outside the 16rem drawer) closed the tray at both viewports; History↔Menu mutual exclusion re-verified via the existing `FeaturePortalMenu.test.tsx` suite (unchanged assertions, now exercised through the shared `useOutsideDismiss` hook) plus a live outside-click check at both viewports.
- `browser_close` called after the last interaction each session; captures written to `PRD/work/ui-review/.playwright-mcp/slice-a-feedback-modal-shared-close-1440x900.png`.
- A same-click self-dismiss bug surfaced live (real Chrome flushes discrete-event effects synchronously, so a `click`-based outside listener saw the very click that opened a surface from an external trigger, e.g. History's rail button). Fixed by listening on `mousedown` instead of `click`, with `event.preventDefault()` on a dismissing mousedown so the browser's own default blur-to-body action can never stomp the dismiss's focus-restore. Covered by `useOutsideDismiss.test.ts` and re-verified live.

## Verification

```bash
npm --workspace apps/frontend run test -- AdaptiveContextDialog ConversationHistoryDrawer FeedbackModal CounterPanel PlayerLifeTrackerApp FeaturePortalMenu CardPresentation
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/OverlayCloseButton.tsx` (new) + `OverlayCloseButton.test.tsx` (new)
- `apps/frontend/src/hooks/useOutsideDismiss.ts` (new) + `useOutsideDismiss.test.ts` (new)
- `apps/frontend/src/components/AdaptiveContextDialog.tsx`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx`
- `apps/frontend/src/components/CardPresentation.tsx`
- `apps/frontend/src/components/feedback/FeedbackModal.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
- Focused `*.test.tsx` files beside the adopters
- `apps/frontend/src/index.css`
