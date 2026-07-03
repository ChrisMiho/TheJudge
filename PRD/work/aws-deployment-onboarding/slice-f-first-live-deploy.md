# Slice F — First live deployment + verification

## Status: planned

## Goal

Execute the first production deployment to the owner's new AWS account and verify the live app answers via **real OpenAI** on the AWS-provided URLs, with all guardrails confirmed. Requires the AWS account and admin credentials (human-in-the-loop).

## Requirements

- Bootstrap the account, set the secret out-of-band, flip to `openai`, deploy, and verify end-to-end.
- No custom domain — record and use the default CloudFront + Function URL URLs.

## Ordered runbook

**Key-first ordering:** the SSM SecureString is set *before* bootstrap, so every cold start already has the key and the provider is `openai` from the very first deploy — there is no mock-in-prod stage and no throwing window. (`readServerConfig` throws when `ASK_AI_PROVIDER=openai` and the key/model are absent — `apps/backend/src/config/index.ts:84` — so the key must exist before any `openai` cold start.)

1. **Prereqs:** AWS account created; **AWS CLI installed and configured with admin credentials for that account** — every step below (SSM, bootstrap, verify) runs against the default credential chain, so this must be done first:
   - Install (macOS): `brew install awscli`; confirm with `aws --version`.
   - Configure credentials for the new account — either `aws configure` (access key/secret + default region `us-east-1`) or `aws configure sso` if using IAM Identity Center.
   - **Verify it resolves before continuing:** `aws sts get-caller-identity` must return the new account's ID (this is the ID you also put in the GitHub repo variable below).
   - Then: GitHub repo variable `AWS_ACCOUNT_ID` set (to that same ID); OpenAI API key on hand.
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
- [ ] `aws lambda get-function-concurrency --function-name thejudge-api` returns the configured reserved-concurrency ceiling
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
