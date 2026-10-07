# Slice F — Paired comparison report

## Status: done

## Dependencies

Slices A (run folders) and C (record fields)

## Goal

Two finished runs compare case by case, offline, showing what got better and what got worse by group, without naming a winner.

## Requirements

1. REQ-228 (new): `npm run eval:answer-quality:compare -- <run-a> <run-b>` with optional arm and model selectors, offline.
2. Refuses, printing reasons, when judge model, rubric revision or a case's reference-answer hash differ.
3. "Right" is Correctness 2; "wrong" is 0 or 1; with repeats a side is the majority result and disagreeing repeats are listed unstable.
4. Prints right-to-right, wrong-to-right, right-to-wrong, wrong-to-wrong and missing counts with denominators; lists each right-to-wrong case id with transcript paths; breakdown by tier (1-2 together, 3 apart, never pooled), rules section, mechanic, difficulty, source pool, request kind; unchanged-input stratum (identical prompt hash) reported as sampling noise.
5. Per side: latency mean, p50, p95; answers slower than the per-attempt timeout of the revision the run executed from (15,000 ms today); errors and timeouts; tokens including reasoning; answer and judge cost apart. Diagnostic arms under a "diagnostic control, not a product score" heading. Never names a winner.

## Acceptance criteria

- [x] F1: A test shows the report refuses on a judge model, rubric revision, or reference-hash mismatch and prints each reason
- [x] F2: A test with fixture runs shows all five transition counts with denominators and every right-to-wrong case id with transcript paths
- [x] F3: A test shows tier 1-2 and tier 3 are never pooled and breakdowns by rules section, mechanic, difficulty, source pool and request kind appear
- [x] F4: A test shows repeats resolve by majority and disagreeing repeats are listed unstable
- [x] F5: A test shows identical-prompt-hash cases form the unchanged-input stratum labelled as sampling noise
- [x] F6: A test shows latency mean/p50/p95, slower-than-timeout count, errors, tokens with reasoning, and answer and judge cost apart
- [x] F7: A test shows diagnostic-arm results print under the diagnostic-control heading and the output never names a winner
- [x] F8: `npm run eval:answer-quality:compare` exists in package.json and runs offline on two fixture run folders
- [x] F9: Typecheck passes

## Verification

```bash
npm run test:scripts
npm run eval:answer-quality:compare
npm run typecheck
```

No live OpenAI call; fake clients and stored fixtures only.

## Files touched

- `scripts/eval-answer-compare.mjs (new)`
- `scripts/lib/answer-compare.mjs (new)`
- `scripts/lib/answer-compare.test.mjs (new)`
- `package.json`
- `scripts/lib/experiment-run.mjs`, `scripts/eval-answer-quality.mjs` (the identity record gains `productionTimeoutMs`, read from the checkout's own config source, so the report can hold latency against the revision's timeout)
- Build note: the compare command with no arguments prints how to use it and lists the runs under `output/answer-quality/runs/`; it makes no network call either way
