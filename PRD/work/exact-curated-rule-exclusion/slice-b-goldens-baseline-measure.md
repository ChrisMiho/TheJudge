# Slice B — Regenerate three goldens, raise baseline, re-measure

## Status: in-progress

## Goal

Regenerate exactly the three prompt goldens the change moves, raise the rules-gate baseline without `--allow-regressions`, and measure every target so the numbers in REQ-179 are real.

## Requirements

1. First decide whether the PR #273 condition applies: compare the committed game-rules data to `f98b8feb` with `git diff --stat f98b8feb HEAD -- apps/backend/data` (empty means the brief's numbers apply unchanged; non-empty means re-measure everything per the GAMEPLAN). Record the answer in `slice-b.evidence.md`.
2. Regenerate goldens with `UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval`, then read the diff. Exactly three fixtures change: `commander-spellbook-lookup-attached-intent` (614.10a out, 115.1b in), `commander-spellbook-wrong-zone` (500.10a out, 117.3a in), `upkeep-trigger` (609.7a out, 603.3b in). The prompt golden changes for each; the context golden changes where it lists supplemental ids. If any other golden moves, or a change is not the named swap, stop and report; do not commit it. Rerun `npm --workspace apps/backend run test:eval` without the env var and see it green.
3. Raise the baseline with `npm run eval:rules-gate:baseline` and no `--allow-regressions`. It must print no `Accepted regressions` line. If it refuses, a recorded rule was lost: stop and report.
4. Measure and record each target: rules test cases with every deciding rule in the prompt (293 to 295 of 392); `npm run eval:worked-solutions` (287 to 289); first-ship cases under hybrid ranking (16 of 18, the same two misses); context-evaluation labelled System 3 checks semantic and lexical (14 of 14 each); retrieval benchmark recall@5 unchanged (`npm run benchmark:rag-retrieval` and `-- --semantic`).
5. Confirm the two closing cases under hybrid ranking from each case's committed frozen vector: `npm run eval:evidence-trace -- --case triggers-becomes-tapped-not-entering-tapped --case triggers-damage-prevented-no-trigger` shows 603.2e and 603.2g selected in System 3. This is the gate.
6. Record, not gate: `EMBEDDING_PROVIDER=mock npm run eval:worked-solutions` gives the lexical first-ship count (before value 14 of 18) and the two closing cases' lexical result. Also record the whole-prompt size change if cheap (brief: median 0, p95 +79, max +465, mean -30 characters).
7. Write every measured value, with the command that produced it and the date, into `PRD/work/exact-curated-rule-exclusion/slice-b.evidence.md`. Slice C copies them into REQ-179's Notes, so they outlive the package.

## Acceptance criteria

- [ ] Whether PR #273's data change is in the committed data is recorded; if it is, every number below was re-measured on the refreshed index
- [ ] Exactly three fixtures' goldens changed (`commander-spellbook-lookup-attached-intent`, `commander-spellbook-wrong-zone`, `upkeep-trigger`), each the named swap, and no other golden under `apps/backend/src/eval/fixtures/` changed
- [ ] `npm --workspace apps/backend run test:eval` passes without the update flag after regeneration
- [ ] `npm run eval:rules-gate:baseline` ran without `--allow-regressions`, printed no `Accepted regressions` line, and the raised baseline file is written
- [ ] `npm run eval:worked-solutions` reports 289 of 392 (or the re-measured value, with no recorded rule lost)
- [ ] The two closing cases show 603.2e and 603.2g as System 3 excerpts under hybrid ranking from their committed frozen vectors
- [ ] The lexical first-ship count and the two closing cases' lexical result are recorded from `EMBEDDING_PROVIDER=mock npm run eval:worked-solutions` (recorded, not gated)
- [ ] The retrieval benchmark's recall@5 is unchanged under both lexical and `--semantic` scoring
- [ ] Every measured value, its command and its date is written into `slice-b.evidence.md`, including first-ship hybrid 16 of 18 and context-eval 14 of 14 each way

## Tests

The context-evaluation harness is the golden test. The rules gate runs inside the baseline command. No new test code.

## Verification

```bash
git diff --stat f98b8feb HEAD -- apps/backend/data
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval
npm --workspace apps/backend run test:eval
git status --porcelain apps/backend/src/eval
npm run eval:rules-gate:baseline
npm run eval:worked-solutions
EMBEDDING_PROVIDER=mock npm run eval:worked-solutions
npm run eval:evidence-trace -- --case triggers-becomes-tapped-not-entering-tapped --case triggers-damage-prevented-no-trigger
npm run benchmark:rag-retrieval
npm run benchmark:rag-retrieval -- --semantic
```

## Files touched

- `apps/backend/src/eval/fixtures/commander-spellbook-lookup-attached-intent.prompt.golden.txt`
- `apps/backend/src/eval/fixtures/commander-spellbook-lookup-attached-intent.context.golden.json`
- `apps/backend/src/eval/fixtures/commander-spellbook-wrong-zone.prompt.golden.txt`
- `apps/backend/src/eval/fixtures/commander-spellbook-wrong-zone.context.golden.json`
- `apps/backend/src/eval/fixtures/upkeep-trigger.prompt.golden.txt`
- `apps/backend/src/eval/fixtures/upkeep-trigger.context.golden.json`
- apps/backend/src/eval/rules-gate/ (the baseline file `npm run eval:rules-gate:baseline` rewrites)
- PRD/work/exact-curated-rule-exclusion/slice-b.evidence.md (package bookkeeping only)
