# Design Brief — lambda-s3-deploy

## What a player/owner gets

Nothing changes in the app itself. This is deploy-pipeline hardening on three
fronts:

1. Pushes to `main` stop breaking when the committed Commander Spellbook combo
   data grows — the deploy gets ~5x more headroom.
2. Documentation-only merges stop firing a pointless production deploy.
3. The full combo corpus ships — the size-driven trim on combos is removed, so
   answers can draw on every reviewed combo, not a popularity-filtered subset.

Axes 1 and 3 are the same story from both ends: axis 1 raises the deploy
ceiling, and axis 3 spends that headroom by shipping the whole corpus. Axis 2 is
an independent reliability/cost fix on the same workflow.

## Axis 1 — S3-staged Lambda deploy (raise the ceiling)

### The one-line problem

The backend deploy uploads the Lambda code+data zip **directly** to
`aws lambda update-function-code --zip-file fileb://…`. AWS caps that request
at 70,167,211 bytes; because `--zip-file` base64-encodes the archive, the real
zip ceiling is ~50 MB. On 2026-08-22 combo refresh #96 pushed the artifacts
past it and `deploy` failed on `main` for two days
(`scripts/lambda-package-budget.test.mjs:10-17`). `dist/lambda.zip` measures
**54.8 MB** today — already over the direct-upload ceiling.

The constraint is the **size of the deploy artifact**, not runtime memory and
not a request payload. The Lambda already reads the combo file positionally and
never loads it whole (`apps/backend/src/commanderSpellbook/catalog.ts:326`), so
"more memory-efficient" and "split into multiple lambdas" both miss — see the
rejected alternatives below.

### The fix

Stage the zip in S3 first, then point Lambda at it:

- `aws s3 cp dist/lambda.zip s3://<artifact-bucket>/lambda/lambda.zip`
- `aws lambda update-function-code --s3-bucket <artifact-bucket> --s3-key lambda/lambda.zip`

The S3 path is not subject to the direct-upload request limit; the binding
constraint becomes AWS's **250 MB unzipped** deployment-package quota — roughly
5x the current ~50 MB ceiling.

### Axis 1 changes — four

1. **New private artifact bucket.** `scripts/aws-bootstrap.sh` creates
   `<app>-lambda-artifacts-<account>`, private (no public access, no
   CloudFront), in the same region as the function. S3 and Lambda must share a
   region for `update-function-code --s3-bucket` to read the object.

2. **Deploy IAM grant.** The GitHub OIDC deploy role gains `s3:PutObject` (and
   the bucket in its resource scope) so the workflow can stage the zip.
   `update-function-code --s3-bucket` reads the object with the caller's own
   credentials, so no bucket policy and no Lambda-side grant are added.

3. **`scripts/aws-deploy.sh` — the switch.** The single
   `update-function-code --zip-file` call becomes an `s3 cp` followed by
   `update-function-code --s3-bucket/--s3-key`. `scripts/package-lambda.sh` is
   unchanged — it still builds the same `dist/lambda.zip`.

4. **Repoint the guardrail, do not remove it.**
   `scripts/lambda-package-budget.test.mjs` currently enforces the
   base64/request-limit math (`LAMBDA_REQUEST_LIMIT`, `BASE64_EXPANSION`,
   `ZIP_CEILING`) that only applies to direct upload. It is rewritten to measure
   the **unzipped on-disk** package footprint against the 250 MB quota (with a
   reserve for `node_modules` + code), and — per axis 3 — baselines on the full
   corpus. The base64 reasoning retires with the direct-upload path it
   described.

## Axis 2 — skip the prod deploy on non-code merges

### The one-line problem

`.github/workflows/quality-check.yml`'s `deploy` job runs on every push to
`main` (`if: github.event_name == 'push' && github.ref == 'refs/heads/main'`,
lines 141-188) and runs `scripts/aws-deploy.sh`, which builds and deploys
**both** the frontend (S3 web bucket + CloudFront) and the Lambda. There is no
path filter. So a documentation-only merge rebuilds and redeploys everything for
zero runtime change — the batch of docs PRs merged on 2026-08-29 each deployed
pointlessly.

### The fix

Gate the `deploy` job with a change-detection step. Deploy runs only when a
changed path matches the **code set**; everything else skips. Quality checks
still run on every merge.

### Axis 2 changes

- **Code set (denylist).** Deploy when a changed path matches `apps/**`,
  `scripts/**`, `.github/workflows/**`, `package.json`, `package-lock.json`, or
  `tsconfig*.json`. Skip when every changed path is outside it (`PRD/**`,
  `docs/**`, `*.md`, `.claude/**`, `eslint.config.mjs`, …).
- **Gate the deploy job only.** `static`, `backend`, `frontend`, and
  `coverage-merge` still run on every push to `main`, so `main` keeps a green CI
  signal. No `paths`/`paths-ignore` at the trigger — that would drop the checks
  too.
- **Manual escape hatch.** Add a `workflow_dispatch` trigger so a full deploy
  can be forced from the Actions tab with no code change.
- **Visible decision.** The detection step logs the changed paths and its
  deploy/skip verdict. When the changed-file set can't be determined (first
  push, all-zeros base SHA), it deploys — fail-safe toward deploying.

## Axis 3 — remove the combo size restriction

### The one-line problem

`scripts/build-commander-spellbook-combos.mjs` carries
`MIN_VARIANT_POPULARITY = 2` — a trim that drops combos run by fewer than two
decks. It exists **only** because the full corpus did not fit the direct-upload
ceiling (`build-commander-spellbook-combos.mjs:20-28`: "the whole corpus no
longer fits in a Lambda deployment package … Set it to 0 to keep everything,
which currently does not deploy"). It is a size tourniquet, not a product
choice — and it was never written into PRD truth; REQ-093 already describes the
**full** corpus.

### The fix

Set `MIN_VARIANT_POPULARITY = 0`. The full reviewed `OK` corpus ships.

### Why it fits (grounded)

- **Package size.** Full corpus = **76.9 MB** detail `.gz` + **4.8 MB** index
  `.gz` ≈ 82 MB of data
  (`PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md`). The
  detail stays `.gz` on disk, so with `node_modules` + code the unzipped package
  lands well under the 250 MB quota with large headroom. The axis-1 guardrail
  measures this directly.
- **Runtime memory.** Only the index loads whole into memory
  (`catalog.ts:302`), and it is 4.8 MB gz; detail is read positionally per
  request. This is the entire point of the DEC-162 streaming design, which
  exists to avoid the ~868 MB-resident blowup of loading detail whole. 512 MB is
  untouched.

### Axis 3 changes

- `MIN_VARIANT_POPULARITY` → `0` and its comment updated (the trim is now an
  emergency size valve, not the standing state).
- The rewritten axis-1 guardrail baselines on the full corpus, so its reported
  headroom is real headroom, not headroom over a trimmed baseline.
- `MIN_VARIANT_POPULARITY` stays a functioning lever — it can still be raised in
  an emergency if the guardrail ever fires — but 0 is the default.

## Requirements

- **REQ-165** — S3-staged Lambda deploy upload (axis 1, functional). *Existing.*
- **REQ-166** — Skip the production deploy on non-code merges (axis 2,
  functional). *New.*
- **REQ-093** — Committed Commander Spellbook combo corpus; amended to pin the
  no-popularity-floor / full-corpus standing state (axis 3). *Edited.*
- **NFR-017** — Deploy-artifact size stays within the S3-path quota, guarded
  pre-merge; baselines on the full corpus. *Edited for axis 3.*

## Decisions

- **DEC-169** — Deploy the backend Lambda via an S3-staged artifact instead of
  a direct `--zip-file` upload, raising the effective package ceiling from
  ~50 MB zipped to the 250 MB unzipped quota; a new private artifact bucket
  holds the zip under a fixed overwritten key. Amends DEC-084's deploy
  mechanism; every other DEC-084 guarantee (one Lambda, Function URL, OIDC
  gate, SSM secret, cost guardrails) is preserved. *Existing — the decision log
  is retired, so axes 2 and 3 add no new DEC; their truth is REQ-166 and the
  REQ-093/NFR-017 edits.*

## Non-goals

- **No second Lambda.** The suite stays one `thejudge-api` function; NFR-004
  (lightweight architecture, no microservices) is preserved. Splitting handlers
  would not shrink the zip anyway.
- **No runtime memory change.** 512 MB is untouched; memory was never the
  constraint, and the full corpus does not change that (index-only load).
- **No S3-side rollback history.** Fixed key, overwrite each deploy. Lambda's
  own function-version history covers rollback; a lifecycle rule and unbounded
  bucket growth are avoided.
- **No `paths-ignore` at the workflow trigger** (axis 2). Gating the deploy job
  keeps the quality checks running on every merge; a trigger filter would drop
  them.
- **No combo build-logic change beyond the floor** (axis 3). Only
  `MIN_VARIANT_POPULARITY` moves to 0; parsing, serialization, streaming, and
  the artifact shape are untouched.
- **No IaC migration, no custom domain.** DEC-084's deferrals stand.

## Rejected alternatives (from the grounded diagnosis)

- **Make one Lambda more memory-efficient** — the runtime is already lazy and
  positional; it never loads the combo file whole and does not exhaust 512 MB.
  Memory is not the pinch.
- **Split into multiple Lambdas** — the combo data isn't an inter-function
  payload; a second function doesn't reduce the code+data zip that hits the
  limit.
- **Keep trimming combos (`MIN_VARIANT_POPULARITY`) as the standing state** —
  the old tourniquet. It drops real combos to fit and fails again on the next
  upstream refresh. Axis 3 removes it precisely because axis 1 makes the trim
  unnecessary.

## Verification intent (for map-out, not decided here)

- Deploy dry-run / real deploy on a full-corpus package succeeds via the S3 path.
- The rewritten `lambda-package-budget.test.mjs` passes on the **full** corpus
  with visible headroom and still fails a synthetic over-quota package.
- `aws-bootstrap.sh` is idempotent for the new bucket (safe re-run).
- A docs-only push to `main` skips the deploy job while the quality-check jobs
  still run; a code-touching push deploys; `workflow_dispatch` forces a deploy.
- The change-detection decision (paths evaluated, deploy/skip verdict) is
  visible in the workflow run log.
- The Lambda loads the full-corpus index within its 512 MB budget (measure
  resident memory at cold start on the full corpus).

## Risks worth naming

- **Unzipped quota is measured, not guessed.** The 250 MB quota is unzipped; the
  combo detail is stored `.gz` (stays compressed on disk), so the full-corpus
  package sits well under 250 MB — and the rewritten guardrail measures the real
  unzipped footprint, so growth toward the ceiling is seen coming.
- **Denylist maintenance (axis 2).** The code set is a denylist, so a future
  build-affecting path — a new deployable directory, a new root build-config
  file — must be added to it, or its deploy is silently skipped. The detection
  step's logged verdict is the mitigation: a wrong skip is visible in the run
  log. `tsconfig.base.json` is already folded in for exactly this reason.
- **Corpus growth (axis 3).** At `MIN_VARIANT_POPULARITY = 0`, every upstream
  refresh adds the full delta, so the corpus grows faster than under a trim. The
  headroom under 250 MB is large but finite; the axis-1 guardrail is the
  pre-merge tripwire, and raising the floor stays available as an emergency
  valve.
