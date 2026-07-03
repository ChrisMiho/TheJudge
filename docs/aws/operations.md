# AWS Operations Runbook

Day-2 operations for the live app: reading logs, rotating the OpenAI key,
watching cost, adjusting the scale cap, rolling back, and tearing down. All
commands assume admin credentials (`export AWS_PROFILE=thejudge-admin`) and
`--region us-east-1` unless noted.

See also: [deployment.md](./deployment.md) and [secrets.md](./secrets.md).

## Reading logs

The Lambda writes to CloudWatch Logs group `/aws/lambda/thejudge-api`.

```bash
# Tail live logs
aws logs tail /aws/lambda/thejudge-api --follow --region us-east-1

# Last 30 minutes
aws logs tail /aws/lambda/thejudge-api --since 30m --region us-east-1
```

The app logs structured JSON (pino). The `backend.startup` event shows the
resolved config, including `askAiProvider` — expect `"openai"` in production.
Provider failures log as `ask_ai.response_failure` with a `code` and `status`.

## Rotating the OpenAI key

The key lives only in SSM (`/thejudge/openai-api-key`). Rotate it in place:

```bash
aws ssm put-parameter \
  --name /thejudge/openai-api-key \
  --type SecureString \
  --value <new-openai-key> \
  --overwrite \
  --region us-east-1
```

The key is read **at cold start**, so force new containers to pick it up —
either wait for existing warm containers to recycle, or force it immediately by
publishing a no-op config change:

```bash
# Force a cold start now (harmless env re-set)
aws lambda update-function-configuration \
  --function-name thejudge-api \
  --description "rotate key $(date -u +%FT%TZ)" \
  --region us-east-1
```

## Checking cost

Three levers, cheapest-first posture:

- **AWS Budgets** — a monthly cost budget (`thejudge-monthly`, default `$5`)
  emails `NOTIFICATION_EMAIL` at 80% of the limit. List it:
  `aws budgets describe-budgets --account-id <id>`.
- **Cost Explorer / Billing console** — Billing -> Cost Explorer for a
  breakdown by service (Lambda, CloudFront, S3, KMS). Most of this stack is
  scale-to-zero or free-tier.
- **OpenAI usage dashboard** — the AI-side spend is separate from AWS. Watch it
  at <https://platform.openai.com/usage>. Prepaid credits with **no auto-renew**
  are the backstop: spend simply stops when credits run out.

## Scale cap (reserved concurrency)

The Function URL is public with no auth, so the Lambda is capped at
`RESERVED_CONCURRENCY` (default `5`) parallel executions — excess requests
throttle with `429` instead of scaling to thousands. Check / adjust:

```bash
aws lambda get-function-concurrency --function-name thejudge-api --region us-east-1

aws lambda put-function-concurrency \
  --function-name thejudge-api \
  --reserved-concurrent-executions 5 \
  --region us-east-1
```

Raise it only if you understand the compute-cost and OpenAI-spend implications.

## Rollback

Deploys are **build-from-source**, not versioned artifacts, so rolling back is a
source operation that flows through the same automated pipeline:

```bash
# Revert the bad commit and let push-to-main rebuild + redeploy
git revert <bad-sha>
git push origin main
# or reset main to a known-good SHA and force-push, if appropriate
```

The `deploy-aws.yml` gate runs `quality:check` and redeploys the reverted state.
No orphaned/retained Lambda artifact is needed — the previous good source is the
rollback target.

## Teardown

Remove everything the bootstrap created (order matters for dependencies):

```bash
ACCOUNT_ID=<id>

# Lambda + Function URL
aws lambda delete-function-url-config --function-name thejudge-api --region us-east-1
aws lambda delete-function --function-name thejudge-api --region us-east-1

# CloudFront: disable, wait for Deployed, then delete (needs the ETag)
#   aws cloudfront get-distribution-config --id <dist-id>
#   ...set Enabled=false, update-distribution, wait, then:
#   aws cloudfront delete-distribution --id <dist-id> --if-match <etag>

# S3 (empty then remove)
aws s3 rm "s3://thejudge-web-$ACCOUNT_ID" --recursive
aws s3api delete-bucket --bucket "thejudge-web-$ACCOUNT_ID" --region us-east-1

# IAM roles (detach/delete inline + managed policies first)
aws iam delete-role-policy --role-name thejudge-lambda-exec --policy-name thejudge-openai-secret
aws iam detach-role-policy --role-name thejudge-lambda-exec \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name thejudge-lambda-exec
aws iam delete-role-policy --role-name thejudge-github-deploy --policy-name thejudge-deploy-policy
aws iam delete-role --role-name thejudge-github-deploy

# GitHub OIDC provider
aws iam delete-open-id-connect-provider \
  --open-id-connect-provider-arn "arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"

# Budget + SSM key
aws budgets delete-budget --account-id "$ACCOUNT_ID" --budget-name thejudge-monthly
aws ssm delete-parameter --name /thejudge/openai-api-key --region us-east-1
```
