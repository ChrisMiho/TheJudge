# Docs-refactor progress — the one place to look

The plan is `refactor-gameplan.md`. This file tracks **how far through it you are**.
Update the status boxes as runs finish. Graph runs delete their own work folder on
completion, so this file — not `PRD/work/STATUS.md` — is the durable progress board.

_Last updated: 2026-08-29._

---

## The five packages

| # | Package | Status | How it runs |
| --- | --- | --- | --- |
| 0 | Codebase health audit | ✅ **done** (PR #98) | graph run, read-only |
| 1 | Feature spec layer (Phase A/B/C) | ✅ **done** — Phase A ✅, Phase B ✅, Phase C ✅ | graph runs + one manual session |
| 2 | Overnight-run tuning | ✅ **done** (PR #133; cleaned up in #134/#135) | interactive (not a graph run) |
| 3 | Operator manual | ✅ **done** (PR to `main`) | manual |
| 4 | Plain-language standard | ✅ **done** (PR to `main`) | manual (not a graph run) |

All five packages are done — the whole docs-refactor arc from the brain dump is
finished. Package 4 fixed the "I can't follow agent output" pain; Package 3 (the
operator manual) came last on purpose, documenting what every other package
settled.

**Prerequisite before Package 2 — graph tooling fixes ✅ done (PR #131 / #132).**
The first autonomous run surfaced five live defects in the graph enforcer/preflight
(two could leave the safety tier silently off). They were fixed as their own
code+tests package and merged, so Package 2 is unblocked. Evidence:
`adhoc/graph-run-shakedown-report.md` §4.

---

## Package 1, Phase A — the seven specs ✅ complete

One current-state spec per feature, smallest first. Each was one graph run that parked
at the **define gate** for review, then resumed to completion. **All seven are on `main`.**

| # | Feature spec | Status | Landed as |
| --- | --- | --- | --- |
| 1 | `life-tracker` | ✅ **done** | PR #105, DEC-168 |
| 2 | `user-feedback` | ✅ **done** | PR #107 (work→base), #109 (base→main) |
| 3 | `trade-balancer` | ✅ **done** | PR #110 (work→base), reached `main` |
| 4 | `scan` | ✅ **done** | PR #114 |
| 5 | `quick-lookup` | ✅ **done** | PR #116 (work→base), #117 (base→main) |
| 6 | shared chrome | ✅ **done** | PR #118 (work→base), #119 (base→main) |
| 7 | `in-depth` | ✅ **done** | PR #120 (work→base), #121 (base→main) |

## Package 1, Phase B — audit + apply ✅ complete

Audited all 156 `Status: confirmed` decisions across the 18 domain files against the
seven specs, one verdict each (`absorbed` / `partial` / `not-absorbed` / `obsolete`),
via the `thejudge-sweep` skill. Then dispositioned every non-clean verdict and applied
the fixes. Deletes nothing — the verdicts are Phase C's deletion map.

| Piece | Status | Landed as |
| --- | --- | --- |
| Audit + disposition grid | ✅ **done** | PR #124 — `PRD/work/sweep-decision-audit/` (verdicts + `DISPOSITION.md`) |
| Applied fixes (27 decisions into specs/docs) | ✅ **done** | PR #125 — 15 fix-spec + 12 fix-doc |

Verdict split: **122 absorbed · 13 partial · 18 not-absorbed · 3 obsolete**.
Dispositions: 15 fix-spec + 12 fix-doc applied; 4 out-of-scope (Cursor retired, Lambda
pending); 3 obsolete left as-is. `PRD/work/sweep-decision-audit/` was the deletion
map; Phase C consumed and deleted it.

## Package 1, Phase C — retire ✅ complete

A manual, plan-first interactive session (not a graph run or a sweep). Flipped
precedence so the 7 specs are truth and `decisions.md` dropped to a demoted #2
historical index; deleted every decision body (the 17 per-domain files) except
the two Lambda survivors **DEC-084 / DEC-169** in `decisions/deployment.md`;
kept all 169 router index rows so every `DEC-ID` still resolves (the ~1,522
content citations were left untouched by design); rewrote the decision-writing
step across the skills **and** the instruction files that carry it
(`requirement-format.md` template, `doc-lifecycle.md`, `agent-working-rules.md`,
`writing-rules.md`, `technical-design-rules.md`, `graph-workflow-contract.md`);
reframed the define gate's example at REQ IDs; and repointed the handful of live
citations that named a deleted file path.

| Piece | Status | Landed as |
| --- | --- | --- |
| Retire the decision log | ✅ **done** | PR (docs/phase-c-retire-decision-log) — receipt `docs-refactor-phase-c-2026-08-28.md` |

`PRD/work/sweep-decision-audit/` was the deletion map; consumed and deleted as
part of this phase. The plan is recorded at `PRD/work/adhoc/phase-c-plan.md`.

## Package 3 — the operator manual ✅ complete

A manual, plan-first interactive session (not a graph run or a sweep). Fixed the
founding pain from the owner's side: there was no owner-facing "I want to do X →
here is the one command and what I'll be asked" doc — only `AGENT-SKILLS.md`, which
is written for agents. New top-level `OPERATOR.md` holds task-recipes in one fixed
shape (You want to · Do · You'll be asked · Your touch points · Done when) for all
eight tasks: start a feature, file a bug/add scope, run overnight, review a gate,
the base→main merge, resume a park, run a sweep, run a manual package. Written to
the plain-language standard Package 4 shipped — its first real consumer. Every
command was verified against the skill it names before writing (document reality,
not the ideal). Fixed the `PRD/README.md` graph-run line, which had presented the
resume form (`/graph-preflight` then `/graph-run PRD/work/<slug>/`) as the general
path — the fresh-run default is one command, `/graph-run "<request>"`. Added a
one-line `OPERATOR.md` pointer from both `README.md` and `PRD/README.md`.

| Piece | Status | Landed as |
| --- | --- | --- |
| Operator manual + doc-bug fix + pointers | ✅ **done** | PR (docs/package-3-operator-manual) — receipt `docs-refactor-package-3-2026-08-29.md` |

The plan is recorded at `PRD/work/adhoc/package-3-plan.md`.

## Package 4 — the plain-language standard ✅ complete

A manual, plan-first interactive session (not a graph run or a sweep). Fixed the
founding pain: every owner-facing artifact an agent writes now opens with a
plain-language block — lead with the ask, inline the substance of any `DEC`/`REQ`
it cites, product terms before technical ones. New
`PRD/instructions/plain-language-standard.md` holds the four rules, the
per-artifact header table, and a worked before/after on a real gate question
(`REQ-134`). Embedded across six fronts: gate questions
(`graph-workflow-contract.md`, `graph-run`, `graph-gate-review`), PR bodies
(`graph-run`, `thejudge-implement-all`), receipts and status boards
(`thejudge-cleanup`, `graph-run`), and in-session/subagent output (`CLAUDE.md`,
`agent-working-rules.md`, `writing-rules.md`). Forward-only. All four edited
skills re-synced byte-identical to `.agents/skills/`.

| Piece | Status | Landed as |
| --- | --- | --- |
| Plain-language standard + six embeds | ✅ **done** | PR (docs/package-4-plain-language-standard) — receipt `docs-refactor-package-4-2026-08-29.md` |

The plan is recorded at `PRD/work/adhoc/package-4-plan.md`.

---

## Kickoff prompts — the seven specs (approach A) ✅ all run

_All seven specs have landed on `main`; this section is kept as a record of how they
were run and is no longer pending work._

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

- **CODE-HEALTH.md** — ✅ resolved (Package 2): dropped from the plan. It was
  never load-bearing — DEC-168 never required it and only the Package 0 audit
  produced one — so the gameplan no longer asks each run to emit one.
- **True overnight batching** — ✅ delivered by Package 2's async markdown gate:
  run one stops at quality-check PASS with a questions file and a docs PR; you
  answer on your own schedule; run two implements.
- **Base→main merge** — ✅ resolved by Package 2: run one opens the
  `thejudge-auto/<slug> → main` PR up front (so it always exists), and
  `graph-preflight` refuses the next fresh run while a prior base→main PR is still
  open. The morning digest (`npm run graph:digest`) also lists any pending one.
