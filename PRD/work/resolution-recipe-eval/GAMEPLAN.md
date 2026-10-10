# Gameplan — resolution-recipe-eval

What a player sees: nothing. This package builds the test bench that tells the
owner whether giving Luna a layer-and-timing recipe makes its hard-interaction
answers better, and what that costs in answer time. The paid comparison runs
after this code merges, launched by the owner. The build makes no live OpenAI
call; dry runs only.

Source of truth for every slice: `DESIGN-BRIEF.md` (Build scope, Arm R, Hard
case set, Comparison design) and `GATE-QUESTIONS.md` (all 24 slots accepted
2026-10-10). The accepted `PRD/sections/` diff blocks are applied by the build
together with the code, by intent against current truth, in the slice named
below.

## Architecture

```text
scripts/lib/diagnostic-arms.mjs      registry A B C D P + R; one shared substitution helper (P, R)
apps/backend/src/eval/answer-quality/arm-r-recipe.json   replaces / recipe / approvedOn (G2 text)
scripts/eval-answer-quality.mjs      loads R's file; run-start fidelity check; arm rules in validateArmUse
scripts/build-answer-quality-manifests.mjs   --append-diagnostic, verifying --check, re-draw keeps groups
scripts/lib/answer-compare.mjs + scripts/eval-answer-compare.mjs   --repeats selectors, answer-level counts
apps/backend/src/eval/answer-quality/rubric.ts   Correctness 2 excludes a material side error (G5)
apps/backend/src/eval/worked-solutions/*.case.json   16 new hard cases (G3-01..G3-16)
docs/eval/resolution-recipe/RUNBOOK.md   paid-run runbook (outlives the package)
```

## Data flow

Hard cases (F) are appended to the diagnostic manifest (B). The owner's paid
run builds the A prompt and the R prompt (A) for each case, asserting the raw
request and the schema-parsed request give the same prompt (D), grades under the
strict rubric (E), and reads the result through the compare report (C), applying
the G4 rule written in the runbook (G).

## Slices

| Slice | Title | Applies accepted block | Depends on |
| --- | --- | --- | --- |
| A | Arm R: recipe substitution arm | REQ-230 (arm R, both flows, approval refusal, held-out-when-frozen lines), G1, G2 | none |
| B | Manifests: recorded append and verifying check | REQ-230 (appended groups, `--check`) | none |
| C | Compare report: repeat selectors and answer-level counts | REQ-228 | none |
| D | Game-case request fidelity check | REQ-230 (fidelity check) | none |
| E | Strict grading revision | REQ-187 (G5) | none |
| F | Sixteen hard cases and the offline gate | REQ-224, REQ-185, G3-01..G3-16 | B |
| G | Runbook, truth sweep, ship gates | G4; final REQ-230/228/187/224/185 consistency | A, B, C, D, E, F |

A through E touch different files and can run in any order; they share
`PRD/sections/functional-requirements.md`, so each edits only its own lines.
F needs B's append command. G runs last.

## Placement

- Outlives the package: `docs/eval/resolution-recipe/RUNBOOK.md` (the report
  `REPORT.md` is written there after the paid run, not by the build).
- Committed cases: `apps/backend/src/eval/worked-solutions/`.
- Nothing under `apps/backend/src/prompt/`, routes or providers changes.
- Evidence under `PRD/work/resolution-recipe-eval/evidence/` dies with the
  package; nothing durable points at it.

## Verification checklist

- [ ] `npm run test:scripts` green
- [ ] `npm --workspace apps/backend run test` green for touched eval tests
- [ ] `npm run typecheck` and `npm run lint` green
- [ ] `npm run quality:check` green (slice G)
- [ ] Dry run of the paid command prints calls and an estimate, spends nothing
- [ ] `grep -rn "confirm-live-calls"` over this package's diff shows it only as a
      runbook step the owner runs, never in a verification command
- [ ] `git diff origin/main --stat -- apps/backend/src/prompt` is empty
