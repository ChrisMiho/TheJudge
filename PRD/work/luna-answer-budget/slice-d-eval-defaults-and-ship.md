# Slice D — Eval defaults, compare report, and ship gates

## Status: planned

## Goal

A routine answer-quality run grades gpt-6-luna with a gpt-6.1-sol judge, and the comparison report holds latency against the 30,000 ms production budget.

## Requirements

1. `scripts/eval-answer-quality.mjs`: header (line 5) and comment (line 106) name gpt-6-luna; `DEFAULT_LINEUP` becomes `["gpt-6-luna"]` (line 107); its copy of the judge default (line 118) becomes `gpt-6.1-sol`. `apps/backend/src/eval/answer-quality/judge.ts:76` and its doc comment (:82) follow; the two copies stay in step. The `--bake-off` lineup is unchanged.
2. Timeout wording: comment at `scripts/eval-answer-quality.mjs:1030`, `scripts/lib/experiment-run.mjs:255`, `scripts/lib/answer-compare.mjs` lines 13, 24 and 330. `ASSUMED_TIMEOUT_MS` STAYS 15000; its comment says it is the pre-budget production value used only for runs whose identity record has no `productionTimeoutMs`. The report label changes from 'per-attempt timeout' to 'production timeout'. Runs read the new 30000 from config via the existing regex.
3. Tests follow: `scripts/eval-answer-quality.test.mjs` (lines 94, 96, 1092, 1122, 1152, 1248, 1521, 1547, 1548; prefer constants where the test mirrors defaults), `scripts/lib/answer-compare.test.mjs:296`, `apps/backend/src/eval/answer-quality/judge.test.ts:32`. `apps/backend/src/eval/worked-solutions/README.md:216` names gpt-6-luna as the deployed model.
4. Apply by intent to `PRD/sections/` the accepted slots in `PRD/work/luna-answer-budget/GATE-QUESTIONS.md`: REQ-186 (judge default), REQ-188 (all five blocks: lineup, latency line, effort constraint, timeout wording, code-default note and deployed-model sentence; dated history notes stay), REQ-226, REQ-228.
5. Final slice: carry the PRD promotion checklist (executed by cleanup, which reads this list). Confirm every `amend` row of the DESIGN-BRIEF amendment table is done by one quoted line-level grep, with the brief's grep command, and a disposition per hit; the 'keep as history' rows (REQ-022/188/190 dated notes, `results.json`) stay untouched.
6. No paid eval run, no live provider call, no aws command in this build. Owner steps for the receipt: the post-deploy check (see slice B) and the optional paid arm-A run on the held-out manifest.

## Acceptance criteria

- [ ] D1: DEFAULT_LINEUP is ["gpt-6-luna"] and the script's judge default is gpt-6.1-sol, in step with judge.ts (DEFAULT_JUDGE_MODEL); --bake-off lineup unchanged
- [ ] D2: ASSUMED_TIMEOUT_MS is still 15000 with a comment calling it the pre-budget value; the compare report label reads 'production timeout'
- [ ] D3: The script test suite passes with updated default assertions (lineup, judge, timeout title/constant, report label)
- [ ] D4: The backend judge test asserts gpt-6.1-sol and the backend tests pass
- [ ] D5: PRD/sections carries REQ-186, REQ-188, REQ-226 and REQ-228 as accepted in GATE-QUESTIONS.md; dated history notes untouched
- [ ] D6: Quoted line-level grep from the brief shows no amend row left undone (every hit dispositioned; keep and history rows untouched)
- [ ] D7 (manual): No criterion in this package required a paid run, live provider call or aws command; none was run (attested in the evidence log)
- [ ] D8: Full quality gate passes
- [ ] D9 (manual): A reader confirms the receipt notes list the owner-run post-deploy check, the optional paid arm-A run, the reserved-concurrency risk (five slow answers hold slots up to ~30 s), the REQ-230 wording looseness and the REQ-022 vs 'REQ-178' mix-up

Every deliverable lives outside `PRD/work/` (node 8 deletes the package). No criterion needs a paid run, live provider call or aws command.

## Verification

```bash
npm run test:scripts
npm --workspace apps/backend run test
npm run quality:check
```

## Files touched

- `scripts/eval-answer-quality.mjs`
- `scripts/eval-answer-quality.test.mjs`
- `scripts/lib/experiment-run.mjs`
- `scripts/lib/answer-compare.mjs`
- `scripts/lib/answer-compare.test.mjs`
- `apps/backend/src/eval/answer-quality/judge.ts`
- `apps/backend/src/eval/answer-quality/judge.test.ts`
- `apps/backend/src/eval/worked-solutions/README.md`
- `PRD/sections/functional-requirements.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/luna-answer-budget/` ready to delete

## PRD promotion checklist (executed by cleanup)

- [ ] REQ-231 (new), NFR-002 + goals echo, REQ-181, 182, 186, 188, 190, 226, 228 present in `PRD/sections/` (applied in slices A and D)
- [ ] REQ-230 note present (applied in slice C)
- [ ] In-Depth, Quick Lookup and system-map provider passages cite REQ-231
- [ ] Stable IDs unchanged except REQ-231 added; no DEC- entry added
