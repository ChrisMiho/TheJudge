# Slice D — Cost & scale guardrails

## Status: planned

## Goal

Bound how far AWS can scale the app up (so a public URL can't generate runaway compute cost) and add cost visibility, matching the owner's risk posture (prepaid OpenAI credits are the AI-side backstop).

## Requirements

- **Scale cap (AWS side):** `aws-bootstrap.sh` sets Lambda **reserved concurrency** to a low ceiling (env `RESERVED_CONCURRENCY`, default `5`). Excess traffic throttles (429) instead of scaling to thousands of concurrent executions.
- **Cost visibility/alert:** create an **AWS Budgets** monthly cost budget with an email alert at a low threshold (env `BUDGET_LIMIT_USD`, default `5`; `NOTIFICATION_EMAIL` subscriber). If `NOTIFICATION_EMAIL` is unset, skip creation and print a documented manual fallback rather than failing.
- **Confirm existing cap:** CloudFront stays `PriceClass_100` (already in the distribution config) — no change, just asserted.
- No product/runtime code change; this is bootstrap + docs only.

## Files touched

- `scripts/aws-bootstrap.sh`
- (docs) `docs/aws/operations.md` — monitoring section (authored in Slice E)

## Changes

### `scripts/aws-bootstrap.sh`

- After the Lambda function exists:
  ```bash
  aws lambda put-function-concurrency \
    --function-name "$lambda_name" \
    --reserved-concurrent-executions "${RESERVED_CONCURRENCY:-5}" \
    --region "$aws_region" >/dev/null
  ```
- Budget (guarded on `NOTIFICATION_EMAIL`): write a `budget.json` + `notifications-with-subscribers.json` and call `aws budgets create-budget`, or print the manual console steps when the email is unset.
- Assert the distribution config keeps `"PriceClass": "PriceClass_100"` (unchanged).

## Acceptance criteria

- [ ] `aws-bootstrap.sh` contains `put-function-concurrency` using `RESERVED_CONCURRENCY` (default 5)
- [ ] After bootstrap, `aws lambda get-function-concurrency --function-name thejudge-api` returns the configured ceiling
- [ ] Budget creation is guarded on `NOTIFICATION_EMAIL`; when set, `aws budgets describe-budgets --account-id <id>` lists the budget; when unset, the script prints the manual fallback and does not fail
- [ ] CloudFront distribution `PriceClass` remains `PriceClass_100`
- [ ] `bash -n scripts/aws-bootstrap.sh` reports no syntax errors

## Verification

```bash
grep -n "put-function-concurrency\|RESERVED_CONCURRENCY" scripts/aws-bootstrap.sh
grep -n "create-budget\|NOTIFICATION_EMAIL\|PriceClass_100" scripts/aws-bootstrap.sh
bash -n scripts/aws-bootstrap.sh
# Post-bootstrap (Slice F), against the live account:
# aws lambda get-function-concurrency --function-name thejudge-api --region us-east-1
# aws budgets describe-budgets --account-id "$AWS_ACCOUNT_ID"
```
