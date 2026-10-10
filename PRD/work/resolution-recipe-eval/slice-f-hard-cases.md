# Slice F — Sixteen hard cases and the offline gate

## Status: done

## Goal

The nine hard interactions exist as graded cases in both flows (16 new files;
the Necropotence and Academy Manufactor lookups already exist), approved by the
owner's gate verdicts and joined to the diagnostic set.

## Requirements

1. One case file per slot G3-01 to G3-16 in `apps/backend/src/eval/worked-solutions/`, named by the slot's backticked case id (`<id>.case.json`). Question, short answer, reference answer, deciding rules, outcome and cards come from the slot text in `GATE-QUESTIONS.md` as accepted (all 24 slots accepted, no edits).
2. Every zone card is one of the case's `cards`; each card carries the oracle id its slot lists. Re-run `node PRD/work/resolution-recipe-eval/evidence/resolve-g3-cards.mjs` against the data the cases are authored from. `gameState` holds only facts the ruling depends on. Each In-Depth twin has its own question and reference wording (the loader rejects duplicates). All tier 3, reference source `owner-approved-derived`, no source pool. Snapshot recorded at authoring.
3. Approval: written `approved`, `reviewedOn` = the docs PR merge date, a review note naming the G3 slot (REQ-224 exception, applied here).
4. Append the 16 ids to the diagnostic manifest as group `resolution-recipe-hard-set` with slice B's command.
5. Rebuild frozen query vectors (`npm run eval:build-rules-gate-vectors`), raise the rules-gate baseline (`npm run eval:rules-gate:baseline`), rewrite `coverage.json` (`npm run eval:rules-coverage`) so the offline gate stays green.
6. Apply the accepted REQ-224 and REQ-185 blocks in `PRD/sections/functional-requirements.md`, and the worked-solutions README line "Nothing else writes `approved`" (brief row 52).

## Acceptance criteria

- [x] 16 new case files exist, one per slot G3-01 to G3-16, and the corpus loader accepts them (no duplicate errors)
- [x] Every new case is `approved` with `reviewedOn` and a review note naming its slot
- [x] Card oracle ids in each case equal the ids in `evidence/g3-card-ids.txt` and the resolve script reports 0 problems
- [x] The diagnostic manifest holds group `resolution-recipe-hard-set` with the 16 ids and the held-out manifest is unchanged
- [x] Offline rules gate is green after vectors, baseline and coverage are rebuilt
- [x] Dry run of `--arm A --arm R --repeat 6` over the 18 hard ids prints 216 answer calls and an estimate, with no `--confirm-live-calls`
- [x] REQ-224, REQ-185 and the README line match the accepted blocks
- [x] A reader compared each reference answer with its G3 slot and found them equal (manual)

## Notes (evidence, re-runnable)

- Authoring: the 16 files were written by a one-off script (kept out of the repo) that reads each accepted slot from `GATE-QUESTIONS.md` (question, short answer, reference answer, outcome, deciding rules, cards with oracle ids), adds the game state each In-Depth slot's Board line describes, and records each snapshot with `computeSnapshot` from the committed data. Zone items carry `name` as well as `cardId` because the offline gate's state-fact check reads `name` from the case file.
- F1: `node --test scripts/lib/gold-cases.test.mjs scripts/lib/rules-coverage.test.mjs` -> 33 pass, 0 fail; the corpus loads 416 cases with no duplicate error.
- F2: all 16 files carry `review.status` "approved", `reviewedOn` "2026-10-10" and a note naming their slot (checked by the F8 comparison below).
- F3: `node PRD/work/resolution-recipe-eval/evidence/resolve-g3-cards.mjs` -> "22 names, 0 problem(s)"; the F8 comparison confirms every case card's id and name appear in the slot's Cards line and in `evidence/g3-card-ids.txt`.
- F4: `npm run eval:answer-quality:manifests -- --append-diagnostic <the 16 ids> --group resolution-recipe-hard-set --reason "..."` -> "Appended 16 cases ... it now lists 62 cases. The held-out manifest is unchanged."; then `npm run eval:answer-quality:manifests -- --check` -> "Check passed" (exit 0); `git diff` shows `held-out.json` untouched.
- F5: `npm run eval:build-rules-gate-vectors` -> 415 vectors (16 embedded, 399 kept); `npm run eval:rules-gate:baseline` -> 415 cases, 0 failed, 0 regressed, baseline written; `npm run eval:rules-coverage` -> `coverage.json` rewritten; `npm --workspace apps/backend run test -- src/eval` -> 12 files, 135 tests pass. Two test-side changes were needed to keep the gate green: the state-fact check now accepts two cards of one name each matching their own printed block (G3-16 has two Blood Artists with different owners; a test was added), and the pinned count of baseline cases with an in-topic rule moved from 11 to 18.
- F6: `npm run eval:answer-quality -- --run-id rr-hard-dry --manifest output/answer-quality/manifests/rr-hard.json --model gpt-6-luna --arm A --arm R --repeat 6 --max-cost-usd 6` -> "Cases: 18 from the manifest, each answered 6 times", "Arms: A (A.1), R (R.1)", "Calls: 216 answer calls, 216 lone judge calls", "Estimated cost: $2.56", no `--confirm-live-calls`. The game-case fidelity check ran in that dry run and passed for all nine In-Depth cases. The 62-case diagnostic dry run (`--run-id rr-dry`, A and R) prints 124 answer calls, 124 judge calls, $1.46; `node scripts/diagnostic-arms-check.mjs` -> `{"cases":62,"problems":[]}` (R substitutes once on every case, game cases included).
- F7: REQ-224 (exception (b) and the new Notes), REQ-185 (the two restating lines) in `PRD/sections/functional-requirements.md`, and the "Nothing else writes `approved`" paragraph in `apps/backend/src/eval/worked-solutions/README.md`.
- F8 (manual), observation lines:

2026-10-10 F8 — compared all 16 committed case files with their accepted G3 slots in `GATE-QUESTIONS.md`: question, short answer, reference answer (word for word, including the escaped quotation marks in G3-07), outcome, deciding rule ids, and each card's name and oracle id (also against `evidence/g3-card-ids.txt`); found 0 differences. Also read each In-Depth case's game state against its slot's Board line (zones, owners or casters, notes, targets, phase, life totals; 1 life each in G3-16) and found them equal. The two existing lookup cases (Necropotence, Academy Manufactor) were not changed.

## Verification

```bash
node PRD/work/resolution-recipe-eval/evidence/resolve-g3-cards.mjs
node --test scripts/lib/gold-cases.test.mjs scripts/lib/rules-coverage.test.mjs
npm run eval:answer-quality:manifests -- --check
npm run eval:rules-coverage
npm --workspace apps/backend run test -- src/eval
```

Dry run (spends nothing): emit `rr-hard` with `--from approved --ids <the 18 ids>`, then `npm run eval:answer-quality -- --run-id rr-hard-dry --manifest output/answer-quality/manifests/rr-hard.json --model gpt-6-luna --arm A --arm R --repeat 6 --max-cost-usd 6`.

## Files touched

- `apps/backend/src/eval/worked-solutions/*.case.json` (16 new), `README.md`
- diagnostic manifest, rules-gate vectors, baseline and `coverage.json` (generated by the commands above)
- `PRD/sections/functional-requirements.md` (REQ-224, REQ-185)
