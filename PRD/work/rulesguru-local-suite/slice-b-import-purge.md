# Slice B — Import and purge commands

## Status: planned

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

- [ ] First request uses `previousId` 1 and a `from` value naming TheJudge (injected fetch)
- [ ] With an injected clock, no request starts less than 3 s after the previous one finished
- [ ] A malformed error halves the size 50, 25, 12, 6, 3, 1 at the same `previousId`; a failing size-1 request records a skip and advances one id; size regrows after five consecutive successes
- [ ] A frozen file is never overwritten; resume starts after the saved id; state is rewritten after each batch
- [ ] A network error, 10 consecutive failures, and a repeated rate-limit answer after one 30 s wait each stop with state saved; an empty batch ends cleanly; output is counts only
- [ ] Purge without `--yes` deletes nothing and prints the count; with `--yes` it deletes only a temporary suite folder; it refuses a path outside the suite folder
- [ ] Every import and purge test uses a temporary folder and an injected fetch and clock; no test names `output/rulesguru` or passes the global `fetch`
- [ ] `package.json` has the two scripts, the entry point runs the ignore guard first, and no live request was made during the build (no `--confirm-live-calls`, no real fetch in verification)
- [ ] The `REQ-232` entry gains the import, freeze, resumable and purge criteria
- [ ] `npm run test:scripts` passes

## Verification

```bash
node --test scripts/lib/rulesguru-import.test.mjs scripts/rulesguru-purge.test.mjs
npm run test:scripts
```

## Files touched

- `scripts/lib/rulesguru-import.mjs`, `scripts/lib/rulesguru-import.test.mjs`
- `scripts/rulesguru-import.mjs`
- `scripts/rulesguru-purge.mjs`, `scripts/rulesguru-purge.test.mjs`
- `package.json`
- `PRD/sections/functional-requirements.md` (REQ-232 criteria)
