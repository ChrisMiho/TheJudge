# Phase → zone default assumptions

status: active

When the user selects a turn phase, the zone checklist is **pre-checked** per the **Assumed** column. User may uncheck any zone. These are UX hints, not rules-engine truth.

Refine rows as you playtest; update frontend tests when this table changes.

## Zone IDs (v1)

`stack`, `battlefield`, `hand`, `graveyard`, `exile`, `library`, `command`

## Matrix

| Turn phase | Assumed (auto-check) | Suggested (optional second tier — merge into Assumed for simpler v1) |
|------------|----------------------|----------------------------------------------------------------------|
| Untap | battlefield, command | — |
| Upkeep | battlefield, stack, command | graveyard, hand |
| Draw | battlefield, library, hand | graveyard, stack, command |
| Main 1 | battlefield, hand, stack, graveyard | exile, command, library |
| Combat | battlefield, stack, hand | graveyard, exile, command |
| Main 2 | battlefield, hand, stack, graveyard | exile, command, library |
| End step | battlefield, hand, graveyard, stack | exile, command, library |
| Cleanup | battlefield, graveyard | hand, stack, command |
| Stack resolving | stack, battlefield | hand, graveyard, exile, command, library |

## Implementation notes

- Map `TurnPhase` enum values to this table in `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts` (or equivalent).
- **Additive merge** on phase change: union new Assumed zones with existing `selectedZones`; never remove user-selected zones or delete cards.
- v1 may treat **Suggested** same as **Assumed** (all auto-check) to reduce complexity.

## Tests (slice-03+)

- Selecting `draw` checks battlefield, library, hand (minimum).
- Changing phase from `draw` to `combat` adds stack if not already selected; does not remove library from selection.
