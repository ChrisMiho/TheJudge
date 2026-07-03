# AWS Deployment

How TheJudge is deployed to AWS: a serverless, scale-to-zero backend plus a
static frontend behind a CDN, deployed from GitHub Actions with no static AWS
keys. No custom domain — the app is served on the AWS-provided CloudFront and
Lambda Function URLs.

See also: [operations.md](./operations.md) (day-2 runbook) and
[secrets.md](./secrets.md) (what lives where, and why GitHub needs no AWS keys).

## Architecture

```
Browser
  |
  v
CloudFront (https://<dist>.cloudfront.net)      <-- PriceClass_100, OAC
  |  static SPA                                     403/404 -> index.html
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

Deploy path:
GitHub push to main
  -> .github/workflows/deploy-aws.yml
     -> quality:check gate (typecheck + lint + format + test + coverage)
     -> OIDC AssumeRole (thejudge-github-deploy, no static keys)
     -> scripts/aws-deploy.sh
        -> package + update Lambda code + non-secret env
        -> build frontend + s3 sync + CloudFront invalidation
```

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
   (`thejudge-github-deploy`). The Lambda env is set to `ASK_AI_PROVIDER=openai`;
   the key from step 1 is already readable, so the first cold start comes up
   live.

   Tunable env overrides: `AWS_REGION` (default `us-east-1`), `APP_NAME`,
   `RESERVED_CONCURRENCY`, `BUDGET_LIMIT_USD`, `NOTIFICATION_EMAIL`,
   `OPENAI_MODEL`, `OPENAI_API_KEY_SSM_PARAM`. If `NOTIFICATION_EMAIL` is unset
   the budget step is skipped with a printed manual fallback.

## How ongoing deploys work

Deploys are **build-from-source**, triggered by a push to `main`:

1. `.github/workflows/deploy-aws.yml` runs on push to `main`.
2. The **quality gate** (`npm run quality:check`) runs first; a red build blocks
   the deploy.
3. GitHub assumes the `thejudge-github-deploy` role via OIDC (no static keys).
4. `scripts/aws-deploy.sh` packages the Lambda, updates the function code and the
   **non-secret** env block, rebuilds the frontend (with `VITE_API_URL` pointed
   at the Function URL), syncs it to S3, and invalidates CloudFront.

The OpenAI key is never touched by a deploy — it is read from SSM at cold start,
so redeploys never clobber it. Running `scripts/aws-deploy.sh` locally (with
`AWS_ACCOUNT_ID` exported) is a supported fallback when a `main` push isn't
appropriate yet.

## Where the URLs come from

No custom domain is configured. Two AWS-provided URLs:

- **Frontend:** the CloudFront distribution domain,
  `https://<dist>.cloudfront.net`. Find it with:
  `aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='thejudge-web'].DomainName | [0]" --output text`
- **API:** the Lambda Function URL,
  `https://<id>.lambda-url.us-east-1.on.aws`. Find it with:
  `aws lambda get-function-url-config --function-name thejudge-api --query FunctionUrl --output text --region us-east-1`

Both `aws-bootstrap.sh` and `aws-deploy.sh` print these on completion.

### Live URLs (first deploy — 2026-07-03)

- **Frontend:** https://d36yuv4ycof5gd.cloudfront.net
- **API:** https://24yhnhknx5sc24cvtb7szdz76q0uruif.lambda-url.us-east-1.on.aws

> **Reserved concurrency note:** the account launched with the default Lambda
> concurrency limit of **10**, so `aws-bootstrap.sh` skips setting reserved
> concurrency (reserving any would drop the unreserved pool below AWS's required
> 10). The account-wide limit of 10 is the effective parallelism cap for now.
> After a Service Quotas increase for Lambda "Concurrent executions", set the
> intended ceiling:
> `aws lambda put-function-concurrency --function-name thejudge-api --reserved-concurrent-executions 5 --region us-east-1`
