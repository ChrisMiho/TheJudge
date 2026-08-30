# Slice A — S3-staged Lambda deploy

## Status: done

## Goal

Stage the Lambda code+data zip in S3 before pointing `update-function-code`
at it, so the deploy is bounded by AWS's 250 MB unzipped deployment-package
quota instead of the ~50 MB effective ceiling of a direct `--zip-file`
upload. Repoint (never remove) the pre-merge size guardrail so it measures
the real limit.

## Requirements

1. `scripts/aws-deploy.sh` uploads `dist/lambda.zip` to the artifact bucket
   via `aws s3 cp`, then calls
   `aws lambda update-function-code --s3-bucket <bucket> --s3-key <key>`; the
   `--zip-file fileb://…` form is removed from this call. (REQ-165)
2. `scripts/aws-bootstrap.sh` creates the artifact bucket
   `<app>-lambda-artifacts-<account>` — private (public access blocked), no
   CloudFront origin, in the same region as the Lambda function — using the
   same idempotent head-bucket-then-create pattern the existing web bucket
   uses. (REQ-165)
3. The S3 object uses a fixed key, overwritten on every deploy; no per-deploy
   history object, versioning, or lifecycle rule is added. (REQ-165, DEC-169)
4. The GitHub OIDC deploy role's policy in `scripts/aws-bootstrap.sh` gains
   `s3:PutObject` scoped to the new artifact bucket, alongside its existing
   web-bucket grants. No bucket policy and no Lambda-side S3 grant are added
   — `update-function-code --s3-bucket` reads the object with the deploy
   role's own credentials. (REQ-165)
5. `scripts/package-lambda.sh` is unchanged; it still builds `dist/lambda.zip`
   the same way. (REQ-165)
6. `scripts/lambda-package-budget.test.mjs` is rewritten to measure the
   **unzipped on-disk** package footprint (code + production `node_modules` +
   committed `apps/backend/data`) against the 250 MB unzipped
   deployment-package quota, with a reserve for `node_modules` + code. The
   base64/request-limit basis (`LAMBDA_REQUEST_LIMIT`, `BASE64_EXPANSION`,
   `ZIP_CEILING`) is removed with the direct-upload path it described.
   (NFR-017)
7. The rewritten guardrail keeps a synthetic-over-budget regression case
   (mirroring the existing "ceiling accounts for…" test), and its failure
   message still names the largest data contributors and the available
   levers (reduce committed data, or raise `MIN_VARIANT_POPULARITY` as an
   emergency valve). (NFR-017)
8. `docs/aws/deployment.md` — the durable, code-adjacent operator doc — is
   updated to show the new artifact bucket in the architecture diagram and
   the S3-staging step in the deploy-path walkthrough, per DEC-169's note
   that operational detail for the new bucket lives here.

## Acceptance criteria

- [ ] A1 — `scripts/aws-deploy.sh` stages the zip via `aws s3 cp` and updates
      the function via `--s3-bucket`/`--s3-key`; no `--zip-file` remains in
      that call.
- [ ] A2 — `scripts/aws-deploy.sh` passes `bash -n` (syntax check; no AWS
      credentials are available in this environment for a live dry-run).
- [ ] A3 — `scripts/aws-bootstrap.sh` creates the private, no-CloudFront
      artifact bucket `<app>-lambda-artifacts-<account>` in the function's
      region, idempotently (head-bucket check before create).
- [ ] A4 — `scripts/aws-bootstrap.sh` passes `bash -n`.
- [ ] A5 — the GitHub deploy role policy in `scripts/aws-bootstrap.sh` grants
      `s3:PutObject` scoped to the new artifact bucket.
- [ ] A6 — `scripts/lambda-package-budget.test.mjs` no longer defines or
      references `LAMBDA_REQUEST_LIMIT`, `BASE64_EXPANSION`, or `ZIP_CEILING`;
      it measures the unzipped on-disk footprint against a 250 MB quota with
      a stated reserve.
- [ ] A7 — `npm run test:scripts` passes, including the rewritten guardrail
      test and its synthetic over-budget regression case.
- [ ] A8 — `scripts/package-lambda.sh` is unchanged (no diff against the
      pre-slice version).
- [ ] A9 — `docs/aws/deployment.md` mentions the new artifact bucket and the
      S3-staged upload step.
- [ ] A10 — a dated manual observation records that a real S3-staged deploy
      exceeding the old ~50 MB ceiling cannot be executed in this sandbox (no
      AWS credentials); the plumbing was instead verified by reading the
      `update-function-code --s3-bucket`/`--s3-key` and `aws s3 cp` argument
      forms against the AWS CLI reference, and real deploy behavior is proven
      when this branch reaches `main` and CI's `deploy` job runs under the
      OIDC role.

## Manual observation (A10)

2026-08-29 A10 — no AWS credentials are available in this sandbox, so the real S3-
staged deploy (an upload past the old ~50MB direct-upload ceiling, and the
`update-function-code --s3-bucket`/`--s3-key` call actually succeeding
against Lambda's 250MB unzipped quota) could not be executed here. Instead,
the plumbing was verified by reading the argument forms
(`aws s3 cp <path> s3://<bucket>/<key>` and
`aws lambda update-function-code --function-name <fn> --s3-bucket <bucket>
--s3-key <key>`) against the AWS CLI v2 reference for `s3 cp` and
`lambda update-function-code`, and by `bash -n` syntax-checking both edited
scripts. Real deploy behavior is proven when this branch reaches `main` and
GitHub Actions' `deploy` job runs `scripts/aws-deploy.sh` under the
`thejudge-github-deploy` OIDC role — that is the first point in this graph
run's lifecycle where AWS credentials exist.

## Verification

```bash
bash -n scripts/aws-deploy.sh
bash -n scripts/aws-bootstrap.sh
npm run test:scripts
git diff --stat scripts/package-lambda.sh   # expect no output
```

## Files touched

- `scripts/aws-deploy.sh`
- `scripts/aws-bootstrap.sh`
- `scripts/lambda-package-budget.test.mjs`
- `docs/aws/deployment.md`
