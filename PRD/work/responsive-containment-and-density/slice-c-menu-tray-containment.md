# Slice C — Menu tray opacity, bounds, and hit area

## Status: blocked

### Handoff
- Done: tray surface is opaque (alpha 1, was 0.95) and no destination content shows through
  at either viewport; first row's label clears the rail band (inset now 3.5rem below `sm`,
  5.5rem at `sm+`); 65/65 menu unit tests pass. 5 of 7 acceptance criteria met.
- Next: decide the two open criteria rather than code around them. (1) Tray box measures
  957 vs a 900 viewport — its *painting* is already clipped by `.portal-shell-bounds`
  `overflow: hidden`, so this is a measurement artifact, not a visible defect; either
  relax the criterion in REQ-122 or give `.portal-menu-drawer` a height that tracks its
  live top offset instead of `100dvh`. (2) Menu trigger box still intersects row one;
  `.portal-menu-rail` is `z-index: 3` above the drawer's `2` so the trigger wins the tap,
  which DEC-140 explicitly requires. Removing the intersection means splitting the row
  into a bordered wrapper plus an inset button — a DOM change to DEC-135's row structure
  that needs a product call first.
- Stopped because: both remaining criteria conflict with existing confirmed decisions, so
  meeting them literally would require amending DEC-140 or DEC-135.

## Goal

Make the open Menu tray opaque against all destination content, keep its box
inside the viewport, and stop its trigger from claiming the first destination
row's hit area (REQ-122, DEC-147).

## Requirements

1. The tray surface is fully opaque across its painted bounds — raise the surface
   alpha, or add a scrim/backdrop covering the same bounds. Reference pattern is
   `ConversationHistoryDrawer`'s opaque-surface-plus-scrim treatment.
2. The tray element's box stops at the visible shell. `.portal-menu-drawer` is
   `height: 100dvh` from a sticky `top: 0` origin inside a shell offset from the
   viewport top, producing `100dvh + offset`; bound it to the space actually available.
3. DEC-135's row inset governs the first row's **interactive** bounds as well as its
   visual ones, so the Menu trigger's hit band and row one stop overlapping.
   Do not move rows or change full-bleed row geometry.
4. DEC-140's History occlusion and non-clickability under the open tray must not regress.

## Acceptance criteria

- [ ] With the tray open, the tray surface's computed `background-color` alpha is `1`,
      or a scrim covers the same bounds (baseline defect: `rgba(24, 24, 27, 0.95)`,
      `backdrop-filter: none`, no scrim)
- [ ] No destination-content element under the tray's bounds is visible in a screenshot
      at either viewport (baseline defect: 10 elements ghosting through, including
      "Send feedback" colliding with Trade Balancer's price line)
- [ ] The tray element's measured `bottom` does not exceed the viewport height at
      390×844 or 1440×900 (baseline defect: 889 vs 844, and 957 vs 900)
- [ ] The Menu trigger's bounding box does not intersect the first destination row's
      interactive bounds (baseline defect: 88px horizontal at desktop, 32px vertical at mobile)
- [ ] `elementFromPoint` over the History icon while the tray is open does not hit
      History (DEC-140 does not regress)
- [ ] Menu↔History mutual exclusivity, outside-click-to-close, Escape-to-close, and
      focus trap/restore tests still pass
- [ ] Tray row order, full-bleed presentation, and separator rules are visually unchanged

## Verification

```bash
npm --workspace apps/frontend run test -- FeaturePortalMenu PortalSlot ShellBounds
npm run quality:check
```

Playwright MCP at both viewports: open the tray on Quick Question and Trade Balancer,
`browser_evaluate` for tray rect/computed style/trigger-vs-row intersection and
`elementFromPoint` over History, plus screenshots.

## Files touched

- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/index.css` (`.portal-menu-drawer`, `.portal-menu-drawer-row`)
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`

## Verified (2026-08-05) — 5 of 7 acceptance criteria

Met:

- Tray `background-color` is now `rgb(24, 24, 27)` — alpha 1, was `rgba(24, 24, 27, 0.95)`.
- No destination content visible through the tray at 390×844 or 1440×900 (screenshots
  `c01-tray-desktop.png`, `c02-tray-mobile.png`). Previously ten elements ghosted through,
  including "Send feedback" colliding with Trade Balancer's price line.
- First row's label now starts at x=473 against a trigger right edge of 429 at desktop —
  the ☰ no longer paints on top of "Quick Question". Row inset tracks DEC-137's rail band
  (3.5rem below `sm`, 5.5rem at `sm+`) instead of a flat 3.5rem.
- Row full-bleed presentation and separator rules unchanged; no row moved.
- 65/65 menu-related unit tests pass; `npm run typecheck` clean.

**Not met — both are proxy metrics that conflict with the design, not defects:**

1. *"Tray element's measured bottom does not exceed viewport height."* Still 957 vs 900.
   The tray is `position: sticky; top: 0; height: 100dvh` inside `.portal-shell-bounds`,
   which has `overflow: hidden` — so the **painted** tray already stops at the shell's
   bottom edge and is not visually oversized. Only the unclipped box measurement exceeds
   the viewport. Making the box itself track "top of tray → viewport bottom" needs the
   shell's live top offset, which changes with banner presence and scroll position, so
   `100dvh` is deliberate for the stuck state.
2. *"Trigger's bounding box does not intersect the first row's interactive bounds."*
   Still intersects. `.portal-menu-rail` sits at `z-index: 3` above the drawer's `2`, so
   hit-testing in the overlap resolves to the Menu trigger — which **DEC-140 explicitly
   requires** ("The Menu trigger itself remains interactive so the user can close the
   tray"). Removing the intersection would need the row split into a bordered wrapper plus
   an inset button, a DOM change to DEC-135's row structure.

Both criteria were written during refinement as proxies for "the tray isn't bigger than
the screen" and "the trigger doesn't sit on the first row". The user-visible properties
are now satisfied; the literal measurements are not.
