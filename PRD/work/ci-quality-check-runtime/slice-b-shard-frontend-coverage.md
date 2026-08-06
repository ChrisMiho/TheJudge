# Slice B — Shard frontend coverage and merge with thresholds intact

## Status: planned

## Goal

Split the frontend coverage run across parallel shard jobs and merge their
reports so thresholds are evaluated once, on merged totals.

## Requirements

1. Convert the `frontend` job to a matrix of N shards running
   `vitest run --coverage --shard=${{ matrix.shard }}/N --reporter=blob`, each
   uploading its blob report as an artifact.
2. Add a `coverage-merge` job with `needs: [frontend]` that downloads all shard
   blobs, merges them, and evaluates frontend thresholds against merged totals.
3. Shard jobs must **not** apply thresholds. Partial coverage data would fail
   spuriously — thresholds belong only to the merge job. (Confirmed hazard: a
   scan-only run reports 17.47% lines against the 45% global threshold.)
4. Choose N from the runner-core value slice A recorded, not from an assumption.
   Start at 3 and record measured per-shard wall time before settling.
5. Update `deploy`'s `needs:` to depend on `coverage-merge` rather than the old
   single `frontend` job.
6. Coverage thresholds stay at current values — frontend `lines: 45`; backend
   `lines: 45`, `src/prompt/** 60`, `src/validation/** 60`. Do not edit them.
7. If blob-based coverage merging is unavailable on vitest 2.1.9, the recorded
   fallback is a devDependency bump of `vitest` and `@vitest/coverage-v8` with
   its own verification. Running the suite twice, or narrowing when coverage
   applies, are both prohibited (NFR-012, DEC-086).

## Acceptance criteria

- [ ] Frontend case count across all shards sums to exactly **1227** — no test
      is dropped or double-run by the shard split
- [ ] Merged coverage report is produced and thresholds evaluate against it
- [ ] **Threshold enforcement proven, not assumed:** temporarily lower merged
      coverage below 45% (e.g. by adding an uncovered source file) and confirm
      `coverage-merge` **fails**; revert afterwards and record both outcomes
- [ ] No shard job fails on coverage thresholds when run alone
- [ ] Per-shard wall time recorded in this slice doc; N justified against the
      runner-core value from slice A
- [ ] Deploy depends on `coverage-merge` and is skipped when it fails
- [ ] Vitest config threshold values are byte-identical to their pre-slice state
      (`git diff apps/frontend/vite.config.ts apps/backend/vitest.config.ts`)
- [ ] `npm run quality:check` unchanged and green locally

## Verification

```bash
# local shard equivalence — the sum must equal the unsharded total
cd apps/frontend
npx vitest run --reporter=blob --shard=1/3
npx vitest run --reporter=blob --shard=2/3
npx vitest run --reporter=blob --shard=3/3
npx vitest --merge-reports --coverage

# thresholds must be untouched
git diff apps/frontend/vite.config.ts apps/backend/vitest.config.ts

# canonical local gate
npm run quality:check

# CI timing per shard
gh api "repos/ChrisMiho/TheJudge/actions/runs/<RUN_ID>/jobs" \
  --jq '.jobs[] | "\(.name) \(.started_at) -> \(.completed_at)"'
```

## Files touched

- `.github/workflows/quality-check.yml`
- `PRD/work/ci-quality-check-runtime/slice-b-shard-frontend-coverage.md`
  (record shard timings, chosen N, and the threshold-breach proof)
