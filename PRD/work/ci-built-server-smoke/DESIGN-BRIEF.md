# Design brief — ci-built-server-smoke

**What you need to do:** Decide three product-truth changes in
`GATE-QUESTIONS.md` (one new requirement, two small amendments). There are no
blocker questions.

## What it means for a player

Today a pull request can pass every check and still ship a backend that will
not start, or one that starts but cannot find any card. A player would open
the site, tap a card, and get nothing: no card text in the card popup, no
prices in the Trade Balancer, no card text behind a rules answer. Nothing in
CI today would have stopped that build reaching production.

After this change every pull request builds the backend the same way the
deploy does, starts it, checks it answers, and looks up one real card — Sol
Ring. If the build cannot start, or starts without its card data, the check
turns red on the PR and the deploy on `main` does not run.

## What exists today (grounded in the repository)

**The CI workflow.** There is one workflow, `.github/workflows/quality-check.yml`,
triggered on `pull_request`, on push to `main`, and on `workflow_dispatch`.
Its jobs:

| Job | Runs on PRs | What it does | Node |
| --- | --- | --- | --- |
| `static` | yes | `npm run typecheck`, `lint`, `format:check`, `test:scripts` | 22 |
| `backend` | yes | `npm --workspace apps/backend run test:coverage` | 22 |
| `frontend` (3 shards) | yes | frontend vitest coverage shards | 22 |
| `coverage-merge` | yes | merges shards, applies thresholds | 22 |
| `changes` | no (main push / dispatch) | decides deploy vs skip (REQ-166) | — |
| `deploy` | no | `needs: [static, backend, coverage-merge, changes]`; builds the backend, runs `scripts/aws-deploy.sh` | 24 |

**No PR job builds the backend.** `npm run typecheck` runs
`tsc -p tsconfig.json --noEmit` — it type-checks but emits nothing. The only
place `npm --workspace apps/backend run build` runs in CI is the `deploy` job,
after merge. The backend tests run the TypeScript sources through vitest, never
the compiled output. So nothing before merge ever runs `apps/backend/dist/`.

**The backend build.** `npm --workspace apps/backend run build` =
`tsc -p tsconfig.build.json` (`apps/backend/package.json`). It writes
`apps/backend/dist/` (388 KB measured; gitignored by `dist/` in `.gitignore`),
excluding tests, `src/test-utils/**` and `src/eval/**`.

**Two entry points into the same app.**

- `apps/backend/dist/index.js` (from `src/index.ts`) — the HTTP server. Started
  with `node apps/backend/dist/index.js` (the `start` script). It reads `PORT`
  (default 3000), calls `createConfiguredApp(repoRoot, process.env)` and
  `app.listen`. It loads `.env` files only when `NODE_ENV=development`.
- `apps/backend/dist/lambda.js` (from `src/lambda.ts`) — what production runs.
  `scripts/aws-bootstrap.sh` creates `thejudge-api` with
  `--handler apps/backend/dist/lambda.handler`, `--runtime nodejs24.x`,
  `--architectures arm64`. It awaits `loadOpenAiKeyFromSsm` (a no-op unless
  `ASK_AI_PROVIDER=openai`), calls the same `createConfiguredApp`, and wraps the
  Express app with `@codegenie/serverless-express`. Production sets
  `ASK_AI_PROVIDER=openai`, `EMBEDDING_PROVIDER=local` (`scripts/aws-deploy.sh`).
- The Lambda package is a pruned `npm ci --omit=dev` install for linux/arm64
  (`scripts/package-lambda.sh`). `index.js` imports `dotenv`, a devDependency,
  so `index.js` would not even load inside the Lambda package — it is a
  development and CI entry point, not the deployed one.

**The two routes.** Both registered in `apps/backend/src/app/createApp.ts`.

- `GET /api/health` — `apps/backend/src/routes/health.ts`; always
  `200 {"ok": true}`. The PRD calls it the non-product health check, used for
  local checks, deployment health checks, uptime checks and the Trade
  Balancer's warm-up ping (`integrations-and-data.md`, REQ-064, REQ-175).
- `GET /api/cards/:oracleId` — `apps/backend/src/routes/cardDetail.ts`
  (REQ-175). A known Scryfall oracle id returns `200` with the card block
  (`oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`,
  `subtypes`, `keywords`; power/toughness/loyalty stripped per REQ-245). An
  unknown id returns `404 {"error": "card_not_found"}`.

**The data a card lookup needs.** One file:
`apps/backend/data/cardDetailByOracleId.json.br` (1.7 MB, brotli JSON, 37,854
cards). It is **committed** — `git ls-files apps/backend/data` lists it — so a
fresh CI checkout has it. Boot also reads five other committed files (rulings,
prices, game-rules topics, rule index, combo index; full list with timings in
`evidence/measurements.md`). None of the gitignored local dumps is read, and
the gitignored model folder `apps/backend/data/models/` is not touched while
the embedding provider is `mock`.

**Missing data does not crash the server.** Every loader
(`cardDetail.ts`, `cardRulings.ts`, `cardPrices.ts`, `gameRules.ts`,
`gameRulesRetrieval.ts`, `commanderSpellbook/catalog.ts`) logs one warning and
returns an empty index. Measured: with the data folder absent the server
boots, health answers `200`, and Sol Ring answers `404`. That is why the card
lookup is part of the check — health alone would have passed.

**Branch rules today.** GitHub's ruleset on `main` (id 15384308) requires a
pull request and blocks deletion and force-push, and requires **no** status
checks. Every existing CI job is advisory on the PR page; what a red job
actually stops is the deploy, through `deploy.needs`.

## Live verification

Recorded in full in `evidence/measurements.md`. Summary: build 1.2 s; the
built server was listening ~0.5 s after launch; `/api/health` answered
`200 {"ok":true}`; Sol Ring answered `200` with its card block in under 1 ms;
an unknown id answered `404`. The Lambda handler, invoked in-process, served
both routes on Node 22, 24 and 26. Port 3917 was released afterwards. Local
was macOS arm64; the mock-provider boot loads no native module, so no x86
difference is expected (details in the evidence file).

## The design

1. **A committed command, `npm run smoke:built-server`.** Root `package.json`
   script: `npm --workspace apps/backend run build && node scripts/smoke-built-server.mjs`.
   The script:
   - picks a free port (bind port 0, read it, release it), because `PORT=0` is
     rejected by `readServerConfig` and a fixed port could collide with a
     developer's dev server on 3000;
   - starts `node apps/backend/dist/index.js` as a child process with `PORT`
     set and `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, `OPENAI_API_KEY` and
     `NODE_ENV` removed from its environment, so both providers are `mock` and
     no `.env` or `.secrets/` file is read;
   - polls `GET /api/health` until it answers, with a ready deadline (30 s
     proposed; boot measured 0.5 s);
   - passes only when health is `200 {"ok": true}` and
     `GET /api/cards/6ad8011d-3471-4369-9d68-b264cc027487` (Sol Ring) is `200`
     with a card block — a non-empty `oracleText` string and a non-empty
     `typeLine` string;
   - fails, printing the server's captured output, when the child exits
     before it is ready, the deadline passes, or either answer is wrong;
   - always stops the child, and prints boot time and both statuses.
2. **The pass/fail rules are unit-tested** in
   `scripts/smoke-built-server.test.mjs` (picked up by `npm run test:scripts`),
   including the case measured above: health green, card `404` → fail.
3. **It joins `npm run quality:check`.** Appended to the aggregate so the
   canonical local pre-PR command and CI stay equivalent (NFR-012). This
   follows the existing precedent of the Lambda package-size test, which runs
   in `quality:check` "so an over-quota artifact fails on the pull request,
   not after the merge" (NFR-017). Local cost is about two seconds.
4. **A new CI job, `built-server`,** in `.github/workflows/quality-check.yml`:
   `ubuntu-24.04`, checkout, `setup-node` with Node 24, `npm ci`, then
   `npm run smoke:built-server`. It runs on every PR and every push to `main`,
   like the other gate jobs, with no path filter and no extra permissions. The
   existing `scripts/ci-workflow-parity.test.mjs` guard then requires it
   automatically: it fails if any `quality:check` leaf command is not run by a
   pull-request job.
5. **The deploy waits for it.** `deploy.needs` gains `built-server`, so a
   build that cannot boot never reaches production.

## Answers to the open questions in `IDEA.md`

1. **Which card, and where does CI get the data?** Sol Ring, oracle id
   `6ad8011d-3471-4369-9d68-b264cc027487` — a staple colorless artifact that
   will not leave the corpus. Its block is in the committed
   `apps/backend/data/cardDetailByOracleId.json.br`, which every checkout has.
   No gitignored dump, download or refresh is needed. The assertion checks the
   block's shape, not its exact wording, so a data refresh that rewords Oracle
   text cannot turn the check red.
2. **Does it need the rule-search model or embedder?** No. The trained model
   lives in a private S3 bucket and PR jobs have no AWS credentials by design
   (only `deploy` gets `id-token: write`, asserted by
   `scripts/ci-workflow-parity.test.mjs`). The PRD already says CI quality
   checks need no AWS access and no model, with `EMBEDDING_PROVIDER` left at
   `mock` (REQ-237). The health and card routes never touch the embedder.
3. **Required check or warning?** It behaves exactly like every other gate
   job: red on the PR, and it blocks the deploy on `main`. No CI job is a
   GitHub required status check today (the ruleset requires none), so this one
   is not either. Making checks required is a GitHub setting the owner can turn
   on at any time; it is not part of this change.
4. **Every PR, or only backend/data paths?** Every PR. All gate jobs run
   unfiltered; REQ-166 forbids workflow-level path filters because they would
   drop the quality checks, and NFR-012 forbids narrowing when a gate applies.
   The job costs roughly 20–30 s of runner time in parallel with the frontend
   shards, which take longer, so PR wall time does not grow.

## Material assumptions (conservative ladder)

| Assumption | Evidence | Ladder rung |
| --- | --- | --- |
| The check starts `dist/index.js`, not the Lambda handler | Owner's request: "starts the built backend and calls /api/health" | request text |
| Node 24 for the new job, not 22 | Lambda runs `nodejs24.x` (`scripts/aws-bootstrap.sh`); `deploy` builds with Node 24; REQ-093 records a real 22-vs-24 brotli difference; boot verified on 22, 24 and 26 | equivalent technical choice, closest to production |
| A separate job, not extra steps in `backend` | The owner asked for "a CI check" — a named check on the PR; the `backend` job is pinned to Node 22 | request text; reversible |
| Joins `quality:check` | NFR-012: the local command and the CI decomposition must not drift; NFR-017 precedent | PRD |
| Shape assertion, not exact Oracle text | Data refreshes (`npm run data:refresh-pr`) may reword text; the check is about boot and data presence | smallest reversible scope |
| Not a required status check | Ruleset requires none today; all gate jobs are treated the same | established pattern |
| Runs on every PR, no path filter | REQ-166 constraint; NFR-012 | PRD |

## Non-goals

- No change to any player-facing behavior, route, response or data file.
- No change to the deploy itself (`scripts/aws-deploy.sh`, `scripts/package-lambda.sh`).
- Does not prove the deployed Lambda path: the `lambda.js` wrapper, the pruned
  `--omit=dev` arm64 install, the arm64 native bindings for the embedder
  (REQ-184), the SSM key load, or the OpenAI call. Those stay covered by
  `scripts/package-lambda.sh`'s refusals and the post-deploy live check.
- No frontend build check (the owner asked about the backend).
- No `ask-ai` call, not even with the mock provider.
- No GitHub settings change.

## Offered separately (not in scope)

The deployed entry point can be exercised the same way at almost no cost:
importing `apps/backend/dist/lambda.js` and calling its handler with a
synthetic Function URL event served both routes in 0.4 s with no AWS access
(`evidence/measurements.md` §6). That would catch a broken Lambda wrapper,
which this check cannot. It is a one-line follow-up if the owner wants it;
it is left out because the request named the started server.

## Product truth this needs

Full diffs in `GATE-QUESTIONS.md`:

- **NFR-020 (new)** — the built backend boots and answers a card lookup on
  every pull request; companion lines in `integrations-and-data.md` (health
  check purposes) and `system-map.md` (Deploy and cost guardrails).
- **REQ-166 (amend)** — its list of quality-check jobs that run on every push
  to `main` gains `built-server`.
- **NFR-012 (amend)** — its note "the 6 [concurrent jobs] this workflow uses"
  becomes 7.

NFR-020 is the next free NFR number: `PRD/sections/non-functional-requirements.md`
ends at NFR-019, no remote branch mentions NFR-020, and NFR-015 is skipped
because it was the unreviewed leaked id recorded in `open-questions.md`.

## Amendment set — disposition per grep hit

Grep 1 (required terms), run over `PRD/sections/`:
`grep -rniE "\bCI\b|quality gate|quality-check\.yml|health check|/api/health|healthcheck|smoke|deploy verif|verify the deploy|boots?\b"` — 52 hits.

| # | Hit | Disposition |
| --- | --- | --- |
| 1 | `overview.md:43` — Trade Balancer price fetch, mentions `/api/health` warm-up | unaffected |
| 2 | `user-flows.md:199` (FLOW-009) — balancer warm-up ping to the health check | unaffected |
| 3 | `user-flows.md:578` (FLOW-025) — warm-up ping is unrelated health traffic | unaffected |
| 4 | `system-map.md:516` — AWS production deployment "Lives in" (`deploy` job) | unaffected; the deploy itself does not change |
| 5 | `system-map.md:537` — Deploy and cost guardrails "Lives in" (`changes`, `deploy` jobs) | **amend in NFR-020 block**: add the `built-server` job and `scripts/smoke-built-server.mjs`; add NFR-020 to Backed by |
| 6 | `system-map.md:564` — Trade Balancer warm-up at `GET /api/health` | unaffected |
| 7 | `system-map.md:579` — user feedback "live-send smoke" of the modal | unaffected; different "smoke" |
| 8 | `integrations-and-data.md:160` — `GET /api/health` heading | **amend in NFR-020 block**: purposes list |
| 9 | `integrations-and-data.md:163` — "deployment health checks" | **amend in NFR-020 block**: add the CI built-backend boot check beside it |
| 10 | `integrations-and-data.md:321` — Trade Balancer integration posture, mentions the `/api/health` warm-up | unaffected |
| 11 | `decisions.md:196` — DEC-155 (retired) CI parallelization row | unaffected; historical index |
| 12 | `user-feedback/README.md:108` — live-send smoke of the feedback modal | unaffected; different "smoke" |
| 13 | `goals-and-non-goals.md:83` — answer-quality never gates `quality:check` | unaffected; the new check calls no model |
| 14 | `trade-balancer/README.md:60` — warm-up to `GET /api/health` | unaffected |
| 15 | `trade-balancer/README.md:169` — warm-up carries no product data | unaffected |
| 16 | `non-functional-requirements.md:116` (NFR-009) — eval golden CI gate | unaffected |
| 17 | `non-functional-requirements.md:152` (NFR-011) — colour "quality gate" | unaffected; unrelated meaning |
| 18 | `non-functional-requirements.md:185` (NFR-012 title) | unaffected |
| 19 | `non-functional-requirements.md:186` (NFR-012 description) | unaffected |
| 20 | `non-functional-requirements.md:188` (NFR-012) — every test runs once | unaffected; the smoke is not a vitest test and runs once |
| 21 | `non-functional-requirements.md:189` (NFR-012) — `quality:check` stays canonical | satisfied by design step 3; no edit |
| 22 | `non-functional-requirements.md:190` (NFR-012) — parallel jobs | satisfied; the new job runs in parallel; no edit |
| 23 | `non-functional-requirements.md:191` (NFR-012) — coverage on every run | unaffected |
| 24 | `non-functional-requirements.md:193` (NFR-012) — deploy depends on gate jobs | satisfied by design step 5; no edit |
| 25 | `non-functional-requirements.md:194` (NFR-012) — parity guard | satisfied; the existing guard covers the new leaf; no edit |
| 26 | `non-functional-requirements.md:206` (NFR-012 note) — DEC-086 deferral | unaffected |
| 27 | `non-functional-requirements.md:207` (NFR-012 note) — shard scaling rule | unaffected; frontend-only measure |
| 28 | `non-functional-requirements.md:209` (NFR-012 note) — "against the 6 this workflow uses" | **amend: NFR-012 block** (6 → 7) |
| 29 | `non-functional-requirements.md:299` (NFR-017) — onnxruntime platforms | unaffected |
| 30 | `non-functional-requirements.md:303` (NFR-017) — CUDA download on x64 CI | unaffected; the new job inherits the workflow-level skip |
| 31 | `non-functional-requirements.md:314` (NFR-018) — practice suite never in CI | unaffected |
| 32 | `functional-requirements.md:786` (REQ-039) — no CI image refresh | unaffected |
| 33 | `functional-requirements.md:1381` (REQ-060) — visual quality gate | unaffected |
| 34 | `functional-requirements.md:1513` (REQ-064) — warm-up to `/api/health` | unaffected |
| 35 | `functional-requirements.md:1515` (REQ-064) — balancer's only other traffic | unaffected |
| 36 | `functional-requirements.md:1516` (REQ-064) — health check reused "for local, deployment, and uptime checks" | unaffected; CI use is consistent and adds no endpoint |
| 37 | `functional-requirements.md:2245` (REQ-093) — combo artifacts use brotli with no dictionary because "Node 22 in CI silently ignores a brotli dictionary while Node 24 on Lambda" does not | unaffected; it is the reason the new job runs Node 24, the production major |
| 38 | `functional-requirements.md:3585` (REQ-146) — never fail CI on model answers | unaffected; no model call |
| 39 | `functional-requirements.md:3927` (REQ-166) — deploy runs only on code-set changes | unaffected |
| 40 | `functional-requirements.md:3929` (REQ-166) — job list `static`, `backend`, `frontend`, `coverage-merge` | **amend: REQ-166 block** (add `built-server`) |
| 41 | `functional-requirements.md:4156` (REQ-175) — `/api/health` stays non-product | unaffected; the CI call is non-product |
| 42 | `functional-requirements.md:4429` (REQ-184) — sharp arm64 binding | unaffected; non-goal |
| 43 | `functional-requirements.md:4781` (REQ-195) — owner-invoked, never a CI cron | unaffected |
| 44 | `functional-requirements.md:4815` (REQ-195) — no CI cron | unaffected |
| 45 | `functional-requirements.md:5162` (REQ-202) — screenshot pair is not a CI job | unaffected |
| 46 | `functional-requirements.md:6164` (REQ-232) — practice suite description | unaffected |
| 47 | `functional-requirements.md:6179` (REQ-232) — never a gate | unaffected |
| 48 | `functional-requirements.md:6185` (REQ-232) — never a standing CI gate | unaffected |
| 49 | `functional-requirements.md:6312` (REQ-236) — never in CI | unaffected |
| 50 | `functional-requirements.md:6313` (REQ-236) — Python never a CI dependency | unaffected |
| 51 | `functional-requirements.md:6344` (REQ-237) — CI cannot provision | unaffected |
| 52 | `functional-requirements.md:6345` (REQ-237) — CI needs no AWS and no model; `EMBEDDING_PROVIDER` stays `mock` | unaffected; NFR-020 depends on it |

Grep 2 (deploy-verification wording not caught above):
`grep -rniE "quality-gated|gate jobs|post-deploy|after (each|every) deploy|deploy(ment)? (check|verification)|cold start.*verif|verif.*(cold start|deploy)|boot"` minus grep-1 hits. Most matches are the word "bootstrap".

| # | Hit | Disposition |
| --- | --- | --- |
| 53 | `system-map.md:515` — "automated quality-gated deploys" | unaffected; still true, gate grows by one job |
| 54 | `system-map.md:522`, `:523` — serverless hosting ("bootstrap") | unaffected |
| 55 | `system-map.md:530` — secrets and deploy identity ("bootstrap") | unaffected |
| 56 | `system-map.md:536` — "Gates every main-branch deploy on `quality:check`" | unaffected; stays true because the smoke joins `quality:check` |
| 57 | `integrations-and-data.md:276` — search model never committed | unaffected; why the check uses `mock` |
| 58 | `decisions.md:125` — DEC-084 index row, "quality-gated" | unaffected |
| 59 | `decisions/deployment.md:6`, `:10`, `:34`, `:38` — DEC-084/DEC-169 bodies ("bootstrap") | unaffected |
| 60 | `decisions/deployment.md:15` — deploy runs `quality:check` first (found by a follow-up `quality:check` grep) | unaffected; stays true |
| 61 | `goals-and-non-goals.md:45` — quality-gated deploys | unaffected |
| 62 | `functional-requirements.md:3457`, `:3906`, `:4428`, `:4901`, `:4903`, `:4925`, `:4930`, `:6144`, `:6338` — "bootstrap" / deep links / headers / timeout | unaffected |
| 63 | `functional-requirements.md:3912` (REQ-165) — deploy runs only after `quality:check` passes | unaffected; stays true |
| 64 | `functional-requirements.md:6288` — post-deploy live timing | unaffected |

## Related material (citations only, not opened)

- `PRD/ideasForLater/codebase-cleanup-followups/evidence/FINDINGS-backend-scripts-and-august-audit.md`
- `PRD/ideasForLater/codebase-cleanup-followups/evidence/GRAPH-BRIEF-backend-health.md`
- Prior runs listed in `IDEA.md`.
