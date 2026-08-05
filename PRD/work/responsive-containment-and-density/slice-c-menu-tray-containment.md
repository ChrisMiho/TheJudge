# Slice C — Menu tray opacity, bounds, and hit area

## Status: planned

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
