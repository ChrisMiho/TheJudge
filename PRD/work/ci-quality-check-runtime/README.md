status: active

# ci-quality-check-runtime

Reduce GitHub Actions wall time for the `quality:check` gate (~30s → ~4min
regression). Measured cause is per-file fixed overhead (jsdom environment, v8
coverage instrumentation), three outlier test files, and workflow-level waste —
not raw case count. See `IDEA.md` for the timing evidence.

Delivers the follow-up DEC-086 deferred by name (cross-workspace parallelism /
sharding, "revisit with CI-runner-core data") and refreshes NFR-012's stale
suite baseline.

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ci-quality-check-runtime/DESIGN-BRIEF.md`
- Findings: none

Prior round returned FAIL on two issues, both corrected before this result:
(1) NFR-012's "exactly once per CI job" wording contradicted sharding, where a
job runs one shard rather than the whole suite — generalized to "once per CI run
across all jobs", preserving DEC-086's no-duplicate-execution intent; (2) the
deploy-dependency mechanism was underspecified, since `needs:` is only valid
within one workflow — the design now states that `deploy-aws.yml` merges into
the gate workflow, rejects `workflow_run`, and scopes OIDC `id-token: write` to
the deploy job so PR jobs never receive AWS-assumable credentials.

## Slices

| Slice | Objective | Type | Depends on |
| --- | --- | --- | --- |
| [A](./slice-a-workflow-restructure.md) | Parallel gate jobs, cancellation, deploy `needs:` the gate instead of duplicating it | sequential | — |
| [B](./slice-b-shard-frontend-coverage.md) | Shard frontend coverage; merge blobs; thresholds on merged totals | sequential | A — needs the job structure and A's observed runner-core value to pick shard count |
| [C](./slice-c-scope-jsdom-per-file.md) | `environmentMatchGlobs` so DOM-free suites skip jsdom | parallel-ready | NFR-012, DEC-155 (no slice prerequisite; touches only `vite.config.ts`) |
| [D](./slice-d-split-outlier-test-files.md) | Assertion-preserving split of the 3 outlier files to lower the shard floor | sequential | B — "slowest shard drops" is only measurable once shards exist |
| [E](./slice-e-verify-and-promote.md) | Verify wall-time targets end to end; promote PRD truth | sequential | A, B, C, D |

## Implementation map

| Area | Files |
| --- | --- |
| CI workflows | `.github/workflows/quality-check.yml`; `.github/workflows/deploy-aws.yml` (deleted in A) |
| Vitest config | `apps/frontend/vite.config.ts` (C, possibly D) |
| Test files | `apps/frontend/src/App.interaction-flows.test.tsx`, `src/lib/scan/detection/detector.test.ts`, `src/lib/scan/detection/detectorFixtures.test.ts` (D, split only) |
| Durable PRD | `PRD/sections/decisions/doc-process.md` (DEC-155), `PRD/sections/decisions.md` (router), `PRD/sections/non-functional-requirements.md` (NFR-012) |
| Untouched by contract | `package.json` scripts, coverage threshold values, `apps/backend/src/eval/**` |

## Targets

| Metric | Baseline | Target |
| --- | --- | --- |
| PR gate wall | 3m57s | < 2m00s |
| Deploy **job** duration | 4m41s | < 1m30s |
| **Time-to-deployed** (push → live) | ~4m41s | < 3m00s |
| Frontend cases | 1227 | 1227 (unchanged) |
| Backend cases | 271 | 271 (unchanged) |
| Coverage thresholds | fe 45; be 45 / 60 / 60 | unchanged |

## Autonomous metadata

- Autonomous base: origin/feature/ui-review
