# Slice A — Case format v2, shared loader, migration of the 18

## Status: done

## Goal

A rules test case becomes a version-2 record with one shared loader, one request builder and one stale comparison that every later slice calls. The 18 existing cases migrate with their question and answer text byte-identical, and the live scorer and retrieval check read the new field names. A player sees no change; the owner's grading corpus is now in the shape the rest of run 1 builds on.

## Depends on

None. First slice.

## Product truth applied at build (A21)

None. REQ-185 is applied in slice G (A21), where its run-1 authoring criterion becomes true. Slice A still honours REQ-185 as proposed: the loader, the migration and the A1 carve-out implement it.

## Requirements

1. Rewrite `scripts/lib/gold-cases.mjs` as the format-version-2 loader and validator (`formatVersion: 2`; fields per `### Case format version 2` and the intake's converged shape, with the three brief changes: `snapshot` hashes the whole rule-index file instead of a rules date (A11, M13); `review.status` is `draft | approved | needs-edit | rejected`; `cards` is the attachment list for every tier). The question stays top-level and file names do not change (A2).
2. Loader checks: required fields, dedup by id and by question text, the derived `mechanic:` tag from 701/702 ids in `expected.decidingRuleIds`, `review.reviewedOn` required once a case is not `draft`, and the A15 structural rule: reject a `gameState` that sets `owner` on a stack item or `caster` on a card outside the stack. `gameState` is null or an In-Depth `gameContext` shape; the loader checks only the structural rules, the full schema check is slice B's backend test (A3, A15).
3. `snapshot` hashing: SHA-256 of the rule text, oracle text and ruling text a case depends on, plus the rule-index file hash, computed from committed data. One exported stale-comparison function reports whether a case's stored `snapshot` still matches (A18). Slices C, D and E call it; nothing re-implements it.
4. Migrate the 18 cases (A1, A14): `expected.answer` carries `workedSolution` byte-identical, `expected.decidingRuleIds` carries `expectedSupplementalRuleIds`, `cards` per A14 (Panharmonicon, Restoration Angel and Sensei's Divining Top for the three tier-2 cases; Tarmogoyf oracle id `45900b2f-f6a9-4c42-9642-008f3c1cf6dd` for `token-created-by-name-uses-oracle-card`; an empty list for the other 14), `review.status` `approved`, `review.reviewedOn` the date of this slice's migration commit, review note "approved by the owner's accept of REQ-185 at the define gate; migrated to format version 2". This is the one carve-out from the rule that no agent sets `approved`; the owner's accept of REQ-185 is the approval. `snapshot` is recorded at migration, which counts as the cases' authoring.
5. Move every case-file reader of the two renamed fields (the full list is under `### Case format version 2` in the brief): `scripts/eval-answer-quality.mjs` lines 408, 426, 431 (deciding rule ids) and 433, 464, 480 (reference answer); `scripts/eval-worked-solutions.mjs` lines 65 and 120; `scripts/lib/gold-cases.mjs`; the case objects in `scripts/lib/gold-cases.test.mjs` and `scripts/eval-worked-solutions.test.mjs`. Leave alone the context-eval fixture readers (`contextEvaluationHarness.ts`, `relevanceReport.test.ts`, `contextEvaluationHarness.test.ts`, `scripts/build-frozen-query-embeddings.mjs`, `apps/backend/src/eval/fixtures/README.md`), the parameter and transcript keys in `judge.ts`, `assertions.ts` and the transcript type in `artifact.ts`, and `artifact.ts` line 68, which keeps `workedSolution` on the no-prose list on purpose (REQ-189).
6. `buildCaseRequest` in `scripts/lib/prompt-fidelity.mjs` builds every case's request (A15): a case without a `gameState` is a lookup with every `cards` entry attached by oracle id; a case with a `gameState` is an In-Depth `mode: "game"` request with that `gameState` as its `gameContext` and its `cards` placed in those zones. It is the one request builder the offline gate (slice B) and the live runner (slice C) share.
7. Add `scripts/lib/gold-cases.d.mts` and `scripts/lib/prompt-fidelity.d.mts`, declaring only the exports backend tests call (A3, M17). A declaration states types, never logic. The backend compiler options stay unchanged.
8. Rewrite `apps/backend/src/eval/worked-solutions/README.md` for the v2 format and the loader (disposition rows for README lines 1, 89, 90 and 142). Update the disposition-listed code comments in the files this slice edits (`gold-cases.mjs:1`, `prompt-fidelity.mjs:34`, `eval-worked-solutions.test.mjs:42`, `eval-answer-quality.test.mjs:372`: the `buildCaseRequest` test now asserts every case's cards are attached).
9. Do not touch `apps/backend/src/prompt/preparation.test.ts` (it reads six cases' `question` by path), the REQ-177 benchmark, or the 31 context-eval fixtures (A13, M12).

## Acceptance criteria

- [x] **A1.** The 18 migrated cases have byte-identical question and answer text: a committed test pins the SHA-256 of each case's pre-migration `question` and `workedSolution` and compares them with the migrated `question` and `expected.answer`
- [x] **A2.** Each migrated case has `review.status` `approved`, `review.reviewedOn` set to the migration commit's date, and a review note naming the approval source ("approved by the owner's accept of REQ-185 at the define gate; migrated to format version 2") (A1)
- [x] **A3.** Each migrated case's `cards` matches A14: three tier-2 cases carry their cited card, `token-created-by-name-uses-oracle-card` carries Tarmogoyf (`45900b2f-f6a9-4c42-9642-008f3c1cf6dd`), the other 14 are empty (test)
- [x] **A4.** No case-file read of `workedSolution` or `expectedSupplementalRuleIds` remains in `scripts/` or `apps/backend/src/eval/`: a grep shows only the context-eval fixture readers, the parameter and transcript keys, and the no-prose list line in `artifact.ts`
- [x] **A5.** `scripts/eval-answer-quality.mjs` passes the case's `expected.answer` to the judge and its `expected.decidingRuleIds` to the assertions and retrieval check; its existing tests pass and its dry run (no key, no network) runs on the migrated 18
- [x] **A6.** `npm run eval:worked-solutions` still reports 16/18 with the same two misses (`panharmonicon-controller-not-entering-permanent`, `restoration-angel-blink-resets-counters`) (M15)
- [x] **A7.** A unit test shows the stale comparison flags a changed rule, oracle or ruling hash and passes unchanged data (A18)
- [x] **A8.** `buildCaseRequest` test: a case without a `gameState` gives a lookup with every `cards` entry attached by oracle id (`test:scripts`)
- [x] **A9.** `buildCaseRequest` test: a fixture case with a `gameState` (two stack items, a battlefield card with an owner) gives a `mode: "game"` request that the In-Depth request schema accepts, with each card in its zone and the stack in order (a backend vitest test, because the schema is TypeScript)
- [x] **A10.** The loader rejects a fixture `gameState` with `owner` on a stack item, and one with `caster` on a battlefield card (A15)
- [x] **A11.** Loader tests cover dedup, the derived `mechanic:` tag, `snapshot` hashing, and each v2 validation error
- [x] **A12.** `preparation.test.ts`, the REQ-177 benchmark and the context-eval fixtures pass unchanged: `git diff` shows `apps/backend/src/prompt/preparation.test.ts` and `rag-retrieval-benchmark.json` untouched, and the backend tests pass
- [x] **A13.** `scripts/lib/gold-cases.d.mts` and `scripts/lib/prompt-fidelity.d.mts` exist and a backend vitest test imports both modules statically; `npm run typecheck` is green (A3, M17)
- [x] **A14.** The corpus README `apps/backend/src/eval/worked-solutions/README.md` is rewritten for format version 2 and names the shared loader
- [x] **A15.** `npm run quality:check` is green

## Verification

```bash
npm run test:scripts
npm --workspace apps/backend run test
npm run eval:worked-solutions
npm run eval:answer-quality   # dry run: no key, no network
grep -rnE "workedSolution|expectedSupplementalRuleIds" scripts apps/backend/src/eval
npm run typecheck
npm run quality:check
```

## Files touched

- scripts/lib/gold-cases.mjs
- scripts/lib/gold-cases.test.mjs
- scripts/lib/gold-cases.d.mts (new)
- scripts/lib/prompt-fidelity.mjs
- scripts/lib/prompt-fidelity.d.mts (new)
- scripts/eval-answer-quality.mjs
- scripts/eval-answer-quality.test.mjs
- scripts/eval-worked-solutions.mjs
- scripts/eval-worked-solutions.test.mjs
- apps/backend/src/eval/worked-solutions/*.case.json (the 18, migrated in place)
- apps/backend/src/eval/worked-solutions/README.md
- a backend vitest test under apps/backend/src/eval/ for the In-Depth request check (new)
