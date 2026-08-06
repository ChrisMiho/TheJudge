# DESIGN-BRIEF: ci-quality-check-runtime

Status: refined (orchestrated `thejudge-prepare`; user approved addressing the
DEC-086 deferral and refreshing NFR-012, with no test deletion).

## Problem

The GitHub Actions gate has grown from ~30s to ~4min. Measurement localises it
precisely — this is not a guess about case count.

Job-level (run `31077630789`, `Quality Check` @ `main`, 3m57s total):

| Step | Time |
| --- | --- |
| Checkout + `setup-node` + `npm ci` | 14s |
| **`npm run quality:check`** | **3m41s** |

`npm ci` is already cached and costs 7–8s; dependency install is not the
problem. Inside the gate, local timings isolate the cost further:

| Sub-check | Local | Note |
| --- | --- | --- |
| `typecheck` | 2.9s | noise |
| `lint` | 2.1s | noise |
| `format:check` | 0.5s | noise |
| `test:scripts` | 1.0s | noise |
| backend `test:coverage` | 1.8s | 271 cases / 23 files — noise |
| **frontend `test:coverage`** | **24.5s** | 1227 cases / 115 files |

Case count is a factor but not the driver. Three fixed costs dominate, each
measured independently:

1. **v8 coverage instrumentation.** The same frontend suite runs in 15.2s
   without `--coverage` and 24.5s with it — **+52s CPU (+86% test CPU)**. The
   penalty is pathological on tight numeric loops: `src/lib/scan/**` alone runs
   **7.0s of test CPU uninstrumented and 32.3s instrumented — 4.6x**. Fifteen
   files account for roughly half the entire coverage penalty.
2. **jsdom for every file.** `apps/frontend/vite.config.ts` sets
   `environment: "jsdom"` globally, so all 115 files pay it: **54.1s CPU**.
   Measured on `src/lib/scan/**`, switching those 15 files to `node` drops
   environment CPU from 8.51s to 0.002s with all 138 cases still passing.
3. **Outlier files set the floor.** `App.interaction-flows.test.tsx` (50 cases,
   18.2s), `scan/detection/detector.test.ts` (17.6s) and
   `detectorFixtures.test.ts` (16.6s) are 52s of the 114s test CPU.

Total gate CPU (~210s) is close to CI wall time (221s), so the 4-vCPU runner is
extracting almost no parallelism from a `quality:check` that is a strictly
serial `&&` chain.

Workflow shape adds waste on top:

- **The deploy gate is duplicated.** `deploy-aws.yml` re-runs the identical
  `quality:check` that `quality-check.yml` already ran on the same commit —
  **3m22s of a 4m41s deploy**. Build is 12s and the actual AWS deploy is 37s.
- **The duplication is also the only real gate.** The two workflows run
  *concurrently* on a `main` push, so `Deploy AWS` does not wait for
  `Quality Check`. Its inline gate is what actually protects production;
  deleting that step without replacing it with a dependency would remove the
  gate, not just the duplication.
- **No cancellation.** Neither workflow declares a `concurrency` group, so
  superseded pushes keep running — four overlapping runs on
  `feature/responsive-containment-and-density` inside 25 minutes.

## Outcome

Cut the PR gate from ~3m57s to a target **under 2 minutes** and the deploy from
~4m41s to a target **under 1m30s**, by attacking fixed overhead, runner
parallelism, and workflow waste — never by removing tests or weakening a
threshold. This is the follow-up DEC-086 deferred by name ("cross-workspace
parallelism and vitest sharding … a later package may revisit them with
CI-runner-core data"), now supplied with that runner data.

## Confirmed choices

| Question | Choice |
| --- | --- |
| Where does the speed come from? | Shard the frontend coverage run across parallel CI jobs and merge blob reports; thresholds are evaluated on merged coverage, unchanged. |
| Does `quality:check` change? | No. It stays the single canonical local command (root README) and still runs everything serially for a developer. CI decomposes it into parallel jobs; it does not get a new "CI-only fast mode". |
| Coverage on PRs? | **Kept, every run.** See rejected alternatives. |
| jsdom scope | Per-file opt-out via `environmentMatchGlobs`, extended only to globs a green run proves. Starts with `src/lib/scan/**` (measured). Not a blanket rule. |
| Deploy duplication | Removed by moving the deploy job **into the gate workflow** and giving it `needs:` on the gate jobs, so the gate becomes a real precondition instead of a concurrent duplicate. `needs:` is only valid within one workflow, so `deploy-aws.yml` is merged rather than kept as a second file; `workflow_run` is rejected because it evaluates in default-branch context and needs manual SHA plumbing. The deploy job carries `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`. |
| OIDC scope after the merge | `id-token: write` moves to **job-level on deploy only**. Merging the workflows must not grant AWS-assumable credentials to PR gate jobs, which run on contributor-controlled refs. |
| Deploy now waits for the gate | Accepted. Time-to-deployed becomes gate + deploy job (~2m42s) rather than the deploy job racing alongside (~4m41s today). Both still beat baseline. The trade buys a real gate: today a `main` push can deploy a commit whose `Quality Check` is still running or already red. Tracked as **two** metrics so the job figure is never reported as time-to-deployed. |
| Drift between `quality:check` and CI | Guarded by a `scripts/*.test.mjs` test (run by the existing `test:scripts`) asserting every sub-script in the `quality:check` chain is executed by some CI job. Without it, decomposing the aggregate lets a locally-added check silently never run in CI. |
| "Suite runs once" under sharding | Measured **per CI run across all jobs**, not per job. NFR-012's original "exactly once per CI job" wording predates sharding and is generalized by DEC-155; the no-duplicate-execution intent from DEC-086 is unchanged. |
| Outlier files | Split assertion-preserving, to lower the shard floor — the same refactor DEC-086 already blessed for `App.test.tsx`. |
| Cancellation | `cancel-in-progress: true` for PR gates only. Deploy on `main` must never be cancelled mid-flight. |

## Product truth

| ID | Role |
| --- | --- |
| DEC-155 | New — CI gate is parallel/sharded with merged coverage; deploy depends on it instead of duplicating it; PR runs cancel-in-progress. Discharges DEC-086's deferral. |
| NFR-012 | Amended — refresh the stale baseline (~800 cases / ~82 files → 1498 cases / 161 files), add parallelism/sharding constraints, retire the deferral note. |
| DEC-086 | Referenced, not superseded — its single-pass collapse stands and is still correct. |
| NFR-009 | Preserved — the `test:eval` golden gate is untouched. |

## Material assumptions

| Assumption | Evidence | How it is discharged |
| --- | --- | --- |
| `ubuntu-latest` gives 4 vCPU | `gh repo view` reports `PUBLIC`; GitHub's standard public-repo runner is 4-core | Slice A prints `nproc` in the job and records it; shard count is tuned to the observed value, not the assumed one |
| 3 frontend shards is the right split | ~210s gate CPU dominated by frontend coverage; 3 shards puts each job near ~60–70s plus ~20s setup | Slice B records measured per-shard wall time and adjusts before the slice closes |
| `environmentMatchGlobs` is available | vitest pinned at **2.1.9** (`npx vitest --version`); the option exists in 2.x | Slice C run is green or the glob is not added |
| Sharded coverage still enforces thresholds | vitest 2.x `--reporter=blob` + `--merge-reports` merges coverage across shards | **Proven, not assumed**: slice B must demonstrate a deliberate threshold breach still fails the merged job |
| Splitting outlier files preserves behavior | DEC-086 already did this for `App.test.tsx` | Case count before/after is asserted equal |

None meets the genuine-blocker test: each is settled by measurement inside
implementation, and none changes product behavior, a public contract, data
handling, or security posture.

## Rejected alternatives

- **Move coverage off PR runs (coverage only on `main`).** This is the single
  largest lever (+86% test CPU) but it contradicts DEC-086, which makes
  coverage-mode execution *the* single canonical regression + coverage gate.
  Running plain tests on PRs and coverage on `main` would either execute the
  suite twice overall or lose PR-time coverage enforcement, and would surface
  coverage regressions only after merge. Sharding gets the wall-clock win
  without touching the gate.
- **Excluding hot numeric scan source from coverage.** Would lower effective
  coverage of exactly the code most worth covering. Forbidden by NFR-012.
- **Deleting or merging away test cases.** Explicitly out of scope per the
  user and NFR-012 ("no test is deleted purely to reduce runtime").
- **Swapping the v8 provider for istanbul.** Istanbul is generally slower for
  this shape; no evidence it helps, and it would change coverage numbers.

## Non-goals

- No test is deleted, skipped, or weakened, and no coverage threshold is
  lowered (frontend `lines: 45`; backend `lines: 45`, `src/prompt/** 60`,
  `src/validation/** 60`).
- The `test:eval` golden gate (NFR-009) is untouched.
- No product behavior, UI, API, prompt, provider, or data change.
- No new `@playwright/test` CI harness.
- Not a re-litigation of DEC-086's single-pass collapse.
- No change to the AWS deploy mechanics themselves (`scripts/aws-deploy.sh`,
  OIDC role, S3/Lambda/CloudFront targets) beyond where the gate sits.

## Implementation pointers (non-normative)

- Preserve `f7970bf` ("scope `VITE_FEEDBACK_FORMSPREE_ID` to build step only")
  when restructuring `deploy-aws.yml` — that env scoping was a deliberate
  hotfix for a leak and must not regress.
- Target CI job shape: `static` (typecheck + lint + format:check +
  test:scripts) ∥ `backend` (coverage) ∥ `frontend-shard 1..N`, then a
  `coverage-merge` job, then `deploy` gated on all of them via `needs:`.
- `concurrency` group keyed on workflow + ref with `cancel-in-progress: true`
  for PR gates; the deploy job must be excluded from cancellation.
- Measured `src/lib/scan/**` node-environment migration is safe; measured
  counter-examples that still need jsdom include
  `src/lib/lifeTracker/useLifeTracker.test.ts`,
  `src/lib/feedback/FeedbackContextProvider.test.tsx`, and
  `src/lib/portal/seedContext.test.tsx` — do not apply an extension-based rule.
