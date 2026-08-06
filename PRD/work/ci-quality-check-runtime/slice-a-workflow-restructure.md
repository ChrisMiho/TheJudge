# Slice A — Workflow restructure: parallel jobs, cancellation, deploy dependency

## Status: done

## Goal

Replace the single serial gate job and the duplicated deploy gate with one
workflow of parallel jobs where deploy depends on the gate via `needs:`.

## Requirements

1. Decompose `quality:check`'s sub-checks into concurrent jobs: `static`
   (`typecheck`, `lint`, `format:check`, `test:scripts`) and `backend`
   (`npm --workspace apps/backend run test:coverage`). Frontend coverage stays
   a single job in this slice — sharding is slice B.
2. Move the `Deploy AWS` job into the gate workflow with
   `needs: [static, backend, frontend]` and
   `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`.
   Delete `.github/workflows/deploy-aws.yml`. Do not use `workflow_run`.
3. Remove the duplicated `Quality gate` step from the deploy path — the
   `needs:` edge replaces it. Deploy keeps `Install packaging tools`,
   `Build project`, `Configure AWS credentials`, and `Deploy`.
4. Scope `permissions: id-token: write` to the deploy job only, not the
   workflow, so PR jobs never receive AWS-assumable credentials.
5. Preserve `VITE_FEEDBACK_FORMSPREE_ID` as a build-step-only `env:` (commit
   `f7970bf` fixed exactly this leak — do not regress it).
6. Add a workflow-level `concurrency` group keyed on workflow + ref with
   `cancel-in-progress` true for `pull_request` and false for `push`, so a
   `main` deploy is never cancelled mid-flight.
7. Preserve the existing trigger surface: `push` on `main` and `master`, plus
   `pull_request`.
8. Record observed runner cores by running `nproc` in one job and capturing the
   value in this slice doc — slice B tunes shard count against it.
9. Leave `package.json`'s `quality:check` untouched: it remains the canonical
   local command.
10. **Add a drift guard.** Because CI now runs `quality:check`'s sub-scripts
    individually rather than the aggregate, a check added to `quality:check`
    could pass locally while CI silently never runs it. Add a test under
    `scripts/*.test.mjs` (picked up by the existing `test:scripts`) that parses
    `package.json`'s `quality:check` chain and the gate workflow, and fails if
    any sub-script in the chain is not executed by some CI job. This keeps the
    local command and the CI decomposition provably equivalent.

## Acceptance criteria

- [x] `.github/workflows/deploy-aws.yml` no longer exists; its deploy steps live
      in the gate workflow
- [x] `grep -c "quality:check" .github/workflows/*.yml` returns **0** — CI runs
      the sub-scripts as separate jobs, so the aggregate never runs (and so can
      never run twice)
- [x] Drift guard exists and passes: `npm run test:scripts` covers a test that
      fails when a `quality:check` sub-script is absent from the workflow —
      prove it by temporarily adding a dummy sub-script to the chain and
      confirming the test fails, then revert
- [x] `id-token: write` appears only under the deploy job, verified by reading
      the workflow file
- [x] `VITE_FEEDBACK_FORMSPREE_ID` appears only under the build step's `env:`
- [x] A PR run shows `static`, `backend`, and `frontend` starting concurrently
- [ ] Deploy is skipped on `pull_request` runs and runs on `main` pushes
- [ ] A deliberately failing check (e.g. a temporary lint error) blocks deploy —
      confirm deploy reports `skipped`, never `success`
- [ ] Pushing twice in quick succession to a PR branch cancels the first run;
      pushing twice to `main` does **not** cancel the first deploy
- [x] Observed `nproc` value recorded in this slice doc under a `Runner cores:`
      line
- [x] Gate wall time recorded for comparison against the 3m57s baseline
- [x] `npm run quality:check` unchanged in `package.json` and green locally

## Measurements

**Runner cores: 4** (`nproc` in the `static` job, run `31111931196`). Slice B
tunes shard count against this, not against an assumption.

Measured on PR run `31111931196` (`pull_request`, PR #82):

| Job | Started | Completed | Duration |
| --- | --- | --- | --- |
| `static` | 14:39:41Z | 14:40:22Z | 41s |
| `backend` | 14:39:41Z | 14:40:11Z | 30s |
| `frontend` | 14:39:41Z | 14:43:18Z | **3m37s** |
| `deploy` | — | — | `skipped` |

| Metric | Baseline | Measured |
| --- | --- | --- |
| PR gate wall | 3m57s | **3m41s** |

All three gate jobs report the identical `started_at` of `14:39:41Z`, which is
the concurrency proof. The wall time barely moved because `frontend` alone is
3m37s of the 3m41s — parallelism cannot help until that job is split. That is
exactly what slices B, C, and D address; slice A's job is the structure they
need. The duplicated `Deploy AWS` gate (3m22s of wasted CPU per `main` push) is
gone outright.

Local `npm run quality:check` (this worktree, 10-core M-series): **34.6s wall**,
unchanged command, green.

### Deferred to a human-controlled `main` push

Three criteria require a `main` push or a live cancellation race, neither of
which this flow performs (it never merges and never pushes outside the shared
branch):

- deploy runs on `main` pushes — the `pull_request` half (deploy `skipped`) is
  observed above and recorded
- a deliberately failing check leaves deploy `skipped`, never `success` — on a
  `pull_request` run deploy is skipped by its `if:` regardless, so the run above
  cannot distinguish the two causes
- pushing twice to `main` does **not** cancel the first deploy

All three are structurally guaranteed by
`cancel-in-progress: ${{ github.event_name == 'pull_request' }}`,
`if: github.event_name == 'push' && github.ref == 'refs/heads/main'`, and
`needs: [static, backend, frontend]`, and each is now asserted by
`scripts/ci-workflow-parity.test.mjs` so it cannot regress silently. The live
confirmation belongs to the first post-merge `main` push.

The PR-branch half of the cancellation criterion is observable on this shared
branch and is captured during the slice C / D push sequence — see slice C.

### Formspree scoping note

Requirement 5 says "build-step-only". The variable was already scoped to the
**Deploy** step, not "Build project", because `scripts/aws-deploy.sh` runs its
own frontend build (`f7970bf` moved it there deliberately; the value on "Build
project" only reaches a discarded artifact). Preserved exactly, and
`deploymentPipeline.test.ts` now additionally asserts it appears on exactly one
line of the merged workflow, so it cannot widen to workflow or job scope.

## Verification

```bash
# local — the canonical gate must still pass unchanged
npm run quality:check

# workflow syntax and shape
cat .github/workflows/quality-check.yml
ls .github/workflows/            # deploy-aws.yml must be gone

# after push: confirm concurrency, dependency, and timings
gh run list --limit 5
gh api "repos/ChrisMiho/TheJudge/actions/runs/<RUN_ID>/jobs" \
  --jq '.jobs[] | "\(.name) \(.conclusion) \(.started_at) -> \(.completed_at)"'
```

## Files touched

- `.github/workflows/quality-check.yml`
- `.github/workflows/deploy-aws.yml` (deleted)
- `PRD/work/ci-quality-check-runtime/slice-a-workflow-restructure.md` (record
  runner cores and measured timings)
