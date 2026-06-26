---
status: active
---

# ui-compact-layout-refinement

Frontend presentation pass to reduce vertical scroll across the staged flow: compact game context, zone card list grid, focused scan UI, enrichment list scroll caps, and a global **Chunky / Slim** layout density toggle in the theme panel.

See [IDEA.md](IDEA.md) for problem, outcome, and non-goals. See [DESIGN-BRIEF.md](DESIGN-BRIEF.md) for approved scope, decisions, and REQ/FLOW references.

## Origin

Captured from an interactive planning session (2026-06-25) covering game context layout, zone collection card list, scan-mode chrome, enrichment list mode, and layout density personalization. Zone confirmation (`ZoneConfirmStep`) was reviewed and explicitly excluded.

## PRD references

| ID | Title |
| --- | --- |
| DEC-075 | Chunky / Slim layout density toggle |
| DEC-076 | Staged-flow presentation compaction |
| REQ-055 | Layout density preference |
| REQ-056 | Staged-flow screen compaction |
| FLOW-008 | Choose and persist layout density |

## Scope summary

| Screen / area | Change |
| --- | --- |
| Game context | Cat-wizard Easter egg; turn phase + active player side-by-side; wider player-control buttons |
| Zone collection | 2×2 card tile grid (max 4 visible, scroll rest); remove empty-state suggestion placeholder; scan mode hides search, list, picker preview, owner select, and outer flow action buttons; Exit scan and Capture stay on the camera |
| Enrichment | View all cards: per-zone scroll cap (4 rows) |
| Global | Chunky/Slim toggle in `ThemeControl`; shared `PageShell` + CSS density tokens |
| Unchanged | Zone confirmation step |

## Implementation map

[GAMEPLAN.md](GAMEPLAN.md) is the authoritative architecture and sequencing doc. Slices are grouped into waves for optional parallel implementation.

## Slice table

| Slice | File | Status | Objective | Wave | Dependencies |
| --- | --- | --- | --- | --- | --- |
| A | `slice-a-game-context-refinements.md` | done | Easter egg, merged turn-phase row, wider player buttons | 1 | None |
| B | `slice-b-zone-card-list-grid.md` | done | 2-column zone card grid, 4 visible then scroll | 1 | None |
| C | `slice-c-zone-scan-focused-ui.md` | done | Hide picker and outer flow chrome while scanning; Exit and Capture on camera; drop manual-entry prompt | 1 | None |
| D | `slice-d-enrichment-list-scroll-cap.md` | done | View all cards: 4 rows per zone then scroll | 1 | None |
| E | `slice-e-layout-density-foundation.md` | done | Density prefs, theme toggle, `PageShell`, CSS tokens | 2 | None |
| F | `slice-f-slim-density-surfaces.md` | done | Slim overrides on high-scroll components | 3 | E |
| G | `slice-g-prd-promotion-and-ship-gates.md` | pending | DEC/REQ promotion, integration tests, verification | 4 | A–F |

Wave 1 slices (A–D) are independent screen refinements and can run in parallel. Slice E can also start in parallel with wave 1 but slice F requires E. Slice G is last.
