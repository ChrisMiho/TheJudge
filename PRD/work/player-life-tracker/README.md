---
status: active
---

# player-life-tracker

Suite life-counter feature (peer to standalone MTG life-tracker apps), with a
one-way MTG Assistant game-context handoff. UI direction is fixed by the
reference photos under `references/`.

See `IDEA.md` for the original idea, `DESIGN-BRIEF.md` for scope, and
`GAMEPLAN.md` for architecture.

## Decisions & requirements

- DEC-101 (feature), DEC-102 (additive counter contract), DEC-103 (persistence)
- REQ-081–085, FLOW-013

## Slices

| Slice | Objective | Depends on | Status |
| --- | --- | --- | --- |
| [A](slice-a-counter-contract.md) | GameContext per-player counter contract (REQ-083 / DEC-102) | — | planned |
| [B](slice-b-state-and-persistence.md) | Tracker state model, seat arrangement, browser-local persistence (REQ-084 / DEC-103) | — | planned |
| [C](slice-c-life-screen.md) | Tracker destination + full-table life screen (REQ-081) | B | planned |
| [D](slice-d-counter-panel.md) | Counter panel + commander-damage matrix (REQ-082) | B, C | planned |
| [E](slice-e-assistant-seed.md) | Tracker → MTG Assistant one-way seed + PRD promotion (REQ-085 / FLOW-013) | A, B, C, D | planned |

A and B are independent foundations (parallel-ready); C then D are sequential on
the UI; E lands last (seeds counters from D, rides the Slice A contract).

## Implementation map

| Area | Path |
| --- | --- |
| Tracker logic + persistence (pure) | `apps/frontend/src/lib/lifeTracker/` |
| Tracker components | `apps/frontend/src/components/portal/life-tracker/` |
| Destination registry | `apps/frontend/src/components/portal/destinationRegistry.tsx` |
| Seed handoff | `apps/frontend/src/lib/portal/seedContext.tsx`, `App.tsx`, `MtgAssistantApp.tsx` |
| FE contract types | `apps/frontend/src/types.ts` |
| BE contract + prompt | `apps/backend/src/validation/askAiRequest.ts`, `apps/backend/src/prompt/{context,promptFormatting}.ts` |
| Eval goldens | `apps/backend/src/eval/fixtures/*.golden.json` |

## Reference assets

`references/IMG_9504` (life screen), `9505`/`9506` (counter panel + matrix),
`9509` (Game Setup retained; Gameplay toggles dropped except commander-damage→life).
`9507`/`9508`/`9510`/`9511`/`9512` are deferred surfaces.
