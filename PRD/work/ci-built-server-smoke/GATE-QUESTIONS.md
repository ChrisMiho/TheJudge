# Gate questions — ci-built-server-smoke

**Decide:** three product-truth changes, one block each. Answer each
`Verdict:` with accept, edit or reject; a reason is required for edit and
reject. The design behind them is in `DESIGN-BRIEF.md`; the live measurements
are in `evidence/measurements.md`. There are no blocker questions.

## NFR-020 — every pull request proves the built backend starts and finds a card

**What this decides:** whether every pull request must prove that the
compiled backend — the same build the deploy ships — starts, answers its
health check, and returns one real card, before it can reach players.

**In plain terms:** today no check before merge ever runs the compiled
backend; the build itself first runs in the deploy, after merge. A change can
pass every test and still produce a server that will not start, or one that
starts with no card data — players would then tap a card and get no card text
and no prices. This adds a check that builds the backend, starts it, calls the
health check (`GET /api/health`, which always answers "ok" when the server is
up) and looks up Sol Ring through the card route (`GET /api/cards/:oracleId`,
the read-only route the card popup and Quick Lookup use, REQ-175). The card
lookup matters because a missing data file does not crash the server: it
starts, health says "ok", and every card comes back "not found" — measured
2026-10-18. The check uses only data already committed to the repository, the
free mock AI (no paid call, no secret, no AWS access — CI already needs none,
REQ-237), and runs on every PR. It also joins `npm run quality:check`, the one
command you run locally before a PR, so local and CI stay the same (NFR-012).
A red result shows on the PR and stops the deploy from `main`, like every
other check; it does not lock the merge button, because no check does today.

**What happens if you say no:** nothing new is checked. A build that cannot
start is still first discovered by the deploy after merge — or by players.

Proposed diff — `PRD/sections/non-functional-requirements.md` (append after NFR-019):

```diff
@@ end of file, after the NFR-019 Notes @@
   - re-measured after REQ-174/Slice C (trade-balancer-price-slim): the slim shape now stores a representative-printing id (`imageId`) instead of the full `imageUrl` string, so it compresses further — gzipped drops ~57.2% (4.23 MB → 1.81 MB, measured against the same live 33,399-card corpus). The ≥40% floor is unchanged and still has headroom
+
+### NFR-020
+- Title: Built backend boots and answers a card lookup on every pull request
+- Description: Every pull request and every push to `main` proves that the compiled backend — the output of `npm --workspace apps/backend run build`, the same build the deploy packages — starts, answers its health check, and serves one real card from the committed card data. A change that type-checks and passes its tests but leaves the built server unable to start, or started without its card data, fails before merge and never deploys. Before this, no pull-request job ran the compiled output: `typecheck` emits nothing, the tests run the TypeScript sources, and the build first ran in the `deploy` job after merge.
+- Constraints:
+  - the check is the committed command `npm run smoke:built-server`: it builds the backend, starts `node apps/backend/dist/index.js` on a free port, and passes only when `GET /api/health` answers `200 {"ok": true}` within the ready deadline and `GET /api/cards/6ad8011d-3471-4369-9d68-b264cc027487` (Sol Ring) answers `200` with a card block — a non-empty `oracleText` string and a non-empty `typeLine` string
+  - it fails on any other status or body, when the server exits before it is ready, or when the ready deadline passes; it prints the server's output on failure and stops the server in every case
+  - the card lookup is required, not optional: a missing or unreadable data file does not stop the server — each loader logs a warning and serves an empty index — so the health check stays `200` while every card lookup answers `404 card_not_found`
+  - the assertion checks the card block's shape, never its exact Oracle wording, so a data refresh that rewords card text cannot fail it
+  - `npm run smoke:built-server` is part of `npm run quality:check`, so the canonical local pre-PR command and CI stay equivalent (NFR-012); its pass/fail rules are unit-tested under `scripts/` and run by `npm run test:scripts`
+  - CI runs it in its own `built-server` job in `.github/workflows/quality-check.yml` on every pull request and every push to `main`, with no path filter (REQ-166's no-trigger-filter rule), on the Node major the Lambda runs (`nodejs24.x`, `scripts/aws-bootstrap.sh`); the `deploy` job lists `built-server` in `needs:`
+  - the server runs with `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, `OPENAI_API_KEY` and `NODE_ENV` unset, so both providers are the checkout default `mock` and no `.env` or `.secrets/` file is read; the check reads only committed files under `apps/backend/data/`, makes no network call, downloads no model, and needs no gitignored local data (REQ-181, REQ-237)
+  - the `built-server` job gets no `id-token` permission and no secret; only `deploy` may assume AWS credentials (DEC-084)
+- Dependencies:
+  - NFR-012
+  - NFR-017
+  - REQ-166
+  - REQ-175
+  - REQ-181
+  - REQ-237
+  - DEC-084
+- Notes:
+  - what it does not prove: the deployed Lambda entry point (`apps/backend/dist/lambda.js`, wrapped by `@codegenie/serverless-express`), the pruned `npm ci --omit=dev` linux/arm64 install, the arm64 native bindings the local embedder needs (REQ-184), the SSM key load, and the OpenAI call; those stay covered by `scripts/package-lambda.sh`'s refusals and the post-deploy live check
+  - `dist/index.js` is a development and CI entry point, not the deployed one: it imports `dotenv`, a devDependency the Lambda package omits
+  - Sol Ring is the card because it is a staple colorless artifact that will not leave the corpus; its block lives in the committed `apps/backend/data/cardDetailByOracleId.json.br`
+  - a red `built-server` result shows on the pull request and blocks the `main` deploy, the same as every other gate job; GitHub's ruleset on `main` requires no status check today, so no gate job locks the merge button
+  - measured 2026-10-18 on macOS arm64: build 1.2 s, server listening ~0.5 s after launch, both calls under 2 ms; with the data folder removed, health answered `200` and Sol Ring `404`; the built code booted on Node 22, 24 and 26
```

Companion edit — `PRD/sections/integrations-and-data.md`, `### Optional Endpoint: GET /api/health`:

```diff
 ### Optional Endpoint: `GET /api/health`
 Purpose:
 - local development checks
 - deployment health checks
+- the built-backend boot check every pull request runs: CI starts the compiled server and requires this route to answer `200 {"ok": true}` before it looks up one card (NFR-020)
 - uptime verification
```

Companion edit — `PRD/sections/system-map.md`, `### Deploy and cost guardrails`:

```diff
 - Status: shipped
-- Summary: Gates every main-branch deploy on `quality:check`, skips the deploy job on merges that touch no code-set path (with a `workflow_dispatch` manual override), caps Lambda concurrency when the account quota permits, retains the account limit as the fallback cap, and configures a low monthly AWS Budget alert.
-- Lives in: `.github/workflows/quality-check.yml` (`changes` and `deploy` jobs), `scripts/aws-bootstrap.sh`
-- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017
+- Summary: Gates every main-branch deploy on `quality:check` — including the built-backend boot check, which starts the compiled server on every pull request and requires the health check and one card lookup to answer — skips the deploy job on merges that touch no code-set path (with a `workflow_dispatch` manual override), caps Lambda concurrency when the account quota permits, retains the account limit as the fallback cap, and configures a low monthly AWS Budget alert.
+- Lives in: `.github/workflows/quality-check.yml` (`built-server`, `changes` and `deploy` jobs), `scripts/smoke-built-server.mjs`, `scripts/aws-bootstrap.sh`
+- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017, NFR-020
```

- Verdict: accept
- Reason: owner took the recommendation, 2026-10-19. A proposed widening, to also run the frontend production build, was dropped: every PR already runs it. `scripts/frontend-public-static-files.test.mjs` (REQ-198) runs `vite build` under `npm run test:scripts`, and `npm run typecheck` covers the `tsc -b` half (the frontend has a single `tsconfig.json` with no references). Opening the built site in a browser is the separate browser-smoke-suite proposal (NFR-021).

## REQ-166 — the new check also runs on every merge to main

**What this decides:** whether the list of checks that still run on a
documentation-only merge to `main` names the new built-backend check.

**In plain terms:** REQ-166 is the rule that a merge touching only documents
skips the production deploy but still runs every quality check, so `main`
always shows a green or red result. Its acceptance list names those checks
one by one — `static`, `backend`, `frontend`, `coverage-merge`. The new
`built-server` check (NFR-020, above) also runs on every merge, so it joins
that list. Nothing about when the deploy runs or skips changes.

**What happens if you say no:** REQ-166's list stays at four checks while the
workflow runs five, so the written rule no longer matches what CI does.

Proposed diff — `PRD/sections/functional-requirements.md`, `### REQ-166` Acceptance Criteria:

```diff
-  - the quality-check jobs (`static`, `backend`, `frontend`, `coverage-merge`) still run on every push to `main`, so `main` keeps a green CI signal on a docs-only merge
+  - the quality-check jobs (`static`, `backend`, `frontend`, `coverage-merge`, `built-server`) still run on every push to `main`, so `main` keeps a green CI signal on a docs-only merge
```

- Verdict: accept
- Reason: owner took the recommendation, 2026-10-19

## NFR-012 — the CI job count note goes from 6 to 7

**What this decides:** whether the CI-cost note in the test-speed
requirement records the new job in its count of jobs that run at once.

**In plain terms:** NFR-012 is the rule that keeps CI fast without weakening
any check. One of its notes says the repository is public, so runner minutes
are free, and that the real limit is how many jobs run at the same time — 20
allowed, "against the 6 this workflow uses". The built-backend check (NFR-020)
is a seventh job on every pull request, so the note says 7. If the repository
ever went private, that job would add about one billed minute per run, which
the note now says too.

**What happens if you say no:** the note keeps saying 6 jobs while the
workflow runs 7.

Proposed diff — `PRD/sections/non-functional-requirements.md`, `### NFR-012` Notes:

```diff
-  - CI cost exposure: the repository is public, so standard-runner minutes are free and unlimited and shard count carries no minute cost; the binding limit is concurrent jobs (20 on the Free plan) against the 6 this workflow uses. Actions billing rounds each job up to the nearest minute, so if the repository is ever made private the current 1m58s run bills ~9 minutes rather than 2 — sharding trades billed minutes for wall time, making it free today and the largest cost multiplier if visibility changes
+  - CI cost exposure: the repository is public, so standard-runner minutes are free and unlimited and shard count carries no minute cost; the binding limit is concurrent jobs (20 on the Free plan) against the 7 this workflow uses on a pull request (the seventh is NFR-020's `built-server` job). Actions billing rounds each job up to the nearest minute, so if the repository is ever made private the current 1m58s run bills ~9 minutes rather than 2, plus about one minute for `built-server` — sharding trades billed minutes for wall time, making it free today and the largest cost multiplier if visibility changes
```

- Verdict: accept
- Reason: owner took the recommendation, 2026-10-19
