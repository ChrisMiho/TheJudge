# Quality check — ci-built-server-smoke

**Verdict: PASS**

What happened: the design brief, the finalized gate questions (all three
verdicts accept), the measurements file and the `## Gate verdicts` section of
`GRAPH-RUN.md` were re-checked against `PRD/sections/` and the repository on
2026-10-19 (build-half graph run `graph-20261019-182200`, node `gate-qc`,
attempt 1, the re-grade after the owner's verdicts). Nothing blocks map-out.
The package stays at `refined`.

What it means for a player: the planned check would stop a backend that will
not start, or one that starts with no card data, from reaching production.
Both are caught.

## Blocking findings

None.

## Advisory findings (do not block)

First-grade notes, carried forward:

1. Per-request timeout and job timeout are still not stated. The brief gives
   only the 30 s ready deadline. Status: stays advisory. Map-out should give
   each fetch a short timeout and set `timeout-minutes` on the `built-server`
   job, so a hung request cannot run to the six-hour default.
2. The 30 s ready deadline is still labelled "proposed". Status: stays
   advisory. Map-out should fix it as a constant in the script and its unit
   tests.
3. Only the card data is asserted; a missing rulings, prices or rules file
   still boots clean. Status: settled as scope. The brief states the card
   lookup as the intended check, and the accepted NFR-020 text says the same.
   Not a gap against the two named failures.
4. Ruleset 15384308 requires no status checks. Status: settled. The brief and
   the accepted NFR-020 note both say no gate job locks the merge button; the
   first grade re-read the ruleset and confirmed it.

New this grade:

5. `DESIGN-BRIEF.md` line 3 still says "Decide three product-truth changes".
   The decisions are made. Harmless for build; map-out should ignore it.
6. `DESIGN-BRIEF.md:192` says "No frontend build check (the owner asked about
   the backend)". The NFR-020 Reason gives the sharper reason: every PR already
   runs `vite build` (through `scripts/frontend-public-static-files.test.mjs`
   under `npm run test:scripts`, REQ-198) and `tsc` for the frontend. The two do
   not conflict; the outcome is the same (no frontend build step). Map-out
   should not add one.

## Checks run

### One story after the verdicts

All three verdicts are `accept` with no edits, so no diff changed. Nothing in
the brief contradicts an accepted diff or a Reason line. The brief's design
(command, new `built-server` job on Node 24, `quality:check` membership,
`deploy.needs` addition) matches the NFR-020 constraints word for word. The
amendment-set dispositions match the REQ-166, NFR-012, `system-map.md` and
`integrations-and-data.md` diffs.

### Diffs against current `PRD/sections/` (re-read on this branch)

The branch contains `origin/main` (merge-base check passes; `origin/main` has
no commits ahead).

| Diff | Target | Result |
| --- | --- | --- |
| NFR-020 append | `non-functional-requirements.md` | last block is NFR-019; its final note (line 345, "re-measured after REQ-174/Slice C…") matches once and is the file's last line; append applies cleanly |
| Companion, health route | `integrations-and-data.md` lines 160–164 | context (heading, `Purpose:`, "local development checks", "deployment health checks", "uptime verification") matches once at 160–164 |
| Companion, deploy guardrails | `system-map.md` lines 535–538 | the four removed lines match once |
| REQ-166 | `functional-requirements.md` | removed line matches once |
| NFR-012 | `non-functional-requirements.md` | "against the 6 this workflow uses" occurs once |

NFR-020 has zero hits in `PRD/sections/` and none on `origin/main`. The browser-smoke-suite
docs PR (#338) did not add NFR-021 to `PRD/sections/`; no clash.

### Technical claims against the repository

| Claim | Result |
| --- | --- |
| Single workflow `quality-check.yml`, triggers `push` (main), `pull_request`, `workflow_dispatch` | confirmed |
| Jobs `static`, `backend`, `frontend`, `coverage-merge`, `changes`, `deploy` | confirmed |
| Gate jobs on Node 22, `deploy` on Node 24, runners `ubuntu-24.04` | confirmed |
| `deploy.needs: [static, backend, coverage-merge, changes]` | confirmed (line 219) |
| `changes` and `deploy` do not run on pull requests | confirmed |
| `build` = `tsc -p tsconfig.build.json`; `typecheck` = `--noEmit`; `start` = `node dist/index.js` | confirmed in `apps/backend/package.json` |
| Lambda handler `apps/backend/dist/lambda.handler`, `nodejs24.x`, arm64 | confirmed in `scripts/aws-bootstrap.sh` |
| `PORT` parsed as integer 1–65535 (so `PORT=0` is rejected) | confirmed in `config/index.ts` |
| `registerHealthRoute` in `createApp.ts`; `GET /api/cards/:oracleId` in `routes/cardDetail.ts` | confirmed |
| `cardDetailByOracleId.json.br` committed | confirmed (`git ls-files`) |
| Sol Ring id `6ad8011d-…` is Sol Ring | confirmed in `apps/frontend/public/data/cardMetadata.json` |
| `scripts/ci-workflow-parity.test.mjs` exists; `scripts/smoke-built-server.mjs` does not yet exist | confirmed (to be built) |
| `quality:check` and `test:scripts` shapes | confirmed in root `package.json`; `test:scripts` globs `scripts/*.test.mjs`, so the new unit test is picked up |
| Measurements internally consistent (200/200/404; data-folder-absent run gives health 200, card 404) | confirmed |

### Agent-readiness

- Measurable acceptance: exact command, URLs, statuses, body shape, failure
  triggers (child exit before ready, deadline, wrong answer).
- Port: free port by binding port 0; reason given.
- Ready deadline: 30 s (see advisory 2). Pass/fail rule: stated.
- Per-request timeout and job timeout: not stated (advisory 1).
- Environment: provider and key variables and `NODE_ENV` removed, so `mock`
  providers and no `.env` or `.secrets/` read.
- No paid API, no `.secrets/`, no AWS, no network, no gitignored dump. Every
  boot file is committed; the model folder is untouched under `mock`.
- No open blocker questions. Screen-layout check: not applicable, no screen
  changes. `technical-design-rules.md`: untouched.

## Status

`STATUS.refined` remains the only marker. The `PRD/work/STATUS.md` board row is
under `## refined`. The README `## Preparation gate` section is left to the
driver.
