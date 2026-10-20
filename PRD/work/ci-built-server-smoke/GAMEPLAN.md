# Gameplan — ci-built-server-smoke

Every pull request builds the backend the way the deploy does, starts it, and
requires the health check and a Sol Ring lookup to answer. If the build cannot
start, or starts with no card data, the check turns red on the PR and the
deploy on `main` does not run. A player never meets a server that boots but
finds no cards.

Design: `DESIGN-BRIEF.md`. Product truth: NFR-020 (new), REQ-166 and NFR-012
(amended), all accepted in `GATE-QUESTIONS.md`. Measurements:
`evidence/measurements.md`.

## Slices

One slice. The script, its tests, the CI job and the product-truth edits are one
small change that only makes sense together: a CI job with no script fails, and
the parity guard `scripts/ci-workflow-parity.test.mjs` fails the moment
`quality:check` gains the command without a CI job running it.

| Slice | Doc | Goal |
| --- | --- | --- |
| A | `slice-a-built-server-smoke.md` | Smoke command, unit tests, `quality:check` entry, `built-server` CI job, deploy dependency, product truth applied |

## Architecture

- `scripts/smoke-built-server.mjs` — exports pure helpers (`pickFreePort`,
  `buildChildEnv`, `evaluateHealth`, `evaluateCard`, `waitUntilReady`) and a
  `main()` that runs only when executed directly, so the test file imports it
  without starting a server.
- Named constants at the top of the script, asserted by the unit tests:
  `READY_DEADLINE_MS = 30_000`, `REQUEST_TIMEOUT_MS = 5_000` (each fetch uses
  `AbortSignal.timeout`), `POLL_INTERVAL_MS`, `SOL_RING_ORACLE_ID =
  "6ad8011d-3471-4369-9d68-b264cc027487"`.
- `package.json` root: `"smoke:built-server": "npm --workspace apps/backend run
  build && node scripts/smoke-built-server.mjs"`, appended to `quality:check`.
- `.github/workflows/quality-check.yml`: new job `built-server` — `ubuntu-24.04`,
  `timeout-minutes: 10`, checkout, `setup-node` Node 24 with `cache: npm`,
  `npm ci`, `npm run smoke:built-server`. No `if:`, no path filter, no
  `permissions` block of its own (workflow default `contents: read`). No
  frontend build step: every PR already runs `vite build` through
  `scripts/frontend-public-static-files.test.mjs` (REQ-198) and the frontend
  `tsc` through `npm run typecheck`.
- `deploy.needs` gains `built-server`.

## Data flow

`npm run smoke:built-server` → `tsc -p tsconfig.build.json` writes
`apps/backend/dist/` → script picks a free port → spawns
`node apps/backend/dist/index.js` with `PORT` set and `ASK_AI_PROVIDER`,
`EMBEDDING_PROVIDER`, `OPENAI_API_KEY`, `NODE_ENV` removed → polls
`GET /api/health` until `200 {"ok":true}` or the 30 s deadline or child exit →
`GET /api/cards/<Sol Ring id>` must be `200` with non-empty string `oracleText`
and `typeLine` → child is stopped in every case → exit 0 or 1 (server output
printed on failure).

## Product truth applied in the same PR

Applied to `PRD/sections/` by intent, exactly as the accepted diffs in
`GATE-QUESTIONS.md` read:

- `non-functional-requirements.md` — append NFR-020; NFR-012 note 6 → 7.
- `functional-requirements.md` — REQ-166 job list gains `built-server`.
- `integrations-and-data.md` — health route purposes gain the CI boot check.
- `system-map.md` — Deploy and cost guardrails summary, Lives in, Backed by.

## Constraints that bind every check

Everything runs locally and in CI with no paid API, no `.secrets/`, no AWS
access, no network and no gitignored local data dump. Criteria evidence is
earned by a command the build node runs or a file it writes. No post-merge or
post-deploy check appears in any criterion.

## Verification checklist

- [ ] `node --test scripts/smoke-built-server.test.mjs` green
- [ ] `npm run smoke:built-server` exits 0 and prints boot time plus both statuses
- [ ] `npm run test:scripts` green (includes the parity guard)
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` green
- [ ] Workflow YAML parses and the parity assertions for `built-server` pass
- [ ] Port released after the smoke run
