---
status: active
---

# center-menu-tab-prominence

Widen and emphasize the center menu tab so users notice and can use it more easily.

## Refined outcome

- Menu trigger widens automatically via CSS (~10–15% below `768px`, ~25% at/above).
- Thicker accent border and medium accent glow on every viewport.
- Docking, icon-only label, dropdown behavior, and DEC-117 automatic responsive rules stay intact — no user Desktop/Mobile setting.

## Product truth

- DEC-121
- REQ-101
- DEC-109 / REQ-067 / REQ-089 (placement, docking, registry — unchanged)
- DEC-117 / REQ-096 (automatic responsive presentation — must stay intact)

See `DESIGN-BRIEF.md` for approved scope and `GAMEPLAN.md` for architecture, dependency order, and verification.

## Slices

| Slice | Objective | Depends on | Requirements | Status |
| --- | --- | --- | --- | --- |
| [A](slice-a-menu-trigger-prominence.md) | Responsive width + thicker border + medium glow on Menu trigger | — | REQ-101, DEC-121 | done |
| [B](slice-b-assertions-and-ship.md) | Stylesheet/component assertions, regression, cleanup handoff | A | REQ-101 verification | planned |

Sequential: B asserts the selectors and values A introduces on the shared trigger/CSS.

## Implementation map

| Concern | Location |
| --- | --- |
| Menu trigger button | `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` |
| Prominence CSS (width / border / glow) | `apps/frontend/src/index.css` (dedicated class, e.g. `.portal-menu-trigger`) |
| Flush docking (unchanged behavior) | `.portal-slot-tab` in `apps/frontend/src/index.css` + `PortalSlot` |
| Assertions | `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx` (+ optional CSS contract test) |
| Frozen contracts | No Ask AI / Zod / backend / registry / Theme density changes |

## Next step

`/thejudge-implement PRD/work/center-menu-tab-prominence/ slice A`
