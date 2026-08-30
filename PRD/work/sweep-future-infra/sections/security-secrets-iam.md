# Future-infra finding — security-secrets-iam

- Concern-area focus: secrets handling, IAM scope, and the public endpoint's
  abuse/injection surface, today and under RAG-for-rules.
- Reference read: `docs/aws/secrets.md`, `docs/aws/deployment.md`,
  `docs/aws/operations.md`, `scripts/aws-bootstrap.sh`,
  `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/src/cardRulings.ts`,
  `apps/backend/src/routes/askAi.ts`, `PRD/sections/system-map/prompt-assembly.md`,
  `apps/backend/data` (via `ls -la`).

## Current state

The OpenAI key is an SSM `SecureString` at `/thejudge/openai-api-key`, encrypted
with the AWS-managed `aws/ssm` KMS key. It never touches Git, GitHub, or Lambda
function configuration — only the parameter *path* travels as a non-secret env
var (`docs/aws/secrets.md:14,28-29`). The Lambda execution role
(`thejudge-lambda-exec`) gets an inline policy (`thejudge-openai-secret`,
`scripts/aws-bootstrap.sh:95-117`) with exactly two statements:
`ssm:GetParameter` scoped to the parameter's own ARN, and `kms:Decrypt` with
`Resource: "*"` gated by `Condition: {StringEquals: {kms:ViaService:
ssm.<region>.amazonaws.com}}`. The GitHub deploy role gets no key access at
all. Rotation is manual and in-place (`aws ssm put-parameter --overwrite`,
`docs/aws/operations.md:26-49`) with no documented cadence — only the mechanic,
triggered by a no-op `update-function-configuration` to force new containers to
pick it up. There is no AWS Secrets Manager and no automated rotation Lambda.

GitHub authenticates via OIDC (`docs/aws/secrets.md:54-69`), not static keys.
The deploy role's trust policy is scoped to this repo's `main`-branch workflows
(`scripts/aws-bootstrap.sh:375-396`) and its permission policy
(`thejudge-deploy-policy`) is scoped to `lambda:UpdateFunctionCode/Configuration`
+ `GetFunction`/`GetFunctionUrlConfig`/`GetFunctionConfiguration` on
`thejudge-api` by name, S3 read/write on the two named buckets, and CloudFront
invalidation (wildcard `Resource: "*"` on the three CloudFront actions —
`scripts/aws-bootstrap.sh:458-467`, since CloudFront invalidation/get/list
don't take a distribution-scoped resource ARN for `ListDistributions`).

The Lambda's Function URL is public with `--auth-type NONE`
(`scripts/aws-bootstrap.sh:226-250`; confirmed in `docs/aws/deployment.md:26`
and `docs/aws/operations.md:65-80`). The only throttle is reserved concurrency
(`RESERVED_CONCURRENCY`, default 5 — currently *not actually applied*, since the
account's default Lambda concurrency limit is 10 and AWS requires >=10
unreserved, so bootstrap skips the reservation and the account-wide limit of 10
is the live cap, per `docs/aws/deployment.md:155-161`). A $5/mo AWS Budget
alerts at 80% (`scripts/aws-bootstrap.sh:184-224`), and OpenAI spend is capped
only by prepaid, no-auto-renew credits (`docs/aws/operations.md:61-63`). There
is no WAF, no per-IP rate limit, no API key, and no CAPTCHA/bot check in front
of the endpoint — anyone with the URL can call `/api/ask-ai` and trigger an
OpenAI-billed request, up to 10 concurrent, until credits or the Lambda
throttle stop them.

Rules/rulings retrieval today is 100% static and offline: `gameRulesRetrieval.ts`
loads `gameRulesRuleIndex.json` (2.2MB), `gameRulesTokenStats.json` (256KB), and
`gameRulesKeywordVocabulary.json` (328B) from `apps/backend/data` at cold start
and scores them with IDF/keyword weighting (`scoreEntry`,
`gameRulesRetrieval.ts:292-327`) — no embeddings, no vector store, no network
call. `cardRulings.ts` does the same against `cardRulingsByOracleId.json`
(19.5MB). The full `apps/backend/data` dir is 59MB (`ls -la` above; the two
Commander Spellbook combo files, 2.7MB + 37.5MB gzipped, dominate). All of this
content is WotC/Scryfall-sourced and baked into the deploy package at build
time (`npm run build` + `package-lambda.sh`, `scripts/aws-bootstrap.sh:121-122`)
— it is not fetched live and not influenced by end-user input. Per
`PRD/sections/system-map/prompt-assembly.md:23-25`, this retrieved content
("System 2"/"System 3"/"System 1" blocks) is explicitly framed in the prompt as
*reference context, not authority to rewrite the submitted state* — an
existing, code-level mitigation against a retrieved passage steering the model.
The one place free-form end-user text already enters the prompt today is
per-card `contextNotes` in submitted zones/stack items
(`gameRulesRetrieval.ts:227-243`) — an existing prompt-injection surface, but
one that predates and is orthogonal to RAG.

The enrichment-debug sidecar (`apps/backend/src/prompt/enrichmentDebug.ts`) that
reports retrieval scoring is mock-provider-only per
`prompt-assembly.md:44-47`, and `askAi.ts:126-140` confirms the OpenAI-mode
response path never attaches it — retrieval internals are not exposed to
callers of the public endpoint.

## Recommendations

### SEC-1 — Rate-limit / gate the public Function URL before RAG raises cost-per-request — with-rag
**Current -> Target:** Auth `NONE`, no WAF, no per-caller quota; the only cost
brake is a concurrency ceiling (nominally 5, actually capped at the account's
default 10) and a $5 budget email that fires *after* spend happens. **Target:**
put a request-level throttle in front of the endpoint before RAG retrieval
(embeddings + vector-store queries, both metered) is added per-request cost on
top of today's free CPU-only keyword scoring.
**Gap:** today an anonymous caller can trigger up to 10 concurrent
OpenAI-billed requests with no per-IP or per-session limit; RAG adds a second
billed call (embedding, and possibly a managed vector-store query charge) per
request, multiplying the blast radius of the same open door.
**Services/tradeoff:** Lambda Function URLs don't support AWS WAF directly;
options are (a) put CloudFront in front of the Function URL (same OAC-style
pattern already used for the frontend bucket) and attach AWS WAF with a
rate-based rule — adds a CloudFront hop (small latency, no cost at this
traffic level under PriceClass_100) and ~$5-6/mo WAF base cost plus per-rule
fees; (b) switch Function URL `auth-type` to `AWS_IAM` and put API Gateway or
CloudFront+Lambda@Edge in front for a lightweight shared-secret/turnstile
check — more moving parts; (c) cheapest: an in-Lambda per-IP/session token
bucket backed by nothing more than reserved concurrency plus a short-lived
in-memory counter (works only while a single container is warm, so it is weak
alone but costs nothing and ships in an afternoon). Recommend (c) now as a
stopgap and (a) as the real fix timed to land with RAG.
**Risk:** unchanged, un-rate-limited endpoint plus billed RAG retrieval is a
direct cost-abuse vector — a scripted caller can run the AWS Budget and OpenAI
prepaid credits to zero with no rate limit in the way, at higher cost-per-hit
than today.

### SEC-2 — Scope IAM for the RAG vector store / embedding provider before it's built — with-rag
**Current -> Target:** No vector-store or Bedrock/embedding IAM grants exist
anywhere in the stack today — `thejudge-lambda-exec`'s only inline policy is
the SSM+KMS pair above. **Target:** whichever retrieval backend is chosen
(Bedrock Knowledge Bases, Bedrock `InvokeModel` for embeddings + a self-managed
vector index, OpenSearch Serverless, or S3 Vectors) gets its own narrowly
scoped inline policy on the execution role, resource-ARN-pinned the same way
the SSM policy is pinned to one parameter ARN — not a wildcard
`bedrock:*`/`aoss:*`/`s3:*` grant.
**Gap:** this is a decision + IAM-design gap, not a regression — there's
nothing to tighten yet because nothing exists yet. The risk is doing it under
RAG-ships-this-sprint time pressure and reaching for a broad managed-policy
attach (e.g. `AmazonBedrockFullAccess`) the way `AWSLambdaBasicExecutionRole`
was reached for on the Basic Execution side, rather than hand-writing a scoped
statement the way `thejudge-openai-secret` was.
**Services/tradeoff:** Bedrock Knowledge Bases (managed RAG, handles chunking
+ retrieval, `bedrock:Retrieve`/`bedrock:RetrieveAndGenerate` scoped to one
knowledge-base ARN) is the least IAM surface and least operational burden but
highest per-query cost and a new cold-start dependency; a self-hosted vector
index (OpenSearch Serverless collection, or pgvector) needs both
`bedrock:InvokeModel` scoped to one embedding-model ARN *and*
data-plane grants on the store, doubling the policy surface but giving cost
control. Either way, write the policy scoped to named resource ARNs from the
first commit, mirroring the existing SSM pattern, and have it reviewed as part
of the RAG design brief rather than as an incidental deploy-script diff.
**Risk:** a wildcard Bedrock/vector-store grant on the same role that already
holds the OpenAI key's `kms:Decrypt` turns one Lambda compromise into a
two-secret, two-service blast radius instead of one.

### SEC-3 — Pin the KMS `kms:Decrypt` grant to the actual key ARN, not `Resource: "*"` — later
**Current -> Target:** `scripts/aws-bootstrap.sh:104-109` grants `kms:Decrypt`
on `Resource: "*"`, narrowed only by the `kms:ViaService =
ssm.<region>.amazonaws.com` condition. **Target:** resolve the `alias/aws/ssm`
key's ARN at bootstrap time (`aws kms describe-key --key-id alias/aws/ssm`) and
pin the statement's `Resource` to that ARN, keeping the `ViaService` condition
as defense-in-depth rather than the sole boundary.
**Gap:** the `ViaService` condition is a real, AWS-documented control (it means
this grant only works when SSM itself calls KMS on the role's behalf, not a
direct `kms:Decrypt` on an arbitrary key), so this is a hardening pass, not a
live hole — but a resource-ARN-pinned statement is strictly tighter and costs
nothing to add.
**Services/tradeoff:** no new service; pure IAM policy edit in
`aws-bootstrap.sh`. Only wrinkle is the `aws/ssm` managed key's ARN is
account/region-specific and not knowable at repo-write time, so it has to be
resolved by a CLI call inside the script rather than hardcoded.
**Risk:** low as-is; this closes the gap between "scoped by condition" and
"scoped by condition and resource," which matters if `kms:ViaService` is ever
misconfigured or a future statement is appended to the same policy without the
condition.

### SEC-4 — Document and schedule OpenAI key rotation cadence — later
**Current -> Target:** `docs/aws/operations.md:26-49` documents *how* to
rotate (`put-parameter --overwrite` + a forced cold start) but not *when* —
there is no rotation cadence, no calendar reminder, and no automated rotation
Lambda. **Target:** a documented cadence (e.g. quarterly, or on suspected
exposure) added to `operations.md`, optionally backed by an EventBridge
scheduled reminder (not an automated rotation, since OpenAI keys are minted
manually in their dashboard, not via a rotatable API).
**Gap:** the mechanism exists and is correct (SSM SecureString, cold-start-only
read, redeploys don't clobber it); only the "when" is missing.
**Services/tradeoff:** AWS Secrets Manager's native rotation-Lambda feature
doesn't apply cleanly — OpenAI has no rotation API to call, so Secrets Manager
would only buy versioning/audit history over SSM SecureString at ~$0.40/secret/
month plus API-call cost, for a single low-traffic key. Not worth migrating off
SSM at this scale; a documented cadence plus an EventBridge -> SNS/email
reminder is the low-cost equivalent.
**Risk:** low urgency — no incident-driving forcing function today — but an
unrotated long-lived key is a standing exposure with no expiry backstop.

### SEC-5 — Treat retrieved-corpus provenance as a RAG design gate, not an afterthought — with-rag
**Current -> Target:** today's retrieved text (`gameRulesRuleIndex.json`,
`cardRulingsByOracleId.json`) is 100% WotC/Scryfall-sourced static JSON, baked
into the deploy package at build time with no live fetch and no end-user
influence over its content — so "prompt injection via retrieved rules text" is
not a live risk today. Prompt assembly already frames this content as
reference-only, not state-rewriting authority
(`prompt-assembly.md:23-25`). **Target:** whatever RAG's ingestion pipeline
is (fetching the MTG Comprehensive Rules + rulings corpus into a vector store),
keep the same trust boundary — ingest only from the same authoritative
sources (official WotC/Scryfall text), not a live/community/user-editable
corpus — and keep the "reference, not authority" framing in the prompt when
the retrieval mechanism changes from IDF scoring to nearest-neighbor.
**Gap:** none today; the gap is process — this needs to be an explicit line
in the RAG design brief (source allowlist for ingestion, no dynamic/crowd-sourced
corpus without a re-review) rather than assumed to carry over silently when the
retrieval code is rewritten.
**Services/tradeoff:** no new service; this is a design-review checklist item,
not an infra change. If a future iteration considers ingesting community
rulings/forum content (broader coverage) versus staying WotC-official-only
(narrower but trusted), that tradeoff should be named explicitly in the RAG
design brief, since it directly reopens the prompt-injection question this
finding currently closes.
**Risk:** low today; the risk is a silent scope-creep in a later corpus update
(e.g. adding community-sourced rulings for coverage) that reintroduces
untrusted text into a channel the current design treats as trusted.

### SEC-6 — Existing `contextNotes` free-text field is already a prompt-injection surface, independent of RAG — later
**Current -> Target:** per-card `contextNotes` (populated zones and stack
items, `gameRulesRetrieval.ts:227-243`) is free-form end-user text concatenated
directly into the query text and, per `prompt-assembly.md`, into the rendered
prompt's zone sections. **Target:** no code change proposed here since it's
outside this concern-area's forcing function, but flag it so it isn't confused
with a *new* RAG-introduced risk — it predates RAG and is a separate,
already-live surface.
**Gap:** not a gap this study covers in depth (out of the RAG/S3-deploy
forcing functions), but worth naming so a future prompt-injection review
scopes both the RAG-retrieved-content path (SEC-5) and this pre-existing
user-text path together rather than treating retrieval as the only entry
point.
**Services/tradeoff:** none — this is a scoping note, not an infra
recommendation.
**Risk:** low-to-moderate; the prompt's "reference, not authority" framing and
the model's own instruction-following limits are the only current mitigation.
No new information from this study changes that risk level.

## Open questions

- Which RAG backend (Bedrock Knowledge Bases vs. self-managed
  OpenSearch/pgvector/S3 Vectors) is chosen determines the exact IAM policy
  shape in SEC-2 — this study can size the tradeoff but not pick a winner
  without a cost/ops-burden decision the owner has to make.
- Whether the public Function URL should ever move off `auth-type NONE`
  entirely (e.g. a lightweight shared token in the frontend, checked
  app-side) is a product-scope question (does anonymous public access stay a
  requirement?), not one this security study can resolve alone.
- Whether a CloudFront+WAF front-end for the API (SEC-1 option a) is worth its
  ~$5-6/mo fixed cost against the current $5/mo total AWS budget is a
  budget-policy call for the owner, since it could itself roughly double the
  monthly AWS spend ceiling.
