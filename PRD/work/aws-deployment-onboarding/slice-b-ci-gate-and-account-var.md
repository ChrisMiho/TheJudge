# Slice B — Deploy test gate + account ID → GitHub repo variable

## Status: planned

## Goal

Harden `deploy-aws.yml` so a red build cannot ship, and remove the hardcoded AWS account ID from committed files by sourcing it from a GitHub Actions repository variable.

## Requirements

- **Gap 3:** the workflow runs `npm run quality:check` (typecheck + lint + format + test + coverage) and must pass **before** the deploy step runs; a failing check blocks the deploy.
- **Secrets hygiene:** the 12-digit AWS account ID is no longer a committed literal. The workflow reads `${{ vars.AWS_ACCOUNT_ID }}`; the `role-to-assume` ARN and account-scoped names (S3 bucket) are constructed from it.
- Scripts stop embedding a specific account: `aws-bootstrap.sh` / `aws-deploy.sh` / `package-lambda.sh` **fail fast with a clear message** when `AWS_ACCOUNT_ID` is unset (rather than defaulting to a hardcoded account).

## Files touched

- `.github/workflows/deploy-aws.yml`
- `scripts/aws-bootstrap.sh`
- `scripts/aws-deploy.sh`
- `scripts/package-lambda.sh` (only if it references the account/bucket)

## Changes

### `.github/workflows/deploy-aws.yml`

- Add a step (before `Deploy`) or a dependent job: `- run: npm run quality:check`.
- Replace `AWS_ACCOUNT_ID: "979135883660"` with `AWS_ACCOUNT_ID: ${{ vars.AWS_ACCOUNT_ID }}`.
- Replace the literal `AWS_S3_BUCKET` and the `role-to-assume` ARN with values built from `${{ vars.AWS_ACCOUNT_ID }}` (e.g. `thejudge-web-${{ vars.AWS_ACCOUNT_ID }}`, `arn:aws:iam::${{ vars.AWS_ACCOUNT_ID }}:role/thejudge-github-deploy`).

### `scripts/*.sh`

- Change `account_id="${AWS_ACCOUNT_ID:-979135883660}"` to require the value:
  ```bash
  account_id="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID must be set (GitHub repo variable or shell export)}"
  ```
- Keep bucket/role names derived from `$account_id` (already the pattern).

## Acceptance criteria

- [ ] `grep -rnE '[0-9]{12}' .github/ scripts/` returns no hardcoded account ID
- [ ] `deploy-aws.yml` runs `npm run quality:check` before the `Deploy` step (or via a `needs:` job dependency), so a failing check blocks deploy
- [ ] Running any script with `AWS_ACCOUNT_ID` unset exits non-zero with the clear message
- [ ] `bash -n scripts/aws-bootstrap.sh scripts/aws-deploy.sh scripts/package-lambda.sh` reports no syntax errors
- [ ] Workflow YAML is valid (parses without error)
- [ ] Required repo variable `AWS_ACCOUNT_ID` is documented (covered in Slice E `docs/aws/secrets.md`)

## Verification

```bash
grep -rnE '[0-9]{12}' .github/ scripts/ && echo "FAIL: hardcoded id" || echo "OK: no hardcoded id"
bash -n scripts/aws-bootstrap.sh scripts/aws-deploy.sh scripts/package-lambda.sh
( unset AWS_ACCOUNT_ID; bash scripts/aws-deploy.sh; echo "exit=$?" )   # expect non-zero + message
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy-aws.yml')); print('yaml ok')"
```
