# Slice C — Live runner: selection, per-case merge, per-tier headline

## Status: planned

## Goal

The on-demand grader re-pays only for cases whose prompt or official answer changed, defaults to the deployed setup (gpt-4.1, cap 10), records the judge's cost, reports one headline per tier, and never overwrites a case it did not grade. Nothing here runs automatically and nothing here can fail a build.

## Depends on

Slice A (loader, stale comparison, `buildCaseRequest`). Independent of B.

## Product truth applied at build (A21)

REQ-186, REQ-187, REQ-190 (functional-requirements entries) and the answer-quality system-map entry (the second diff in the REQ-188 slot). Re-derive each by intent against current truth. REQ-188 itself waits for F (it says the coverage gate runs in `quality:check`); REQ-189 waits for E (it names the coverage file). REQ-186 and REQ-187 cite REQ-225's staleness rule (E) and REQ-185's new terms (G) ahead of their entries; that is acceptable under A21 because every slice lands in one code PR into `main`.

The build re-derives each edit by intent against current `PRD/sections/` truth, together with the code in this slice's work. `GATE-QUESTIONS.md` holds the approved diff (every verdict `accept`).

## Requirements

1. Selection: `--changed` is the default. It picks a case whose prompt hash at that model and cap differs from its last graded record, whose current `expected.answer` hash differs from the reference-answer hash that record was judged against, whose last record lacks either hash, or that was never graded. Alternatives: `--tag`, `--tier`, `--sample N` (seeded), `--all`.
2. Only `approved`, non-stale cases are graded; staleness uses slice A's stale comparison, never a copy.
3. Requests come from slice A's `buildCaseRequest`. Per-case prompt hash.
4. Default lineup `gpt-4.1` at excerpt cap `[10]` (REQ-190, A6); the four-model bake-off and other caps are explicit flags. A one-model run skips the blind ranking (`judge.ts:225` comment updated).
5. `results.json` merges per case: each record carries its own prompt hash, reference-answer hash (SHA-256 of the `expected.answer` it was judged against), timestamp, commit, and the judge's token use. A merge drops a record only when its case left the corpus or is no longer `approved`; it keeps every other case's record unchanged (REQ-189's rule, applied in E; the behavior lands here).
6. Headline per tier over approved, non-stale cases (A22): a case counts through its latest graded record only when that record's reference-answer hash matches the current `expected.answer` hash; otherwise it counts as ungraded, including every record with no hash (today's 18). Print the ungraded and stale counts beside the headline. Tier 3 is never pooled with tiers 1 and 2. A stale case's last record stays in `results.json` but is not counted.
7. Judge usage recorded per case and in run totals, answer and judge shown separately (M8: judge usage was never recorded).
8. The free check: an unknown-rule-id assertion lists cited rule ids that are not in the committed index, worded "not in the committed rule index" (A9), added in `assertions.ts`. Add `shortAnswer` to the no-prose guard in `artifact.ts`.
9. Update the disposition-listed comments and code in `artifact.ts` (lines 1, 39, 101), `rubric.ts:94`, `judge.ts:225`, `assertions.ts:1`, `scripts/eval-answer-quality.mjs` (lines 3, 94, 286, 337, 356).
10. Keep the regression guard: `eval:answer-quality` is never wired into any gate script (REQ-188).

## Acceptance criteria

- [ ] **C1.** The dry run prints the selection and a cost estimate with no network call when there is no key
- [ ] **C2.** Selection test: `--changed` picks a case whose prompt hash matches its last record but whose `expected.answer` hash differs from that record's reference-answer hash, and skips a case where both match (`test:scripts`, injected fakes)
- [ ] **C3.** Legacy-record test: a fixture record with no prompt hash and no reference-answer hash counts as ungraded in the headline and is selected by `--changed`
- [ ] **C4.** The dry run on the real corpus selects all 18 migrated cases and prints its cost estimate (about $0.35: 18 x ($0.0098 + $0.0099), M8)
- [ ] **C5.** Unknown-rule-id test: a fixture answer citing a rule id the committed index lacks records that id in the per-case list, worded "not in the committed rule index"; one citing only existing ids records an empty list
- [ ] **C6.** Judge-usage test: a fake judge's token usage lands in the per-case record and in the run totals, with answer and judge shown separately
- [ ] **C7.** No-prose test: `writeResultsFile` throws on a record carrying `shortAnswer`
- [ ] **C8.** Drop test: a merge where a previously recorded case is now `needs-edit`, and one where a case left the corpus, drops both records and keeps every other case's record unchanged
- [ ] **C9.** Headline test (A22): a stale approved case with a Correctness-2 record is left out of the count and a stale count of 1 prints
- [ ] **C10.** Headline test (A22): a re-approved case whose answer did not change counts at once from its existing record
- [ ] **C11.** Headline test (A22): a re-approved case whose answer was reworked counts as ungraded, is selected by `--changed` although its prompt hash is unchanged, and after a fake re-grade merges a new record counts from that record
- [ ] **C12.** Ranking skip test: a one-model run skips the blind ranking; the default lineup is `gpt-4.1` at cap `[10]`
- [ ] **C13.** The regression guard still passes: `eval:answer-quality` is wired into no gate script
- [ ] **C14.** REQ-186, REQ-187, REQ-190 and the answer-quality system-map entry are applied to `PRD/sections/` by intent against current truth
- [ ] **C15.** `npm run quality:check` is green

## Verification

```bash
npm run test:scripts
npm --workspace apps/backend run test
npm run eval:answer-quality   # dry run: no key, no network
npm run quality:check
```

## Files touched

- scripts/eval-answer-quality.mjs
- scripts/eval-answer-quality.test.mjs
- apps/backend/src/eval/answer-quality/artifact.ts (+ test)
- apps/backend/src/eval/answer-quality/assertions.ts (+ test)
- apps/backend/src/eval/answer-quality/judge.ts (+ test)
- apps/backend/src/eval/answer-quality/rubric.ts (+ test)
- apps/backend/src/eval/answer-quality/results.json (shape only; no live run)
- PRD/sections/functional-requirements.md (REQ-186, REQ-187, REQ-190)
- PRD/sections/system-map.md (answer-quality entry)
