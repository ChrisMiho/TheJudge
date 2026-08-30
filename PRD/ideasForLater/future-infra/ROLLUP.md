# Forward AWS Infra Study — Rollup

**9 act now · 24 with RAG · 14 later · 47 recommendations across 8 areas**

The player keeps a fast, cheap, scale-to-zero rules assistant, and RAG rides in
on the same shape the app already has: a vector index bundled inside the Lambda
zip, brute-force cosine-searched in memory, no managed vector database, no
always-on cost. Right now the job is guardrails — CloudWatch alarms, bounded log
retention, real OpenAI token-cost logging, S3 artifact versioning, a
forecast-aware budget, and finishing the reserved-concurrency quota so a
throttled player gets a real message instead of the generic fallback. RAG then
forces one owner decision — embed rules only, or rules plus rulings — because
embedding all 76,605 rulings is ~470MB of vectors that blows the 250MB package
quota and nearly the 512MB memory ceiling, repeating the exact memory blowup
DEC-162 already fixed once. Every managed vector option (OpenSearch Serverless,
Aurora Serverless v2 pgvector, Bedrock KB) is rejected up front: each costs
multiples of the whole $5/month budget even idle.

## Recommended sequence

**Do now — guardrails, all independent of RAG.** Close the observability and
deploy-safety gaps that exist today regardless of what comes next: enable S3
versioning on the artifact bucket, add CloudWatch alarms on errors/throttles/
duration, set bounded log retention, add a forecasted + lower-threshold budget,
and log real OpenAI token usage and dollar cost per request. In parallel, finish
the reserved-concurrency step (request the Service Quotas increase, then reserve)
and branch the UI on 429 so the throttle SC-01 creates lands as a real message,
not "Miho is working on it." Standing decision to record now: no managed vector
service at this scale.

**The keystone decision RAG forces first: corpus scope.** Rules-only (3,432
entries, ~21MB of vectors) fits trivially inside the package and 512MB memory as
a bundled static file. Rules-plus-rulings (~470MB) does not — it changes the
architecture from in-package to S3-cold-load-only and reopens the DEC-162 memory
problem. This one decision gates almost everything downstream, so it must be made
before sizing the data plane.

**Then the choices that chain off scope.** The vector-store cost-fit call
(favor S3 Vectors or an SSM-keyed external API over always-on OpenSearch/RDS)
drives three dependents: the IAM policy to hand-write (SEC-2), the packaging /
lazy-cache pattern to apply (lcp-02), and whether budgets need a per-service
split (obs-09, obs-06). Land the CDK migration *before* RAG bolts a vector store
and new IAM onto the imperative bash scripts. Build the embedding pipeline at
build time (RA-001) using OpenAI embeddings (RA-002), chunk above rule-entry
granularity (RA-003), store vectors as raw binary not JSON (binary format), fuse
the vector signal with the existing lexical scorer rather than replacing it
(RA-004), and extend the eval harness to stay deterministic under embedding
scores (RA-007) so the quality-check gate keeps working. Add a dev/staging
environment for the retrieval-quality iteration that shouldn't happen on prod.

**Re-tune once RAG's real shape is measured.** Memory/timeout (lcp-04, SC-04),
provisioned concurrency (SC-03), the per-leg cost/latency trail (obs-07), and
tracing (obs-08) all wait on measured RAG cold-start and latency numbers. Bundle
the edge hardening (CloudFront + WAF rate limiting) with RAG, since RAG adds a
second billed call per request and makes an open Function URL economically worse
to abuse.

**Later.** Container images, a split retrieval Lambda, an embedded ANN store,
reranking, a custom domain, and general abuse backpressure all lack a forcing
function today.

## Act now

| Recommendation | Area | Current → Target | Gap |
|---|---|---|---|
| Do not reach for OpenSearch Serverless / Aurora v2 pgvector / Bedrock KB | RAG data plane | Zero managed data-tier services, $5/mo budget, no VPC → stays that way | None to close; every managed option costs multiples of the whole budget even idle, DynamoDB has no vector search |
| Bundle the vector index as a static file in the Lambda package; no managed vector DB yet | Retrieval arch | All data ships in the ~50-55MB zip, ~195MB headroom → ship a ~21MB brute-force in-memory index the same way | No index format/loader yet; a managed store adds always-on cost that fights scale-to-zero |
| Enable S3 versioning on the Lambda artifact bucket | IaC/Deploy | Fixed-key overwrite, no versioning (DEC-169) → versioned objects on the same key | One idempotent put-bucket-versioning call in aws-bootstrap.sh; gives instant rollback |
| Capture real OpenAI token usage per request | Observability/Cost | Char-count estimate (answer.length/4), no usage field → log real input/output/total tokens + dollar cost | Add one field to the response type and thread it through; pure code, no infra |
| CloudWatch Alarms on Lambda errors, throttles, duration | Observability/Cost | Zero alarms; RESERVED_CONCURRENCY=5 throttles are silent 429s → 3-4 alarms to NOTIFICATION_EMAIL | No put-metric-alarm block; the budget block is a ready copy template |
| Set explicit CloudWatch Logs retention | Observability/Cost | Log group auto-creates Never Expire → bounded 30-90 day retention | One idempotent aws logs call missing from bootstrap |
| Multi-threshold, forecast-aware AWS Budget | Observability/Cost | One Budget, one ACTUAL alert at 80% of $5/mo → add FORECASTED + a lower (50%) threshold | budget-notifications.json needs a second notification object, no new resource |
| Finish the reserved-concurrency step: request the quota increase, then set it | Scaling/Concurrency | Bootstrap skips put-function-concurrency (default 10 can't fit 5 + 10 unreserved) → request Service Quotas increase, then reserve | Command documented but unrun; zero dedicated concurrency protection today |
| Give a throttled player a real message and a retry, not the generic fallback | Scaling/Concurrency | Every failure renders "Miho is working on it" → branch on status, 429-specific copy + retry/cooldown | No status-code branching; SC-01's real throttle would otherwise hit players with an unhelpful message |

## With RAG

| Recommendation | Area | Current → Target | Gap |
|---|---|---|---|
| Decide rules-only vs rules+rulings embedding scope before sizing anything else | Compute/Packaging | No embedding/vector-store mention in PRD → explicit owner decision on corpus scope | Every other packaging/compute rec is conditional on this one unmade decision |
| Decide whether RAG embeds rulings too, before sizing the data plane | RAG data plane | 76,605 rulings looked up by exact oracle ID only → scope decision (rules vs rulings vs both) | Embedding all rulings ~470MB blows 250MB quota + 512MB ceiling; decides in-package vs S3-cold-load architecture |
| Apply the DEC-162 lazy/bounded-cache pattern to rules+rulings before RAG scales past eager-load | Compute/Packaging | Rules (2.1MB) + rulings (19.5MB) fully JSON.parse'd at cold start → RAG index reuses the lazy/bounded-LRU disk-read pattern | An all-rulings index is ~470MB resident — repeats the exact RSS failure DEC-162 already fixed |
| Bundle rule-level embeddings the same way as today's JSON | RAG data plane | 3,432-entry corpus, IDF, bundled JSON → same entries carry embeddings, brute-force cosine, same S3-staged deploy | No embedding pipeline/format yet; ~21MB fits inside 250MB + 512MB with no new service |
| Store embedding vectors as raw binary, not JSON float arrays | RAG data plane | Every artifact is JSON text → Float32Array binary blob | JSON floats ~3x binary; trivial at rules scale, big if rulings embedded (470MB → 1GB+) |
| Build-time embedding generation, not runtime | Retrieval arch | Zero embedding/network calls, IDF stats at cold start → offline pipeline ships a static embedding artifact | No pipeline; runtime embedding would blow the 20s timeout and break scale-to-zero |
| OpenAI embeddings over Bedrock Titan/Cohere for the first cut | Retrieval arch | OPENAI_API_KEY live via SSM for answers, no embedding provider → reuse OpenAI embeddings, same secret plumbing | Bedrock needs a new IAM grant + per-region model access + a second provider, unjustified at this scale |
| Chunk the Comprehensive Rules corpus above rule-entry granularity | Retrieval arch | 3,432 entries at rule-number granularity (avg 240 chars) tuned for lexical/exact-ID → coarser section/token-window chunking | No chunking strategy exists; must preserve the exact-rule-ID match path |
| Hybrid fusion, not vector-only replacement | Retrieval arch | One lexical formula (IDF + multipliers + rule-ID bonuses) → add a fused vector signal (RRF/weighted sum), keep exact-match guarantees | No fusion logic; pure-vector regresses the exact rule-number lookups System 3 nails today |
| Extend the eval harness's recall/noise checks to survive non-deterministic vector scores | Retrieval arch | Harness asserts exact rule-ID recall/noise + byte-exact goldens on a deterministic IDF scorer → keep the contract, fixture-pin query embeddings | No plan for embedding nondeterminism; quality-check.yml's gate would break or silently stop testing quality |
| Move bootstrap/deploy off imperative bash onto CDK (TypeScript) | IaC/Deploy | 478+99 lines of hand-rolled bash idempotency, no state/plan/diff → declarative CDK TS with plan-before-apply | Full rewrite; land it before RAG bolts a vector store + new IAM onto the imperative script |
| Add a dev/staging environment, separate from prod | IaC/Deploy | One unparameterized stack, OIDC pinned to main only → stage-parameterized dev+prod with separate OIDC trust | No env separation; RAG quality iteration needs a live target that isn't prod |
| Pick RAG's vector store against the scale-to-zero / $5-budget posture before it lands | IaC/Deploy | Idle-cost-near-zero (Lambda, CloudFront/S3, $5/mo budget) → a store preserving that (S3 Vectors or SSM-keyed external API over RDS/pgvector or always-on OpenSearch) | Decision not made anywhere in the repo |
| Rate-limit / gate the public Function URL before RAG raises cost-per-request | Security/IAM | Auth NONE, no WAF, nominal reserved-concurrency + post-hoc $5 budget → request-level throttle (CloudFront+WAF rule, or in-Lambda counter stopgap) | RAG adds a second billed call per request, multiplying abuse cost on an already-open door |
| Scope IAM for the RAG vector store / embedding provider before it's built | Security/IAM | Zero vector-store IAM; only SSM+KMS inline on the exec role → narrow resource-ARN-pinned inline policy for the chosen backend | Risk of grabbing a broad managed policy (AmazonBedrockFullAccess) under time pressure |
| Treat retrieved-corpus provenance as a RAG design gate, not an afterthought | Security/IAM | Retrieved text is 100% static WotC/Scryfall JSON, framed as reference → RAG ingestion keeps the authoritative-source-only trust boundary at nearest-neighbor | Process gap; needs an explicit source-allowlist line in the RAG design brief |
| Vector-store standing cost is a new spend surface | Observability/Cost | One external AI spend line (OpenAI, manual, no Budget coverage) → a vector store whose cost shape varies wildly by choice | No store evaluated; architecture decision the RAG brief must make with cost-shape as an explicit input |
| Per-request cost/latency attribution across retrieval/embedding/generation legs | Observability/Cost | Event trail measures one external leg (LLM providerElapsedMs) → add embedding + vector-store-query legs, each with cost/latency | The event-trail pattern exists and extends easily, but no legs exist yet to instrument |
| X-Ray or OTel tracing for the multi-hop RAG path | Observability/Cost | Single hop Lambda→OpenAI, correlationId + pino logs, no tracing → trace the RAG fan-out via X-Ray or an OTel layer | Today's single hop doesn't justify it; retrofitting after RAG ships is harder than building in |
| Per-service budget / cost-allocation split once RAG adds billed surfaces | Observability/Cost | One flat untagged $5/mo Budget for all AWS → cost-allocation tags or per-component budgets | Budget block has no tagging dimension; sequenced after the obs-06 architecture choice |
| CloudFront + WAF in front of the API | Networking/Edge | Bare Function URL, only reserved-concurrency + post-hoc budget → CloudFront + WAF rate-based rule (WAF can't attach to a Function URL directly) | WAF ~$5-10/mo outsizes today's risk; bundle it with RAG, which worsens abuse economics |
| Provisioned concurrency for RAG's cold start | Scaling/Concurrency | Pure scale-to-zero; cold start does an SSM round trip + ~21.7MB synchronous JSON.parse → evaluate Provisioned Concurrency once RAG shape known | Can't size until RAG cold-start is measured; trades away the scale-to-zero cost story for latency |
| Re-budget the 20s timeout once retrieval adds a network hop | Scaling/Concurrency | 20s budgets 15s OpenAI + ~5s margin, no network-hop retrieval → re-derive (retrieval + OpenAI + cold-start margin) once RAG latency measured | No retrieval-latency budget line yet; interacts with SC-01's cap for worst-case cost |

## Later

| Recommendation | Area | Current → Target | Gap |
|---|---|---|---|
| Keep zip + S3-staged deploy; container image not warranted yet | Compute/Packaging | 63MB package (59MB data) via S3-staged zip vs 250MB quota → stay on zip until an artifact needs the 10GB container ceiling or native deps | None, package is ~25% of quota |
| Splitting retrieval into a separate Lambda is a with-rag question, gated by concurrency | Compute/Packaging | One Lambda does orchestration + retrieval + OpenAI; account concurrency limit 10 → split only if self-hosted embedding makes retrieval compute-heavy | No forcing function; a second function needs a Service Quotas increase first |
| LanceDB/sqlite-vss stays a documented fallback, not a default | RAG data plane | Brute-force cosine over ~3,432 vectors, no index → unchanged unless corpus grows to tens of thousands | None today; an EFS-mounted variant needs a VPC + NAT/ENI cost this app doesn't carry |
| No reranking pass for the first cut | Retrieval arch | System 3's score is the final rank → stay that way unless hybrid fusion underperforms on the eval harness | A reranker adds a request-time network call against a corpus too small to need it |
| Do not fold compare-combo-answer-quality.mjs into rules-retrieval eval | Retrieval arch | Script scoped to combo enrichment (REQ-146/DEC-161), informational → leave it, extend contextEvaluationHarness.ts instead | None; scope clarification to avoid conflating the two eval surfaces |
| Require a plan/diff preview on infra changes before merge | IaC/Deploy | Infra edits reviewed as plain bash diffs, no live-impact preview → cdk diff / terraform plan posted in PR CI | Impossible until the CDK migration lands; downstream increment, no independent forcing function |
| Pin the kms:Decrypt grant to the actual key ARN, not Resource "*" | Security/IAM | kms:Decrypt on Resource "*" scoped by kms:ViaService=ssm condition → pin the alias/aws/ssm key ARN, keep the condition | Low risk (condition is a real boundary) but strictly tighter and free to add |
| Document and schedule OpenAI key rotation cadence | Security/IAM | operations.md documents how to rotate but not when → a documented cadence + optional EventBridge reminder | Mechanism is correct; only the "when" is missing (Secrets Manager rotation doesn't help — OpenAI has no rotation API) |
| Existing contextNotes free-text field is already a prompt-injection surface | Security/IAM | Per-card contextNotes concatenated into the prompt, predates RAG → no code change here, flagged so it isn't mistaken for RAG-introduced | A future prompt-injection review should scope this path and the RAG path (SEC-5) together |
| Embedded Metric Format for per-request cost/latency | Observability/Cost | Cost/latency are log fields needing Logs Insights to aggregate → EMF lines CloudWatch auto-promotes to Metrics | No metrics namespace; defer until RAG creates enough numeric legs (obs-07) to justify per-metric cost |
| Keep the Function URL; no API Gateway | Networking/Edge | Function URL via serverless-express, zero request cost → considered API Gateway HTTP API for usage plans/keys/native WAF | No second consumer or account system; CloudFront delivers the one real benefit (rate limiting) without migration churn |
| CORS posture | Networking/Edge | FRONTEND_ORIGIN pins CORS to the CloudFront domain in prod, not a wildcard → no functional change, just a documenting comment | None in prod; the non-browser-bypass residual is covered by the WAF rec, not CORS |
| Custom domain + ACM | Networking/Edge | Raw *.cloudfront.net / *.lambda-url URLs, VITE_API_URL rebaked each deploy → Route 53 + ACM + CloudFront alternate domain | Purely cosmetic/branding, ~$13-18/yr, no forcing function |
| Add abuse-layer backpressure (WAF / rate limiting) in front of the Function URL | Scaling/Concurrency | Public no-auth Function URL, only the global concurrency ceiling as backpressure → CloudFront+WAF rules or API Gateway usage plans | Nothing configured; worth the cost only once real abuse or unpredictable traffic shows up |

## Open questions for the owner

- **Corpus scope — the fork everything hangs on.** Embed rules only (3,432
  entries, ~21MB, fits in-package), rulings too (76,605 entries, ~470MB, forces
  S3-cold-load-only and reopens the DEC-162 memory problem), or both? No other
  packaging, compute, IAM, or budget decision can be sized until this is settled.
  (lcp-03, rulings-corpus-scope-decision)
- **Which vector store, given the scale-to-zero / $5-budget posture?** S3
  Vectors, an SSM-keyed external API, pgvector, or something else — and it must
  be chosen before RAG lands, because the choice sets the IAM policy to write,
  the cache pattern to apply, and whether budgets need a per-service split.
  (iac-vector-store-cost-fit, obs-06)
- **Query embedding: OpenAI API call (network) or self-hosted inference
  (CPU/memory)?** This is the compute shape that decides memory/timeout re-tuning
  and whether retrieval ever needs its own Lambda. (lcp-04, lcp-05)
- **Provisioned concurrency vs scale-to-zero.** Once RAG's cold-start cost is
  measured, is the latency worth trading away today's near-zero idle cost story?
  (SC-03)
- **CDK migration timing.** Land the imperative-bash-to-CDK rewrite before RAG
  bolts a vector store and new IAM onto the scripts, or accept adding to the bash
  first? (iac-cdk-migration)
- **Edge hardening spend.** CloudFront + WAF is ~$5-10/mo against today's near-
  zero traffic risk; accept that standing cost bundled with RAG, or hold until
  real abuse appears? (SEC-1, edge-waf-rate-limit, SC-05)
