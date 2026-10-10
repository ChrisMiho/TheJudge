# Slice G — Runbook, truth sweep, ship gates

## Status: done

## Goal

The owner can run the paid comparison from one document that outlives this
package, and the product truth reads consistently after every accepted block.

## Requirements

1. `docs/eval/resolution-recipe/RUNBOOK.md`: the command sequence from the brief (manifest check, emit `rr-hard` and `rr-regression`, dry run first, then the owner's `--confirm-live-calls` run, `--resume`, the five compare commands including the noise floor), the cost arithmetic (about $3.55 estimated, likely nearer $2; every live run `--max-cost-usd` 15 or less), the owner's auto-mode allow-rule note, the G4 decision rule exactly as accepted, where the result goes (`docs/eval/resolution-recipe/REPORT.md`, written after the paid run), the grouping of results by "answer already in an attached ruling" using case ids, and the note that harness `latencyMs` is not production `providerElapsedMs`. The runbook states `--confirm-live-calls` only as the owner's step.
2. Re-run the brief's amendment-set grep and check every disposition row: each "amend" and "build" line is done by slices A to F; fix any leftover. Counts reported in the receipt input.
3. Promotion checklist: confirm every accepted block (REQ-230, REQ-228, REQ-187, REQ-224, REQ-185) is present in `PRD/sections/`; nothing durable points into `PRD/work/resolution-recipe-eval/`.
4. Close the build: `npm run quality:check` green.

## Acceptance criteria

- [x] `docs/eval/resolution-recipe/RUNBOOK.md` exists and names the G4 rule as accepted
- [x] The runbook lists every command from the brief, the 15 USD cap rule, and no path under `PRD/work/`
- [x] The amendment-set grep shows no remaining line from the "amend" or "build" dispositions that is stale
- [x] `grep -rn "PRD/work/resolution-recipe-eval" apps scripts docs PRD/sections` finds nothing durable (the runbook and code do not depend on the package)
- [x] `git diff origin/main --stat -- apps/backend/src/prompt` is empty and no route or provider file changed
- [x] `npm run quality:check` passes
- [x] A reader followed the runbook top to bottom up to the first paid command and found it complete (manual)

## Notes (evidence, re-runnable)

- G1, G2: `docs/eval/resolution-recipe/RUNBOOK.md` carries the G4 rule word for word as accepted (four numbered rules and the ship candidate, don't ship, test more verdicts), every command of the brief's runbook shape (manifest `--check`, the two `--emit` commands, the two dry runs, the two live runs with `--resume`, the five compare commands) plus the follow-up for movers, the cost arithmetic, the "every live run passes `--max-cost-usd` of 15 USD or less" rule (caps 6, 3 and 2), the owner's allow-rule note, the grouping by case id, the `latencyMs` versus `providerElapsedMs` note, and where `REPORT.md` goes. `grep -c "PRD/work" docs/eval/resolution-recipe/RUNBOOK.md` -> 0. `--confirm-live-calls` appears in it only in the owner's live-run steps.
- G3: the brief's amendment-set grep (`grep -rnE "REQ-(187|224|228|230)\b|A, B, C, D|B, C, D|C, D and P|B and P|-- --check|no agent sets .approved|Nothing else writes .approved|eaches the same outcome" PRD/sections apps scripts docs --exclude-dir=node_modules`) now returns 134 lines (104 at the brief, plus the lines this build added). Dispositions: all 10 "amend" rows are applied in `PRD/sections/functional-requirements.md` (REQ-185 x2, REQ-187 x2, REQ-224 x2, REQ-228, REQ-230 x3); all 20 "build" rows are done (worked-solutions README 52, 54, 55; `rubric.ts` 59 to 61; `build-answer-quality-manifests.mjs` 65; test lines 67, 68, 69, 72, 79; `eval-answer-compare.mjs` 82; `diagnostic-arms-check.mjs` 83; `eval-answer-quality.mjs` 86, 89; `answer-compare.mjs` 93; `diagnostic-arms.mjs` 94, 95, 98). The remaining pattern hits for the old wordings ("A, B, C, D", "B and P", "C, D and P") are the historical `docs/eval/answer-quality-investigation/` runbook row (brief row 104, kept) and the new arm-list error text. The 74 "keep" rows were not touched.
- G4: `grep -rn "PRD/work/resolution-recipe-eval" apps scripts docs PRD/sections` -> no match.
- G5: `git diff origin/main --stat -- apps/backend/src/prompt apps/backend/src/routes apps/backend/src/providers` -> empty.
- G6: `npm run quality:check` -> exit 0 on the final commit.
- G7 (manual), observation line:

2026-10-10 G7 — read `docs/eval/resolution-recipe/RUNBOOK.md` top to bottom and ran every step up to the first paid command: `git status`, `npm run eval:answer-quality:manifests -- --check` (Check passed), both `--emit` commands with the `HARD` list copied straight out of the runbook (18 ids; manifests of 18 and 44 cases), and both dry runs (`rr-hard`: Arms A (A.1), R (R.1), 216 answer calls, 216 judge calls, $2.56; `rr-regression`: 88 and 88, $1.03), each ending "Re-run with --confirm-live-calls". Found every step runs or is plainly the owner's (the live runs, `--resume`, the compare commands on run folders that do not exist yet, the follow-up, and `REPORT.md`). Nothing missing; no `--confirm-live-calls` was run.

## Verification

```bash
npm run quality:check
git diff origin/main --stat -- apps/backend/src/prompt apps/backend/src/routes apps/backend/src/providers
```

## Files touched

- `docs/eval/resolution-recipe/RUNBOOK.md`
- `PRD/sections/functional-requirements.md` (consistency fixes only)

## PRD promotion checklist

- [x] REQ-230, REQ-228, REQ-187, REQ-224, REQ-185 accepted blocks present in `PRD/sections/functional-requirements.md` (applied in slices A to F)
- [x] No new REQ or DEC (decision log retired); REQ-227 and REQ-226 unchanged

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/resolution-recipe-eval/` ready to delete
