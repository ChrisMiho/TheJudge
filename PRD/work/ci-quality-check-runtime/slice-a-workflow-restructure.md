# Slice A — Workflow restructure: parallel jobs, cancellation, deploy dependency

## Status: planned

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

- [ ] `.github/workflows/deploy-aws.yml` no longer exists; its deploy steps live
      in the gate workflow
- [ ] `grep -c "quality:check" .github/workflows/*.yml` returns **0** — CI runs
      the sub-scripts as separate jobs, so the aggregate never runs (and so can
      never run twice)
- [ ] Drift guard exists and passes: `npm run test:scripts` covers a test that
      fails when a `quality:check` sub-script is absent from the workflow —
      prove it by temporarily adding a dummy sub-script to the chain and
      confirming the test fails, then revert
- [ ] `id-token: write` appears only under the deploy job, verified by reading
      the workflow file
- [ ] `VITE_FEEDBACK_FORMSPREE_ID` appears only under the build step's `env:`
- [ ] A PR run shows `static`, `backend`, and `frontend` starting concurrently
- [ ] Deploy is skipped on `pull_request` runs and runs on `main` pushes
- [ ] A deliberately failing check (e.g. a temporary lint error) blocks deploy —
      confirm deploy reports `skipped`, never `success`
- [ ] Pushing twice in quick succession to a PR branch cancels the first run;
      pushing twice to `main` does **not** cancel the first deploy
- [ ] Observed `nproc` value recorded in this slice doc under a `Runner cores:`
      line
- [ ] Gate wall time recorded for comparison against the 3m57s baseline
- [ ] `npm run quality:check` unchanged in `package.json` and green locally

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
