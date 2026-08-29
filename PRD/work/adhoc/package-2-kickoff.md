# Kickoff — docs-refactor Package 2 (overnight-run tuning)

Paste the prompt below into a **fresh session on an up-to-date `main`**
(`git checkout main && git pull` first, so it sees PR #128 — Phase C).

Package 2 is **not** a `/graph-run` and **not** a sweep — it edits `graph-*`
skills, the graph contract, and `scripts/`, and a graph run may not patch the
machinery it runs on. It is an ordinary interactive session. Like Phase C it is
plan-first: it changes how every future overnight run behaves and touches real
code, so let it show you the plan — especially the scope split — before it edits
anything.

## Prerequisite: the tooling fixes ship first

The shakedown's five tooling defects (§4) are fixed in their own package before
this one — `PRD/work/adhoc/graph-tooling-fixes-kickoff.md`. Package 2 is pure
run-tuning and assumes it runs on the fixed enforcer. Do not re-open the defects
here; if one is still live, stop and finish that package first.

## The prompt

```
Package 2 of the docs-refactor — overnight-run tuning. This is an ordinary
interactive session, NOT a graph run and NOT a sweep (it edits graph-* skills,
the graph contract, and scripts/, which a graph run may not patch on itself).

Read first, in order:
- PRD/work/adhoc/refactor-gameplan.md — the Package 2 row plus the "Binding
  constraints" section, especially the run-mechanics rulings 11–14 (two runs /
  two PRs, the async markdown gate, the queue continues past a park but never
  past a failure, Phase A is calendar-bound). Every constraint there is settled;
  do not relitigate it.
- PRD/work/adhoc/PROGRESS.md — current state (Package 1 A/B/C done) plus the
  "Open loose ends" list (the CODE-HEALTH.md decision, true overnight batching
  needing this package, and the base→main merge having no automation/reminder).
- PRD/work/adhoc/graph-run-shakedown-report.md — the run evidence this package
  tunes against: the branch-shape question (Q7), node mistake 2 (the PR-diff
  slip), and the ordered next-steps (§5). The five §4 tooling defects are
  already fixed in the prior package; read them only as context.
- PRD/instructions/graph-workflow-contract.md — the contract being tuned, and
  the graph-* skills + scripts/graph-*.mjs / scripts/lib/boundary-rules.mjs it
  governs.

Then plan before touching anything and wait for my approval before editing. The
five graph tooling defects are already fixed in a prior package — this is pure
run-tuning; do not re-open them. Because this has real code and tests, prefer
running it as a proper interactive PRD/work/<slug>/ package (kickoff →
refinement → quality-check → map-out → implement), driven by hand rather than by
graph-run.

What Package 2 covers (gameplan scope):
- The two-run split (constraint 11): run one stops at quality-check PASS with the
  package refined, a docs-only PR, and a questions file; run two is
  /graph-run PRD/work/<slug>/. The only contract change is the stop condition —
  the node table and every boundary stay unchanged.
- The async markdown gate (constraint 12): gates are answered in a markdown file
  with answer slots, not walked live; the run parks and ends, and I answer on my
  own schedule.
- A morning digest: a readable summary of what the night's run(s) did.
- Merge-safe ordering and the branch shape (Q7 / constraint 13): the base→main
  hop with no reminder, and the single-path run lock (sequential only).
- The loose ends from PROGRESS: decide CODE-HEALTH.md (write it into the process
  or drop it) and make the base→main merge step impossible to skip.

Hard guardrails (from the gameplan and the shakedown):
- Do not relitigate constraints 11–14. The node table and every boundary are
  unchanged; only the stop condition and the gate's answer mechanism move.
- Every defect fix is backed by a test, not a prompt.
- Expect friction from the graph-boundary hook itself — it denies remote-branch
  deletion and denies prose that merely names a denied command inside a heredoc
  (that heredoc false-positive is defect 5, one of the things to fix).
- PR to main, never push to the trunk — I merge.
```

## How it runs

Not a graph run: Package 2 rewrites the graph lifecycle and the enforcer, and a
run is forbidden from patching its own machinery (the same reason Phase C was
manual). Drive it by hand. It carries real code and tests, so it fits the full
interactive `thejudge-*` lifecycle better than a light plan-first pass — but the
scope split is the first decision, so let the session bring you the plan before
it commits to either shape.
