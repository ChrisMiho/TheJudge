status: active

# graph-shipping-mode-phase1

Foundation of the two-tool shipping model: move durable writing out of refinement.
Refinement *proposes* (work-folder only, recording the proposed product-truth diff
in `GATE-QUESTIONS.md`); implement *applies* the durable `PRD/sections/` truth and
the code together, by intent; cleanup promotes once at close. Makes spec-forming
conflict-free and kills the spec-ahead-of-code window. Agent-workflow change only —
no `PRD/sections/` product truth. **Does not** touch the base→main guard,
auto-bridge, or concurrency — those are Phase 2. See `DESIGN-BRIEF.md` and
`GAMEPLAN.md`.

Implement **interactively**, not via an autonomous graph run — a run must not
rewrite the skills it is running on.

## Slice table
| Slice | Objective | Depends on | Parallel-ready |
| --- | --- | --- | --- |
| [A](slice-a-proposal-contract.md) | Proposal contract + docs | — | — |
| [B](slice-b-spec-forming.md) | Spec-forming side: refinement proposes; gate reads proposal | A | yes (with C) |
| [C](slice-c-apply-side.md) | Apply side: implement applies truth + code; cleanup promotes once | A | yes (with B) |
| [D](slice-d-sync-verify.md) | Sync + integration verification | B, C | — |

## Implementation map
- Docs/contract: `PRD/instructions/graph-workflow-contract.md`, `preparation-contract.md`, `workflow-reference.md`
- Spec-forming skills: `thejudge-refinement`, `graph-run`, `graph-gate-review`
- Apply skills: `thejudge-implement-all`, `thejudge-implement`, `thejudge-cleanup`
- Mirror: `.agents/skills/**` via `npm run skills:ai-sync`
- Fixtures: `PRD/instructions/skill-fixtures/`

## Autonomous metadata
- Not an autonomous graph run. Implemented interactively on branch
  `graph-shipping-mode-phase1`.

## Preparation gate
- Quality-check: PASS
- Checked artifact: `PRD/work/graph-shipping-mode-phase1/DESIGN-BRIEF.md`
- Findings: none (scope correction applied post-approval: guard/auto-bridge/concurrency confirmed Phase 2)
