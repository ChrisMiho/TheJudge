status: ship-ready

# luna-answer-budget

Switch live answers to GPT-6 Luna at default effort under one 30-second answer budget (Lambda about 40 s, retries inside the budget), amend NFR-002, and correct the layers sentence.

- Idea: `IDEA.md`
- Intake: `intake/GRAPH-BRIEF.md` (evidence, not authority)
- Design brief: `DESIGN-BRIEF.md`
- Proposed product truth (owner answers): `GATE-QUESTIONS.md`
- Plan: `GAMEPLAN.md`

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/luna-answer-budget/DESIGN-BRIEF.md`
- Findings: none (attempt 2, build-half re-grade, run `graph-20261009-150059`, commit `d9be4af2`; three non-blocking notes for map-out in `QUALITY-CHECK.md`)

## Slices

| Slice | Doc | Goal | Depends on | Criteria (manual) |
| --- | --- | --- | --- | --- |
| A | `slice-a-answer-budget.md` | Provider deadline, config, factory, credentials script, budget product truth | none | 9 (A9) |
| B | `slice-b-deploy-config.md` | Deploy and bootstrap scripts, docs, env example | none | 6 (none) |
| C | `slice-c-layers-sentence.md` | Layers sentence, 31 goldens, REQ-230 note | none | 6 (C6) |
| D | `slice-d-eval-defaults-and-ship.md` | Eval defaults, compare report, eval product truth, ship gates | none | 9 (D7, D9) |

Criteria files: `slice-<letter>.criteria.json`, all values `false`.

## Implementation map

Backend provider and config (A), shell and docs (B), prompt and goldens (C), eval scripts (D). Product truth from `GATE-QUESTIONS.md` is applied inside A, C and D. Next: `/thejudge-implement PRD/work/luna-answer-budget/ slice A`.
