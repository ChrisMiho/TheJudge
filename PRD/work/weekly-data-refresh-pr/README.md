status: active

# Weekly data-refresh-and-PR script

See `IDEA.md` for the request, owner's framing, and prior-run matches.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS (build-half re-grade, run graph-20260908-013519, of the gate-finalized proposal — REQ-195 accepted; three proposed diffs match current PRD/sections byte-for-byte, pipeline `data:refresh`→`data:build` real, buildable without a live user)
- Checked artifact: `PRD/work/weekly-data-refresh-pr/DESIGN-BRIEF.md`
- Findings: none

## Slices

| Slice | Title | Status | Depends on |
| --- | --- | --- | --- |
| A | Refresh-and-PR script core (branch, pipeline, commit, push, PR) | done | none |
| B | Change-detection and no-op path | done | A |
| C | npm script wiring | planned | A |
| D | Promote REQ-195 into PRD/sections, together with the code | planned | A, B, C |

See `GAMEPLAN.md` for architecture, the explicit committed-artifact path list,
and the verification checklist. Every slice is unit-tested against injected
git/gh/pipeline fakes — no slice runs `npm run data:refresh`,
`npm run data:build`, or `npm run data:refresh-pr` for real.

## Implementation map

- `scripts/refresh-and-open-pr.mjs` — new (slices A, B)
- `scripts/refresh-and-open-pr.test.mjs` — new (slices A, B)
- `package.json` — `scripts.data:refresh-pr` entry (slice C)
- `PRD/sections/functional-requirements.md` — `### REQ-195` append (slice D)
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md` — amend (slice D)
- `PRD/sections/trade-balancer/README.md` — amend (slice D)
- `PRD/sections/system-map.md` — amend (slice D)
