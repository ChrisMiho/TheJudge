# Receipt — graph tooling fixes (prerequisite before Package 2)

- **Date:** 2026-08-28
- **Slug:** `graph-tooling-fixes`
- **Status:** shipped
- **Type:** tooling + documentation — patches the graph enforcer and preflight
  and the graph workflow contract, plus tests. Ran as an ordinary interactive
  session, not a graph run: a run may not patch the machinery it loads.
- **PR:** [#131](https://github.com/ChrisMiho/TheJudge/pull/131), merged to
  `main` (merge commit `c1c87e6`).

## What shipped

The five tooling defects the 2026-08-23 graph-run shakedown found are all fixed
in committed code, and each now carries a regression test.

On audit, four of the five already had code fixes from prior PRs (#99, #101,
#104): the lock is now taken in code (`takeLock`), both hook tiers are proven at
startup (the `nohup true` graph canary), lock release has a permitted path
(`.graph-run-release.json`), and heredoc bodies are no longer misread by the
command normalizer. Two gaps remained and this package closed them:

- **Defect 3 (the one live defect).** Evidence was earned per run, not per step,
  so the `plan` node's file listings satisfied 7 of 21 criteria before `build`
  began. Earning is now gated to the `build` node (`EVIDENCE_EARNING_NODE`); the
  flip guard still fires in every node, so gating cannot let a non-build node
  forge a pass. The owner's design call was to state the "proves it ran, not that
  it passed" limit honestly for all checks rather than build `PostToolUse`
  outcome-capture — the latter is deferred to its own package.
- **Defect 5 (missing test).** The heredoc false-positive fix had shipped in #101
  with no test at all. Backfilled with two guards through the real hook payload.

## Actions taken

- Fixed defect 3 in code, test-first (failing test → gate → green).
- Backfilled the defect-5 regression test.
- Extended the graph workflow contract to record the per-step earning gate and
  broaden the ran-not-passed limit from `manual`-only to every check.
- Confirmed defect 4 / Q5's shipped resolution (permitted release path) stands.

## Files

Created:
- `PRD/instructions/receipts/graph-tooling-fixes-2026-08-28.md` (this receipt)

Updated (via PR #131):
- `scripts/lib/boundary-rules.mjs` — `EVIDENCE_EARNING_NODE` constant
- `scripts/graph-boundary-hook.mjs` — earn evidence only during `build`
- `scripts/graph-boundary-hook.test.mjs` — 3 defect-3 tests + 2 defect-5 tests
- `PRD/instructions/graph-workflow-contract.md` — per-step gate + ran≠passed limit

Deleted:
- `PRD/work/graph-tooling-fixes/` (DESIGN-BRIEF.md, STATUS.ship-ready) — folder
  removed at cleanup; the durable record is this receipt and the merged code.

## Verification

- `npm run test:scripts` → **407 pass, 0 fail.**
- Heredoc guard proven meaningful: driving `splitSegments` directly shows the
  `; nohup` inside the heredoc body stays one segment, so removing the fix would
  split it into a `nohup` head and deny — the test would catch the reversion.

## Out of scope (named, not fixed)

- **Q3 outcome-capture** — a `PostToolUse` evidence model; separate package.
- **Retry-after-block** — Claude Code's own permission classifier, above the hook
  (shakedown Q6, an upstream report).
- **Branch-shape / PR-diff slip** — Package 2's merge-safe-ordering work
  (shakedown Q7).
