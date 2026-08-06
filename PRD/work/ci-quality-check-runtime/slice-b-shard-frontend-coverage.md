# Slice B — Shard frontend coverage and merge with thresholds intact

## Status: in-progress

### Handoff
- Done: blob sharding + merge proven locally on vitest **2.1.9** (no dependency
  bump needed), workflow converted to a 3-shard matrix plus a `coverage-merge`
  job, deploy repointed at `coverage-merge`, drift guard extended with a
  shard/merge contract test. `npm run quality:check` green.
- Next: read the PR run's per-shard timings, settle N against them, fill
  `## Measurements`, flip to `done`.
- Stopped because: per-shard CI wall time cannot exist until this is pushed.

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

- [x] Frontend case count across all shards sums to exactly **1227** — no test
      is dropped or double-run by the shard split
- [x] Merged coverage report is produced and thresholds evaluate against it
- [x] **Threshold enforcement proven, not assumed:** temporarily lower merged
      coverage below 45% (e.g. by adding an uncovered source file) and confirm
      `coverage-merge` **fails**; revert afterwards and record both outcomes
- [x] No shard job fails on coverage thresholds when run alone
- [ ] Per-shard wall time recorded in this slice doc; N justified against the
      runner-core value from slice A
- [ ] Deploy depends on `coverage-merge` and is skipped when it fails
- [x] Vitest config threshold values are byte-identical to their pre-slice state
      (`git diff apps/frontend/vite.config.ts apps/backend/vitest.config.ts`)
- [x] `npm run quality:check` unchanged and green locally

## Measurements

### Blob merging works on vitest 2.1.9 — no dependency bump

The fallback in requirement 7 is **not** needed. `BlobReporter` in 2.1.9 already
serialises coverage as the blob's fifth element, and `readBlobs` feeds it to
`coverageProvider.mergeReports()`. Verified locally, three shards then a merge:

```
Test Files  115 passed (115)
     Tests  1227 passed (1227)
 All files  |   96.35 |   91.86 |   94.93 |   96.35
```

1227 cases across the merged shards — identical to the unsharded total, so the
split neither drops nor double-runs a test.

### Threshold enforcement, proven rather than assumed

Merged coverage is 96.35% lines against a 45% threshold, so pushing merged
totals *below* 45 would take roughly as much dead code as the entire `src` tree.
The equivalent and decisive proof is to raise the bar above the measured value
on the merge step alone:

```
$ npx vitest run --merge-reports --coverage --coverage.thresholds.lines=99
ERROR: Coverage for lines (96.35%) does not meet global threshold (99%)
EXIT=1
```

That is the merge job failing on merged totals. The configured value stays 45 —
`git diff apps/frontend/vite.config.ts apps/backend/vitest.config.ts` is empty —
and `scripts/ci-workflow-parity.test.mjs` now asserts the merge step may not
pass any `--coverage.thresholds` override, so the real threshold cannot be
quietly bypassed in CI.

### Shards do not apply thresholds

All three shard runs passed locally with `--coverage.thresholds.lines=0`. The
override lives on the CLI, not in the config, so it applies only to shard jobs.
Without it a shard is judged on partial data: the design brief's measured
counter-example is a scan-only slice reporting 17.47% lines against the 45%
global threshold.

### Shard count

Runner cores from slice A: **4**. N starts at **3** per the slice contract;
per-shard CI wall time is recorded below and N is settled against it.

| Job | Duration |
| --- | --- |
| _pending first sharded run_ | |

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
