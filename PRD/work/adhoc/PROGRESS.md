# Docs-refactor progress — the one place to look

The plan is `refactor-gameplan.md`. This file tracks **how far through it you are**.
Update the status boxes as runs finish. Graph runs delete their own work folder on
completion, so this file — not `PRD/work/STATUS.md` — is the durable progress board.

_Last updated: 2026-08-26._

---

## The five packages

| # | Package | Status | How it runs |
| --- | --- | --- | --- |
| 0 | Codebase health audit | ✅ **done** (PR #98) | graph run, read-only |
| 1 | Feature spec layer (Phase A/B/C) | 🟡 **in progress** — see below | graph runs + one manual session |
| 2 | Overnight-run tuning | ⬜ not started | mixed |
| 3 | Operator manual | ⬜ not started | manual |
| 4 | Plain-language standard | ⬜ not started | manual |

Package 4 is the only one that fixes the "I can't follow agent output" problem that
started all this. Don't let it fall off the end.

---

## Package 1, Phase A — the seven specs

One current-state spec per feature, smallest first. Each is one graph run that parks
at the **define gate** for you to review, then resumes to completion.

| # | Feature spec | Status | Landed as |
| --- | --- | --- | --- |
| 1 | `life-tracker` | ✅ **done** | PR #105, DEC-168 |
| 2 | `user-feedback` | ✅ **done** | PR #107 (work→base), #109 (base→main) |
| 3 | `trade-balancer` | ✅ **done** | PR #110 (work→base), #111 (base→main) |
| 4 | `scan` | ✅ **done** | PR #112 (work→base), #114 (base→main) |
| 5 | `quick-lookup` | ⬜ **next** | — |
| 6 | shared chrome | ⬜ not started | — |
| 7 | `in-depth` | ⬜ not started | — |

**Phase B** (audit every decision against the specs) can't start until all seven exist.
**Phase C** (retire the decision log) is a manual session — it edits `thejudge-*` skills,
which a graph run may not touch.

---

## Kickoff prompts — the remaining six specs (approach A)

One graph run per spec, each its own branch and PR. Run them **one at a time, in
this order**, each **in a fresh session checked out on an up-to-date `main`**. Do
**not** run `/graph-preflight` yourself — the driver dispatches it as node 1. Each
run parks at its define gate; review with `/graph-gate-review PRD/work/<slug>/`,
then resume with `/graph-run PRD/work/<slug>/`.

### The branch loop — do not skip the merge to main

A graph run marks itself COMPLETE once its **work branch merges into its base
branch** (`thejudge-auto/<slug>`). It does **not** reach `main` on its own — that
last hop is an owner PR, and nothing in the run reminds you. Skip it and the next
run branches off a `main` that lacks the prior spec and the DEC-168 template, and
it parks at the define gate on the wrong base (this is what happened to
`user-feedback-spec` on 2026-08-25).

So the loop per spec is:

1. Fresh session on current `main` → paste the kickoff prompt.
2. Run drives to its define gate → **you review** → resume → run opens its
   work→base PR and marks COMPLETE.
3. **Open and merge the base→main PR** (`thejudge-auto/<slug>` → `main`). This is
   the step that keeps `main` current. Run 1 did it (PR #98); life-tracker
   skipped it.
4. `git checkout main && git pull`, then start the next spec.

The seven specs coexist **on `main`**, which is where Phase B reads them. Do not
chain each spec off the previous branch — that builds a fragile stack and delays
`main` until Phase C.

**#2 — user-feedback**
```
/graph-run "Write the current-state feature spec for the user-feedback feature — Phase A #2 of the docs-refactor gameplan. Land it at PRD/sections/user-feedback/README.md on the DEC-168 template. Frontend-only, one external dependency, no server state. Consolidate current behavior; keep it draft and non-authoritative with decisions.md at precedence #1." PRD/work/adhoc/refactor-gameplan.md
```

**#3 — trade-balancer**
```
/graph-run "Write the current-state feature spec for the trade-balancer feature — Phase A #3 of the docs-refactor gameplan. Land it at PRD/sections/trade-balancer/README.md on the DEC-168 template. Frontend-only but it carries a corpus: apply the gameplan's data/ bucket test and split the corpus from the behavior. Keep it draft and non-authoritative." PRD/work/adhoc/refactor-gameplan.md
```

**#4 — scan**
```
/graph-run "Write the current-state feature spec for the scan feature — Phase A #4 of the docs-refactor gameplan. Land it at PRD/sections/scan/README.md on the DEC-168 template. Scan is cross-cutting — referenced by multiple destinations — so capture how it feeds each one, not just its own screen. Keep it draft and non-authoritative." PRD/work/adhoc/refactor-gameplan.md
```

**#5 — quick-lookup**
```
/graph-run "Write the current-state feature spec for the quick-lookup feature — Phase A #5 of the docs-refactor gameplan. Land it at PRD/sections/quick-lookup/README.md on the DEC-168 template. It runs the full backend path — prompt assembly, retrieval, and the provider boundary — so capture that flow, not just the UI. Keep it draft and non-authoritative." PRD/work/adhoc/refactor-gameplan.md
```

**#6 — shared chrome**
```
/graph-run "Write the current-state spec for the shared chrome — Phase A #6 of the docs-refactor gameplan. Land it at PRD/sections/shared-chrome/README.md on the DEC-168 template (confirm the directory name at the gate). This is the shared-chrome bucket: the shared layout language and chrome the feature specs kept reaching for, plus the screen-layout.md rows that belong to shared chrome rather than a single feature. Keep it draft and non-authoritative." PRD/work/adhoc/refactor-gameplan.md
```

**#7 — in-depth**
```
/graph-run "Write the current-state feature spec for the in-depth feature — Phase A #7, the last of the docs-refactor gameplan. Land it at PRD/sections/in-depth/README.md on the DEC-168 template. It is the largest and most entangled feature, so lean on the patterns the earlier six specs established. Keep it draft and non-authoritative." PRD/work/adhoc/refactor-gameplan.md
```

## Where to watch a run in flight

| You want to see… | Look at |
| --- | --- |
| Live progress of the current run | `PRD/work/<slug>/GRAPH-RUN.md` (the ledger) |
| The board of active packages | `PRD/work/STATUS.md` |
| A gate waiting on you | `## Open gate` in that run's `GRAPH-RUN.md` |
| What a finished run produced | `PRD/instructions/receipts/<slug>-<date>.md` |
| Overall progress on the refactor | **this file** |

When a run parks at a gate, resume it with `/graph-gate-review PRD/work/<slug>/`,
then `/graph-run PRD/work/<slug>/`.

---

## Open loose ends to settle (not blocking the next spec)

- **CODE-HEALTH.md**: the gameplan says every Phase A run emits one; DEC-168 doesn't
  require it and the life-tracker run didn't. Decide: write it into the process, or
  drop it from the plan.
- **True overnight batching** needs Package 2 (async markdown gate). Until then it's
  one spec per cycle: run → park at define gate → you review → resume → complete.
- **Base→main merge has no automation or reminder** (shakedown Q7, the branch-shape
  question). A run marks COMPLETE at its base branch; reaching `main` is a manual
  owner PR. Package 3 (operator manual) or Package 2 should make this step explicit
  so it can't be skipped again.
