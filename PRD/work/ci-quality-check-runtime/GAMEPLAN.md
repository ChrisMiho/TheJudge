# GAMEPLAN: ci-quality-check-runtime

Authority: `DESIGN-BRIEF.md`, DEC-155, NFR-012 (amended), DEC-086 (upheld),
NFR-009 (untouched).

## Baseline to beat

Measured on run `31077630789` and local isolation runs. Every slice compares
against these numbers, not against impressions.

| Metric | Baseline |
| --- | --- |
| PR gate (`Quality Check`) wall | **3m57s** (3m41s of it `npm run quality:check`) |
| Deploy (`Deploy AWS`) wall | **4m41s** (3m22s of it a duplicated `quality:check`) |
| Frontend suite, local, coverage | 24.5s — 1227 cases / 115 files |
| Frontend suite, local, no coverage | 15.2s |
| `src/lib/scan/**` test CPU, no coverage | 7.0s |
| `src/lib/scan/**` test CPU, coverage | 32.3s (4.6x) |
| Frontend jsdom environment CPU | 54.1s across 115 files |
| Backend suite, local, coverage | 1.8s — 271 cases / 23 files |
| Total gate CPU | ~210s vs ~221s CI wall — near-zero parallelism |

Targets: **PR gate < 2m00s**, **deploy job < 1m30s**, **end-to-end
time-to-deployed < 3m00s**, with zero tests removed and zero thresholds lowered.

### Two distinct deploy metrics — do not conflate them

Today `Deploy AWS` runs **concurrently** with `Quality Check`, so time-to-
deployed on a `main` push is ≈ its own 4m41s. Under this design deploy **waits**
on `needs:`, so the two metrics separate:

| Metric | Baseline | Target | Why |
| --- | --- | --- | --- |
| Deploy **job** duration | 4m41s | < 1m30s | The duplicated 3m22s gate leaves it; only setup + build (12s) + deploy (37s) remain |
| **Time-to-deployed** (push → live) | ~4m41s | < 3m00s | Now serialized: gate (~1m34s) + deploy job (~1m08s) |

This is a deliberate trade: deploy no longer starts immediately, but it also can
no longer ship a commit whose gate failed — which today it can, because the two
workflows race. Both numbers still beat the baseline; only the job metric shows
the dramatic drop, and slice E must record both.

## Architecture

Today `quality:check` is one serial `&&` chain inside one job, and
`deploy-aws.yml` runs the whole chain a second time concurrently. Target shape
is one workflow, five job groups, dependencies expressed with `needs:`:

```
                    ┌── static  (typecheck, lint, format:check, test:scripts)
push/PR ──┬─────────┼── backend (vitest --coverage)
          │         └── frontend-shard 1..N (vitest --coverage --shard=i/N --reporter=blob)
          │                        │
          │                        └──> coverage-merge (merge blobs, apply thresholds)
          │
          └──> deploy   needs: [static, backend, coverage-merge]
                        if: push && ref == refs/heads/main
                        permissions: id-token: write   (job-level only)
```

Key properties this shape must preserve:

- **`npm run quality:check` is unchanged.** It remains the canonical local
  pre-PR command (root README). CI decomposes the same checks; it does not gain
  a CI-only fast mode, and the local command does not gain shard flags.
- **Every test runs exactly once per CI run**, across all jobs (DEC-086 intent,
  NFR-012 wording as generalized by DEC-155).
- **Thresholds are applied once, to merged coverage** — never per shard, which
  would produce false failures on partial data.
- **OIDC stays job-scoped.** Merging the workflows must not hand
  `id-token: write` to PR jobs running contributor-controlled refs.

## Data flow: sharded coverage

1. Each `frontend-shard` job runs its shard with coverage enabled and emits a
   blob report as a build artifact.
2. `coverage-merge` downloads all shard blobs, merges them, and evaluates the
   frontend thresholds (`lines: 45`) against merged totals.
3. The merge job is the one that can fail on coverage. Shard jobs must not
   apply thresholds.

Slice B owns proving this works on vitest **2.1.9** and must not assume it.
If blob-based coverage merging is unavailable at that version, the recorded
fallback is a devDependency bump of `vitest` / `@vitest/coverage-v8` with its
own verification — **not** running the suite twice, and **not** narrowing when
coverage applies.

## Slice order and why

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | Workflow restructure: parallel jobs, concurrency cancellation, deploy `needs:` the gate | — |
| B | Shard frontend coverage and merge blobs with thresholds intact | A (job structure), A (runner-core data) |
| C | Scope jsdom per-file via `environmentMatchGlobs` | — (parallel-ready with A/B; no shared files) |
| D | Split outlier test files, assertion-preserving, to lower the shard floor | B (shard balance is the measurable outcome) |
| E | Verify targets end to end and promote PRD truth | A, B, C, D |

A precedes B because shard count must be tuned to **observed** runner cores,
not the assumed 4 — A records `nproc` from a real job. D follows B because
"slowest shard drops" is only measurable once shards exist; a single 18.2s file
otherwise sets a floor sharding cannot cross.

## Verification checklist

- [ ] `npm run quality:check` still passes locally and is unchanged in
      `package.json`
- [ ] Every test case count is identical before and after (1227 frontend, 271
      backend, plus `test:scripts`)
- [ ] Coverage thresholds unchanged in both vitest configs; a deliberate breach
      still fails the merged job
- [ ] `test:eval` golden gate untouched (NFR-009)
- [ ] PR gate wall < 2m00s and deploy wall < 1m30s on real runs
- [ ] Deploy cannot start unless the gate jobs succeeded
- [ ] PR runs cancel superseded runs; a `main` deploy is never cancelled
- [ ] `VITE_FEEDBACK_FORMSPREE_ID` remains scoped to the build step only
- [ ] `id-token: write` appears only on the deploy job

## Runtime process hygiene

No slice in this package has browser-observable risk under
`PRD/instructions/runtime-process-hygiene.md`: the changes are CI configuration,
vitest configuration, and assertion-preserving test-file moves. No Playwright
MCP session, no dev server, and no port allocation is required, so no slice
carries browser cleanup-evidence criteria. Verification is CI runs and vitest
output.
