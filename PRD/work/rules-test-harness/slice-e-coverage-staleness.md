# Slice E — Coverage command and report, coverage.json, staleness report

## Status: planned

## Goal

The owner can see, in one report, which real Magic mechanics have a case, how many cases sit at each tier, review status and outcome, and which cases went stale after a rules or card-data change. The coverage gate exists as tested code but does not yet run in `quality:check`; slice F wires it in once the 255 mechanic cases exist. The owner's own review never leaves the coverage file out of date.

## Depends on

Slices A (loader, stale comparison), B (re-freeze check), D (apply command that gets the coverage rewrite).

## Product truth applied at build (A21)

REQ-189, REQ-222, REQ-224 and REQ-225 (functional-requirements entries), each applied by intent against current truth. Cross-citations of REQ-223 (F) and of REQ-185's new terms (G) ahead of their entries are acceptable under A21: one code PR into `main`.

The build re-derives each edit by intent against current `PRD/sections/` truth, together with the code in this slice's work. `GATE-QUESTIONS.md` holds the approved diff (every verdict `accept`).

## Requirements

1. Mechanic list: the distinct `701.N` and `702.N` prefixes in the committed rule index (`apps/backend/data/gameRulesRuleIndex.json`), excluding 701.1 and 702.1. 258 today (M1). Names by rule number with a best-effort name from the first subrule's text (A10); no new data file.
2. Committed excluded list (proposed: `apps/backend/src/eval/worked-solutions/excluded-mechanics.json`) holding the Q-007 answer: 701.45 Assemble and 702.158 Space Sculptor, each with the reason. A case covers a mechanic when one of its deciding rule ids sits under it. A mechanic with no `draft`, `approved` or `needs-edit` case fails the gate; `rejected` does not count (A7).
3. Coverage command (proposed `npm run eval:rules-coverage`) prints mechanic x {approved, draft, none}, case counts per Comprehensive Rules section, and counts per tier, review status and `outcome`, and rewrites the counts-only `apps/backend/src/eval/answer-quality/coverage.json` (numbers and ids only, no prose).
4. The coverage gate is a tested function and is NOT wired into `quality:check` in this slice (A17). It fails: an uncovered mechanic; an excluded id the index lacks; a committed coverage file out of date with the corpus.
5. Add the `coverage.json` rewrite to the end of slice D's apply command (A20).
6. Staleness command (proposed `npm run eval:rules-staleness`): lists stale cases through slice A's stale comparison, naming each changed dependency, and cases awaiting a query-vector re-freeze through slice B's re-freeze check. Never edits a case, never fails a gate.
7. On the real corpus the coverage command lists the 255 uncovered mechanics as report output, not a failure; the staleness report is clean on unchanged data.

## Acceptance criteria

- [ ] **E1.** Fixture-corpus tests: an uncovered mechanic fails the gate, an excluded id the index lacks fails it, an out-of-date coverage file fails it, and a fully covered fixture passes
- [ ] **E2.** Applying a filled review batch that changes a status leaves the out-of-date check passing (the apply command rewrites `coverage.json`, A20)
- [ ] **E3.** On the real corpus the coverage command lists the 255 mechanics still uncovered as report output, not a failure, and writes `coverage.json`
- [ ] **E4.** `coverage.json` carries counts and ids only (no prose), including counts per `outcome`
- [ ] **E5.** The excluded-mechanics list holds 701.45 and 702.158 with a reason each, and the gate reads the mechanic list from the committed rule index
- [ ] **E6.** The coverage gate is not wired into `quality:check` yet, and `npm run quality:check` is green (A17)
- [ ] **E7.** The staleness report is clean on unchanged data (run on the real corpus)
- [ ] **E8.** Staleness fixture test: a fixture case with a changed ruling hash is listed as stale naming that dependency, and a fixture case whose stored query-text hash no longer matches is listed as awaiting a re-freeze (a backend vitest test, because slice B's re-freeze check rebuilds query text); neither run fails any gate
- [ ] **E9.** REQ-189, REQ-222, REQ-224 and REQ-225 are applied to `PRD/sections/functional-requirements.md` by intent against current truth

## Verification

```bash
npm run test:scripts
npm --workspace apps/backend run test
npm run eval:rules-coverage
npm run eval:rules-staleness
npm run quality:check
```

## Files touched

- scripts/rules-coverage.mjs and scripts/lib/rules-coverage.mjs (+ tests) (new)
- scripts/rules-staleness.mjs (new) and a backend vitest test for the re-freeze listing
- scripts/rules-review.mjs / scripts/lib/rules-review.mjs (coverage rewrite step)
- apps/backend/src/eval/worked-solutions/excluded-mechanics.json (new)
- apps/backend/src/eval/answer-quality/coverage.json (new, generated)
- package.json (script entries)
- PRD/sections/functional-requirements.md (REQ-189, REQ-222, REQ-224, REQ-225)
