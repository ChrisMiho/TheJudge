# Slice C — The rules gate counts a rule a curated topic carries

## Status: done

## Dependencies

Slices A and B. The baseline can only record the Manufactor case's four rules as topic-carried once the topic exists (A) and the selector fires it (B).

## Goal

Teach the offline rules gate (REQ-222) that a deciding rule reaches the prompt when System 3 picks it or when a curated topic selected for that prompt carries it, record topic-carried rules apart as `inTopic`, and raise the committed baseline so the gate holds the Manufactor + Esix fix.

## Requirements

1. **Gate logic** in `apps/backend/src/eval/rules-gate/rulesGate.ts`. Read the selected topics' rule numbers from `prepared.enrichmentDebug.curatedGameRules.topics` (already collected with `collectEnrichmentDebug: true`). Per case compute `inTopic`: deciding rules that are not System 3 picks but are listed by a selected topic. A regression is a rule recorded in `hit` or `inTopic` that now reaches the prompt by neither route. A new hit is a deciding rule that reaches the prompt now by either route and is in neither recorded list. A rule that moves between the two routes is not a loss. `hit` and `miss` keep their System 3 meaning. `preparePromptInput` is not changed.
2. **Baseline shape.** `BaselineCase` gains an optional `inTopic`; `CaseGateResult` carries it; `raiseBaseline` writes `inTopic` only when non-empty. The summary and report line add the count of cases with a topic-carried rule. Update the header comments in `rulesGate.ts` and `baseline.ts` that say the gate "fails only when a recorded hit becomes a miss".
3. **Tests** in `rulesGate.test.ts`: a rule carried by a selected topic is recorded as `inTopic` (for example 603.2 on `panharmonicon-controller-not-entering-permanent`); a recorded System 3 hit that moves into a selected topic is not a regression; a recorded `inTopic` rule that leaves the prompt fails; `raiseBaseline` writes `inTopic` only when non-empty; the committed baseline records 614.1a, 616.1, 616.1e, 616.1f as `inTopic` for `academy-manufactor-esix-treasure`. The existing "16 of 18 first-ship cases hitting" test and every planted-baseline test keep passing unchanged.
4. **Raise the baseline.** Run `npm run eval:rules-gate:baseline` with no `--allow-regressions`; it must not refuse (if it refuses, stop and report). Commit `apps/backend/src/eval/rules-gate/baseline.json`. Expected diff: every case's `hit` and `miss` identical to today except `replacement-bard-and-bilbo-tokens` (616.1f moves from `hit` to `miss`; both 616.1 and 616.1f recorded in `inTopic`); 11 cases carry `inTopic`; 287 cases still have every deciding rule a System 3 excerpt; no frozen query vector file changes.
5. **Not edited:** `scripts/raise-rules-gate-baseline.mjs` (it calls `raiseBaseline`) and `scripts/eval-evidence-trace.mjs` (its parity check reads `hit` and `miss` only).
6. **PRD truth applied here.**
   - `PRD/sections/functional-requirements.md`, `### REQ-222`: the ratchet bullet (System 3 excerpt or selected-topic route, `inTopic`, written only when non-empty, move between routes is not a loss), the summary-line bullet (adds cases with a topic-carried rule), the REQ-022 dependency, and the last Notes bullet. Keep the dated first-ship sentence's 16-case count and add the words "a System 3 excerpt" so it reads as the System 3 count (non-blocking note 2).
   - `### REQ-229`, the first Notes bullet, one clause: "The baseline's hit and miss lists record System 3 selections only".
   - `apps/backend/src/eval/worked-solutions/README.md`, one sentence beside `:151` (not product truth): a rule carried by a selected curated topic counts as reaching the prompt and is recorded as `inTopic`.
   - Unchanged by the brief's Invariant 2 dispositions: `system-map.md:508`, REQ-185 `:4428`, REQ-189 `:4540` and `:5961`, REQ-222 frozen vectors `:5792`, REQ-229 `:5959` and `:5965`, REQ-230 `:6002`. Re-run the Invariant 2 grep and confirm every remaining hit is one of these.

## Acceptance criteria

- [ ] C1: `rulesGate.ts` reads the selected topics' rule numbers from `enrichmentDebug.curatedGameRules.topics`, computes `inTopic`, and treats a rule recorded in `hit` or `inTopic` that reaches the prompt by neither route as a regression, with `preparePromptInput` unchanged
- [ ] C2: `BaselineCase` has an optional `inTopic`, `raiseBaseline` writes it only when non-empty, and the summary and report line count cases with a topic-carried rule
- [ ] C3: The new rules-gate tests (topic-carried rule recorded, a System 3 hit moving into a topic is not a regression, a recorded `inTopic` rule that leaves the prompt fails, `raiseBaseline` writes `inTopic` only when non-empty, the committed baseline records the Manufactor case's four rules as `inTopic`) pass alongside every existing rules-gate test, including "16 of 18 first-ship cases hitting"
- [ ] C4: `npm run eval:rules-gate:baseline` ran without `--allow-regressions` and did not refuse
- [ ] C5: The committed `baseline.json` differs from the old one only as expected: `hit` and `miss` identical except `replacement-bard-and-bilbo-tokens`, 11 cases carry `inTopic`, `academy-manufactor-esix-treasure` records 614.1a, 616.1, 616.1e, 616.1f as `inTopic`, and 287 cases still have every deciding rule a System 3 excerpt
- [ ] C6: No frozen query vector file, `raise-rules-gate-baseline.mjs`, or `eval-evidence-trace.mjs` changed (`git diff --stat`)
- [ ] C7: The scripts test suite (evidence-trace parity with the baseline, coverage gate) passes
- [ ] C8: REQ-222 is amended (ratchet bullet, summary bullet, REQ-022 dependency, last Notes bullet, "a System 3 excerpt" wording on the first-ship sentence) and REQ-229's first Notes bullet carries the one clause
- [ ] C9: `worked-solutions/README.md` has the one sentence beside `:151` about topic-carried rules and `inTopic`
- [ ] C10: Re-running the Invariant 2 grep (`ratchet|baseline\.json|System 3 excerpts|selectedInSearch|records System 3|System 3 selections|hit and miss` over `PRD/sections` and the two eval READMEs) leaves only hits the brief dispositions as unchanged
- [ ] C11: `npm run typecheck`, `npm run lint`, and `npm run format:check` pass

## Verification

```bash
npm --workspace apps/backend run test -- rulesGate
npm run eval:rules-gate:baseline
git diff apps/backend/src/eval/rules-gate/baseline.json
git diff --stat
npm run test:scripts
grep -rniE "ratchet|baseline\.json|System 3 excerpts|selectedInSearch|records System 3|System 3 selections|hit and miss" PRD/sections apps/backend/src/eval/fixtures/README.md apps/backend/src/eval/worked-solutions/README.md
npm run typecheck && npm run lint && npm run format:check
```

## Files touched

- `apps/backend/src/eval/rules-gate/rulesGate.ts`
- `apps/backend/src/eval/rules-gate/baseline.ts` (header comment)
- `apps/backend/src/eval/rules-gate/rulesGate.test.ts`
- `apps/backend/src/eval/rules-gate/baseline.json`
- `apps/backend/src/eval/worked-solutions/README.md`
- `PRD/sections/functional-requirements.md`
