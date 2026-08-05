# Slice A — Menu tray occludes under-rail History

## Status: planned

## Goal

When the feature-portal Menu tray is open, non-Menu corner-rail chrome (History) must be fully
covered by the tray and must not receive clicks, while the Menu trigger remains available to close
(DEC-140 / REQ-115).

## Requirements

1. With Menu open on a History-bearing destination (In-Depth Question, Quick Question), the History
   icon must not paint through the tray surface.
2. With Menu open, `document.elementFromPoint` over the History icon's former center must return
   tray/menu UI (or other non-History chrome), not the History control.
3. Clicking/tapping where History sits while Menu is open must not open History.
4. The Menu trigger must still toggle the tray closed.
5. Menu-only destinations (Life Tracker, Trade Balancer) keep an opaque open tray over destination
   content without regressing DEC-133/137 hit-area rules (single-zone rail interactive box still
   bounded to what it paints).
6. Do not merge History into the Menu tray, change destination registry/Theme, or alter Menu
   outside-click-to-close.

## Why this fails today

`.portal-menu-rail` is `z-index: 3`; `.portal-menu-drawer` is `z-index: 2`. The side-by-side History
zone therefore sits above the open tray and stays `pointer-events: auto`. Playwright confirmed a
click on History while Menu is open closes Menu (via mutual exclusivity) and opens History.

Preferred fix shape: while Menu is open, ensure the tray surface occludes History and History is
inert/non-hit-testable; keep the Menu zone interactive as the close control. Raising the whole rail
above the drawer without inerting History is insufficient.

## Acceptance criteria

- [ ] With Menu open on Quick Question or In-Depth Question, History does not paint through the tray
- [ ] `elementFromPoint` over History's former center hits tray/menu UI, not History
- [ ] Activating that point does not open the History drawer
- [ ] Menu trigger still closes the open tray
- [ ] Life Tracker / Trade Balancer open-tray opacity and DEC-137 single-zone hit bounds still hold
- [ ] Menu↔History mutual exclusivity when History opens by other means is unchanged

## Verification

```bash
npm --workspace apps/frontend run test -- FeaturePortalMenu
npm --workspace apps/frontend run test -- App.responsive-presentation
npm --workspace apps/frontend run test -- App.mtg-color-themes
npm run quality:check
```

Hit-testing is required for the History-under-tray case (`elementFromPoint` and/or
`pointer-events` / `aria-hidden` assertions). Screenshots alone do not satisfy REQ-115's click
criterion.

## Files touched

- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/index.css` (`.portal-menu-drawer` / `.portal-menu-rail*` open-state stacking)
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- Related rail CSS assertions in `App.responsive-presentation.test.tsx` /
  `App.mtg-color-themes.test.tsx` only if they break
