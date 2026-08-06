# Slice E — Verify targets end to end and promote PRD truth

## Status: planned

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

## Acceptance criteria

- [ ] PR gate wall time **< 2m00s**, measured on a real run and recorded here
      alongside the 3m57s baseline
- [ ] Deploy **job** duration **< 1m30s**, measured and recorded alongside the
      4m41s baseline
- [ ] **Time-to-deployed** (push on `main` → deploy job complete) **< 3m00s**,
      recorded separately. Deploy is now serialized behind the gate, so this is
      gate + deploy job, not the job alone — do not report the job duration as
      if it were time-to-deployed
- [ ] Frontend cases **1227**, backend cases **271** — identical to baseline
- [ ] `git diff origin/feature/ui-review -- apps/frontend/vite.config.ts
      apps/backend/vitest.config.ts` shows no threshold value changed
- [ ] `npm --workspace apps/backend run test:eval` green; the eval harness and
      its goldens are untouched in the diff (NFR-009)
- [ ] Deploy still cannot start unless gate jobs succeed — re-confirmed on a
      real run
- [ ] `id-token: write` job-scoped; `VITE_FEEDBACK_FORMSPREE_ID` build-step-only
- [ ] `npm run quality:check` unchanged in `package.json` and green
- [ ] NFR-012 and DEC-155 reflect what shipped; router line for DEC-155 present
      in `PRD/sections/decisions.md`

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

## PRD promotion checklist

Execution happens in `thejudge-cleanup`; this slice confirms the content is
correct and ready.

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

- `PRD/sections/non-functional-requirements.md` (only if slice D changed file
  counts)
- `PRD/sections/decisions/doc-process.md` (only to correct drift)
- `PRD/work/ci-quality-check-runtime/slice-e-verify-and-promote.md`
