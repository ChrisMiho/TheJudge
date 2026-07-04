# Slice F — First live deployment + verification

## Status: done

## Goal

Execute the first production deployment to the owner's new AWS account and verify the live app answers via **real OpenAI** on the AWS-provided URLs, with all guardrails confirmed. Requires the AWS account and admin credentials (human-in-the-loop).

## Requirements

- Bootstrap the account, set the secret out-of-band, flip to `openai`, deploy, and verify end-to-end.
- No custom domain — record and use the default CloudFront + Function URL URLs.

## Ordered runbook

**Key-first ordering:** the SSM SecureString is set *before* bootstrap, so every cold start already has the key and the provider is `openai` from the very first deploy — there is no mock-in-prod stage and no throwing window. (`readServerConfig` throws when `ASK_AI_PROVIDER=openai` and the key/model are absent — `apps/backend/src/config/index.ts:84` — so the key must exist before any `openai` cold start.)

1. **Prereqs:** **Slice 0 complete** — IAM Identity Center (SSO) admin access set up and the `thejudge-admin` CLI profile resolves ([slice-0](./slice-0-owner-sso-setup.md)). Every step below (SSM, bootstrap, verify) runs against the default credential chain, so before proceeding: `export AWS_PROFILE=thejudge-admin` (re-login with `aws sso login --profile thejudge-admin` if the token has expired) and confirm `aws sts get-caller-identity` returns the account ID. Also: GitHub repo variable `AWS_ACCOUNT_ID` set (to that same ID); OpenAI API key on hand.
2. **Set secret first:** `aws ssm put-parameter --name /thejudge/openai-api-key --type SecureString --value <key> --region us-east-1`. The `aws/ssm` KMS key auto-provisions on first SecureString use, so this needs no prior bootstrap.
3. **Bootstrap:** `AWS_ACCOUNT_ID=<id> NOTIFICATION_EMAIL=<email> bash scripts/aws-bootstrap.sh` — creates S3/CloudFront/OAC, Lambda + Function URL, IAM (Lambda exec role with `ssm:GetParameter`+`kms:Decrypt`, GitHub OIDC deploy role), reserved concurrency, budget. Env is `ASK_AI_PROVIDER=openai`; the key set in step 2 is already readable, so the first cold start comes up live on OpenAI.
4. **Deploy (primary path — automated):** merge/push to `main` to run `deploy-aws.yml` — `quality:check` gate → OIDC AssumeRole → `aws-deploy.sh`. This is the path used for every deploy going forward, so exercising it now proves the pipeline end-to-end (including GitHub→AWS OIDC). **Fallback:** `AWS_ACCOUNT_ID=<id> bash scripts/aws-deploy.sh` locally if the account isn't ready for a `main` push yet.
5. **Verify** (acceptance criteria below), including confirming the push-to-main run went green.
6. **Record URLs** in `docs/aws/deployment.md`.

## Acceptance criteria

- [ ] `curl -s <function-url>/api/health` returns HTTP 200
- [ ] `POST <function-url>/api/ask-ai` with a sample stack + question returns a **real OpenAI answer** (distinguishable from the mock canned response)
- [ ] The CloudFront URL serves the SPA and a full ask flow completes end-to-end in the browser
- [ ] `aws lambda get-function-configuration --function-name thejudge-api` shows env vars **without** `OPENAI_API_KEY` (only `OPENAI_API_KEY_SSM_PARAM` + non-secrets)
- [ ] `aws lambda get-function-concurrency --function-name thejudge-api` returns the configured reserved-concurrency ceiling — **N/A on this account:** the new account launched with the default Lambda concurrency limit of 10, so reserving any would drop the unreserved pool below AWS's required 10. Bootstrap now skips reserved concurrency gracefully; the account-wide limit of 10 is the effective cap. Follow-up after a Service Quotas increase: `aws lambda put-function-concurrency --function-name thejudge-api --reserved-concurrent-executions 5 --region us-east-1`
- [ ] `aws budgets describe-budgets --account-id <id>` lists the budget with an email alert (or the documented manual budget exists)
- [ ] A push to `main` runs `quality:check` first and only deploys when green
- [ ] `git grep -nE "[0-9]{12}|sk-[A-Za-z0-9]{20,}"` finds no committed account ID or key

## Verification

```bash
FN_URL="<function-url>"
curl -s -o /dev/null -w "%{http_code}\n" "$FN_URL/api/health"
curl -s -X POST "$FN_URL/api/ask-ai" -H 'content-type: application/json' \
  -d '{"question":"Does my counterspell resolve first?","stack":[/* sample */]}' | head
aws lambda get-function-configuration --function-name thejudge-api --region us-east-1 \
  --query 'Environment.Variables' --output json
aws lambda get-function-concurrency --function-name thejudge-api --region us-east-1
```

## First-deploy results (2026-07-03)

- **Frontend:** https://d36yuv4ycof5gd.cloudfront.net (CloudFront Deployed, serves the SPA, HTTP 200)
- **API:** https://24yhnhknx5sc24cvtb7szdz76q0uruif.lambda-url.us-east-1.on.aws
- `/api/health` → 200 `{"ok":true}`; `/api/ask-ai` → real OpenAI answer (cited CR 608.2b, ~10s), provider `openai`
- Lambda env carries `OPENAI_API_KEY_SSM_PARAM` only — **no** `OPENAI_API_KEY`; key read from SSM at cold start
- Budget `thejudge-monthly` ($5/mo, alert 80% → owner email) created
- Reserved concurrency skipped (account limit 10 — see acceptance note); account cap is the guard
- Bootstrap ran key-first (SSM SecureString set before bootstrap); `AWS_ACCOUNT_ID` in GitHub repo variable, not committed
- Small supporting change: `scripts/aws-bootstrap.sh` now skips reserved concurrency when the account limit can't accommodate it (forced by the fresh-account 10-concurrency default)

## PRD promotion checklist (execute in cleanup)

- [ ] (Optional) add a DEC recording the AWS serverless deployment target + `openai`-in-prod to the relevant `sections/decisions/<domain>.md` + router index (DEC-020/DEC-080 already permit it; promote only if durable truth is wanted)
- [ ] Confirm root README "Operational References" links to `docs/aws/` (from Slice E) are retained
- [ ] Update PRD README "Active work packages" — remove the `aws-deployment-onboarding` row on cleanup
- [ ] Write cleanup receipt at `PRD/instructions/receipts/aws-deployment-onboarding-<YYYY-MM-DD>.md`
- [ ] Delete `PRD/work/aws-deployment-onboarding/`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged (no product/API/prompt/stack change)
- [ ] No secrets committed (key only in SSM; account ID only in repo variable)
- [ ] Durable outcomes promoted (`docs/aws/` shipped); `PRD/work/aws-deployment-onboarding/` ready to delete
