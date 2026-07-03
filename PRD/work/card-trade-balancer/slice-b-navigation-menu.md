# Slice B — Top-level navigation menu + mode switch

## Status: planned

## Dependencies

None. Parallel-ready with Slice A. Renders a placeholder Trade Balancer slot that Slice C replaces.

## Goal

Add a top-right navigation menu (distinct from and non-overlapping with `ThemeControl`) and an `appMode` view switch that mounts either the Stack Assistant flow or the Trade Balancer, preserving each mode's in-session state. (REQ-067, DEC-088, FLOW-010)

## Requirements

1. New `apps/frontend/src/components/NavMenu.tsx`: a header button that opens a menu listing **Stack Assistant** and **Trade Balancer** with the current mode indicated; selecting a destination calls back with the mode; selecting the current mode is a no-op. Open/close motion is CSS-only and reduced-motion-aware (NFR-006).
2. `App.tsx` gains `appMode: "stack-assistant" | "trade-balancer"` state (default `stack-assistant`). The `NavMenu` mounts in the top-right header alongside `ThemeControl` with **non-overlapping** visual bounds and pointer hit areas at mobile and desktop sizes (DEC-065 precedent — e.g. place `NavMenu` left of the existing `fixed right-3 top-3` `ThemeControl`, or stack them without hit-area overlap).
3. View switch preserves each mode's in-session state while the app stays loaded: the Stack Assistant subtree keeps its state (mount both and toggle visibility, or otherwise avoid unmounting the active flow's state) and Trade Balancer keeps its state across a round-trip. Nothing is persisted across a page reload.
4. Trade Balancer mode renders a placeholder component (e.g. `<div>Trade Balancer</div>` or a stub `TradeBalancer`) so the switch is verifiable before Slice C lands.
5. Chrome only: the Stack Assistant start screen, staged flow, and answered/conversation view are unchanged; no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, `POST /api/ask-ai`, or any endpoint; no backend route.

## Acceptance criteria

- [ ] The nav-menu button is visible in the top-right header on every screen and is visually distinct from `ThemeControl`.
- [ ] Opening the menu lists Stack Assistant and Trade Balancer with the current mode indicated; selecting the other switches the active view without reload; selecting the current mode does not reset state.
- [ ] `NavMenu` and `ThemeControl` bounds/hit areas do not overlap (component/interaction test asserts distinct regions; manual check at mobile + desktop widths).
- [ ] Switching Stack Assistant → Trade Balancer → Stack Assistant preserves an in-progress Stack Assistant flow (e.g. entered game context survives the round-trip) — asserted in an `App` interaction test.
- [ ] Existing `App.*.test.tsx` suites still pass unchanged (Stack Assistant behavior unaltered).

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/NavMenu.test.tsx
npm --workspace apps/frontend run test -- src/App.interaction-flows.test.tsx
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/NavMenu.tsx` (new)
- `apps/frontend/src/components/NavMenu.test.tsx` (new)
- `apps/frontend/src/App.tsx` (`appMode` state, header mount, view switch)
- `apps/frontend/src/App.interaction-flows.test.tsx` (extend, not replace)
</content>
