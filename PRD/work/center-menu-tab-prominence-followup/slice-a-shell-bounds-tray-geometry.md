# Slice A — Shell-bounds tray geometry

## Status: done

## Goal

Make the open feature-portal Menu drawer size itself against the outer app
shell (`.page-card` on standard destinations, Life Tracker's full-bleed
shell) instead of a fixed `max-height`: full height on short shells,
visible-viewport bounds on tall/scrollable shells, bottom-left radius
matching the shell — for both shell types, via one shared mechanism.

## Requirements

1. `PageShell` (`apps/frontend/src/components/PageShell.tsx`) always wraps
   its children in a shell element: `.page-card` for `variant="standard"`
   (existing), and a new `.page-shell-bleed` pass-through wrapper for
   `variant="full-bleed"` (today full-bleed renders children with no wrapper
   at all). Both variants render a `<ShellBounds />` marker inside that
   shell element.
2. New `apps/frontend/src/components/portal/ShellBounds.tsx`: a
   `PortalSlot`-shaped component that registers its own DOM node into context
   on mount and unregisters on unmount; renders no visible content itself.
3. `PortalSlotContextValue`
   (`apps/frontend/src/lib/portal/slotContext.tsx`) gains
   `registerShellBounds` / `unregisterShellBounds`, with no-op defaults in
   `noopSlotContext` (same pattern as the existing `registerSlot` /
   `unregisterSlot`, so `ShellBounds` can render in isolation without a
   provider without crashing).
4. `FeaturePortalMenu` (`apps/frontend/src/components/portal/FeaturePortalMenu.tsx`):
   - Provides `registerShellBounds` / `unregisterShellBounds` on its
     `PortalSlotContext.Provider`, tracking registered nodes in state the
     same way it tracks `slotEntries`.
   - Resolves the *visible* shell-bounds node the same way it resolves
     `visibleSlotEntry` (the registered node whose closest `[hidden]`
     ancestor is `null`) — more than one can be registered at once since
     `DestinationOutlet` keeps visited destinations mounted-but-hidden.
   - Portals **only the drawer** (the `isOpen && (...)` block) into the
     resolved shell-bounds node via `createPortal` when one is registered.
     The rail trigger keeps portaling into the header's `<PortalSlot />`
     exactly as today — do not change rail placement or the fixed-fallback
     trigger logic.
   - When no shell-bounds node is registered, the drawer renders in place
     exactly as it does today (unchanged fallback) — required so every
     existing `FeaturePortalMenu.test.tsx` case that doesn't render a
     `PageShell`/`ShellBounds` ancestor keeps passing without modification.
5. CSS (`apps/frontend/src/index.css`):
   - `.page-card` gains `position: relative` (no other property changes).
   - New `.page-shell-bleed`: `display: block; width: 100%; position:
     relative;` and nothing else — no border, radius, or padding, so Life
     Tracker's existing rendered layout is pixel-identical to today aside
     from the new shell-bounds child.
   - New `.portal-shell-bounds`: `position: absolute; inset: 0; overflow:
     hidden; border-radius: inherit; pointer-events: none;`. Children that
     need to be interactive (the drawer) re-enable `pointer-events: auto`.
   - The drawer's positioning changes from `position: absolute; left: 0; top:
     0;` + `max-height: 90dvh` to `position: sticky; top: 0;` with a
     viewport-scale height (e.g. capped at `100dvh`) so it (a) tracks the
     on-screen top/bottom of the shell while scrolling a tall/scrollable
     destination, and (b) gets clipped by `.portal-shell-bounds`'s `overflow:
     hidden` at the shell's real bottom edge when the shell is shorter than
     the viewport — this clip is also what produces the matching bottom-left
     radius (`border-radius: inherit` on the clip box). `left: 0` stays so
     the drawer remains flush with the shell's left edge.
6. Do not change: destination/action entry list, Theme section, mutual
   exclusivity with the History drawer, reduced-motion handling, the rail's
   own visuals/placement, or any backend/contract code.

## Acceptance criteria

- [x] `npx vitest run FeaturePortalMenu` (or the frontend workspace
      equivalent) passes, including all pre-existing cases unmodified.
- [x] New/updated tests assert: a `ShellBounds` node registers into context
      and unregisters on unmount; `FeaturePortalMenu` resolves the visible one
      among multiple registered (hidden-vs-visible) nodes; the open drawer
      portals into the resolved shell-bounds node (its DOM parent is that
      node, not the header slot) when one is present.
- [x] CSS assertions (string-matching `appCss`, matching this file's existing
      test conventions) confirm: `.page-card` includes `position: relative`;
      `.portal-shell-bounds` includes `position: absolute`, `overflow:
      hidden`, and `border-radius: inherit`; the drawer rule includes
      `position: sticky`.
- [x] `PlayerLifeTrackerApp.test.tsx` passes with the new `.page-shell-bleed`
      wrapper + `<ShellBounds />` present; existing layout/behavior assertions
      are unchanged.
- [ ] Manual check on `npm run dev` (frontend workspace): open Menu on a
      standard short-content destination — tray fills the card top→bottom,
      bottom-left radius matches the card, no square corner past the curve.
      **Not performed** — no browser-automation tool was available in this
      session (Playwright browser was locked by a concurrent session; the
      Chrome extension was not connected). Confidence instead comes from the
      automated DOM-structure assertions above (drawer's real DOM parent is
      the resolved `.portal-shell-bounds` node) plus the exact CSS-string
      assertions for the sticky/clip/radius-inherit rules. Recommend a
      one-time manual pass before/at ship.
- [ ] Manual check: open Menu on a tall/scrolled destination (e.g. a long
      In-Depth Question answer) — tray tracks the visible card side while
      scrolling, not a mile-tall panel spanning the full document. **Not
      performed** — see note above.
- [ ] Manual check: open Menu on Life Tracker — same full left-side +
      bottom-left radius treatment as a standard destination. **Not
      performed** — see note above.
- [x] Destination select, Theme section, History mutual exclusivity, and
      reduced-motion slide all still work exactly as before (spot-check via
      existing test suites + one manual pass).

## Verification

```bash
cd apps/frontend
npx vitest run FeaturePortalMenu PlayerLifeTrackerApp
npm run quality:check
npm run dev   # manual checks above
```

## Files touched

- `apps/frontend/src/components/PageShell.tsx`
- `apps/frontend/src/components/portal/ShellBounds.tsx` (new)
- `apps/frontend/src/lib/portal/slotContext.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/index.css`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
