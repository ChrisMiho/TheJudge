---
status: ship-ready
---

# player-life-tracker-refinement

Visual-refinement pass on the shipped Player Life Tracker (`system-map.md` → **Player Life Tracker**; DEC-101/102/103/132; REQ-081–085, REQ-111–112; FLOW-013). Remaining approved scope: always-on day/night, wider life/commander-damage tap bands, Game Setup `−`/`+` player count (keep Edit names), Custom starting-life default 60, and In-Depth-matching count→life defaults (2→20, 3+→40).

See `IDEA.md` for the original idea and `DESIGN-BRIEF.md` for the approved scope (final addendum, "always-on day/night + wider tap zones + Game Setup count/life defaults"). `GAMEPLAN.md` has the implementation architecture. Reference screenshots carried over from the shipped `player-life-tracker` work package live in `references/`.

## Slices

| Slice | Goal | Depends on | Status |
| --- | --- | --- | --- |
| [A](./slice-a-always-on-day-night.md) | Remove `dayNightEnabled` end-to-end; header ☀/☾ control always visible | — | done |
| [B](./slice-b-life-band-width.md) | Widen `PlayerLifeCard` life +/− bands by 40% (48px → 67px) | — | done |
| [C](./slice-c-commander-damage-band-width.md) | Widen `CommanderDamageCell` +/− bands by 20% (44px → 53px) | — | done |
| [D](./slice-d-player-count-stepper.md) | Replace Game Setup Players pill row with a −/+ stepper | — | done |
| [E](./slice-e-starting-life-defaults.md) | Custom starting-life default 60 + count-driven starting-life defaults; final ship gates and PRD promotion | — | done |

All five slices are parallel-ready — see `GAMEPLAN.md` for the file/line
overlap analysis (A and E share files with E at non-overlapping sections).

## Implementation map

- `apps/frontend/src/lib/lifeTracker/types.ts`
- `apps/frontend/src/lib/lifeTracker/state.ts`
- `apps/frontend/src/lib/lifeTracker/persistence.ts`
- `apps/frontend/src/lib/lifeTracker/useLifeTracker.ts`
- `apps/frontend/src/components/portal/life-tracker/GameSetupPanel.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx`

## Next step

`/thejudge-implement PRD/work/player-life-tracker-refinement/ slice A`
(Cursor / Claude Code) or
`$thejudge-implement PRD/work/player-life-tracker-refinement/ slice A`
(Codex) — any of A/B/C/D can start first since none block another.

For one unattended agent completing every slice:
`/thejudge-implement-all PRD/work/player-life-tracker-refinement/`.

For a dispatched parallel wave (A/B/C/D together, then E):
`$thejudge-implement-parallel PRD/work/player-life-tracker-refinement/`.
