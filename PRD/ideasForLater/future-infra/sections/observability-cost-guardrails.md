# Future-infra finding — observability-cost-guardrails

- Concern-area focus: seeing and bounding spend/behavior — metrics, tracing, structured logging, per-request cost attribution, and budget/alerting, today and under RAG.
- Reference read: `docs/aws/deployment.md`, `docs/aws/operations.md`, `docs/aws/secrets.md`, `scripts/aws-bootstrap.sh`, `apps/backend/src/logging.ts`, `apps/backend/src/routes/askAi.ts`, `apps/backend/src/responseSizeDiagnostics.ts`, `apps/backend/src/providers/openAiResponsesProvider.ts`, `apps/backend/data/` (`ls -la`), `PRD/sections/system-map.md`.

## Current state

**Logging.** The Lambda writes structured JSON (pino) to CloudWatch Logs group `/aws/lambda/thejudge-api` (`docs/aws/operations.md`). `apps/backend/src/logging.ts` builds one `AppLogger` with `info`/`error`, a `service: "thejudge-backend"` base field, and ISO timestamps. `apps/backend/src/routes/askAi.ts` emits a clean per-request event trail keyed on a `correlationId` (`resolveCorrelationId`, echoed as `X-Correlation-Id`): `ask_ai.request_received` → `..._validation_succeeded/failed` → `..._prompt_context_build_completed` (with `promptChars`/`promptBudgetChars`/`promptUtilizationPercent`) → `..._provider_invocation_completed` (with `providerElapsedMs`) → `..._response_success`. A hardcoded latency check logs `ask_ai.provider_latency_warning` when `providerElapsedMs > 1200`. Debug/payload logging are env-gated (`DEBUG_LOGGING`, `LOG_PAYLOADS`, off by default in prod per the bootstrap env block).

**Response-size diagnostics, not cost diagnostics.** `apps/backend/src/responseSizeDiagnostics.ts` is the only per-request "cost" signal today, and it is an estimate, not a real one: `estimateTokensFromChars` divides `answer.length` by a hardcoded `CHARS_PER_TOKEN_ESTIMATE = 4`. `apps/backend/src/providers/openAiResponsesProvider.ts` calls `client.responses.create({ model, input })` and its `OpenAiResponseOutput` type is declared as `{ output_text?: string }` only — the OpenAI Responses API's real `usage` object (actual input/output/total token counts) is never read, typed, or logged. There is no per-request dollar figure anywhere in the stack.

**Metrics/alarms.** None exist. Grep for `Alarm`/`Metric`/`X-Ray`/`xray`/`Tracing` across the repo (scripts, docs, `apps/backend/src`) returns nothing except the default Lambda-side CloudWatch Logs group reference in `operations.md`. `aws-bootstrap.sh` never calls `cloudwatch put-metric-alarm`, never enables Lambda active tracing (`--tracing-config`), and never sets log-group retention — the Lambda's log group is created implicitly on first invoke with the default **Never Expire** retention, so log storage cost grows unbounded with no lifecycle rule.

**Cost guardrail today.** `scripts/aws-bootstrap.sh` (budget block, lines ~184-224) creates one AWS Budget, `thejudge-monthly`, `COST` type, `MONTHLY`, limit `BUDGET_LIMIT_USD` (default `5`), one `ACTUAL` notification at `GREATER_THAN 80` percent to `NOTIFICATION_EMAIL`. This is skipped entirely if `NOTIFICATION_EMAIL` is unset (printed manual fallback only). `docs/aws/operations.md` names three "levers" for checking cost: this Budget, Cost Explorer/Billing console (manual), and the OpenAI usage dashboard (manual, external to AWS — "spend simply stops when credits run out" is the stated backstop, i.e. no active guardrail, just prepaid exhaustion).

**Scale/blast-radius guardrail.** `RESERVED_CONCURRENCY` (default 5, currently unset on the live account per the "Reserved concurrency note" in `deployment.md` because the account's default concurrency limit is 10) caps parallel Lambda executions; excess requests 429. No alarm fires on throttling — it is a silent cap, visible only by tailing logs or checking `GetThrottleCount` manually in the console.

**Data scale grounding the RAG shift.** `apps/backend/data/` totals 59M (`du -sh`): `cardRulingsByOracleId.json` 19.5MB, `commanderSpellbookCombos.json.gz` 37.5MB, `commanderSpellbookComboIndex.json.gz` 2.7MB, `gameRulesRuleIndex.json` 2.2MB, plus small manifests/vocab files. Retrieval today (`apps/backend/src/gameRulesRetrieval.ts`) is keyword/IDF scoring (`scoreEntry`, `topTokenIdf`, a `df`/`N` document-frequency index) over this static bundled JSON — no embeddings, no vector store, no external call for retrieval. RAG-for-rules will add at least one new external call per request (query embedding) plus a new standing service (vector store), which today's cost/observability surface does not model at all.

## Recommendations

### OBS-01 — Capture real OpenAI token usage per request — now

**Current -> Target:** `openAiResponsesProvider.ts` discards the Responses API's `usage` object; `askAi.ts` logs only a char-count token *estimate* (`estimatedAnswerTokens`, answer text only, no input side) -> every `ask_ai.provider_invocation_completed` log line carries real `usage.input_tokens`/`usage.output_tokens`/`usage.total_tokens` and a computed dollar cost for that call (model pricing table, even a hardcoded one keyed on `OPENAI_MODEL`).
**Gap:** the `OpenAiResponseOutput` type needs one field added (`usage`) and `generateAnswer` needs to return it up through `AskAiProvider`'s response type into the route; no new AWS service, no new dependency.
**Services/tradeoff:** none — pure code change. Zero cost, zero cold-start impact. This is the single highest-leverage fix in this area: it's the only way to see actual OpenAI spend per request instead of an estimate that only covers the answer's character count (not the prompt/input side, which is the larger token consumer given the ~60MB rules corpus feeding the prompt).
**Risk:** low. The estimate-only status quo means nobody can currently answer "how much did this one request cost" from the logs, which is the literal ask of this concern-area.

### OBS-02 — CloudWatch Alarms on Lambda errors, throttles, and duration — now

**Current -> Target:** zero CloudWatch Alarms exist; throttling from `RESERVED_CONCURRENCY` and provider failures (`ask_ai.response_failure` events) are visible only by tailing logs or the console -> `aws-bootstrap.sh` provisions 3-4 alarms on the `thejudge-api` function: `Throttles > 0`, `Errors > N` over a window, `Duration` approaching the 20s timeout, wired to the same `NOTIFICATION_EMAIL` (SNS topic) already used for the budget.
**Gap:** the bootstrap script has an idempotent budget block already (lines 184-224) as a template; no equivalent `cloudwatch put-metric-alarm` block exists.
**Services/tradeoff:** CloudWatch Alarms, free tier covers the first 10 alarms (this stack needs 3-4) — effectively $0 add given the free tier, no cold-start impact (control-plane only). Needs one SNS topic (near-zero cost) reused for both budget-style and operational alerts, or reuse the existing budget-notification email path.
**Risk:** low. The forcing function is concrete: reserved concurrency is a silent request-dropping cap today (429s with no alert), and the S3-staged deploy raising the package ceiling to 250MB makes cold-start duration regressions (more code/data to unpack) more likely and currently invisible until a user reports errors.

### OBS-03 — Set explicit CloudWatch Logs retention — now

**Current -> Target:** the Lambda's log group is auto-created on first invoke with **Never Expire** retention (no `retention-in-days` set anywhere in `aws-bootstrap.sh`) -> bootstrap explicitly creates/configures the log group with a bounded retention (e.g. 30-90 days) via `aws logs put-retention-policy`.
**Gap:** one `aws logs` call, idempotent, added to the bootstrap script near the Lambda creation block.
**Services/tradeoff:** no new service, CloudWatch Logs storage cost only — currently unbounded growth (every request logs ~8 structured events, and `LOG_PAYLOADS`/`DEBUG_LOGGING` can be flipped on for debugging and forgotten). At this app's traffic this is pennies today, but it is exactly the kind of guardrail this concern-area exists to set before it's forgotten and traffic grows.
**Risk:** low, purely additive; does not change what operations.md's `aws logs tail` commands do within the retention window.

### OBS-04 — Multi-threshold, forecast-aware AWS Budget — now

**Current -> Target:** one Budget, one `ACTUAL` notification at 80% of a flat $5/mo (`aws-bootstrap.sh` budget block) -> add a `FORECASTED` notification (catches a spend trajectory before it happens, not just after crossing 80% actual) and a second lower threshold (e.g. 50%) so the single owner gets an early signal, not just a near-miss one.
**Gap:** the existing `budget-notifications.json` templating in the script needs a second notification object; `BudgetType: COST` stays the same, no new AWS resource type.
**Services/tradeoff:** AWS Budgets, free (first two budgets/account free; this stays at one budget, two notifications). No infra to stand up.
**Risk:** low. This is a cheap improvement independent of RAG — do it now rather than waiting, since it's a JSON-block edit to a script that's already being touched for the S3-deploy work.

### OBS-05 — Embedded Metric Format (EMF) for per-request cost/latency instead of ad hoc alarms on raw logs — later

**Current -> Target:** cost/latency signals live only as structured log fields (`promptChars`, `providerElapsedMs`, and after OBS-01 the token/cost fields) that require CloudWatch Logs Insights queries to aggregate -> emit those same fields via CloudWatch **Embedded Metric Format** (a specially-shaped JSON log line CloudWatch auto-promotes to real Metrics, e.g. `RequestCostUsd`, `RetrievalLatencyMs`, `ProviderLatencyMs`) so dashboards/alarms can target them as first-class metrics without a Logs Insights query or a new SDK dependency.
**Gap:** no metrics namespace exists today; this is a logging-format change (structure existing pino output as EMF), not new infrastructure — pino's JSON output would need an EMF-shaped payload alongside (or instead of) the current human-readable event fields.
**Services/tradeoff:** CloudWatch Metrics (custom metrics have a small per-metric cost, ~$0.30/metric/mo — worth deferring until there are enough per-request numeric signals, i.e. after RAG adds retrieval/embedding legs, to justify a handful of custom metrics rather than one).
**Risk:** low value today (traffic and signal count are both small); becomes worth it once RAG creates multiple cost/latency legs per request that are worth graphing separately (see OBS-07).

### OBS-06 — Vector-store standing cost is a new, distinct spend surface RAG introduces — with-rag

**Current -> Target:** today's "AI-side spend" is one line (OpenAI usage dashboard, external to AWS, watched manually) -> RAG adds a second spend surface with a fundamentally different cost shape: a vector store. Standing-cost options (OpenSearch Serverless: billed on provisioned OCUs with a published minimum, does **not** scale to zero — this alone can exceed the current $5/mo budget baseline even at zero traffic) versus scale-to-zero-friendly options (Aurora Serverless v2 / RDS Postgres + pgvector: still has a minimum ACU floor, cheaper than OpenSearch Serverless but not free at idle; Amazon S3 Vectors: new S3 feature purpose-built for this shape — pay-per-query/storage, no standing compute, closest fit to this app's scale-to-zero posture) versus an external SaaS vector DB (Pinecone serverless, etc. — usage-based like OpenSearch/S3 Vectors but its billing is **outside AWS entirely**, meaning it inherits the same blind spot the OpenAI dashboard has today: not covered by the AWS Budget at all, needs its own manual-watch guardrail).
**Gap:** none of these are provisioned or evaluated anywhere in the repo today; this is a target-state architecture decision the RAG design brief needs to make with cost-shape (not just retrieval quality) as an explicit input, given this app's $5/mo baseline and stated scale-to-zero posture.
**Services/tradeoff:** as above — the key axis is standing cost at zero traffic (OpenSearch Serverless fails the scale-to-zero fit hardest; S3 Vectors fits it best; pgvector is in between) crossed with which spend surface the budget system can even see (AWS-native options show up in Cost Explorer/Budgets automatically; SaaS vector DBs do not, same gap as OpenAI today).
**Risk:** high if unaddressed — picking a vector store on retrieval-quality grounds alone could silently blow past the $5/mo budget the day it's provisioned, independent of any traffic.

### OBS-07 — Per-request cost/latency attribution across retrieval, embedding, and generation legs — with-rag

**Current -> Target:** `askAi.ts`'s event trail has exactly one external-call leg to measure (`ask_ai.provider_invocation_completed`, LLM only) -> RAG turns this into (at minimum) three legs per request — query embedding call, vector-store query, LLM generation — each with its own latency and (for the two API-based legs) its own dollar cost, needing its own `..._started`/`..._completed` event pair and its own cost field (extending OBS-01's per-request cost logging to the embedding leg, and adding a query-count/latency field for the vector-store leg).
**Gap:** the event-trail pattern already exists and is easy to extend (`providerElapsedMs` today is the template), but no embedding or vector-store leg exists yet to instrument — this is a "build it right the first time RAG lands" item, not a retrofit.
**Services/tradeoff:** no new AWS service by itself; it's a logging-discipline requirement on whatever embedding provider (OpenAI embeddings API is the natural default given the existing OpenAI relationship) and vector store (OBS-06) get chosen.
**Risk:** medium if skipped — without it, a RAG-era cost spike is diagnosable only as "the AWS bill went up," with no way to tell whether embeddings, vector-store queries, or LLM generation drove it.

### OBS-08 — X-Ray or lightweight OTel tracing for the multi-hop RAG request path — with-rag

**Current -> Target:** today's request is a single hop (Lambda -> OpenAI), and `correlationId` plus sequential pino events already give a readable timeline with no tracing library needed -> once RAG adds a real fan-out (retrieval -> embedding call -> vector-store query -> LLM call, possibly with retries), a trace view (AWS X-Ray, or OpenTelemetry via the Lambda OTel Lambda layer) becomes worth it for seeing where time/cost concentrate across those hops.
**Gap:** `aws-bootstrap.sh` never sets `--tracing-config Mode=Active` on the Lambda; no `aws-xray-sdk` or OTel dependency exists in `apps/backend`.
**Services/tradeoff:** X-Ray: ~$5/million traces after a 100k/mo free tier, minor cold-start overhead from the SDK, tightest AWS-native integration (auto-traces the Lambda invocation and any instrumented AWS SDK calls). OTel Lambda layer: more portable (not locked to X-Ray as the backend), slightly more setup, same free-tier-friendly cost story if exported to X-Ray or another low-volume backend. Both are overkill for today's single-hop request.
**Risk:** low today (correctly deferred); revisit as soon as RAG's fan-out is designed, not after it ships — retrofitting tracing onto an already-multi-hop path is harder than building it in.

### OBS-09 — Per-service budget or alert split once RAG adds a second/third billed surface — with-rag

**Current -> Target:** one flat $5/mo Budget covers "AWS" as a single bucket, and OpenAI is watched manually/separately -> once RAG adds a vector store (OBS-06) and heavier embedding-API usage (OBS-07), a single $5 figure stops being a meaningful guardrail — recommend either raising `BUDGET_LIMIT_USD` with cost-allocation tags per component (Lambda vs. vector store vs. artifact storage) so Cost Explorer can break down the new spend, or standing up parallel budgets per major cost center.
**Gap:** `aws-bootstrap.sh`'s budget block has no tagging or per-service dimension today (`BudgetType: COST`, untagged, account-wide); this needs deciding alongside the RAG architecture choice in OBS-06, not before it.
**Services/tradeoff:** AWS Budgets supports cost-allocation-tag-filtered budgets at no extra charge (within the free-budget-count tier); the real cost is deciding what the new number should be, which depends on the vector-store choice in OBS-06.
**Risk:** low as a standalone item, but sequencing matters — doing this before OBS-06's architecture decision means guessing at a number with no shape to it.

## Open questions

- What should `BUDGET_LIMIT_USD` become once RAG lands, and should it split into per-service budgets (OBS-09)? This depends on which vector store OBS-06 picks — the study can name the options and their standing-cost shape but not a target dollar figure without a chosen architecture and expected traffic.
- Is OpenAI's Responses API `usage` object populated for every response shape this app's provider handles (including any future streaming or tool-use paths)? OBS-01 assumes it is always present on a successful `responses.create` call; this should be confirmed against the OpenAI SDK's actual response typing before implementation, not assumed from this study.
- Does the owner want a single unified spend view (AWS + OpenAI + a non-AWS vector-store SaaS if chosen) at all, or is "watch three dashboards manually" an acceptable permanent posture for a single-owner project at this scale? This is a product/ops-philosophy call, not one this study can make.
