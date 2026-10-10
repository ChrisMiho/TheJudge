# Gameplan — rulesguru-local-suite

## What the owner gets

A local practice suite of about 1,500 judge-style rules questions, used with permission, local only. The owner imports once, converts into test cases, runs the free retrieval check over all of them and the paid answer run over a filtered slice, split by level, complexity and tags. Players see nothing change.

## Safety rules for every slice

- The build never runs the real import, convert or suite run against the live source. No network request to it, no live OpenAI call, no `--confirm-live-calls`. Dry runs are fine.
- Tests use an injected fetch, clock and client, invented questions, and temporary folders. No test reads `output/rulesguru/`.
- Every criterion is checkable with no suite data present. The owner runs the first real import by hand from the main checkout after the merge.
- Nothing under `apps/backend/src/prompt/`, routes or providers changes. No new npm dependency.
- Nothing that must outlive the package lives under `PRD/work/`: durable notes go in committed code, tests, `apps/backend/src/eval/worked-solutions/README.md`, or `docs/`.
- No question or answer text from the source in any file. Synthetic questions are invented. The only words about the permission are "used with permission, local only".
- Accepted decisions: all 9 gate slots accepted. B1 yes, by the owner's hand only. B2 folder `output/rulesguru/` (one constant, `SUITE_DIR`).

## Architecture

```
output/rulesguru/ (gitignored, SUITE_DIR)
  raw/<id>.json        import  -> frozen as fetched
  import-state.json    import
  cases/*.case.json    convert -> format v2, tier external, draft
  convert-report.txt   convert
  reports/             retrieval check
  runs/<run-id>/       answer run (experiment machinery, arm A)
```

Data flow: import (injected fetch) writes `raw/`; convert reads `raw/` plus committed card and rule data and writes `cases/`; `loadGoldCases(dir, { external: true })` reads `cases/`; the retrieval check and the answer run both call the shared selection and filters in `scripts/lib/rulesguru-suite.mjs`.

## Slices

| Slice | Title | Depends on | Applies from GATE-QUESTIONS.md |
| --- | --- | --- | --- |
| A | Suite folder, ignore line, guards, loader external mode | none | REQ-232 (creates the entry; folder, loader, never-a-gate, tested-on-synthetic criteria); B2 |
| B | Import and purge commands | A | REQ-232 (import, freeze, resumable, purge criteria) |
| C | Name lookup, header mapping, convert | A | REQ-232 (convert, full name lookup, bare keyword headers, kept-but-excluded criteria) |
| D | Retrieval check suite mode | A, C | REQ-232 (retrieval check, filters criteria) |
| E | Answer-quality run suite mode | A, C, D | REQ-232 (answer run criterion) |
| F | PRD apply, README, promotion checklist | A to E | REQ-185 (three insertions plus B1 line), REQ-186, REQ-188, REQ-226, NFR-018, goals-and-non-goals, system-map |

A lands first so the ignore line precedes any import code. B and C are parallel-ready after A. D needs C (cases to select). E needs D (shared filters and selection helpers).

## Verification checklist

- `npm run test:scripts` green after every slice.
- `npm run quality:check` green after the last slice.
- `git check-ignore -q output/rulesguru/raw/probe.json` succeeds; `git ls-files output/rulesguru` is empty.
- `git status --short` shows no path under `output/rulesguru/` and no file with suite content.
- No script named in `npm test`, `quality:check` or any workflow references a suite command.
- `git diff --stat main -- apps/backend/src/prompt` is empty.
- The REQ-232 entry in `PRD/sections/functional-requirements.md` matches the accepted block by intent.
