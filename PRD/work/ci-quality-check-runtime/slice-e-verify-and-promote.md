# Slice E — Verify targets end to end and promote PRD truth

## Status: done

### Post-merge confirmation (not a blocker)

The package's objective is met: the PR gate is **1m58s** against a 3m57s
baseline — half the wall time — with zero tests removed and zero thresholds
lowered. Every in-session verification passed.

Two deploy figures are recorded as *pending observation* rather than verified,
because the `deploy` job is gated on `push` to `main` and is `skipped` on every
PR run. They are not at risk — the duplicated 3m22s `quality:check` that
dominated the 4m41s deploy baseline is gone, leaving setup + build (12s) +
deploy (37s) — but they have not been measured, and this doc does not claim
otherwise. Read them off the first `main` run after `feature/ui-review` lands
and record them below.

## Goal

Prove the package hit its wall-time targets without weakening any gate, and
record the outcome in durable PRD truth.

## Requirements

1. Measure the final PR gate and deploy wall times from real runs and compare
   against the recorded baselines (3m57s gate, 4m41s deploy).
2. Confirm no gate weakened: case counts, thresholds, and the `test:eval` golden
   gate are all unchanged from baseline.
3. If a target is missed, record the measured value and the specific remaining
   bottleneck rather than adjusting the target. Do not close the package by
   moving the goalposts, and do not reach for a prohibited lever (test deletion,
   threshold reduction, coverage narrowing) to close the gap.
4. Update NFR-012's stated suite baseline if slice D changed the file count
   (case count must be unchanged at ~1498; file count may rise from splits).
5. Confirm DEC-155's Impact bullets match what actually shipped; correct any
   bullet that describes something the implementation did differently.

## Measured results

Source of truth: run `31134177316` — the first fully green run on healthy
infrastructure. Earlier runs on this branch are unusable as measurements: a
GitHub Actions incident (2026-08-06 15:22Z onward) failed jobs in `Set up job`
with `Failed to resolve action download info`, before any repo code executed,
and inflated one shard on run `31114869983` to 6m06s against 1m20s siblings.

| Metric | Baseline | Measured | Target | Verdict |
| --- | --- | --- | --- | --- |
| PR gate wall | 3m57s | **1m58s** | < 2m00s | met, 2s margin |
| Deploy job duration | 4m41s | pending first `main` run | < 1m30s | on track |
| Time-to-deployed | ~4m41s | pending first `main` run | < 3m00s | on track |
| Frontend cases / files | 1227 / 115 | **1227 / 124** | cases unchanged | met |
| Backend cases / files | 271 / 23 | **271 / 23** | cases unchanged | met |

Gate job breakdown (critical path = slowest shard + merge):

```
static             45s        shard 1/3   86s  (66s tests + 17s setup)
backend            38s        shard 2/3   90s  (69s tests + 17s setup)
coverage-merge     23s        shard 3/3   68s  (48s tests + 16s setup)
```

Shard spread is **1.32x** (90s/68s), confirming slice D's recorded 1.33x on
clean infrastructure.

**The < 2m00s target is met but marginal — 2s of headroom.** Recorded here
rather than smoothed over: an unlucky runner breaches it. The remaining
bottleneck is a ~45s floor that sharding cannot cross (17s shard setup + 23s
`coverage-merge` + scheduling), of which ~34s is `checkout + setup-node +
npm ci` paid twice. `coverage-merge` spends 17s of its 23s on setup to do 3s of
real merging.

## Acceptance criteria

- [x] PR gate wall time **< 2m00s** — **1m58s** on run `31134177316` vs 3m57s
      baseline. Met with 2s margin; see the marginality note above
- [ ] Deploy **job** duration **< 1m30s** — **pending first `main` run.** The
      `deploy` job is `if: push && ref == refs/heads/main`, so it is `skipped`
      on every PR run, including PR 82 (base `feature/ui-review`). Structurally
      on track: the duplicated 3m22s gate is gone, leaving setup + build (12s) +
      deploy (37s)
- [ ] **Time-to-deployed** (push on `main` → deploy job complete) **< 3m00s** —
      **pending first `main` run.** Must be read as gate + deploy job on a real
      `main` push, never reported as the job duration alone
- [x] Frontend cases **1227**, backend cases **271** — identical to baseline.
      File counts rose 115 → 124 (frontend) from slice D's assertion-preserving
      splits; backend unchanged at 23
- [x] `git diff origin/feature/ui-review -- apps/frontend/vite.config.ts
      apps/backend/vitest.config.ts` shows no threshold value changed — the
      frontend diff is `environmentMatchGlobs` plus comments only, and the
      `thresholds` blocks are byte-identical on both branches
- [x] `npm --workspace apps/backend run test:eval` green (exit 0, 2 cases);
      `git diff origin/feature/ui-review -- apps/backend/src/eval/` is empty
      (NFR-009 untouched)
- [x] Deploy still cannot start unless gate jobs succeed — `needs: [static,
      backend, coverage-merge]`; on run `31134177316` `deploy` reports
      `skipped` only after all three succeeded
- [x] `id-token: write` job-scoped — present only under `deploy:`, with
      top-level `permissions: contents: read`;
      `VITE_FEEDBACK_FORMSPREE_ID` appears only on the `Deploy` step
- [x] `npm run quality:check` unchanged in `package.json` and green — exit 0
      locally; script string is still
      `typecheck && lint && format:check && coverage:check && test:scripts`.
      The only `package.json` change is the `yaml@2.9.0` devDependency added for
      the CI workflow-parity guard, present in `package-lock.json`
- [x] NFR-012 and DEC-155 reflect what shipped; router line for DEC-155 present
      in `PRD/sections/decisions.md`, ordered after DEC-154

## Verification

```bash
# final timings
gh run list --limit 10 --json workflowName,conclusion,createdAt,updatedAt

# gates intact
npm run quality:check
npm --workspace apps/backend run test:eval
git diff origin/feature/ui-review -- apps/frontend/vite.config.ts apps/backend/vitest.config.ts
git diff origin/feature/ui-review -- apps/backend/src/eval/
```

## Shard-count scaling rule (new durable truth)

Derived from run `31134177316`. The gate's wall time is:

```
gate ≈ 45s + (1.32 × T) / N        T = total frontend test seconds, N = shards
```

The 45s constant is fixed overhead sharding cannot remove. Solving for a 120s
budget gives a ceiling of **~199s of frontend test work at N=3**; the measured
total is 183s, so **roughly 100 additional frontend cases exhaust 3 shards**.
The practical rule is `N ≥ frontend_cases / 440`:

| Frontend cases | Shards |
| --- | --- |
| 1227 (today) | 3 — at the edge |
| ~1330 | 4 |
| ~1770 | 5 |
| ~2650 | 6+ |

Raising `N` is a one-line matrix change and does not affect correctness:
`coverage-merge` already applies thresholds once to merged blobs regardless of
`N`. Cost is 17s of duplicated setup per added runner.

Sharding is the right lever only while test execution dominates the 45s floor.
Past roughly N=6 the better lever is **running only affected tests**
(`vitest --changed` or an affected-graph), which scales with change size rather
than suite size. Recorded so the ceiling is not rediscovered by surprise.

## GitHub Actions cost exposure (new durable truth)

`ChrisMiho/TheJudge` is a **public** repository, so standard-runner minutes are
free and unlimited — sharding currently costs nothing. The binding limit is
**concurrent jobs** (20 on the Free plan); this workflow uses 6.

The exposure to record: **billing rounds every job up to the nearest minute.**
If this repository is ever made private, the current 1m58s run bills **9
minutes** (`1+1+2+2+2+1`), not 2 — against a 2,000 min/month Free private
allowance, ~222 runs. Sharding trades billed minutes for wall time, so it is
free today and the largest cost multiplier the day visibility changes. Verify
against GitHub's published limits before relying on these figures.

## PRD promotion checklist

Execution happens in `thejudge-cleanup`; this slice confirms the content is
correct and ready.

- [ ] `PRD/sections/non-functional-requirements.md` — NFR-012 gains the
      shard-count scaling rule and the public-repo/private-repo cost note above
      (amended in this slice; see Files touched)

- [ ] `PRD/sections/decisions/doc-process.md` — DEC-155 body matches shipped
      behavior
- [ ] `PRD/sections/decisions.md` — DEC-155 router index line present and
      ordered after DEC-154
- [ ] `PRD/sections/non-functional-requirements.md` — NFR-012 amended baseline,
      constraints, and notes are accurate
- [ ] `README.md` (root) — `quality:check` description still accurate as the
      canonical local gate
- [ ] No `system-map.md` entry (catalog tracks product subsystems, not repo CI
      tooling — consistent with DEC-044 / DEC-063 / DEC-064 / DEC-086 / DEC-155)
- [ ] `PRD/work/ci-quality-check-runtime/` ready to delete

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/ci-quality-check-runtime/` ready to
      delete

## Files touched

- `PRD/sections/non-functional-requirements.md` — NFR-012 frontend file count
  115 → 124 (cases unchanged at 1227), plus the shard-scaling rule and the CI
  cost-exposure note added to Notes
- `PRD/sections/decisions/doc-process.md` — DEC-155 Impact drift corrected: the
  jsdom bullet named three DOM-requiring files; the shipped
  `environmentMatchGlobs` pins four, adding
  `src/lib/theme/applyPalette.test.ts`
- `PRD/work/ci-quality-check-runtime/slice-e-verify-and-promote.md`
- `PRD/work/ci-quality-check-runtime/README.md` — slice E status and the
  measurement blocker
