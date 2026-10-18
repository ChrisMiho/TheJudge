# Graph-run brief — Honest backend errors and health

Self-contained intake for `graph-kickoff`. Measured by the 2026-10-17 code health
probe; refinement can go straight to a DESIGN-BRIEF.

## What the player gets

- A very long follow-up chat gets a clear message instead of "Miho is working on it",
  and Retry no longer fails the same way forever.
- If a data file or the search model fails to load after a deploy, it is flagged —
  instead of the app quietly giving worse answers (empty card popups, no official
  rulings, rule search falling back to plain word matching).

## Why (measured — do not re-derive)

1. **Body limit → server error.** `apps/backend/src/app/createApp.ts:48` is a bare
   `express.json()`, so Express's 100 KB default applies, while the request schema
   allows 20 turns × 10,000 characters ≈ 200 KB (`validation/askAiRequest.ts:227-234`).
   Body-parser errors are not `AppError`s, so `app/errorHandler.ts:46-48` maps them to
   `500 UNEXPECTED_ERROR` "Miho is working on it" and logs at error level. Checked
   in-process against `createApp({})`: a malformed body and a 200 KB body both returned
   that 500. Verified by the driver.
2. **Silent degradation.** Every data loader returns an empty map with a `console.warn`
   when its file is missing or unreadable: `cardRulings.ts:72-84`, `cardDetail.ts:68-83`,
   `cardPrices.ts:90-106`, `gameRules.ts:44-56`, `commanderSpellbook/catalog.ts:401-405`.
   The local embedder remembers a failed load forever and serves every request with
   lexical search (`providers/localEmbeddingProvider.ts:53-69`). Production has already
   fallen back to lexical search twice after deploys (onnx, then sharp).
3. **Health always says ok.** `/api/health` returns `{ok:true}` unconditionally
   (`routes/health.ts:4-6`). No workflow or deploy script calls any endpoint after a
   deploy (grep of `.github/workflows/*.yml` and `scripts/*.sh`).
4. **Logging trap.** Production runs `DEBUG_LOGGING=false` (`scripts/aws-deploy.sh:108`),
   so `logger.info` is silent (`logging.ts:56-60`). The raw `console.warn`s are today's
   only signal — moving them onto `logger.info` would hide them.
5. **Three loading styles, cold start loads everything.** Seven files load at init
   (`runtime/createConfiguredApp.ts:27-46`, `lambda.ts:12-18`); scoring resources and
   part titles load on first use through hidden default parameters
   (`gameRulesRetrieval.ts:359-372`, `prompt/ruleLayout.ts:49-65`); the embedder loads
   lazily through a promise. Data locations are written in five places. Local timings:

   | Step | Time |
   |---|---|
   | Startup loads, total | 274 ms (rulings 56, card detail 63, prices 82, combos 66, rule index 7) |
   | First ask: embedder load | ~277 ms |
   | Warm request, our side | 5–10 ms |

   A cold price lookup waits for rulings, card detail and combos it never reads.
6. **Inconsistent route errors.** Card detail and prices answer
   `404 {error:"card_not_found"}` (`routes/cardDetail.ts:24-27`, `routes/cardPrices.ts:27-30`)
   while ask-ai answers `{code,message,metadata}`; card routes set no correlation id;
   the shared handler logs every failure as `ask_ai.response_failure`
   (`errorHandler.ts:51,58`); the ask route detects the mock embedder by object
   identity (`routes/askAi.ts:106`).
7. **Only Trade wakes a cold backend.** The fire-and-forget `GET /api/health` lives
   only in `TradeBalancer.tsx:169-171` (REQ-064). Quick Question — the landing page —
   sends nothing until the player asks. A keep-warm schedule is already an open item
   from the Trade Balancer first-card work.

## Decisions already made — do not re-litigate

- Data stays loaded once per container; nothing here moves loading onto the request
  path.
- The body limit should match what the schema allows; malformed and oversized bodies
  are client errors (400/413), not server errors.

## Open decisions for the define gate

1. Wording for "this chat is too long" (and whether the frontend should stop a
   follow-up before it hits the limit).
2. Where readiness is exposed: on `/api/health` (it then can say "not ok") or a
   sibling endpoint, and whether a deploy fails on it or only reports.
3. Eager or lazy loading: (a) load everything plus one warm-up embed at init (moves
   ~0.3 s from the first answer into cold start), or (b) load each data set on first
   use (a price lookup loads only prices). Recommendation: (a) — the first answer is
   the experience that matters.
4. Whether the question tools also warm the backend on open, or a scheduled keep-warm
   covers it (recommendation: decide with the existing keep-warm item, don't copy the
   ping blindly).
5. Whether card routes adopt the ask route's error body (the frontend reads these
   404 bodies, so it changes a contract).

## Design direction (converged)

- `express.json({ limit })` set from the schema maximum; error handler maps
  `entity.parse.failed` / `entity.too.large` to validation errors.
- A readiness snapshot at startup (entries per data set, embedder loaded or not);
  each failure logged once at error level through the logger; one smoke request after
  deploy.
- One `readCommittedJson(path, { brotli })` + `warnOnce` helper for the six loaders
  (each keeps its shape check); one place that says where the data lives.
- Loading style per decision 3.

## Current-state PRD truth to amend

- `PRD/sections/integrations-and-data.md` — API contract: health/readiness response,
  error bodies, body size limit.
- `PRD/sections/in-depth/README.md` and `quick-lookup/README.md` backend-path sections
  — the too-long-chat behaviour.
- `PRD/sections/non-functional-requirements.md` — cold-start/readiness, if decision 3
  or 2 sets a target.
- `PRD/sections/decisions/deployment.md` (DEC-084/DEC-169) only if the deploy gains a
  failing smoke check.

## Constraints (don't rediscover)

- Never run `npm run data:refresh` or paid evals; the Lambda deploy is CI's, and
  infrastructure changes go through bootstrap (`thejudge-admin` profile) — a run can
  propose a smoke step but not provision anything.
- After any deploy-affecting change, verify the native embedder chain with one live
  request plus a CloudWatch tail.
- Lambda runs at 1769 MB (`scripts/aws-bootstrap.sh:157`); Lambda timings were not
  measured, only local.

## Evidence + reusable tooling

`PRD/work/probe-codebase-health-pass/FINDINGS-backend-scripts-and-august-audit.md`
(B-01, B-02, B-06, B-07, B-09) and `FINDINGS-data-and-clients.md` (D-15). Scratch
timing scripts from the probe were in the session scratchpad and are not durable.

## What the graph run should produce

A DESIGN-BRIEF, the five gate questions, the API-contract amendments, and slices: the
body limit and error mapping first (smallest, player-visible), then readiness and
logging, then the loader helper and loading style, then route error consistency.

## How to hand this off

/graph-kickoff "Backend gives clear errors for long chats and flags missing data or a broken search model instead of failing silently" PRD/work/probe-codebase-health-pass/GRAPH-BRIEF-backend-health.md
