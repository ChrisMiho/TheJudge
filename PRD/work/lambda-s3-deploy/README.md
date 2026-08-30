# lambda-s3-deploy

Deploy-pipeline hardening on three fronts (see `DESIGN-BRIEF.md`):

1. **Axis 1** — S3-staged Lambda deploy: stage `dist/lambda.zip` in a private
   artifact bucket, then `update-function-code --s3-bucket`, raising the package
   ceiling from ~50 MB (direct upload) to the 250 MB unzipped quota. (REQ-165,
   DEC-169)
2. **Axis 2** — skip the production deploy on non-code merges: gate the `deploy`
   job with change detection so docs-only merges stop firing a full deploy, with
   a `workflow_dispatch` escape hatch. (REQ-166)
3. **Axis 3** — remove the combo size restriction: set
   `MIN_VARIANT_POPULARITY = 0` so the full reviewed corpus ships, spending the
   headroom axis 1 creates. (REQ-093, NFR-017)

Refinement (design brief, REQ-166, and the REQ-093/NFR-017 edits) was authored
outside the graph run and merged to `main` via PR #143. This package was picked
up by `graph-run` at `STATUS.refined`; see `GRAPH-RUN.md` for the run ledger.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/lambda-s3-deploy

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/lambda-s3-deploy/DESIGN-BRIEF.md`
- Findings: none
