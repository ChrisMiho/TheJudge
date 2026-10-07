# Slice A — Experiment runs and identity record

## Status: planned

## Dependencies

none

## Goal

A named experiment run answers a fixed list of approved cases, repeats them, records exactly what it measured (including the commit it ran from), and writes only to its own folder; a regrade run re-grades stored answers.

## Requirements

1. REQ-226 (new): `--run-id`, `--manifest`, `--repeat`, `--expect-commit`, `--regrade-from`; manifest holds case ids with SHA-256 of `question` and `expected.answer`; stale, unapproved, missing or mismatched case refuses the run by name.
2. Each record keyed by case, model, excerpt cap, arm, repeat index. Output under `output/answer-quality/runs/<run-id>/`: `manifest.json` (identity record), transcripts, numbers-only `summary.json`. Identity record fields per brief section 4.2 (commit, SHA-256 of each data and case file, rules-index hash, models requested and reported, request options, timeout and retries, providers, combo catalog loaded flag, caps, arms and revisions, repeats, judge model, rubric revision, rate table with check dates, spending cap, regrade source run, start time).
3. Refuse on uncommitted changes or a commit different from `--expect-commit`; import nothing across checkouts.
4. Experiment mode never reads or writes the committed `results.json`; routine runs behave exactly as before.
5. Regrade mode makes no answer call, reads an earlier run folder read-only, writes only its own folder, and its identity record names the source run and the source manifest hash.
6. Build in `scripts/lib/experiment-run.mjs` (new) and extend `scripts/eval-answer-quality.mjs` through its injectable `deps`; no change under `apps/backend/src/prompt/`, routes or providers.

## Acceptance criteria

- [ ] A1: A fake-client test shows a manifest with a missing, unapproved, or hash-mismatched case refuses the run and names that case
- [ ] A2: A test shows `--repeat 3` produces three independent records per case keyed by case, model, cap, arm and repeat index
- [ ] A3: A test shows the identity record contains every field listed in brief section 4.2, including the commit run from
- [ ] A4: A test shows a dirty checkout and a commit different from `--expect-commit` each refuse the run before any call
- [ ] A5: A test shows an experiment run writes only under its own run folder and leaves `apps/backend/src/eval/answer-quality/results.json` byte-identical; a routine run still merges as before
- [ ] A6: A test shows a regrade run makes zero answer calls, never writes into the source run folder, and records the source run id and manifest hash
- [ ] A7: `npm run eval:answer-quality` with no key and no experiment flags still dry-runs without a network call
- [ ] A8: Typecheck passes

## Verification

```bash
npm run test:scripts
npm run eval:answer-quality
npm run typecheck
```

No live OpenAI call; fake clients and stored fixtures only.

## Files touched

- `scripts/eval-answer-quality.mjs`
- `scripts/lib/experiment-run.mjs (new)`
- `scripts/lib/experiment-run.test.mjs (new)`
- `scripts/eval-answer-quality.test.mjs`
