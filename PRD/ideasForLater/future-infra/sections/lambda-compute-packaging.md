# Future-infra finding — lambda-compute-packaging

- Concern-area focus: the compute + packaging model for the single Express
  Lambda — zip vs container image, what stays bundled vs moves out, and
  memory/timeout/split-out tuning as RAG adds an embedding-lookup step.
- Reference read: `docs/aws/deployment.md`, `docs/aws/operations.md`,
  `scripts/aws-bootstrap.sh`, `scripts/aws-deploy.sh`,
  `scripts/package-lambda.sh`, `scripts/lambda-package-budget.test.mjs`,
  `PRD/sections/system-map.md`, `PRD/sections/decisions.md` (DEC-162,
  DEC-169), `apps/backend/src/runtime/createConfiguredApp.ts`,
  `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/src/gameRules.ts`,
  `apps/backend/src/gameRulesTopicSelection.ts`,
  `apps/backend/src/cardRulings.ts`,
  `apps/backend/src/commanderSpellbook/catalog.ts`, and
  `apps/backend/data/*` (sizes measured directly with `ls -la`/`du`, and
  entry counts measured with a one-off `node -e` read of the three JSON
  artifacts).

## Current state

One Lambda, `thejudge-api`, runs the whole backend: `nodejs24.x`, `arm64`,
**512 MB memory, 20 s timeout**, created by `scripts/aws-bootstrap.sh`
(`aws lambda create-function --architectures arm64 --timeout 20
--memory-size 512`). It fronts a public Function URL with no auth, capped by
`RESERVED_CONCURRENCY` (default 5); the account's default Lambda
concurrent-executions limit is 10, so a second function today would share
that same 10-execution pool (`docs/aws/deployment.md`'s reserved-concurrency
note).

Packaging is a zip built by `scripts/package-lambda.sh`: it copies
`apps/backend/dist` + `apps/backend/data` into a staging root, runs
`npm ci --omit=dev`, and zips it. As of `817409e` (this branch's tip), the
deploy path (`scripts/aws-deploy.sh`) stages that zip in a private S3 bucket
(`thejudge-lambda-artifacts-<account>`, fixed key
`lambda/lambda.zip`, overwritten every deploy) and calls
`update-function-code --s3-bucket/--s3-key`, which reads the object directly
instead of base64-encoding it into the request body. That raised the
effective ceiling from the ~50 MB a direct `--zip-file` upload tops out at to
Lambda's real **250 MB unzipped deployment-package quota** — confirmed in
`docs/aws/deployment.md` and enforced pre-merge by
`scripts/lambda-package-budget.test.mjs`, which reserves 20 MB for
node_modules/code and budgets the rest (230 MB) for `apps/backend/data`.

Measured today (`ls -la`/`du` on `apps/backend/data`):

| file | size |
|---|---|
| `cardRulingsByOracleId.json` | 19.5 MB (19,542 oracle IDs, 76,605 individual ruling entries) |
| `commanderSpellbookCombos.json.gz` | 37.5 MB (per-variant gzip members, 106,182 variants) |
| `commanderSpellbookComboIndex.json.gz` | 2.7 MB |
| `gameRulesRuleIndex.json` | 2.1 MB (3,432 Comprehensive Rules entries) |
| `gameRulesTokenStats.json` | 256 KB |
| `gameRulesByTopic.json` | 26 KB |
| others | <5 KB |
| **total** | **59 MB** |

Against the 230 MB data budget that leaves ~171 MB of headroom before the
next merge starts failing `lambda-package-budget.test.mjs`. The whole
package (data + ~4 MB prod deps + compiled code) sits at roughly 63 MB
against the 250 MB unzipped quota — nowhere near either ceiling.

**How that data is loaded at cold start** (`createConfiguredApp.ts`) splits
into two different patterns already present in this codebase, and the
difference is the load-bearing precedent for RAG:

- **Eager, full in-memory parse.** `loadCardRulingsIndex` (`cardRulings.ts`)
  and `loadGameRulesRuleIndex` (`gameRulesRetrieval.ts`) both do
  `JSON.parse(readFileSync(path, "utf8"))` synchronously at cold start,
  building a `Map`/array held for the life of the execution environment. This
  is fine at today's sizes (19.5 MB and 2.1 MB raw) but there is no
  measurement in the repo of the resulting Node heap/RSS — no cold-start
  timing or memory metric is captured anywhere in `docs/aws/operations.md` or
  the CloudWatch guidance there (it documents log tailing and the
  `backend.startup` event, not memory/duration numbers).
- **Lazy, bounded-cache disk lookup.** `commanderSpellbook/catalog.ts`
  deliberately does **not** do this for the 37.5 MB combo detail artifact.
  `loadComboCatalog` only fully parses the small 2.7 MB index (oracle/template
  membership + a byte-offset directory); the 106,182-variant detail file is
  read per-variant with a positional `readSync` at a recorded `[offset,
  length]` and `gunzipSync`'d one gzip member at a time, capped by a
  64-entry LRU (`BoundedVariantCache`/`DETAIL_CACHE_CAPACITY`). The comment
  on `DETAIL_CACHE_CAPACITY` and `PRD/sections/decisions.md`'s DEC-162 entry
  both name the reason directly: eager-loading the full combo corpus measured
  at **~868 MB resident** — comfortably over the 512 MB Lambda's memory limit
  — so the artifact is "sized for bounded per-request memory rather than
  repository footprint." This already happened once in this repo: a
  data artifact whose on-disk size looked fine (37.5 MB, well under any zip
  quota) blew up ~23x once fully parsed into a deep object graph, and the fix
  was per-record lazy fetch with a bounded cache, not a bigger Lambda.

Retrieval today (`gameRulesRetrieval.ts`) is keyword/IDF scoring: tokenize
the query, score every one of the 3,432 rule-index entries by TF-IDF-style
weight (`Math.log(N / df)`) plus exact/parent rule-ID bonuses, sort, take the
top 5. It is pure CPU over an in-memory array — no embeddings, no vector
store, no network call beyond the OpenAI Responses API call already in the
request path (`docs/aws/deployment.md`'s architecture diagram: cold start
reads the key from SSM, then `createConfiguredApp()` → Express →
`ASK_AI_PROVIDER=openai` → OpenAI Responses API). This is the retrieval path
RAG-for-rules will replace or augment.

## Recommendations

### lcp-01 — Keep zip + S3-staged deploy; container image is not warranted yet — later

**Current -> Target:** Zip built by `package-lambda.sh`, staged in S3, applied
via `update-function-code --s3-bucket/--s3-key` (DEC-169, landed this
branch). Package is ~63 MB total against the 250 MB unzipped quota, ~59 MB of
that being `apps/backend/data`. -> No change needed today; container-image
packaging (ECR, 10 GB image quota) stays available as the next valve if a
future artifact genuinely needs it.
**Gap:** None currently. The S3-staged zip already lifted the binding
constraint (the old ~50 MB direct-upload cap) to 250 MB, and current usage is
~25% of that.
**Services/tradeoff:** Container image (Lambda + ECR) buys a 10 GB ceiling
and lets you bring a custom base image (useful if a self-hosted embedding
model needs native shared libraries the standard Node.js Lambda layer
doesn't have), at the cost of a slower cold start than a zip of this size,
ECR storage cost, and a second build/push step in the deploy pipeline that
doesn't exist today. None of that is earned by the current ~63 MB package.
**Risk:** Revisit only if a RAG artifact (see lcp-03) or a self-hosted
embedding runtime's native dependencies push the package near 250 MB, or if
`lambda-package-budget.test.mjs` starts failing.

### lcp-02 — Apply the DEC-162 lazy/bounded-cache pattern to rules + rulings retrieval before RAG scales past what fits eager-loaded — with-rag

**Current -> Target:** `cardRulingsByOracleId.json` (19.5 MB, 76,605 ruling
entries) and `gameRulesRuleIndex.json` (2.1 MB, 3,432 rules) are both fully
`JSON.parse`'d into memory at cold start (`cardRulings.ts`,
`gameRulesRetrieval.ts`) and held for the life of the execution environment.
-> When RAG adds a vector index over either corpus, size it against the same
memory ceiling DEC-162 already hit once (~868 MB RSS from a 37.5 MB
gzipped source), and default to the lazy, bounded-cache disk-read pattern
`commanderSpellbookCombos.json.gz`/`catalog.ts` already implements in this
codebase, rather than a third eager-load path.
**Gap:** Today's eager-load pattern for rules/rulings is fine because the raw
data (19.5 MB / 2.1 MB) is small and text-shaped. A vector index is a
different shape: dense float arrays, not sparse text, so its in-memory
footprint scales close to linearly with `chunk_count × dimensions × 4 bytes`,
not the source text size. Using this repo's own numbers — 3,432 rules vs
76,605 individual rulings — a rules-only embedding index at a typical 1536-dim
model is roughly 3,432 × 1536 × 4 ≈ **21 MB**, comfortably residentable
alongside today's 512 MB budget. The same math over all 76,605 rulings is
roughly 76,605 × 1536 × 4 ≈ **470 MB** — before Node's runtime baseline, the
OpenAI SDK, or the already-resident 19.5 MB rulings text, i.e. it would
likely repeat the DEC-162 failure mode (an eager-loaded artifact that looks
fine on disk but doesn't fit resident) rather than avoid it.
**Services/tradeoff:** No new AWS service needed for the rules-only case —
keep it in-process, same shape as today's `loadGameRulesRuleIndex`. For a
rulings-scale index, the tradeoff is the same fork lcp-03 names: either an
external vector store (network round-trip, added op cost, no eager-load risk)
or a lazy-fetch/bounded-cache adaptation of the existing combo-catalog
pattern (stays in-process, but ANN search generally needs some structure
resident to know *which* records to fetch — unlike the combo catalog's
exact-key lookup, a nearest-neighbor query can't cheaply skip straight to an
`[offset, length]` without a resident coarse index of some kind).
**Risk:** Whoever designs RAG-for-rules picks an eager `JSON.parse` of a
vectors file by default, because that's the two-out-of-three pattern already
in this codebase (rules, rulings) — not the one-out-of-three pattern (combos)
that's actually correct at this scale. This is worth flagging explicitly at
RAG design time, not left to be rediscovered as an OOM in production the way
DEC-162 was.

### lcp-03 — Decide rules-only vs rules+rulings embedding scope before sizing anything else — with-rag

**Current -> Target:** No RAG design exists yet in this repo (no mention of
embeddings, vector store, or semantic retrieval anywhere in
`PRD/sections/system-map.md`). -> A named decision: does RAG-for-rules embed
only the 3,432-entry Comprehensive Rules corpus, or also some/all of the
76,605-entry rulings corpus?
**Gap:** This one decision determines whether every other packaging/compute
question in this document (memory size, in-process vs external vector store,
split-the-monolith) has a cheap answer or an expensive one. Rules-only stays
inside every constraint this Lambda has today (small, in-process, no new AWS
service, no split). Rulings-inclusive crosses the same resident-memory line
DEC-162 already hit and most likely forces an external vector store
(RDS/pgvector, OpenSearch Serverless, or a managed vector DB) queried over
the network from inside the request handler.
**Services/tradeoff:** n/a — this is a scope decision, not an infra choice.
Named here because every other `with-rag` recommendation in this document is
conditional on it.
**Risk:** Studied piecemeal (memory sizing here, vector store choice in a
different concern-area, retrieval-quality goals in a third), the corpus-scope
decision gets made implicitly by whichever slice ships first, instead of
explicitly by the owner.

### lcp-04 — Bump memory/timeout only once RAG's actual compute shape is known, not preemptively — with-rag

**Current -> Target:** 512 MB / 20 s, sized for today's keyword/IDF scoring
(pure CPU over a 3,432-entry in-memory array) plus one outbound OpenAI
Responses API call. -> Re-tune once RAG's query path is known: an added
embedding-generation call (network, like the existing OpenAI call) behaves
differently from an added local embedding-model inference step (CPU/memory,
unlike anything in the Lambda today).
**Gap:** No forcing function exists yet because RAG hasn't specified whether
query embedding happens via an API call (e.g. OpenAI's embeddings endpoint —
same shape as the existing Responses API call, just another outbound HTTP
call within the current 20 s budget) or a self-hosted model running in-process
(new CPU/memory pressure, plus new native dependencies that could themselves
threaten the packaging budget in lcp-01). Lambda's documented behavior also
means the two are simply different resources: memory-size increases scale
CPU proportionally on Lambda, so a compute-bound local-inference design
benefits directly from a memory bump in a way a network-bound API-call design
does not.
**Services/tradeoff:** Lambda memory/timeout are a one-line
`update-function-configuration` change (`docs/aws/operations.md` already
shows the pattern) — cheap to change, so there's no cost to waiting for the
RAG design before spending effort here. Bumping now, before that design
exists, just moves cost/latency numbers around without a target to tune
against.
**Risk:** None from waiting; the risk runs the other way — pre-guessing a
memory/timeout value now and having to redo it once RAG's actual shape lands.

### lcp-05 — Splitting retrieval into a separate Lambda is a with-rag question, and today's account concurrency limit is a real constraint on it — later / with-rag

**Current -> Target:** One Lambda (`thejudge-api`) does request handling,
keyword/IDF retrieval, and the OpenAI call. -> No split today; revisit only
if RAG's compute shape (per lcp-04) makes the retrieval step heavy enough
that it threatens the interactive path's cold-start or latency budget.
**Gap:** There is no forcing function today — the current retrieval step is
cheap in-process CPU. A split becomes attractive specifically in the
self-hosted-local-embedding-model branch of lcp-04: a heavier, differently-
provisioned function (its own memory/timeout, maybe its own container image
per lcp-01) can be kept off the latency-sensitive orchestration path. It is
not attractive in the API-call branch of lcp-04, where an added embeddings
call is just another outbound HTTP request the existing single Lambda already
makes a version of (to OpenAI's Responses API).
**Services/tradeoff:** A second Lambda function invoked in-process
(`InvokeFunction`, synchronous) or async via SQS/EventBridge is the natural
AWS-native split; either needs its own IAM role, its own memory/timeout
tuning, and its own cold-start budget on top of the orchestration Lambda's.
Concretely constraining today: `docs/aws/deployment.md` records that this AWS
account's default Lambda concurrent-executions limit is **10**, and
`aws-bootstrap.sh` already skips reserving concurrency for the one existing
function because reserving any would drop the unreserved pool below AWS's
required minimum of 10. A second function competing for that same
account-wide pool needs a Service Quotas increase requested first — an
operational step with no owner or timeline recorded anywhere in this repo.
**Risk:** Deciding to split without first requesting the quota increase
would silently starve both functions' available concurrency the moment
traffic exceeds trivial levels.

## Open questions

- Does RAG-for-rules embed only the 3,432-entry Comprehensive Rules corpus,
  the 76,605-entry rulings corpus, or both (lcp-03)? Nothing in
  `PRD/sections/system-map.md` or `PRD/sections/decisions.md` answers this
  yet, and it is the single decision every other recommendation here is
  conditional on.
- Will query-time embedding be an API call (OpenAI's embeddings endpoint, or
  similar) or a self-hosted model running in-process? This determines
  whether lcp-04/lcp-05 land as network-latency tuning or as a genuine
  compute/packaging redesign, and this document found no evidence either way
  in the current codebase.
- No cold-start duration or memory (RSS) measurement exists anywhere in this
  repo today (`docs/aws/operations.md` documents log tailing and the
  `backend.startup` event, not a timing/memory metric). Before tuning memory
  or timeout for RAG, that baseline should be measured, not assumed — the
  DEC-162 ~868 MB figure is the only real memory measurement on record, and
  it was for a code path RAG will not reuse as-is.
