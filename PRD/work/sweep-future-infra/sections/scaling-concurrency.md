# Future-infra finding — scaling-concurrency

- Concern-area focus: Concurrency and traffic handling — reserved vs. provisioned concurrency, the account concurrency quota, throttling/backpressure on a public no-auth endpoint, and a hobby-scale traffic model.
- Reference read: `docs/aws/deployment.md`, `docs/aws/operations.md`, `scripts/aws-bootstrap.sh`, `scripts/lambda-package-budget.test.mjs`, `PRD/sections/system-map.md`, `apps/backend/src/lambda.ts`, `apps/backend/src/runtime/createConfiguredApp.ts`, `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/src/gameRules.ts`, `apps/backend/src/cardRulings.ts`, `apps/backend/src/hooks/useAskAiSubmitOrchestration.ts` (frontend, checked for 429 handling), `apps/backend/data` (`ls -la`, `du -sh`)

## Current state

A player's turn: type or scan a board state, ask a rules question, wait for
one answer. Each question is exactly one Lambda invocation that makes one
OpenAI Responses API call. There is no queue, no background job, no
multi-request session — concurrency here means "how many players can be
mid-question at the same time."

**Reserved concurrency is not actually set today.** `docs/aws/deployment.md`
documents the intended value as `RESERVED_CONCURRENCY` default `5`, but
`scripts/aws-bootstrap.sh` (lines ~155–173) skips the
`put-function-concurrency` call: AWS requires the account's unreserved pool
to stay ≥ 10, and this account's `ConcurrentExecutions` quota is the
brand-new-account default of 10, so reserving 5 would leave 5 unreserved —
below the floor. The script logs the skip and prints the exact follow-up
command (`aws lambda put-function-concurrency --reserved-concurrent-executions 5`)
to run "after a Service Quotas increase." `docs/aws/operations.md`'s "Scale
cap" section describes the same intended-5, actual-unset state. Net effect:
`thejudge-api` today runs with **no dedicated concurrency reservation**,
sharing the account's default 10-execution pool with every other Lambda in
the account (currently just this one, so the practical cap is 10 — but
nothing stops that shared pool from being contended if a second Lambda is
ever added).

**The endpoint is public and unauthenticated with no layer above Lambda's own
concurrency ceiling.** `docs/aws/deployment.md`'s architecture diagram shows
`POST /api/ask-ai` going straight to the Lambda Function URL
(`auth-type NONE`, per `aws-bootstrap.sh`'s `create-function-url-config`) —
CloudFront fronts only the static SPA bucket, not the API. There is no API
Gateway, no WAF, and no rate limiting in the codebase (`grep` for
`throttl|WAF|usage.plan|api.gateway` across `docs/aws/` and the deploy
scripts returns nothing beyond the two lines describing Lambda's own 429).
The only cost backstop is `docs/aws/operations.md`'s "Checking cost" section:
a `$5`/month `thejudge-monthly` AWS Budget that emails at 80% — reactive,
not a circuit breaker, and unrelated to request-level throttling.

**Cold start already does real synchronous work.** `apps/backend/src/lambda.ts`
runs one `async` IIFE at module load: `loadOpenAiKeyFromSsm` (an SSM
`GetParameter` + KMS decrypt network round trip), then
`createConfiguredApp()`. `apps/backend/src/runtime/createConfiguredApp.ts`
calls `loadCardRulingsIndex`, `loadGameRulesTopics`, and
`loadGameRulesRuleIndex` inline, each doing `readFileSync` +
`JSON.parse` synchronously (`apps/backend/src/cardRulings.ts`,
`apps/backend/src/gameRules.ts`, `apps/backend/src/gameRulesRetrieval.ts`).
`ls -la apps/backend/data` shows what that parses today:
`cardRulingsByOracleId.json` 19.5MB, `gameRulesRuleIndex.json` 2.2MB,
`gameRulesByTopic.json` 25KB — **~21.7MB of JSON parsed synchronously on
every cold start**, before the handler can serve its first request. (The two
combo-corpus files, 37.5MB + 2.7MB gzipped, are not in this eager-load path —
not grounded further here since they sit outside the ask-ai retrieval flow
this study covers.) The function runs at 512MB memory / arm64 / 20s timeout
(`aws-bootstrap.sh` `create-function`), with `OPENAI_TIMEOUT_MS=15000`
leaving roughly 5s of margin over the OpenAI call for cold-start init plus
request/response overhead. No provisioned concurrency is configured anywhere
in the bootstrap script (`grep -i provisioned` across `scripts/` and
`docs/aws/` returns nothing) — the function is pure scale-to-zero today.

**Throttling is present but silent to the player.** Lambda's own concurrency
ceiling returns `429` when the pool is exhausted (`operations.md`, `aws-bootstrap.sh`
comment: "Excess requests throttle (429) instead of scaling out"). On the
frontend, `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` has no
`429`-specific branch — every non-OK response falls into the same generic
path: try to parse a JSON error body, and on failure or absence fall back to
the string `"Miho is working on it"`. A Lambda-level 429 (raised by the
Lambda service itself, not the Express app) typically carries no
app-shaped JSON body, so a throttled player most likely sees the generic
fallback message with no "try again in a moment" framing and no client-side
retry/backoff.

## Recommendations

### SC-01 — Finish the reserved-concurrency step: request the quota increase, then set it — now

**Current -> Target:** Today the account's `ConcurrentExecutions` quota is
the default 10, `aws-bootstrap.sh` skips reserving any of it (the 10-minimum-unreserved
rule blocks reserving 5), so `thejudge-api` has zero dedicated concurrency
protection — it just inherits whatever's left of the account's shared pool.
Target: request a Lambda "Concurrent executions" Service Quotas increase
(a routine, typically auto-approved request for a small bump — e.g. to 50),
then run the `put-function-concurrency --reserved-concurrent-executions 5`
command `aws-bootstrap.sh` already prints, so the intended cap is the
enforced cap.
**Gap:** The fix is documented and the exact command exists in both
`deployment.md` and the bootstrap script's own output — nobody has run the
Service Quotas request. This is a live gap today, independent of RAG or the
S3-staging work: a second Lambda added to this account, or a burst that
happens to coincide with any other account activity, contends for the same
unreserved-10 pool `thejudge-api` currently has no fenced-off share of.
**Services/tradeoff:** AWS Service Quotas (no cost, usually same-day
approval for small increases) + `lambda:PutFunctionConcurrency` (no cost —
reserved concurrency is a ceiling, not pre-warmed capacity, so it doesn't
change the scale-to-zero cost profile). Tradeoff is operational only: one
manual console/CLI step, and a slightly higher account-wide quota to keep
track of.
**Risk:** Low. This only removes a gap; it does not change behavior for any
request that succeeds today.

### SC-02 — Give a throttled player a real message and a retry, not the generic fallback — now

**Current -> Target:** A concurrency-throttled `429` and every other backend
failure both render as `"Miho is working on it"` in
`useAskAiSubmitOrchestration.ts` — a player who hit the concurrency ceiling
gets the same non-answer as one who hit a real backend bug. Target: branch on
HTTP status in that hook — a `429` gets its own copy ("A lot of players are
asking right now — try again in a few seconds") and, ideally, either a
disabled-submit cooldown or a single automatic retry with jitter before
surfacing an error at all.
**Gap:** No status-code branching exists in the orchestration hook today —
confirmed by reading its `catch`/error-setting blocks; every path sets the
same generic string.
**Services/tradeoff:** No new AWS service — this is a frontend fix, paired
here because it's the player-facing half of "throttling/backpressure" for a
concurrency cap that (per SC-01) is about to start actually firing. No cost;
small implementation effort.
**Risk:** Low. Copy/retry-only change; no backend contract change.

### SC-03 — Provisioned concurrency for RAG's cold start — with-rag

**Current -> Target:** Today's cold start already pays for an SSM round trip
plus ~21.7MB of synchronous `JSON.parse` (`cardRulingsByOracleId.json` +
`gameRulesRuleIndex.json`, loaded inline in `createConfiguredApp()`) before
the handler is ready — and the function is pure scale-to-zero, so every
cold container pays this in full. RAG replaces (or sits alongside) the
current IDF keyword scoring in `gameRulesRetrieval.ts` with something that
needs a warm in-memory index or an external vector-store round trip —
either way, cold start gets worse, not better, and semantic retrieval
quality/latency depends on that index being ready. Target: once RAG's actual
shape is known (in-memory index vs. hosted vector DB), evaluate AWS Lambda
**Provisioned Concurrency** — a fixed number of pre-initialized execution
environments, billed continuously (GB-seconds) whether invoked or not — sized
to the hobby-scale traffic model's expected concurrent-question floor (e.g.
1–2 warm containers).
**Gap:** No provisioned concurrency exists in the codebase today
(`aws-bootstrap.sh` has no `put-provisioned-concurrency-config` call), and it
can't be sized sensibly until RAG's retrieval mechanism and its cold-start
cost are known. Also note: provisioned concurrency is allocated *within* a
version's reserved-concurrency (or account) headroom, so this recommendation
composes with SC-01 — the quota increase there is a prerequisite, not a
separate track.
**Services/tradeoff:** Lambda Provisioned Concurrency directly trades away
today's biggest cost lever — `operations.md` states "most of this stack is
scale-to-zero or free-tier" — for lower/no cold-start tax; it is billed
per-second per provisioned instance regardless of traffic, so it turns part
of a $0-at-idle app into a small fixed monthly floor. Alternative worth
weighing at the same gate: keep scale-to-zero and instead make the cold path
itself cheaper (stream/parse the retrieval index lazily instead of eagerly in
`createConfiguredApp()`, or defer non-`ask-ai` data loads) — cheaper than
provisioned concurrency but doesn't eliminate the first-request-after-idle
penalty the way pre-warmed containers do. Lambda SnapStart is *not* listed
here as an option — this study did not verify current SnapStart runtime
support and doesn't want to assert a stale fact; check AWS's current
supported-runtimes list before relying on it.
**Risk:** Cost risk if provisioned count is set high relative to actual
traffic (paying for idle warm containers a hobby app doesn't need most of the
day); latency/quality risk if skipped and RAG's cold start blows past the
current 20s timeout margin (see SC-04).

### SC-04 — Re-budget the 20s timeout once retrieval adds a hop — with-rag

**Current -> Target:** The 20s Lambda timeout budgets `OPENAI_TIMEOUT_MS=15000`
for the OpenAI call, leaving ~5s for cold-start init plus request/response
overhead — a margin sized for today's synchronous JSON-index lookup (no
network hop). RAG will likely add a real network round trip before the
OpenAI call even starts (embedding the query, similarity search against a
hosted vector store) or a heavier in-memory index walk. Target: when RAG's
retrieval latency is measured, re-derive the timeout budget explicitly:
retrieval time + `OPENAI_TIMEOUT_MS` + cold-start margin must fit under
whatever the Lambda timeout is set to (Lambda's ceiling is 900s, so there's
headroom to raise it if needed).
**Gap:** No retrieval-latency budget line exists today because retrieval is
in-process and effectively instant relative to the OpenAI call; RAG turns
that from a non-issue into a number that needs measuring.
**Services/tradeoff:** No new service — this is a config/timeout-budgeting
exercise. The real tradeoff is indirect: raising the Lambda timeout raises
the *maximum* billable duration per invocation, which combines with the
reserved-concurrency ceiling (SC-01) to set the worst-case cost of a stuck or
slow burst — the two numbers should be reasoned about together once RAG's
latency profile is known.
**Risk:** Low as a recommendation (it's a "remember to check this" item);
the risk it heads off is real players timing out mid-answer if retrieval
latency isn't budgeted for.

### SC-05 — Add abuse-layer backpressure (WAF / rate limiting) in front of the Function URL — later

**Current -> Target:** The only thing standing between the public internet
and OpenAI-billed compute is Lambda's own concurrency ceiling — a single
global number, not a per-client one. A burst from one source consumes the
whole pool (5 intended, or today's unset/shared-10 per SC-01) and 429s every
other player at the same time; there's no per-IP or per-client distinction.
Target: put CloudFront (or API Gateway) in front of the Function URL with
AWS WAF rate-based rules, so one bad actor gets throttled without starving
legitimate concurrent players.
**Gap:** Nothing in `aws-bootstrap.sh` or the docs sets up WAF, API Gateway,
or any per-client throttle — confirmed by grep across `docs/aws/` and the
deploy scripts.
**Services/tradeoff:** AWS WAF has its own monthly minimum (roughly $5 plus
per-rule and per-request charges) that alone can exceed the current $5/mo
budget alert threshold — this needs its own budget conversation, not a
silent add. API Gateway with usage plans is the alternative (per-key
throttle/quota) but is a bigger architecture change (a new component in
front of the Function URL) for a single-endpoint hobby app.
**Risk:** Skipping this is fine at today's scale — the existing concurrency
cap already bounds worst-case cost even without per-IP granularity, just not
fairly across simultaneous players. Worth doing only once real abuse is
observed or the player base is public/unpredictable enough to justify the
added cost and moving part.

## Open questions

- What concurrent-player ceiling actually matches how this gets used? The
  intended reserved concurrency (5) reads as "a friend group's play session,"
  but a Commander pod is up to 8 players, and a bigger event (e.g. a
  tournament room) could put several tables asking simultaneously. The owner
  needs to pick the real number SC-01's quota-increase request targets — this
  study can size the AWS mechanics, not the expected table count.
- Does RAG's retrieval mechanism land as an in-process index (bigger cold
  start, same scale-to-zero shape) or a hosted vector store (network hop,
  different failure mode, possibly its own throttling/cost surface)? SC-03
  and SC-04 can't be finalized until that's chosen — that choice likely
  belongs to whichever finding doc covers the RAG/data-retrieval concern-area,
  not this one.
- Is a $5/mo WAF minimum (SC-05) an acceptable trade against the current
  $5/mo total budget alert, or does the budget itself need to move first?
