# life-tracker-spec

Write a current-state feature spec for the Player Life Tracker at
`PRD/sections/life-tracker/`, the first directory in Phase A of the
documentation refactor (`PRD/work/adhoc/refactor-gameplan.md`, staged intake
only — cited, not opened). Today the feature's product truth is split across
the decision log (`DEC-101`, `DEC-102`, `DEC-103`, `DEC-132`, `DEC-136`,
`DEC-139` across `decisions/player-life-tracker.md` and
`decisions/game-context-model.md`), `functional-requirements.md`
(`REQ-081`–`REQ-085`, `REQ-111`, `REQ-112`), `user-flows.md` (`FLOW-013`), and
a one-paragraph `system-map.md` entry — no single document an owner can read
without an agent translating supersession history. Outcome: one player-facing
current-state spec that consolidates the shipped tracker (life counters,
commander damage, game setup, seed handoff into MTG Assistant) so it reads
standalone. Non-goals: no product-code change, no change to shipped tracker
behavior, no retiring or reordering the decision log (that is Phase C, a
separate manual session), and no work on the other six Phase A directories
(`user-feedback`, `trade-balancer`, `scan`, `quick-lookup`, shared chrome,
`in-depth`).

## Prior run

- `PRD/instructions/receipts/player-life-tracker-2026-08-03.md`
- `PRD/instructions/receipts/player-life-tracker-refinement-2026-08-05.md`
