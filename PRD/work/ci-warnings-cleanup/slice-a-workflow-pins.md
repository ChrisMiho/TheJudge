# Slice A — Workflow pins and runner labels

## Status: in-progress

## Goal

Move every GitHub action in the Quality Check workflow to its current major version and pin every job to `ubuntu-24.04`, so the run shows no Node 20 warnings and no Ubuntu-latest notices. Players see no change.

## Requirements

1. In `.github/workflows/quality-check.yml`, set the pins to exactly `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, `aws-actions/configure-aws-credentials@v6`. Upload and download move together. No `with:` input changes.
2. Set `runs-on: ubuntu-24.04` on all six jobs: `static`, `backend`, `frontend`, `coverage-merge`, `changes`, `deploy`.
3. Change nothing else in the workflow: node versions, steps, job graph, concurrency, permissions, and the deploy condition stay as they are.
4. Dependencies: none. Parallel-ready with slice B.

## Acceptance criteria

- [ ] A1. `.github/workflows/quality-check.yml` contains no `@v4` action reference.
- [ ] A2. The pins are exactly `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, `aws-actions/configure-aws-credentials@v6`.
- [ ] A3. All six `runs-on` lines read `ubuntu-24.04`; no `ubuntu-latest` remains.
- [ ] A4. No other workflow line changes: the diff against `origin/main` touches only `uses:` and `runs-on:` lines.
- [ ] A5. The tests that read the workflow (`scripts/ci-workflow-parity.test.mjs`, `apps/frontend/src/lib/deploymentPipeline.test.ts`) pass with no edit.
- [ ] A6. The PR's Quality Check run: every job that runs (`static`, `backend`, three frontend shards, `coverage-merge`) succeeds and shows zero annotations, checked with `gh api repos/ChrisMiho/TheJudge/check-runs/<job-id>/annotations`. (PR run only.)
Post-merge reading (not a criterion; owner-run, recorded in `GAMEPLAN.md` under `## Post-merge reading`): the `main` run's `changes` and `deploy` jobs, and one live answer with the embedder loaded.

## Verification

```bash
grep -n "@v4" .github/workflows/quality-check.yml   # expect no output
grep -nE "uses: (actions|aws-actions)/" .github/workflows/quality-check.yml
grep -n "runs-on" .github/workflows/quality-check.yml
git diff origin/main -- .github/workflows/quality-check.yml
node --test scripts/ci-workflow-parity.test.mjs
npm run test --workspace apps/frontend -- deploymentPipeline
```

## Files touched

- `.github/workflows/quality-check.yml`
