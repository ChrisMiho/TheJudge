status: active

# resolution-recipe-eval

Measure whether a layer-and-timing resolution recipe (eval-only arm R, amending REQ-230) helps GPT-6 Luna judge hard interactions better than the production prompt, in Quick Lookup and In-Depth. Measurement only.

- Idea: `IDEA.md`
- Intake (verbatim, evidence only): `intake/GRAPH-BRIEF.md`
- Design brief: `DESIGN-BRIEF.md`
- Proposal and owner questions: `GATE-QUESTIONS.md` (REQ-230, REQ-228, REQ-187, REQ-224, REQ-185; blockers G1, G2, G3-01 to G3-16, G4; G5 = the REQ-187 slot)
- Evidence (re-runnable, offline; build deletes it with the package): `evidence/` — cost dry runs and recorded Luna figures (`cost-anchor-dry-runs.txt`, `luna-token-stats.mjs`), G3 card oracle ids (`g3-card-ids.txt`, `resolve-g3-cards.mjs`)
- Gameplan: `GAMEPLAN.md`
- Next: build slices A to G in order (A to E any order, F after B, G last)
- Graph run ledger: `GRAPH-RUN.md`

## Slices

| Slice | Doc | Title | Applies accepted block | Depends on | Criteria | Status |
| --- | --- | --- | --- | --- | --- | --- |
| A | `slice-a-arm-r.md` | Arm R: recipe substitution arm | REQ-230 arm lines, G1, G2 | none | 8 | done |
| B | `slice-b-manifests.md` | Manifests: recorded append and verifying check | REQ-230 manifest lines | none | 6 | done |
| C | `slice-c-compare-report.md` | Compare report: repeat selectors and answer-level counts | REQ-228 | none | 5 | done |
| D | `slice-d-game-fidelity.md` | Game-case request fidelity check | REQ-230 fidelity line | none | 5 | done |
| E | `slice-e-strict-grading.md` | Strict grading revision | REQ-187 (G5) | none | 6 | done |
| F | `slice-f-hard-cases.md` | Sixteen hard cases and the offline gate | REQ-224, REQ-185, G3-01..16 | B | 8 (1 manual) | planned |
| G | `slice-g-runbook-ship.md` | Runbook, truth sweep, ship gates | G4, final consistency | A to F | 7 (1 manual) | planned |

Paid-run runbook lands in `docs/eval/resolution-recipe/RUNBOOK.md` (slice G); cases in `apps/backend/src/eval/worked-solutions/` (slice F).

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/resolution-recipe-eval/DESIGN-BRIEF.md`
- Findings: none (build-half re-grade, commit `831c0ee7`, after the owner's 24/24 accept; spec-forming attempt 1 FAIL, attempt 2 PASS). Report: `QUALITY-CHECK.md`.

## Autonomous metadata

- Autonomous base: origin/main
