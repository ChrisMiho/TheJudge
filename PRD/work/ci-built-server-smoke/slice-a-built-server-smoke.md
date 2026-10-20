# Slice A — Built-server smoke check

## Status: planned

## Goal

Every pull request proves the compiled backend starts, answers its health check,
and returns Sol Ring, and the deploy waits for that proof.

## Requirements

1. `scripts/smoke-built-server.mjs` with named constants `READY_DEADLINE_MS`
   (30 000), `REQUEST_TIMEOUT_MS` (per-request, via `AbortSignal.timeout`),
   `POLL_INTERVAL_MS`, `SOL_RING_ORACLE_ID`; pure helpers exported; `main()` runs
   only when the file is executed directly.
2. Behavior per NFR-020: free port by binding port 0; child env without
   `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, `OPENAI_API_KEY`, `NODE_ENV`; pass
   only on health `200 {"ok":true}` and Sol Ring `200` with non-empty string
   `oracleText` and `typeLine`; fail on child exit before ready, deadline, or any
   wrong status or body; print captured server output on failure; stop the child
   in every case; print boot time and both statuses.
3. `scripts/smoke-built-server.test.mjs` (picked up by `npm run test:scripts`)
   asserts the constants (deadline equals 30 000, request timeout is set and
   below the deadline), the env scrub, and every pass/fail rule, including health
   `200` with card `404` → fail, and an empty or missing `oracleText` → fail.
4. Root `package.json`: `smoke:built-server` script; appended to `quality:check`.
5. `.github/workflows/quality-check.yml`: job `built-server` (`ubuntu-24.04`,
   `timeout-minutes: 10`, Node 24, `cache: npm`, `npm ci`,
   `npm run smoke:built-server`; no `if:`, no `id-token`, no secrets, no frontend
   build step); `deploy.needs` gains `built-server`.
6. `scripts/ci-workflow-parity.test.mjs` gains assertions: `built-server` job
   exists, has `timeout-minutes`, Node 24, no path filter and no `id-token`,
   runs no `vite`/frontend build step, and is in `deploy.needs`.
7. Apply the accepted product truth to `PRD/sections/` by intent, in this same PR:
   NFR-020 appended; NFR-012 note 6 → 7; REQ-166 job list; the
   `integrations-and-data.md` health purposes line; the `system-map.md` Deploy and
   cost guardrails lines. Take the text from `GATE-QUESTIONS.md`.
8. Everything runs with no paid API, no `.secrets/`, no AWS access, no network
   beyond localhost, and no gitignored local data.

## Acceptance criteria

- [ ] A1 The smoke script exists and its unit tests pass: `node --test scripts/smoke-built-server.test.mjs`
- [ ] A2 The script defines the named constants `READY_DEADLINE_MS` (30 000), `REQUEST_TIMEOUT_MS`, `SOL_RING_ORACLE_ID`, and the unit tests assert the deadline value and that every fetch carries a timeout
- [ ] A3 Unit tests cover the pass/fail rules, including health `200` with card `404` fails, child exit before ready fails, deadline passed fails, empty `oracleText` fails
- [ ] A4 Unit tests assert the child environment drops `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, `OPENAI_API_KEY` and `NODE_ENV`, and that the child is stopped on pass and on fail
- [ ] A5 `npm run smoke:built-server` exits 0 locally and prints boot time and both statuses
- [ ] A6 After the smoke run no process listens on the port it used (the script's own post-run check or `lsof`)
- [ ] A7 `smoke:built-server` is in `quality:check`, and `npm run test:scripts` passes including the parity guard
- [ ] A8 The `built-server` job in `.github/workflows/quality-check.yml` sets `timeout-minutes`, uses Node 24, has no `if:`/path filter, no `id-token`, and no frontend build step; a parity test asserts each
- [ ] A9 `deploy.needs` lists `built-server`, asserted by the parity test
- [ ] A10 NFR-020 exists in `PRD/sections/non-functional-requirements.md` matching the accepted text, and NFR-012's note says 7 jobs
- [ ] A11 REQ-166's job list names `built-server`, the `integrations-and-data.md` health purposes list has the CI boot check line, and the `system-map.md` guardrails entry names `built-server`, `scripts/smoke-built-server.mjs` and NFR-020
- [ ] A12 `npm run typecheck`, `npm run lint` and `npm run format:check` pass
- [ ] A13 No new dependency is added to any `package.json` and no secret, `.env` or `.secrets/` path is read or written by the script

## Verification

```bash
node --test scripts/smoke-built-server.test.mjs
npm run smoke:built-server
npm run test:scripts
npm run typecheck && npm run lint && npm run format:check
grep -n "NFR-020\|built-server" PRD/sections/non-functional-requirements.md PRD/sections/functional-requirements.md PRD/sections/integrations-and-data.md PRD/sections/system-map.md
```

## Files touched

- `scripts/smoke-built-server.mjs` (new)
- `scripts/smoke-built-server.test.mjs` (new)
- `scripts/ci-workflow-parity.test.mjs`
- `package.json`
- `.github/workflows/quality-check.yml`
- `PRD/sections/non-functional-requirements.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/system-map.md`

## PRD promotion checklist

Product truth is applied by this slice (requirement 7). Cleanup only confirms it
is present: NFR-020, NFR-012 note, REQ-166 list, health route purposes, Deploy
and cost guardrails entry.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/ci-built-server-smoke/` ready to delete
