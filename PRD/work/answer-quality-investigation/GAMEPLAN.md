# GAMEPLAN — answer-quality-investigation

Plain version: build the measuring tools that show whether the judge's shaky answers come from missing rules, poor prompt layout, or the model. Run the free offline half at build. Write the runbook for the paid half. Nothing here changes what a player sees and nothing here spends money.

## Architecture

All work is evaluation tooling. No change under `apps/backend/src/prompt/`, routes, providers or the frontend.

- Experiment mode extends `scripts/eval-answer-quality.mjs` through its injectable `deps` (REQ-226, REQ-227), with a new `scripts/lib/experiment-run.mjs`. Routine runs and the committed `results.json` are untouched.
- Grader and parity fixes live in `apps/backend/src/eval/answer-quality/judge.ts`, `rubric.ts` and `scripts/lib/prompt-fidelity.mjs` (REQ-186 to REQ-189).
- The evidence trace is a new offline script pair reusing `rules-gate/` helpers (REQ-229).
- Arms and manifests are new pure functions plus two committed id-and-hash files (REQ-230, REQ-185).
- The compare report is a new offline script reading two run folders (REQ-228).

## Data flow

manifest -> experiment run (answer -> lone grade -> `calls.jsonl`) -> run folder -> compare report. Trace: checkout -> `trace.json` folder -> trace compare. Regrade: earlier run folder (read-only) -> new run folder.

## Slice order and dependencies

| Slice | Depends on |
| --- | --- |
| A experiment runs | none |
| B checkpoint, resume, cap | A |
| C grader repair, parity | A |
| D evidence trace | none |
| E arms and manifests | A, C, D |
| F compare report | A, C |
| G Phase 0 run, findings, runbook, PRD apply | A to F |

A, B, C and F all touch `scripts/eval-answer-quality.mjs`, so the build runs them one after another in the order A, B, C, D, E, F, G.

## Proposal application

Slice G is the only slice that applies the finalized `GATE-QUESTIONS.md` proposal to `PRD/sections/` (REQ-226 to REQ-230 new; REQ-185 to REQ-189 and NFR-018 amended; `system-map.md` edit inside the REQ-226 block), by intent against current truth, with the code in the same PR. Earlier slices implement the behavior and leave `PRD/sections/` alone. REQ-220/221 stay reserved; no `DEC-###`; no new id beyond REQ-230.

## Offline-only rule

Every verification is offline and free: fake clients, stored transcripts, fixtures, the offline trace, unit tests. The paid Phases 1 to 5 are documented in `RUNBOOK.md` and never run. No `npm run data:refresh`, no Scryfall fetch, no `--confirm-live-calls`. No dev server or browser is used, so no runtime cleanup criterion applies.

## Verification checklist

- `npm run test:scripts`
- `npm --workspace apps/backend run test`
- `npm run typecheck`
- `npm run eval:answer-quality` (dry run, no key)
- `npm run eval:evidence-trace`
- `npm run eval:answer-quality:compare` (on fixture runs)
- `npm run eval:rules-staleness`, `npm run eval:rules-coverage`
- `npm run quality:check` (slice G)

## Criteria

Each slice has `slice-<letter>.criteria.json` beside it. Evidence proves a command ran, not that it passed; the review node is the integrity gate. Only slice G has a manual criterion (no live spend occurred).
