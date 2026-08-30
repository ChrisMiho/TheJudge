# Future-infra finding — iac-deploy-pipeline

- Concern-area focus: shell-script bootstrap/deploy today, and what real IaC, environments, artifact versioning, and RAG's new resources do to that pipeline.
- Reference read: `scripts/aws-bootstrap.sh`, `scripts/aws-deploy.sh`, `scripts/package-lambda.sh`, `scripts/deploy-lambda-s3-staging.test.mjs`, `scripts/lambda-package-budget.test.mjs`, `.github/workflows/quality-check.yml`, `docs/aws/deployment.md`, `docs/aws/operations.md`, `docs/aws/secrets.md`, `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/data` (via `ls -la`), `PRD/sections/system-map.md` (grepped for RAG/vector mentions — none found).

## Current state

Deploy is two bash scripts, no IaC tool, no state file, no plan/diff step.

`scripts/aws-bootstrap.sh` (478 lines) is a one-time, idempotent, imperative
script run locally with admin credentials. It creates or reuses: two private
S3 buckets (`thejudge-web-<account>` for the frontend, `thejudge-lambda-artifacts-<account>`
for deploy staging), a Lambda execution role with an inline SSM/KMS policy
scoped to `/thejudge/openai-api-key`, the `thejudge-api` Lambda + public
Function URL, reserved concurrency (default 5, skipped on accounts whose
account-wide concurrency limit is too low, per its own gap-2 comment), an
AWS Budget (default $5/mo, gated on `NOTIFICATION_EMAIL`), a CloudFront
distribution with an Origin Access Control, and a GitHub OIDC provider +
deploy role (`thejudge-github-deploy`) whose trust policy is pinned to
`repo:$github_repo:ref:refs/heads/main` — no other branch or environment can
assume it. Idempotency is hand-rolled per resource: `head-bucket` /
`get-role` / `get-function` existence checks, and CloudFront/OAC lookups by
filtering `list-distributions`/`list-origin-access-controls` on a `Comment`
or `Name` string match rather than a stored resource ID.

`scripts/aws-deploy.sh` (99 lines) is the steady-state path, run from
`.github/workflows/quality-check.yml`'s `deploy` job on push to `main` (or
manual `workflow_dispatch`). It packages the Lambda
(`scripts/package-lambda.sh`), stages the zip in the artifact bucket at a
**fixed key** `lambda/lambda.zip` — "overwritten on every deploy. No
per-deploy history object, versioning, or lifecycle rule" (`aws-deploy.sh:14-16`,
citing `DEC-169`) — then calls `update-function-code --s3-bucket/--s3-key`,
rewrites the non-secret env block, rebuilds the frontend, and syncs it to S3
with a CloudFront invalidation. `aws-bootstrap.sh` stages via the same fixed
key and calls the equivalent `--code S3Bucket=/S3Key=` path on
`create-function`/`update-function-code`.

The S3-staged path is new: `docs/aws/deployment.md` and
`scripts/deploy-lambda-s3-staging.test.mjs` describe it as replacing
`--zip-file` (inline base64, capped ~50MB) with `--s3-bucket`/`--s3-key`
(bounded only by Lambda's 250MB unzipped quota). The test file's own
docstring records that on 2026-08-30 this landed unevenly — `aws-deploy.sh`
converted, `aws-bootstrap.sh` left on `--zip-file` — and broke a bootstrap
run before a merge-gate test (`deploy-lambda-s3-staging.test.mjs`) was added
to `test:scripts` (part of `quality:check`) to pin both scripts to the S3
path. That test currently passes on both scripts (verified by reading them).

Package-budget guardrail: `scripts/lambda-package-budget.test.mjs` sums
`git ls-files -- apps/backend/data` and asserts it stays under `250MB - 20MB
reserve = 230MB`. Measured today via `ls -la apps/backend/data`:

```
cardRulingsByOracleId.json            19.5 MB
commanderSpellbookComboIndex.json.gz   2.7 MB
commanderSpellbookCombos.json.gz      37.5 MB
gameRulesByTopic.json                 0.025 MB
gameRulesKeywordVocabulary.json       <0.001 MB
gameRulesRuleIndex.json                2.2 MB
gameRulesTokenStats.json               0.26 MB
gameRulesTopicManifest.json            0.003 MB
-----------------------------------------------
total                                 ~59 MB (du -sh)
```

That is well under the 230MB data budget the test enforces, and the test's
own docstring cites 49.8MB as the 2026-08-24 measurement — the corpus has
grown ~9MB since. Rules retrieval today, per `apps/backend/src/gameRulesRetrieval.ts`,
is IDF/keyword scoring (`gameRulesTokenStats.json`, `gameRulesKeywordVocabulary.json`)
over the bundled static JSON above — no embeddings, no vector store, nothing
that talks to an external service at query time.

CI (`quality-check.yml`): a `changes` job gates the `deploy` job on a path
regex (`^(apps/|scripts/|\.github/workflows/|package\.json$|package-lock\.json$|tsconfig.*\.json$)`)
computed via `git diff` against the push's `before` SHA, failing safe to
`deploy=true` when that SHA is unavailable. `deploy` needs `[static, backend,
coverage-merge, changes]` — i.e. the full quality gate blocks every deploy.
Rollback (`docs/aws/operations.md`) is `git revert` + push, which reruns the
entire quality gate and rebuilds from source — there is no artifact to roll
back to, by design (`DEC-169`, restated in `aws-deploy.sh:14-16`).

Nothing in the repo declares infrastructure as versioned, reviewable
resources: no Terraform, no CDK, no SAM, no CloudFormation template. Every
change to what AWS resources exist is a hand-edited bash script reviewed the
same way application code is, with no `plan`/`diff` preview of what the AWS
API calls will actually do against live state.

`PRD/sections/system-map.md` has no mention of RAG, embeddings, or a vector
store — the RAG-for-rules direction is external to this study's reference
set, not yet a tracked `DEC`/`REQ`.

## Recommendations

### iac-artifact-versioning — Enable S3 versioning on the Lambda artifact bucket — now

**Current -> Target:** `aws-bootstrap.sh` creates `thejudge-lambda-artifacts-<account>`
with a public-access block but no `put-bucket-versioning` call; every deploy
overwrites the same key (`lambda/lambda.zip`), so the previous deployed
artifact is gone the moment the next deploy lands. **Target:** turn on S3
versioning on that bucket (`aws s3api put-bucket-versioning
--versioning-configuration Status=Enabled`) so every `aws s3 cp` to the fixed
key creates a new, retrievable object version instead of destroying the old
one. **Gap:** one idempotent API call in `aws-bootstrap.sh`, next to the
existing `put-public-access-block` call on the same bucket — no change to
`aws-deploy.sh`'s deploy path or the fixed-key design `DEC-169` chose.
**Services/tradeoff:** S3 versioning itself is free; storage cost is the old
zip's size (currently well under 100MB) times however many prior versions a
lifecycle rule keeps — add an expiration rule (e.g. keep last 5 versions) to
bound that cost, which is also a one-time bootstrap addition. Payoff: instant
rollback via `update-function-code --s3-bucket ... --s3-key ... --s3-object-version
<id>` without the full `git revert` -> push -> quality-gate -> rebuild
round-trip `docs/aws/operations.md` currently documents as the only rollback
path. **Risk:** low. This is additive to an already-existing bucket the S3
staging work just created — no new resource, no new IAM grant (the deploy
role already has `s3:PutObject`/`s3:GetObject` on that bucket), and no
change to the fixed-key deploy contract the merge-gate test locks in.

### iac-cdk-migration — Move bootstrap/deploy off imperative bash onto CDK (TypeScript) — with-rag

**Current -> Target:** `aws-bootstrap.sh` is 478 lines of hand-rolled
idempotency — a `head-bucket`/`get-role`/`get-function` existence check
before every `create-*` call, and CloudFront/OAC resources looked up by
string-matching `Comment`/`Name` in a `list-*` call rather than a stored ID.
There is no state file, no `plan`/`diff` preview, and no drift detection —
what AWS actually has can only be inspected by rerunning those same lookup
queries by hand. **Target:** a declarative IaC tool with a plan-before-apply
step reviewable in CI, replacing the two scripts' resource-creation logic
(the `npm run build` + `package-lambda.sh` + `aws s3 sync` steps stay
scripts; only the AWS resource lifecycle moves). **Gap:** the full 478+99
lines of bootstrap/deploy logic become IaC resource declarations, plus a new
state backend to stand up. **Services/tradeoff — three options weighed:**
**SAM** is narrowly serverless (Lambda, API Gateway, DynamoDB); it does not
naturally model the CloudFront distribution + OAC + S3 static site + GitHub
OIDC provider + AWS Budget this bootstrap also creates, so SAM alone would
still leave those in bash or a second tool — not a fit for the whole stack.
**Terraform** is the most widely known and cloud-agnostic, with a mature AWS
provider and a real `plan`/`apply` workflow, but it is a new language (HCL)
and toolchain in an all-TypeScript repo, and it needs its own state backend
(an S3 bucket + DynamoDB lock table) bootstrapped before it can bootstrap
anything else — one more bootstrap-of-the-bootstrap step. **AWS CDK
(TypeScript)** stays in the same language as the Lambda handler and every
build/test script already in this repo, so it can live in an
`apps/infra`-style npm workspace using the tooling already in place
(`npm ci`, `tsc`, the existing `quality-check.yml` job structure); it
synthesizes to CloudFormation, so the state backend is AWS-managed with
no separate bucket/lock-table to stand up, and `cdk diff` gives the
plan-preview Terraform would via `plan`. Recommendation: CDK TypeScript, on
fit with the existing all-TS stack, not because Terraform is worse in the
abstract. **Risk:** this is a rewrite of working, tested (`deploy-lambda-s3-staging.test.mjs`)
deploy logic — real regression risk during the cutover, and CloudFormation's
own quirks (slower rollback on some resource replacements, drift detected
only on-demand via `aws cloudformation detect-stack-drift`, not continuously)
are a real cost, not a free upgrade. Sequencing note: RAG will add a vector
store, its IAM grants, and possibly a new data bucket — each one more
copy-pasted existence-check block if bash stays the tool. That's the forcing
function for `with-rag` rather than `now`: land this before RAG's resources
get bolted onto the same imperative script, not after.

### iac-env-separation — Add a dev/staging environment, separate from prod — with-rag

**Current -> Target:** every resource name is unparameterized by
environment (`$app_name-web-$account_id`, `thejudge-api`, fixed CloudFront
`Comment`), and the GitHub OIDC trust policy in `aws-bootstrap.sh` is scoped
to exactly `repo:$github_repo:ref:refs/heads/main` — there is no branch,
tag, or environment condition that could authorize a second deploy target
without hand-editing that trust policy. Today, dev iteration against a live
stack means either testing against prod directly or manually re-running the
bootstrap with overridden `APP_NAME`/`AWS_S3_BUCKET`/etc. env vars — nothing
in the scripts or docs describes that as a supported flow. **Target:** a
stage-parameterized environment (CDK stages, or Terraform workspaces) that
can stand up a `thejudge-dev` stack alongside `thejudge` prod, with its own
OIDC trust condition (e.g. `ref:refs/heads/dev` or a GitHub Environments
`environment:` claim) so a non-`main` branch can deploy to it without
touching the prod role. **Gap:** today there is exactly one deployable
target; this adds a second, parallel one plus the trust-policy plumbing to
reach it safely. **Services/tradeoff:** no new AWS service — this is
re-parameterizing what already exists (Lambda, S3, CloudFront, IAM) per
environment, which roughly doubles the always-on-adjacent cost surface
(CloudFront distributions and S3 buckets are cheap-to-free at low traffic;
the Lambda itself is scale-to-zero either way). The real cost is
operational: two stacks to keep in sync, two OIDC trust conditions to
maintain, twice the bootstrap surface if it stays bash — another reason this
pairs with `iac-cdk-migration` rather than standing alone. **Risk:** low
technical risk, but scope creep risk — do not build this speculatively.
**Verdict rationale:** RAG is what actually creates the need: retrieval
quality tuning (chunking, embedding model choice, hybrid-scoring weights)
needs a place to iterate against a live vector store and Lambda without
touching the prod OpenAI key, prod concurrency cap, or the prod Function URL
real users hit. No such need exists for the current keyword-scoring
retrieval, which is why this is `with-rag` and not `now`.

### iac-vector-store-cost-fit — Pick RAG's vector store against this stack's scale-to-zero posture before it lands — with-rag

**Current -> Target:** the whole stack is built to be idle-cost-near-zero —
Lambda (pay-per-invocation), CloudFront/S3 (pay-per-request/storage), a $5/mo
AWS Budget with an 80%-threshold email alert as the explicit cost guardrail
(`aws-bootstrap.sh`'s `NOTIFICATION_EMAIL`/`BUDGET_LIMIT_USD` block,
`docs/aws/operations.md`'s "Checking cost" section). Rules retrieval today
has zero marginal infrastructure cost beyond the Lambda itself — it's JSON
already bundled in the deployment package. **Target:** whichever vector
store RAG adopts should preserve that scale-to-zero property rather than
introduce an always-on charge that the $5/mo budget was never sized for.
**Gap:** this is a decision the RAG design work must make, not something the
current pipeline has an opinion on yet — flagging it here because bootstrap
complexity and cost posture are exactly what this concern-area tracks.
**Services/tradeoff:** **RDS + pgvector** (or any self-managed instance-based
vector DB) is the worst fit — it bills per hour whether queried or not,
directly contradicting the scale-to-zero pattern every other piece of this
stack follows. **Amazon OpenSearch Serverless** (vector engine / k-NN) is
AWS-native and does scale down, but has a documented non-zero OCU (OpenSearch
Compute Unit) floor even at rest — cheaper than a provisioned cluster, not
free at idle. **Amazon S3 Vectors** is the newest AWS-native option,
S3-backed and priced like S3 (storage + request), which is the closest
philosophical match to how this stack already treats S3 (the frontend
bucket, the artifact bucket) — worth evaluating first on cost grounds.
**A managed external vector API** (e.g. Pinecone) sidesteps new AWS IAM
surface entirely and mirrors the pattern this repo already uses for the
OpenAI key: an API key in SSM SecureString, read at cold start, with a
scoped `ssm:GetParameter`/`kms:Decrypt` inline policy identical in shape to
the existing `thejudge-openai-secret` policy in `aws-bootstrap.sh` — lowest
bootstrap-complexity delta of the four options, at the cost of a second
external vendor dependency. **Risk:** picking this after RAG's design is
already committed elsewhere risks inheriting an always-on cost the current
$5/mo budget guardrail can't absorb; flagging it now so the choice is made
with this pipeline's cost posture in view.

### iac-plan-diff-visibility — Require a plan/diff preview on infra changes before merge — later

**Current -> Target:** an edit to `aws-bootstrap.sh` or `aws-deploy.sh` today
is reviewed as a plain code diff — nothing in `quality-check.yml` shows a
reviewer what AWS API calls that edit will actually make against live
resources (e.g. does a CloudFront config change replace the distribution or
update it in place?). Contrast with the CloudFront distribution JSON block
inline in `aws-bootstrap.sh` (`Origins`, `DefaultCacheBehavior`,
`CustomErrorResponses`) — a typo there is only caught by running the script.
**Target:** once `iac-cdk-migration` lands, add a CI job that runs `cdk diff`
(or `terraform plan`) on pull requests touching the infra package and posts
the resource-level diff for review — the same kind of pre-merge signal
`deploy-lambda-s3-staging.test.mjs` and `lambda-package-budget.test.mjs`
already give the deploy path, extended to infrastructure changes themselves.
**Gap:** no such job exists, and cannot exist meaningfully until there is a
declarative tool to diff against — this recommendation is downstream of
`iac-cdk-migration`, not independent of it. **Services/tradeoff:** the
diff/plan step itself needs read-only AWS credentials in a PR-scoped GitHub
Actions job — narrower than the existing job-scoped `id-token: write` the
`deploy` job already restricts to pushes on `main` (this doc's read of
`quality-check.yml:210-214` confirms that scoping exists today for the
apply step; a plan-only job would need its own, read-only OIDC role).
**Risk:** none beyond ordinary CI job maintenance once the IaC tool exists.
**Verdict rationale:** `later`, not `with-rag` — there's no forcing function
distinct from the IaC migration itself; this is the natural next increment
once that lands, worth recording now so it isn't lost, not worth sequencing
ahead of RAG.

## Open questions

- Vector store choice (`iac-vector-store-cost-fit`) is a RAG-design decision
  this study can surface cost/IAM tradeoffs for for but not make — it depends
  on retrieval-quality requirements (hybrid search? re-ranking?) that sit
  outside this concern-area.
- Whether dev/staging (`iac-env-separation`) should be a second AWS account
  (via AWS Organizations, stronger blast-radius isolation) or a second stack
  in the same account (cheaper, faster to stand up, weaker isolation) is an
  owner call this study did not have grounds to make — nothing in the repo
  states an account-boundary policy today.
- Terraform vs CDK (`iac-cdk-migration`) is a recommendation, not a settled
  decision — if there's an existing team preference or prior Terraform
  investment outside this repo, that should override the all-TS-stack
  argument made here.
