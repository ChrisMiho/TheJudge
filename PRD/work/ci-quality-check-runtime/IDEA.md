# IDEA: CI quality-check runtime

**Problem:** GitHub Actions wall time has grown from ~30s to ~4min. Step-level
timing on run `31077630789` (`Quality Check` @ `main`) shows the growth is
entirely inside one step: checkout + `setup-node` + `npm ci` cost 14s, while
`npm run quality:check` costs **3m41s of the 3m57s job**. Locally that same
gate is ~33s, of which typecheck (2.9s), lint (2.1s), `format:check` (0.5s),
`test:scripts` (1.0s) and the whole backend suite (1.8s, 271 cases / 23 files)
are noise — **frontend `test:coverage` is 24.5s of it** (1227 cases / 115
files). The suspected cause (case count) is only partly right: vitest's own
breakdown attributes 54.1s CPU to `environment` (a fresh jsdom per test file,
though 43 of 45 `src/lib/**` test files touch no DOM), and re-running the same
suite without `--coverage` drops it to 15.2s / 61.5s test-CPU — so **v8 coverage
instrumentation alone adds ~9s wall and ~52s CPU (+86%)**. Three outlier files
(`App.interaction-flows` 18.2s, `scan/detection/detector` 17.6s,
`detectorFixtures` 16.6s) account for 52s of the 114s test CPU. Total gate CPU
(~210s) is close to CI wall time (221s), so the runner is extracting almost no
parallelism from work that is ~5x faster locally. Workflow shape adds waste on
top: neither workflow declares a `concurrency` group, so superseded pushes keep
running (four overlapping runs on `feature/responsive-containment-and-density`
inside 25 minutes), and `Deploy AWS` re-runs the identical `quality:check` that
`Quality Check` already ran on the same commit.

**Outcome:** Cut `quality:check` CI wall time by attacking per-file fixed
overhead and workflow waste rather than case count — scope the jsdom
environment to the tests that need it, stop paying v8 instrumentation on every
PR run while keeping the coverage gate authoritative, tune runner parallelism
with real core data, and add cancel-in-progress plus deduplicate the doubled
gate. This is the follow-up DEC-086 explicitly deferred ("cross-workspace
parallelism and vitest sharding … a later package may revisit them with
CI-runner-core data"), and it refreshes NFR-012, whose stated baseline of "~800
cases across ~82 source test files" is now 1498 cases across 161 files.

**Non-goals:** No test is deleted or weakened to hit a timing target and no
coverage threshold is lowered (NFR-012); the eval golden gate (`test:eval`,
NFR-009) is untouched; no product behavior, UI, API, or prompt change; not a
re-litigation of DEC-086's single-pass collapse, which already landed and is
still correct.
