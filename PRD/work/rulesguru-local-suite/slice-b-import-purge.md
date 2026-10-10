# Slice B — Import and purge commands

## Status: done

## Goal

The owner can import the question set politely and resumably into the suite folder, and wipe it with one command; both proven on an injected fetch only.

## Requirements

1. Applies the accepted `REQ-232` block: add the import, freeze-on-import, resumable and purge criteria to the `REQ-232` entry.
2. `scripts/lib/rulesguru-import.mjs`: `fetch` and a clock are required parameters. Request `GET https://rulesguru.org/api/questions/?json=<settings>` with `previousId` (starts 1), `count`, every level, every complexity, legality `all`, no tag filter, and `from` naming TheJudge. Sequential, next request no sooner than 3 s after the previous finished. Batch starts at 50; malformed-batch error halves the size down to 1 at the same `previousId`; a failing size-1 request records a skip and steps `previousId` by one; five successes in a row double the size toward 50.
3. Freeze: each question is written to `raw/<id>.json` as returned (temp file, then rename); an existing id is never overwritten. `import-state.json` is rewritten after each saved batch; a new run starts from the larger of the saved last id and 1.
4. Clean stop with progress saved: network error; a rate-limit answer that repeats after one 30 s wait; 10 failed requests in a row; an empty batch (end). Prints counts only (saved, skipped, already frozen).
5. `scripts/rulesguru-import.mjs` entry passes Node's global `fetch`; it runs the ignore guard from slice A first. `package.json` gains `eval:rulesguru:import` and `eval:rulesguru:purge`.
6. `scripts/rulesguru-purge.mjs`: deletes `SUITE_DIR` recursively and nothing else; without `--yes` prints the file count it would delete; refuses a target that does not resolve to exactly `SUITE_DIR`.
7. The build and its tests never run the entry point against the live site.

## Acceptance criteria

- [x] First request uses `previousId` 1 and a `from` value naming TheJudge (injected fetch)
- [x] With an injected clock, no request starts less than 3 s after the previous one finished
- [x] A malformed error halves the size 50, 25, 12, 6, 3, 1 at the same `previousId`; a failing size-1 request records a skip and advances one id; size regrows after five consecutive successes
- [x] A frozen file is never overwritten; resume starts after the saved id; state is rewritten after each batch
- [x] A network error, 10 consecutive failures, and a repeated rate-limit answer after one 30 s wait each stop with state saved; an empty batch ends cleanly; output is counts only
- [x] Purge without `--yes` deletes nothing and prints the count; with `--yes` it deletes only a temporary suite folder; it refuses a path outside the suite folder
- [x] Every import and purge test uses a temporary folder and an injected fetch and clock; no test names `output/rulesguru` or passes the global `fetch`
- [x] `package.json` has the two scripts, the entry point runs the ignore guard first, and no live request was made during the build (no `--confirm-live-calls`, no real fetch in verification)
- [x] The `REQ-232` entry gains the import, freeze, resumable and purge criteria
- [x] `npm run test:scripts` passes

## Verification

```bash
node --test scripts/lib/rulesguru-import.test.mjs scripts/rulesguru-purge.test.mjs
npm run test:scripts
```

## Notes (evidence, self-reported; re-run to confirm)

- B1: `node --test scripts/lib/rulesguru-import.test.mjs` 17 pass, 0 fail; the first request starts at previousId 1, `from` is TheJudge, and `buildSettings` is asserted key for key (`level`, `complexity`, `legality`, `tags`, `tagsConjunc`).
- B2, B5: `node --test scripts/lib/rulesguru-import.test.mjs` 17 pass, 0 fail, and `npm run test:scripts` 846 pass, 0 fail, both re-run and read after the id-1 fix (injected fetch, clock and sleep, invented questions, temporary folders).
- B3: same command; halving 50 to 1, the skip at size 1 and the regrow after five successes pass.
- B4: same command; frozen files are never overwritten (including a wrapped batch), resume starts after the saved id, state is saved per batch. Every id in a batch is frozen when its file is absent (counted `alreadyFrozen` when present), including id 1, which only arrives in the wrap batch; only ids above the cursor move it. A batch with no id above the cursor ends the import as complete (stop reason `end`); a mixed batch saves 1, 2 and 3; a wrap test with 1.json absent saves it and leaves other files byte-unchanged. `classifyResponse` also reads a list under `data`.
- B6: `node --test scripts/rulesguru-purge.test.mjs` 5 pass, 0 fail.
- B7: `node --test scripts/lib/rulesguru-suite.test.mjs scripts/answer-quality-no-gate.test.mjs` 9 pass, 0 fail; the name guard scans both new test files.
- B8: `package.json` has `eval:rulesguru:import` and `eval:rulesguru:purge`; `scripts/rulesguru-import.mjs` calls `assertSuiteIgnored()` first in `main()`. No import entry run, no real fetch and no `--confirm-live-calls` in this slice's verification; only `npm run eval:rulesguru:purge` (dry run, prints a count, deletes nothing) was run.
- B9: the `REQ-232` entry in `PRD/sections/functional-requirements.md` now holds the import, freeze on import, resumable and purge criteria (`grep -n "freeze on import" PRD/sections/functional-requirements.md` finds it at line 6106; REQ-232 text unchanged, it already says the import runs to the end of the questions).
- B10: `npm run test:scripts` 845 pass, 0 fail.
- Request settings now match what a successful probe sent: `level` and `complexity` as lists of strings, `legality` all, empty `tags`, `tagsConjunc` NOT, plus `previousId`, `count`, `from`. The response may be a bare array or hold the list under `questions` or `data`. Past the last question the API wraps back to id 1, so the import treats a batch that does not rise above the cursor as the end.

## Files touched

- `scripts/lib/rulesguru-import.mjs`, `scripts/lib/rulesguru-import.test.mjs`
- `scripts/rulesguru-import.mjs`
- `scripts/rulesguru-purge.mjs`, `scripts/rulesguru-purge.test.mjs`
- `package.json`
- `PRD/sections/functional-requirements.md` (REQ-232 criteria)
