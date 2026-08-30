# lambda-s3-deploy

status: active

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

## Slice table

| Slice | Title | Requirements | Dependencies | Status |
| --- | --- | --- | --- | --- |
| A | S3-staged Lambda deploy | REQ-165, DEC-169, NFR-017 | parallel-ready | done |
| B | Skip prod deploy on non-code merges | REQ-166 | parallel-ready | done |
| C | Remove combo size restriction + PRD backing | REQ-093, NFR-017 | parallel-ready | planned |

See `GAMEPLAN.md` for the architecture/data-flow map and the structural
constraint (no graph-run `data:refresh`) that scopes Slice C.

## Implementation map

- Slice A: `scripts/aws-deploy.sh`, `scripts/aws-bootstrap.sh`,
  `scripts/lambda-package-budget.test.mjs`, `docs/aws/deployment.md`
- Slice B: `.github/workflows/quality-check.yml`
- Slice C: `scripts/build-commander-spellbook-combos.mjs`,
  `PRD/sections/system-map.md`
