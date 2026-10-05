# Slice C evidence

## Apply (by intent, against current truth)

- `PRD/sections/functional-requirements.md`: `### REQ-217` appended after REQ-216. Notes reworded to name the shipped helper `lifeHalves.ts` and that `seatArrangement.ts` is unchanged (the diff said the change lived in the card's `halves` split).
- `PRD/sections/decisions.md`: DEC-170 row amended in place (superseded by REQ-217); no DEC row added.
- `PRD/sections/life-tracker/README.md`: Backed-by gains REQ-217; Life table split bullet rewritten for the near-edge rule in both layouts.
- `PRD/sections/system-map.md`: Player Life Tracker summary names the near-edge rule (REQ-217).

## C5 grep dispositions

`grep -rn "fixed on-screen left/right\|fixed screen left" PRD/sections`

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md` REQ-217 Description | History: names the old split as the thing REQ-217 replaces. Not a statement of current behaviour. |
| `decisions.md` DEC-170 row | History: retired row, superseded by REQ-217. |
| `system-map.md:543` | History: "grid's earlier fixed screen left/right split reversed 2026-10-04". |

No hit states the old split as current behaviour.

## Ship gates

- Acceptance criteria A1-A7, B1-B7, C1-C5 satisfied (see the three criteria files).
- `npm --prefix apps/frontend test`: 146 files, 1503 tests pass. `npm run quality:check`: exit 0.
- Public contract unchanged: no backend, `GameContext`, persistence or arrangement change.
- No secrets committed.
- Durable outcomes promoted into `PRD/sections/`; the work folder is ready to delete at cleanup.
