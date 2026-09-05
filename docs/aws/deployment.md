# AWS Deployment

How TheJudge is deployed to AWS: a serverless, scale-to-zero backend plus a
static frontend behind a CDN, deployed from GitHub Actions with no static AWS
keys. Players reach the app at **https://mtgjude.gg**, a custom domain on the
CloudFront distribution (DEC-084); the API stays on its AWS-provided Lambda
Function URL.

See also: [operations.md](./operations.md) (day-2 runbook) and
[secrets.md](./secrets.md) (what lives where, and why GitHub needs no AWS keys).

## Architecture

```
Browser  https://mtgjude.gg
  |
  v
Route 53 hosted zone  mtgjude.gg                 <-- A + AAAA alias records
  |                                                  for apex and www
  v
CloudFront (aliases mtgjude.gg + www, ACM cert)   <-- PriceClass_100, OAC
  |  viewer-request fn: host != apex -> 301 apex     403/404 -> index.html
  |  static SPA
  v
Private S3 bucket  thejudge-web-<account>        <-- public access blocked
                   (built frontend; VITE_API_URL baked to the Function URL)

Browser  --POST /api/ask-ai, GET /api/health-->
  |
  v
Lambda Function URL (https://<id>.lambda-url.us-east-1.on.aws)   auth NONE
  |                                             reserved concurrency = 5
  v
Lambda  thejudge-api  (nodejs24.x, arm64, 512 MB, 20 s)
        handler: apps/backend/dist/lambda.handler
        cold start: read OPENAI_API_KEY from SSM SecureString -> process.env
        -> createConfiguredApp() -> Express app (same routes as local dev)
        -> ASK_AI_PROVIDER=openai -> OpenAI Responses API

Private S3 bucket  thejudge-lambda-artifacts-<account>   <-- public access
                   blocked, no CloudFront origin, deploy staging only
                   (dist/lambda.zip, fixed key, overwritten every deploy)

Deploy path:
GitHub push to main
  -> .github/workflows/quality-check.yml (deploy job)
     -> quality:check gate (typecheck + lint + format + test + coverage)
     -> OIDC AssumeRole (thejudge-github-deploy, no static keys)
     -> scripts/aws-deploy.sh
        -> package Lambda zip
        -> aws s3 cp -> thejudge-lambda-artifacts-<account> (S3-staged upload)
        -> update-function-code --s3-bucket/--s3-key + non-secret env
           (FRONTEND_ORIGIN = the distribution's alias, read live)
        -> build frontend + s3 sync + CloudFront invalidation
```

### Custom domain

The frontend bucket is private and readable only by CloudFront, so the domain
points at the distribution, never at the bucket. `scripts/aws-bootstrap.sh`
attaches it in five idempotent steps (`FRONTEND_DOMAIN`, default `mtgjude.gg`;
set it empty to skip):

1. An ACM certificate covering the apex **and** `www.`, requested in
   **us-east-1** (the only region CloudFront accepts certificates from),
   DNS-validated. An existing certificate is reused only if it covers both.
2. The two validation CNAMEs written to the domain's Route 53 hosted zone,
   then `aws acm wait certificate-validated` (usually a few minutes).
3. The redirect CloudFront Function (`thejudge-redirect-to-apex`,
   cloudfront-js-2.0) created or updated and published. Its source comes from
   `scripts/lib/cloudfront-custom-domain.mjs`: any host other than the apex
   gets a `301` to `https://mtgjude.gg` with the path and query kept.
4. Both aliases, the certificate and the function set on the distribution —
   the transform lives in the same module (unit-tested), the update is
   ETag-guarded, and a distribution that already has all three is left alone.
5. A and AAAA alias records for the apex and for `www.` pointing at the
   distribution.

The backend allows exactly **one** browser origin (`FRONTEND_ORIGIN` → CORS),
which is why exactly one name runs the app: `www.mtgjude.gg` and the old
`*.cloudfront.net` URL both redirect to the apex instead of serving it.
Nothing stores the domain a second time: `scripts/aws-deploy.sh` reads the
apex alias (never the `www.` one) back off the live distribution on every
deploy and uses it as `FRONTEND_ORIGIN`, falling back to the CloudFront
hostname only when no alias is attached.
`scripts/frontend-origin-source.test.mjs` pins both scripts to these rules.

### S3-staged Lambda deploy

`update-function-code --s3-bucket`/`--s3-key` reads the package from S3
instead of accepting it inline as a base64-encoded request body. That raises
the effective package ceiling from the ~50MB a direct `--zip-file` upload
tops out at to Lambda's real 250MB unzipped deployment-package quota. The
artifact bucket is private, has no CloudFront origin (it is never served to
browsers), and holds one fixed-key object overwritten on every deploy — no
per-deploy history, versioning, or lifecycle rule.
`scripts/lambda-package-budget.test.mjs` guards the real quota pre-merge.

## One-time bootstrap

The bootstrap is idempotent and run once, locally, with admin credentials.

### Prerequisites

- An AWS account, and admin CLI access to it. This repo's operator uses IAM
  Identity Center (SSO); sign in and export the profile before running:
  `aws sso login --profile thejudge-admin` then
  `export AWS_PROFILE=thejudge-admin`. Confirm with
  `aws sts get-caller-identity`.
- A GitHub Actions **repository variable** `AWS_ACCOUNT_ID` set to that account
  ID (Settings -> Secrets and variables -> Actions -> Variables). This is the
  only account-scoped value the workflow needs; it is never committed. See
  [secrets.md](./secrets.md).
- The OpenAI API key on hand (stored in SSM, never in Git — see below).
- A Route 53 hosted zone for the custom domain (`mtgjude.gg`, registered
  through Route 53 on 2026-09-05, which created the zone). The bootstrap
  fails early with a clear message if the zone is missing; run it with
  `FRONTEND_DOMAIN=` (empty) to stay on the CloudFront hostname instead.

### Steps

1. **Set the OpenAI key first** (key-first ordering, so the very first Lambda
   cold start is already live on OpenAI with no mock-in-prod stage):

   ```bash
   aws ssm put-parameter \
     --name /thejudge/openai-api-key \
     --type SecureString \
     --value <your-openai-key> \
     --region us-east-1
   ```

   The `aws/ssm` KMS key auto-provisions on first SecureString use, so this
   needs no prior setup.

2. **Run the bootstrap:**

   ```bash
   AWS_ACCOUNT_ID=<id> NOTIFICATION_EMAIL=<you@example.com> \
     bash scripts/aws-bootstrap.sh
   ```

   This creates, idempotently: the private S3 bucket + CloudFront distribution
   (OAC, `PriceClass_100`), the `thejudge-api` Lambda + public Function URL, the
   Lambda execution role (`thejudge-lambda-exec`, granted `ssm:GetParameter` +
   `kms:Decrypt` on the key), reserved concurrency (`RESERVED_CONCURRENCY`,
   default `5`), a monthly AWS Budget (`BUDGET_LIMIT_USD`, default `5`, alert to
   `NOTIFICATION_EMAIL`), and the GitHub OIDC provider + deploy role
   (`thejudge-github-deploy`), and the custom domain on the distribution (ACM
   certificate, Route 53 validation + alias records — see "Custom domain"
   above). The Lambda env is set to `ASK_AI_PROVIDER=openai` and
   `FRONTEND_ORIGIN=https://mtgjude.gg`; the key from step 1 is already
   readable, so the first cold start comes up live.

   Tunable env overrides: `AWS_REGION` (default `us-east-1`), `APP_NAME`,
   `FRONTEND_DOMAIN` (default `mtgjude.gg`, empty to skip), `RESERVED_CONCURRENCY`,
   `BUDGET_LIMIT_USD`, `NOTIFICATION_EMAIL`, `OPENAI_MODEL`,
   `OPENAI_API_KEY_SSM_PARAM`. If `NOTIFICATION_EMAIL` is unset the budget step
   is skipped with a printed manual fallback.

   Re-running the bootstrap on an already-provisioned account is the supported
   way to attach the domain after the fact: every earlier step is a no-op and
   the domain steps run.

## How ongoing deploys work

Deploys are **build-from-source**, triggered by a push to `main`:

1. The `deploy` job in `.github/workflows/quality-check.yml` runs on push to
   `main` (code changes only — see the change-detection step below).
2. The **quality gate** (`npm run quality:check`) runs first; a red build blocks
   the deploy.
3. GitHub assumes the `thejudge-github-deploy` role via OIDC (no static keys).
4. `scripts/aws-deploy.sh` packages the Lambda, stages the zip in the
   `thejudge-lambda-artifacts-<account>` S3 bucket, points
   `update-function-code` at that object, updates the **non-secret** env block
   (`FRONTEND_ORIGIN` from the distribution's live alias), rebuilds the
   frontend (with `VITE_API_URL` pointed at the Function URL), syncs it to S3,
   and invalidates CloudFront.

The OpenAI key is never touched by a deploy — it is read from SSM at cold start,
so redeploys never clobber it. Running `scripts/aws-deploy.sh` locally (with
`AWS_ACCOUNT_ID` exported) is a supported fallback when a `main` push isn't
appropriate yet.

## Where the URLs come from

- **Frontend:** `https://mtgjude.gg`, the alias on the CloudFront
  distribution (DEC-084). The underlying distribution hostname,
  `https://<dist>.cloudfront.net`, still resolves and is what the Route 53
  alias records point at. Find both with:
  `aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='thejudge-web'].[DomainName, Aliases.Items[0]]" --output text`
- **API:** the Lambda Function URL,
  `https://<id>.lambda-url.us-east-1.on.aws`. Find it with:
  `aws lambda get-function-url-config --function-name thejudge-api --query FunctionUrl --output text --region us-east-1`

Both `aws-bootstrap.sh` and `aws-deploy.sh` print these on completion.

### Live URLs

- **Frontend:** https://mtgjude.gg (domain attached 2026-09-05;
  https://www.mtgjude.gg and the first-deploy URL
  https://d36yuv4ycof5gd.cloudfront.net both redirect to it)
- **API:** https://24yhnhknx5sc24cvtb7szdz76q0uruif.lambda-url.us-east-1.on.aws

> **Reserved concurrency note:** the account launched with the default Lambda
> concurrency limit of **10**, so `aws-bootstrap.sh` skips setting reserved
> concurrency (reserving any would drop the unreserved pool below AWS's required
> 10). The account-wide limit of 10 is the effective parallelism cap for now.
> After a Service Quotas increase for Lambda "Concurrent executions", set the
> intended ceiling:
> `aws lambda put-function-concurrency --function-name thejudge-api --reserved-concurrent-executions 5 --region us-east-1`
