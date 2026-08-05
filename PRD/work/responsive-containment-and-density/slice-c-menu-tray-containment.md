# Slice C — Menu tray rail-hide while open

## Status: planned

## Goal

While the Menu tray is open, hide and disable the Menu and History rail icons so
neither is visible or clickable through the tray; close the tray only via
outside-click or Escape (REQ-127, DEC-150). Builds on the already-shipped opacity
and row-inset work (prior `## Verified` section below), which stays intact.

## Requirements

1. In `FeaturePortalMenu.tsx`, while `isOpen` is `true`, the rail (`.portal-menu-rail`
   — both the Menu trigger and, on History-bearing destinations, the History button)
   is not rendered as an interactive, hit-testable element and is not visually painted
   above/through the drawer. This amends DEC-140's "Menu trigger itself remains
   interactive" clause, which DEC-150 explicitly supersedes: closing now goes through
   the outside-click/Escape handlers already implemented (`handlePointerDown` /
   `handleKeyDown`, lines ~154–182), not the trigger button.
2. The existing outside-click and Escape close handlers are unchanged and remain the
   only close affordances while open.
3. Menu↔History mutual exclusivity (opening History elsewhere still closes Menu, and
   vice versa where that logic exists) is not regressed.
4. Rest-state rail (tray closed) is visually and interactively unchanged — same
   DEC-137 hit-area rules, same NFR-001 44px floors, same row-inset and opacity fixes
   already shipped for this slice.
5. Do not move tray rows, and do not change DEC-135's full-bleed row geometry.

## Acceptance criteria

- [ ] With the tray open on a History-bearing destination (e.g. Quick Question) and a
      Menu-only destination (e.g. Trade Balancer) at 390×844 and 1440×900,
      `document.elementFromPoint` over the former Menu icon center and the former
      History icon center does not resolve to either control (baseline: Menu trigger
      previously intersected row one and remained clickable; History remained hidden
      under the opaque tray but is now additionally non-interactive by design)
- [ ] Neither the Menu nor History icon is visible in a screenshot while the tray is
      open, at either viewport
- [ ] Clicking outside the tray closes it; pressing Escape closes it (existing
      handlers, regression check only)
- [ ] Opening History through any other entry point while Menu is open still respects
      Menu↔History mutual exclusivity
- [ ] Tray-closed rest state is pixel/behavior-unchanged: rail hit areas, DEC-137
      inset, and the opacity/scrim fix already shipped for this slice all still hold
- [ ] Tray row order, full-bleed presentation, and separator rules are visually
      unchanged
- [ ] `FeaturePortalMenu` unit tests (65 previously passing) still pass, plus new
      coverage for the hidden/disabled rail-while-open state

## Verification

```bash
npm --workspace apps/frontend run test -- FeaturePortalMenu PortalSlot ShellBounds
npm run quality:check
```

Playwright MCP at both viewports: open the tray on Quick Question and Trade Balancer,
`browser_evaluate` for `elementFromPoint` over the former Menu/History icon centers,
plus screenshots. Call `browser_close` when finished (`CLAUDE.md`).

## Files touched

- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/index.css` (if the rail needs a `[data-tray-open]`-style hook)
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`

## Verified (2026-08-05, first pass) — carried forward, do not re-litigate

- Tray `background-color` is `rgb(24, 24, 27)` — alpha 1, was `rgba(24, 24, 27, 0.95)`.
  No destination content visible through the tray at either viewport.
- First row's label starts at x=473 against a trigger right edge of 429 at desktop —
  row inset tracks DEC-137's rail band (3.5rem below `sm`, 5.5rem at `sm+`).
- Row full-bleed presentation and separator rules unchanged; no row moved.
- 65/65 menu-related unit tests passed; `npm run typecheck` clean.

The two criteria left unmet in that pass ("tray box `bottom` ≤ viewport height" and
"trigger does not intersect row one") were proxies for containment problems this
slice's rail-hide approach resolves directly — REQ-122's box-bottom and
trigger∩row criteria are retired per DEC-147's Notes; this slice's REQ-127 criteria
above are their replacement.
