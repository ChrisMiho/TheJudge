# Design Brief — lambda-s3-deploy

## What a player/owner gets

Nothing changes in the app. This is a deploy-pipeline fix: pushes to `main`
stop breaking when the committed Commander Spellbook combo data grows. Today a
big enough combo refresh pushes the deploy artifact past AWS's direct-upload
limit and `deploy` fails on every push until someone trims the corpus back
down. After this change the deploy has roughly 5x more headroom and stops
being a tripwire.

## The one-line problem

The backend deploy uploads the Lambda code+data zip **directly** to
`aws lambda update-function-code --zip-file fileb://…`. AWS caps that request
at 70,167,211 bytes; because `--zip-file` base64-encodes the archive, the real
zip ceiling is ~50 MB. On 2026-08-22 combo refresh #96 pushed the artifacts
past it and `deploy` failed on `main` for two days
(`scripts/lambda-package-budget.test.mjs:10-17`).

The constraint is the **size of the deploy artifact**, not runtime memory and
not a request payload. The Lambda already reads the combo file positionally
and never loads it whole (`apps/backend/src/commanderSpellbook/catalog.ts:326`),
so "more memory-efficient" and "split into multiple lambdas" both miss — see
the rejected alternatives below.

## The fix

Stage the zip in S3 first, then point Lambda at it:

- `aws s3 cp dist/lambda.zip s3://<artifact-bucket>/lambda/lambda.zip`
- `aws lambda update-function-code --s3-bucket <artifact-bucket> --s3-key lambda/lambda.zip`

The S3 path is not subject to the direct-upload request limit; the binding
constraint becomes AWS's **250 MB unzipped** deployment-package quota — roughly
5x the current ~50 MB ceiling.

## Scope — four changes

1. **New private artifact bucket.** `scripts/aws-bootstrap.sh` creates
   `<app>-lambda-artifacts-<account>`, private (no public access, no
   CloudFront), in the same region as the function. S3 and Lambda must share a
   region for `update-function-code --s3-bucket` to read the object.

2. **Deploy IAM grant.** The GitHub OIDC deploy role gains `s3:PutObject`
   (and the bucket in its resource scope) so the workflow can stage the zip.
   `update-function-code --s3-bucket` reads the object with the caller's own
   credentials, so no bucket policy and no Lambda-side grant are added.

3. **`scripts/aws-deploy.sh` — the switch.** The single
   `update-function-code --zip-file` call becomes an `s3 cp` followed by
   `update-function-code --s3-bucket/--s3-key`. `scripts/package-lambda.sh` is
   unchanged — it still builds the same `dist/lambda.zip`.

4. **Repoint the guardrail, do not remove it.**
   `scripts/lambda-package-budget.test.mjs` currently enforces the
   base64/request-limit math (`LAMBDA_REQUEST_LIMIT`, `BASE64_EXPANSION`,
   `ZIP_CEILING`) that only applies to direct upload. After the switch that
   math is wrong — it would fail deploys that now succeed and keep forcing
   needless combo trimming. It is rewritten to measure the **unzipped on-disk**
   package footprint against the 250 MB quota (with a reserve for
   `node_modules` + code), keeping the pre-merge signal alive against the new
   real limit. The base64 reasoning retires with the direct-upload path it
   described.

## Decisions

- **DEC-169** — Deploy the backend Lambda via an S3-staged artifact instead of
  a direct `--zip-file` upload, raising the effective package ceiling from
  ~50 MB zipped to the 250 MB unzipped quota; a new private artifact bucket
  holds the zip under a fixed overwritten key. Amends DEC-084's deploy
  mechanism; every other DEC-084 guarantee (one Lambda, Function URL, OIDC
  gate, SSM secret, cost guardrails) is preserved.

## Requirements

- **REQ-165** — S3-staged Lambda deploy upload (functional).
- **NFR-017** — Deploy-artifact size stays within the S3-path quota, guarded
  pre-merge (rewrites the guardrail's basis from the direct-upload request
  limit to the 250 MB unzipped quota).

## Non-goals

- **No second Lambda.** The suite stays one `thejudge-api` function; NFR-004
  (lightweight architecture, no microservices) is preserved. Splitting handlers
  would not shrink the zip anyway.
- **No runtime memory change.** 512 MB is untouched; memory was never the
  constraint.
- **No S3-side rollback history.** Fixed key, overwrite each deploy. Lambda's
  own function-version history covers rollback; a lifecycle rule and unbounded
  bucket growth are avoided.
- **No change to the combo build.** `build-commander-spellbook-combos.mjs` and
  `MIN_VARIANT_POPULARITY` are untouched — the point is to stop trimming under
  deploy pressure.
- **No IaC migration, no custom domain.** DEC-084's deferrals stand.

## Rejected alternatives (from the grounded diagnosis)

- **Make one Lambda more memory-efficient** — the runtime is already lazy and
  positional; it never loads the combo file whole and does not exhaust 512 MB.
  Memory is not the pinch.
- **Split into multiple Lambdas** — the combo data isn't an inter-function
  payload; a second function doesn't reduce the code+data zip that hits the
  limit.
- **Keep trimming combos (`MIN_VARIANT_POPULARITY`)** — the current tourniquet.
  It drops less-popular combos to fit and fails again on the next upstream
  refresh. This brief exists to stop needing it.

## Verification intent (for map-out, not decided here)

- Deploy dry-run / real deploy on a package near the old ceiling succeeds via
  the S3 path.
- The rewritten `lambda-package-budget.test.mjs` passes on the current corpus
  with visible headroom and still fails a synthetic over-quota package.
- `aws-bootstrap.sh` is idempotent for the new bucket (safe re-run).

## Risk worth naming

The 250 MB quota is **unzipped**. The combo detail artifact is stored `.gz`
(stays compressed on disk), so the unzipped package sits far under 250 MB with
large headroom — but the rewritten guardrail measures the real unzipped
footprint, so growth toward the ceiling is seen coming, not guessed.
