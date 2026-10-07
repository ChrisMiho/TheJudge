# Slice D — Offline evidence trace

## Status: done

## Dependencies

none (independent of A to C; shares only the read-only rules gate inputs)

## Goal

For every approved case, show offline where each deciding rule ranked, whether it was selected, and whether its text reached the final prompt, for the checkout the command runs from.

## Requirements

1. REQ-229 (new): `npm run eval:evidence-trace` reports per deciding rule the rank in the full System 3 ranking (prepare at an excerpt cap equal to the rule-index size, reusing production ranking per REQ-190), selected-in-search at the production cap, skipped because a curated topic carries it, and available-to-answer anywhere in the final prompt (topic, excerpt, or card ruling quoting it); also parent and lettered subrules.
2. Case level: per-rule coverage, complete-procedure coverage, and `goldRuleInPrompt` side by side. Ranking uses the committed frozen query vectors (REQ-222); a case awaiting re-freeze is embedded locally and labelled.
3. Measures the checkout it runs from, imports nothing across checkouts, refuses uncommitted changes, records its commit in `trace.json` and writes a trace folder.
4. `npm run eval:evidence-trace:compare -- <trace-folder-a> <trace-folder-b>` reports both commits, per-case prompt-hash equality, coverage differences, and cases in only one trace.
5. No network call. Reuse `apps/backend/src/eval/rules-gate/` helpers and `scripts/lib/rules-gate-inputs.mjs`; add package.json script entries.

## Acceptance criteria

- [x] D1: A test shows per-rule output has rank, selected-in-search, skipped-for-curated-topic, and available-to-answer, including a parent/lettered-subrule case (514.3 present, 514.3a absent)
- [x] D2: A test shows case-level per-rule coverage, complete-procedure coverage and `goldRuleInPrompt` are reported side by side
- [x] D3: A test shows the trace refuses a dirty checkout and records its commit in `trace.json`
- [x] D4: A test shows the compare command reports both commits, prompt-hash equality, coverage differences and one-sided cases from two fixture trace folders
- [x] D5: `npm run eval:evidence-trace` runs over all approved cases on this checkout offline and its hit/miss agrees with `rules-gate/baseline.json` for every case, or lists each divergence by case id
- [x] D6: `eval:evidence-trace` and `eval:evidence-trace:compare` exist in package.json and make no network call (test asserts no fetch)
- [x] D7: Typecheck passes

## Verification

```bash
npm run test:scripts
npm run eval:evidence-trace
npm run typecheck
```

No live OpenAI call; fake clients and stored fixtures only.

## Files touched

- `scripts/eval-evidence-trace.mjs (new)`
- `scripts/eval-evidence-trace-compare.mjs (new)`
- `scripts/lib/evidence-trace.mjs (new)`
- `scripts/lib/evidence-trace.test.mjs (new)`
- `package.json`
- `scripts/eval-evidence-trace-compare.mjs` is the compare command; `scripts/lib/rule-availability.mjs` (from slice C) decides availability
- `.gitignore` (trace folders under `output/evidence-trace/` are developer-local)
