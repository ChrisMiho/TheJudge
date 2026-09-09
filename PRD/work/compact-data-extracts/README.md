# compact-data-extracts

status: active

## Summary

Re-encode the committed backend data extracts (brotli, 128-combo blocks) so
the full fresh corpus fits the 120 MB Lambda budget without trimming. See
`IDEA.md` for problem, outcome, non-goals, intake, and prior-run matches.

## Slices

| Slice | Scope | Depends on | Status |
| --- | --- | --- | --- |
| A | Combo block layout + index directory in the build script | none | done |
| B | Catalog loader reads the block layout | A | done |
| C | Brotli for rulings / card-detail / prices, build + loader | none | done |
| D | File-name sweep across path lists and readers | A, B, C, E | done |
| E | Positional-int compact index | A, B | done |
| F | Regenerate, verify, amend PRD (20 accepted diffs) | A, B, C, D, E | planned |

Full architecture, data flow, and risk notes: `GAMEPLAN.md`.

## Implementation map

- `scripts/build-commander-spellbook-combos.mjs` — slices A, E
- `apps/backend/src/commanderSpellbook/catalog.ts` — slices B, E
- `scripts/build-card-rulings.mjs`, `scripts/build-card-detail-by-oracle-id.mjs` — slice C
- `apps/backend/src/cardRulings.ts`, `cardDetail.ts`, `cardPrices.ts` — slice C
- `scripts/refresh-and-open-pr.mjs`, `createConfiguredApp.ts`, eval readers,
  `prompt-fidelity.mjs`, `compare-combo-answer-quality.mjs`, `.gitignore`,
  root `README.md` — slice D
- `apps/backend/data/*` (regenerated), `PRD/sections/*` (20 accepted diffs),
  `scripts/lambda-package-budget.test.mjs` — slice F

## Intake

- `intake/GRAPH-BRIEF.md` (originally staged at
  `.worktrees/.graph-intake/graph-20260908-233747/GRAPH-BRIEF.md`) — evidence
  only, not authority.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/compact-data-extracts/DESIGN-BRIEF.md`
- Findings: none. Amendment set verified complete by the reviewer's own grep —
  20 stable-ID slots cover every `PRD/sections` line that the brotli/rename
  change would make stale, every slot's "before" text is byte-identical to
  current truth, `GATE-QUESTIONS.md` is well-formed, and `PRD/sections/` is
  unedited. (Attempt 1 FAILed on a missed amendment set — REQ-167, REQ-180, and
  four `integrations-and-data.md` card-detail lines — fixed at define attempt 2.)
