# Slice B — Save as you go, resume, spending cap, unpriced models

## Status: done

## Dependencies

Slice A (run folder, record key, identity record)

## Goal

A paid run keeps every finished call on disk, resumes after a crash, stops before it would pass the owner's cap, and refuses to run capped when a model has no known price.

## Requirements

1. REQ-227 (new): append each record to `calls.jsonl` as soon as its judge call returns; a provider error or timeout becomes an `error` record and the run continues.
2. `--resume <run-id>` refuses if any identity field changed and skips completed keys; `--retry-errors` re-attempts error records.
3. `--confirm-live-calls` in experiment mode requires `--max-cost-usd`; before each call add that call's estimate to spend so far and stop cleanly if the cap would be passed; cost from provider-reported usage with reasoning tokens counted as output.
4. A model with no rate is "unpriced": the dry run prints it as unpriced and a live experiment run refuses to start.
5. All tests use injected fake clients; no live call.

## Acceptance criteria

- [x] B1: A test shows each record is on disk in `calls.jsonl` before the next call starts (a fake client that throws on call N leaves N-1 records)
- [x] B2: A test shows a provider error and a timeout become `error` records and the run continues
- [x] B3: A test shows `--resume` skips completed keys and refuses when any identity field changed
- [x] B4: A test shows `--retry-errors` re-attempts only error records
- [x] B5: A test shows `--confirm-live-calls` without `--max-cost-usd` refuses in experiment mode
- [x] B6: A test shows the run stops cleanly before a call whose estimate would pass the cap, with a summary naming the cap and spend
- [x] B7: A test shows reasoning tokens are costed as output tokens
- [x] B8: A test shows a model with no rate prints as unpriced in the dry run and a live capped run refuses to start
- [x] B9: Typecheck passes

## Verification

```bash
npm run test:scripts
npm run typecheck
```

No live OpenAI call; fake clients and stored fixtures only.

## Files touched

- `scripts/lib/experiment-run.mjs`
- `scripts/lib/experiment-run.test.mjs`
- `scripts/eval-answer-quality.mjs`
- `scripts/eval-answer-quality.test.mjs`
