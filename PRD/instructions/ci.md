# ci.md

## Purpose

The CI gate lives at `.github/workflows/quality-check.yml`. It runs on every
push to `main`/`master` and every pull request, mirrors the local
`npm run quality:check` command, and blocks `Deploy AWS` until it passes. This
file records how the gate is shaped and why — read it before changing the
workflow or the scripts it runs.

## Single coverage pass

`npm run quality:check` runs the Vitest suite exactly once. Coverage-mode
execution (`coverage:check`) is the single canonical regression + coverage
gate; there is no separate standalone `test` step in the chain, because that
would re-run every test a second time for no added protection. `npm test` and
`npm run test:coverage` still exist for local iteration.

Coverage thresholds are unchanged and unweakened: frontend `lines: 45`;
backend `lines: 45`, `src/prompt/** lines: 60`, `src/validation/** lines: 60`.
The eval golden gate (`test:eval`, NFR-009) sits outside `quality:check`
entirely and is untouched by any of this.

The test suite itself was reorganized as an assertion-preserving refactor
alongside the single-pass collapse — the oversized `App.test.tsx` was split
into behavior-focused files, shared `EnrichmentStep` fixtures/setup were
extracted to one reusable helper, and scan suites were grouped by pipeline
stage. Case count and assertions carried over unchanged; nothing was deleted
to make the suite faster.

- Backed by: DEC-086, NFR-012

## Parallel, sharded CI jobs

The gate runs as concurrent GitHub Actions jobs, not one serial
`&&`-chained script. `quality-check.yml` decomposes into `static` (typecheck,
lint, format:check, `test:scripts`), `backend` (coverage), `frontend`
(coverage, sharded 3 ways via `--shard` with blob reports), and
`coverage-merge`, which downloads the shard blobs and applies thresholds once
against the merged totals — a shard runs with thresholds disabled, since
judging a partial run against the whole-suite threshold would fail on
incomplete data rather than a real regression.

Splitting the suite across jobs and shards means no single job executes every
test, so the "the suite runs once" rule is evaluated per CI run across all
jobs, not per job: a shard covering one slice of the suite still satisfies the
no-duplicate-execution rule DEC-086 established. `npm run quality:check`
remains the one canonical local pre-PR command regardless of how CI splits its
sub-checks — it gains no CI-only fast mode, and a `scripts/*.test.mjs` drift
guard (`test:scripts`) asserts every sub-script in the `quality:check` chain
is actually executed by some CI job, so a check added locally can't silently
go unrun in CI.

The `jsdom` test environment is scoped per file rather than applied blanket
across a directory or by file extension: DOM-free files opt *out* to `node`
via `environmentMatchGlobs`, extended only to globs a green run proves. `jsdom`
stays the configured default so an unlisted or newly added test file is never
silently left without a DOM. Blanket rules are prohibited because
DOM-dependent tests measurably exist under otherwise DOM-free paths.

`Deploy AWS` no longer re-runs `quality:check` as a second, concurrent copy of
the gate — the deploy job lives inside `quality-check.yml` and depends on the
gate jobs via `needs:`, guarded by an `if:` restricting it to a `push` on
`main`. `id-token: write` is scoped to the deploy job alone, so pull-request
gate jobs never receive AWS-assumable credentials. Deploy is deliberately
serialized behind the gate rather than racing it, closing the gap where a
`main` push could previously deploy a commit whose gate was still running or
had already failed.

PR runs use a `concurrency` group with `cancel-in-progress: true` so a
superseded push cancels its predecessor's run instead of piling up; the `push`
path to `main`/deploy is excluded from cancellation so an in-flight deploy is
never aborted mid-flight.

- Backed by: DEC-155, NFR-012, NFR-009
