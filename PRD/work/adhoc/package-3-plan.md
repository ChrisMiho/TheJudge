# Package 3 plan — the operator manual

The last package of the docs-refactor gameplan. A manual, plan-first interactive
session. It comes last on purpose: it documents what every other package settled,
and it is **written to the plain-language standard** Package 4 just shipped
(`PRD/instructions/plain-language-standard.md`) as that standard's first real
consumer.

## Who it's for and why

The owner, driving the system. `AGENT-SKILLS.md` already documents how the skills
chain — but that is a reference *for agents*. There is no owner-facing "I want to
do X → here is the one command and what I'll be asked" doc. That gap is this
package. It fixes the founding pain from the same angle as Package 4: the owner
should never have to read the skill internals to operate the system.

## Where it lives — recommended

New top-level **`OPERATOR.md`** — the owner-facing counterpart to
`AGENT-SKILLS.md` (same shelf, opposite audience). Add a one-line pointer to it
from `README.md` and `PRD/README.md`. (Owner may relocate under `PRD/`.)

## Form

Task-recipes, not reference. Every recipe has the same fixed shape, obeying the
plain-language standard:

> **You want to:** … · **Do:** `<command>` · **You'll be asked:** … ·
> **Your touch point(s):** … · **Done when:** …

## The recipes to write (scope: all confirmed 2026-08-29)

1. **Start a new feature / idea** — `/graph-run "<request>"`. One command, drives
   the whole lifecycle, parks once at the gate. The fresh-run default.
2. **File a bug / add scope** — into an `active` package via `thejudge-amend`;
   standalone via `/graph-run "<bug>"`. State when to use which.
3. **Run overnight / unattended** — launch with the graph permission profile
   (`claude --settings .claude/graph-profile.json`), pacing via the loop; **stop a
   run** by creating `.worktrees/.graph-stop`. What to expect unwatched.
4. **Review a gate** — `/graph-gate-review PRD/work/<slug>/` when a run parks at
   the define gate; accept/edit/reject per item, then it resumes.
5. **The base→main merge** — the recurring gotcha: a run stops COMPLETE at its
   *base* branch; the owner must open **and merge** the base→main PR to reach
   `main`. Skipped twice recently — call it out loudly.
6. **Resume a parked run** — `/graph-run PRD/work/<slug>/`.
7. **Audit a corpus** — `/thejudge-sweep` (verdict per item, one review at the
   end). The off-graph investigate-and-report door.
8. **Run a manual package** — a plan-first interactive session, for work that
   edits the skills themselves (like Phase C and Package 4).

## The doc bug to fix (named in the gameplan)

`PRD/README.md:130` presents `/graph-preflight then /graph-run PRD/work/<slug>/`
— the mid-lifecycle *resume* case — as the general path. Correct it: the fresh-run
default is one command, `/graph-run "<request>"`; separate preflight is the
exception. Keep the manual and this line consistent.

## Closeout

One PR to `main` (the owner merges), a receipt written **to the plain-language
standard**, mark Package 3 done on `PROGRESS.md`. That completes the entire
docs-refactor gameplan — all five packages.

## Guardrails

- Manual interactive session — the kind allowed to edit skills/instructions if
  needed. No graph run, no sweep.
- PR to `main`; the owner merges. Never push.
- Document **reality**, not the ideal — verify each command against the skill it
  names before writing the recipe.
