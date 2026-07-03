# Slice E — Durable operator docs (`docs/aws/`)

## Status: planned

## Goal

Write durable documentation so the owner can deploy, monitor, secure, and troubleshoot the live app on an ongoing basis, and link it from the root README. These docs survive after the ephemeral `work/` folder is deleted.

## Requirements

- Create three docs under `docs/aws/` describing the **final** state after Slices B/C/D (hence the dependency).
- Link them from the root README "Operational References" section.
- Docs must be accurate to the scripts/workflow as shipped (no aspirational steps).

## Files touched

- `docs/aws/deployment.md` (new)
- `docs/aws/operations.md` (new)
- `docs/aws/secrets.md` (new)
- `README.md` (Operational References link)

## Content requirements

### `docs/aws/deployment.md`
- Architecture overview + ASCII diagram (CloudFront + S3, Lambda + Function URL, GitHub Actions/OIDC).
- One-time bootstrap: prerequisites (AWS account, CLI admin auth, `AWS_ACCOUNT_ID` repo variable, OpenAI key), then `bash scripts/aws-bootstrap.sh`.
- How ongoing deploys work (push to `main` → `quality:check` gate → OIDC → `aws-deploy.sh`).
- Where the AWS-provided URLs come from (CloudFront domain, Lambda Function URL) and that no custom domain is used yet.

### `docs/aws/operations.md` (day-2 runbook)
- Reading logs: CloudWatch Logs group for `thejudge-api`.
- Rotating the OpenAI key: `aws ssm put-parameter --overwrite ...` + force a new cold start.
- Checking cost: AWS Budgets alert, Cost Explorer, and the OpenAI usage dashboard.
- Scale cap: reserved concurrency meaning + how to adjust.
- Rollback: `git revert` the bad commit on `main` (or reset to a known-good SHA) and let the push-to-main pipeline rebuild and redeploy — the same automated path as a normal deploy, so no orphaned/retained Lambda artifact is required. Note that deploys are build-from-source, not versioned artifacts.
- Teardown: delete Lambda, Function URL, S3 bucket, CloudFront distribution, IAM roles, OIDC provider, budget.

### `docs/aws/secrets.md`
- What may live in Git vs. not (non-secrets in env blocks; `OPENAI_API_KEY` only in SSM SecureString).
- The SSM SecureString approach + cold-start read; setting the value: `aws ssm put-parameter --name /thejudge/openai-api-key --type SecureString --value <key>`.
- Why GitHub needs **no** AWS keys (OIDC federation) and the deploy role's scoped permissions.
- Required GitHub Actions repository variable: `AWS_ACCOUNT_ID`.

## Acceptance criteria

- [ ] `docs/aws/deployment.md`, `docs/aws/operations.md`, `docs/aws/secrets.md` exist with every section listed above
- [ ] Root README "Operational References" links to `docs/aws/` (deployment, operations, secrets)
- [ ] No secret values appear in any doc (only parameter names / commands)
- [ ] `npm run format:check` passes (docs formatting)
- [ ] Every command shown matches the actual script/env names shipped in Slices B–D (spot-check names: `thejudge-api`, `/thejudge/openai-api-key`, `AWS_ACCOUNT_ID`, `RESERVED_CONCURRENCY`)

## Verification

```bash
ls docs/aws/deployment.md docs/aws/operations.md docs/aws/secrets.md
grep -n "docs/aws" README.md
grep -rniE "sk-[a-z0-9]{20,}" docs/aws/ && echo "FAIL: secret in docs" || echo "OK: no secrets"
npm run format:check
```
