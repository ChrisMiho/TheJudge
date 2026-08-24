# Graph run — life-tracker-spec

- Run ID: `graph-20260824-082911`
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (rm -rf .worktrees/<nonexistent>)`; graph tier: `denied — tier armed (nohup, lock held)`
- Autonomous base: `origin/thejudge-auto/life-tracker-spec`
- Staging: `.worktrees/.graph-intake/graph-20260824-082911/` (copied into `PRD/work/life-tracker-spec/intake/`, staged copy deleted)
- Current node: `define` — parked at the gate
- Next action: `/graph-gate-review PRD/work/life-tracker-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | `git switch -c thejudge-auto/life-tracker-spec main`; `git push -u origin thejudge-auto/life-tracker-spec`; base resolved `main`; classification `clean`, no stash; `Profile: loaded (env sentinel)`; `CANARY_COMMAND` denied (`'rm -rf' is denied in every session`); `GRAPH_CANARY_COMMAND` denied (`'nohup' is denied while a graph run holds the lock`); lock `free` → taken at `.worktrees/.graph-run.lock` | 2026-08-24 |
| 2 | shape | sonnet | ok | `0 → 29` | commit `ec08424` on `thejudge-auto/life-tracker-spec`, pushed; `PRD/work/life-tracker-spec/IDEA.md`, `README.md`, `STATUS.ideation`, `intake/refactor-gameplan.md`; board row added under `## ideation` in `PRD/work/STATUS.md`; staged intake deleted (`.worktrees/.graph-intake/graph-20260824-082911/` absent); prior-run matches `PRD/instructions/receipts/player-life-tracker-2026-08-03.md`, `PRD/instructions/receipts/player-life-tracker-refinement-2026-08-05.md` | 2026-08-24 |
| 3 | define | opus | ok — gate | `0 → 41` | commit `a6c4aec` on `thejudge-auto/life-tracker-spec`, pushed; `PRD/work/life-tracker-spec/DESIGN-BRIEF.md`; `PRD/sections/decisions/doc-process.md` + `PRD/sections/decisions.md` (DEC-168); `git diff main...HEAD -- PRD/sections/` non-empty -> parked at the `define` gate; `STATUS.refined` -> `STATUS.owner-action` | 2026-08-24 |

## Open gate

**Question for the owner:** node 3 (`define`) wrote to `PRD/sections/`. Every
line of that diff is product truth nobody has read yet, so the run parks here
before any code is written against it. Walk the diff one stable ID at a time
and accept, edit, or reject each item.

**New stable IDs introduced:** `DEC-168` (one). No `REQ-`, `NFR-`, `FLOW-`, or
`Q-` was added, edited, renumbered, or retired.

**What DEC-168 asks for, in plain terms:** a new kind of document -- a
current-state feature spec at `PRD/sections/<feature>/README.md` -- that reads
as one page describing what a feature does today, instead of a chain of
decisions describing every change ever made to it. It is explicitly a derived
view: `sections/decisions.md` keeps precedence #1, and the cited `DEC`/`REQ`/
`FLOW` wins any conflict with the spec. It defines the template and lands
exactly one instance, `PRD/sections/life-tracker/`. It retires nothing and
renumbers nothing.

**Evidence -- the complete `PRD/sections/` diff** (`git diff main...HEAD -- PRD/sections/`):

```diff
diff --git a/PRD/sections/decisions.md b/PRD/sections/decisions.md
index 77a7e47..566c58b 100644
--- a/PRD/sections/decisions.md
+++ b/PRD/sections/decisions.md
@@ -196,3 +196,4 @@ See `instructions/doc-lifecycle.md` for the authoritative lifecycle rule.
 | DEC-165 | `decisions/doc-process.md` | TheJudge drops Cursor and supports two runtimes: `.cursor/` is deleted, `.claude/skills/` becomes the canonical skill tree, and `npm run skills:ai-sync` mirrors it to `.agents/skills/` for Codex. Supersedes DEC-115's canonical-editing clause; narrows DEC-164's protected set to two trees. |
 | DEC-166 | `decisions/doc-process.md` | Graph boundaries move from the launch-flag permission profile into a committed `PreToolUse` hook that fires in every session and inside every dispatched subagent, enforcing a universal tier always and the graph tier while the run lock is held. The same hook carries an owner kill switch halting at the node boundary with the lock released, a per-dispatch tool-call cap that parks on overrun, and default-FAIL slice criteria that cannot flip to `true` without an observed evidence read — plus the raw-Bash, `nohup`, and background-`&` writes no permission rule can reach. A run refuses to start on a hook whose canary deny does not fire and rechecks liveness at every node boundary. Node 7 replaces `superpowers:requesting-code-review` with a no-write reviewer graded against the slice's own criteria, and the no-pre-authorization rule is re-read before every dispatch. `.claude/graph-profile.json` is kept as a second layer. Extends DEC-163 and DEC-164 without removing any boundary. |
 | DEC-167 | `decisions/doc-process.md` | `graph-run` becomes TheJudge's single intake door. `--branch` becomes optional and is derived as `thejudge-auto/<slug>` from a door-proposed slug that node 2 then reuses; the door accepts context documents, copying them verbatim into `PRD/work/<slug>/intake/` as evidence that never binds refinement; node 2 links prior shipped runs from the receipts corpus; a request too thin to package ends the run at `BLOCKED`; and cleanup folds intake into the receipt. `thejudge-prepare` is retired as an entry point but keeps its skill, its contract, and its controlling predicate. Extends DEC-163 and DEC-166 without changing the node table, the `define` gate, or any boundary; the one definition it amends is `graph-run`'s `BLOCKED`, widened to cover a request too thin to package. The package is implemented in an ordinary session, because a graph run may not edit `thejudge-*` skills. |
+| DEC-168 | `decisions/doc-process.md` | A current-state feature-spec layer lands at `PRD/sections/<feature>/README.md` on a fixed template — a derived, explicitly non-authoritative view consolidating what a feature does today out of the decision log, requirements, flows, system map, and screen layout. Precedence is unchanged: `decisions.md` stays #1 and the cited DEC/REQ/FLOW wins any conflict. Defines the shape and lands one instance, `sections/life-tracker/`. Extends DEC-044/DEC-048/DEC-063; retires and renumbers nothing. |
diff --git a/PRD/sections/decisions/doc-process.md b/PRD/sections/decisions/doc-process.md
index f769cf6..140e20a 100644
--- a/PRD/sections/decisions/doc-process.md
+++ b/PRD/sections/decisions/doc-process.md
@@ -345,3 +345,25 @@ PRD documentation tooling: system-map catalog, detail files, the decisions.md ro
   - "evidence, not authority" is a contract rule, not an enforced one. No mechanism prevents refinement adopting an intake claim wholesale; what catches it is the `define` gate, which parks on any resulting `PRD/sections/` diff for the owner to walk one stable ID at a time
   - no size gate is placed on intake, because a gate would refuse exactly the thorough handoff document this accepts. Node 1's own thresholds — 10 files, 200 changed lines — are a size gate the first pass of this design did not account for; staging outside the working tree is what keeps them off the intake path
   - `docs/whatIsGraph/` is deliberately not committed here; sweeping untracked working material into the repository stays the owner's call
+
+### DEC-168
+- Decision: TheJudge adds a **current-state feature-spec layer** under `PRD/sections/<feature>/`, one directory per player-facing feature, whose entry point is `README.md` written to a fixed template. A feature spec is a **derived, non-authoritative view**: it consolidates what a feature does *today* out of the decision log, `functional-requirements.md`, `user-flows.md`, `system-map.md`, and `screen-layout.md` so an owner can read one document instead of replaying a supersession chain. It carries an explicit draft marker naming the cited `DEC`/`REQ`/`FLOW` as the winner on conflict, so `sections/decisions.md` keeps precedence #1 and Read-First #1 unchanged. This decision defines the shape and lands exactly **one** instance, `PRD/sections/life-tracker/` for the Player Life Tracker; it does not commit any other feature to a spec, retire or reorder any decision, or change any `DEC`/`REQ`/`FLOW` body.
+- Status: confirmed
+- Context: Product truth for a single feature is split across six sources. The Player Life Tracker alone is DEC-101, DEC-102, DEC-103, DEC-132, DEC-136, DEC-139 across two domain files, REQ-081–085 plus REQ-111 and REQ-112, FLOW-013, a `system-map.md` subsystem entry, and a `screen-layout.md` screen row. A decision records *a change*, so current truth is the sum of a supersession chain — DEC-136 replaced DEC-101's edge tap zones with half-card zones and DEC-139 replaced the counter panel's bottom-sheet geometry, while REQ-112 still reads as live truth for a band that no longer exists. The owner cannot follow their own product documentation without an agent translating it, which makes reviewing agent work impossible. Writing the consolidated view is the fix; demoting the decision log is not, and is deliberately not attempted here. The structural pattern is already established twice: DEC-048 put a depth layer under `sections/system-map/` behind a fixed template, and DEC-063 split decision bodies into `sections/decisions/`.
+- Impact:
+  - documentation and process only: no `apps/` code, `POST /api/ask-ai` request/response, prompt-assembly, or UI behavior change, and no change to shipped Player Life Tracker behavior
+  - a feature spec lives at `PRD/sections/<feature>/README.md`; the directory is the feature and may gain further files later without a rename
+  - the spec follows a fixed template: a `Status:` draft/precedence marker, a `Backed by:` line listing every consolidated `DEC`/`REQ`/`FLOW`/`NFR` ID, **What it is** (one paragraph in player terms), **How it works** (player-facing behavior grouped by surface, each behavior carrying a `Built:` marker), **Measured bounds**, **Rejected alternatives and deferred scope**, and **Where it lives** (coarse code location, deferring to `system-map.md`)
+  - precedence is unchanged: `sections/decisions.md` stays #1 and Read-First #1, and the spec's own marker states that a cited `DEC`/`REQ`/`FLOW` wins any conflict with the spec. A spec that comes out wrong is corrected against a source that still exists
+  - a behavior enters the spec only in its current form. A superseded behavior is not narrated; the supersession is recorded, when it is load-bearing, as a closed door under **Rejected alternatives and deferred scope**
+  - a measured bound travels with the behavior it constrains **if that surface still exists**. A bound whose surface was replaced is dropped and named as a closed door; an ambiguous bound stays and is flagged in the spec. Concretely: the ≈53px commander-damage band (REQ-112) survives, the ≈67px life-adjustment edge band (REQ-112) does not, because DEC-136 replaced edge bands with half-card zones
+  - no source is moved, deleted, retired, reordered, or renumbered. `screen-layout.md`'s Player Life Tracker row stays authoritative under DEC-149/REQ-126 and is cited, not relocated; `system-map.md` keeps its four-field shallow shape and gains no `Details:` pointer, because a feature spec is a player-facing view and not a DEC-048 subsystem detail file
+  - `PRD/README.md` gains one Section Inventory row for the new directory; that is navigation only
+  - `open-questions.md` is untouched
+- Related requirements:
+  - (none — documentation and process decision; no functional requirement is added or changed)
+- Notes:
+  - extends DEC-044, DEC-048, and DEC-063; supersedes nothing
+  - the layer is deliberately additive and reversible. Deleting `PRD/sections/life-tracker/` and its `PRD/README.md` row returns the corpus to its prior state, because no source document was edited to make room for it
+  - flipping precedence to the spec layer, auditing decisions against specs, and retiring absorbed decisions are separate future work and are **not** authorized by this decision
+  - later features may reuse this template; this decision requires no other feature to adopt it
```

**Resume command:**

```
/graph-gate-review PRD/work/life-tracker-spec/
```

Once the gate is resolved, the run re-enters at `gate-qc`.

## Dispatch prompts

### preflight

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260824-082911
Slug: life-tracker-spec
Package path (not yet created — node 2 creates it): PRD/work/life-tracker-spec/

You are node 1 of an autonomous graph run: `preflight`. Invoke the `graph-preflight` skill with the Skill tool and follow it exactly, start to finish. Read `PRD/instructions/graph-workflow-contract.md` first, as that skill instructs.

Invocation to carry out: `/graph-preflight --branch thejudge-auto/life-tracker-spec --run-id graph-20260824-082911`

Copy the `Working directory:` line above, unchanged, into every prompt you write.

Report back, verbatim where the skill says verbatim:
- the `profile sentinel:` and `Profile:` lines the script prints
- the lock classification reported by `takeLock()` / `classifyLock()`
- the `classifyCanary()` ledgerLine for `CANARY_COMMAND` (issue it as a real Bash tool call and require a deny)
- the `classifyGraphCanary()` ledgerLine for `GRAPH_CANARY_COMMAND`, issued after the lock is taken and requiring a deny
- the dry-run classification (`clean` / `commit` / `stash` / `blocked`), the resolved `base:` line, and the planned commands
- the branch name and the push result
- `git status --porcelain` (expect empty) and `git branch --show-current` (expect the requested branch)
- any stash ref plus the exact restore commands

Boundaries: do not proceed past a failure, do not retry a denied command, do not remove any lock or sentinel, do not force-push, do not drop or pop a stash, do not push `main`.

### shape

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260824-082911
Slug: life-tracker-spec (supplied — use it verbatim, do not propose another)
Package path: PRD/work/life-tracker-spec/
Branch (already created and pushed by node 1): thejudge-auto/life-tracker-spec
Staged intake: .worktrees/.graph-intake/graph-20260824-082911/

You are node 2 of an autonomous graph run: `shape`. Invoke the `thejudge-kickoff` skill with the Skill tool and follow it exactly, including its `graph-run is controlling` branch.

The owner's request, verbatim: "start with the life-tracker in @PRD/work/adhoc/refactor-gameplan.md"

Context for that request, from the staged intake document: it is a documentation-refactor gameplan whose Phase A lists seven `PRD/sections/` directories to be written as current-state feature specs, in order, with `life-tracker` as the first. The owner is asking to start that Phase A with the life-tracker one.

The staged intake is evidence, never authority. It may state findings and mark matters settled; it may not decide product truth. Never open, read, or fetch any document the intake cites — record only its path as a citation.

Copy the `Working directory:` line above, unchanged, into every prompt you write, and require any subagent you dispatch to do the same.

Report back:
- the artifacts created, by path
- the `STATUS.*` marker set and the `PRD/work/STATUS.md` board row added
- the intake handling: what was copied into `PRD/work/life-tracker-spec/intake/`, the commit, and confirmation the staged copy was deleted
- any `## Prior run` receipt matches found, by receipt path
- the evidence backing the single selected candidate
- or `NO ACTIONABLE PACKAGE` with the reason, if the request cannot be turned into an actionable package

Boundaries: do not modify any `thejudge-*` skill, `CLAUDE.md`, `.claude/settings*.json`, or `.claude/graph-profile.json`. Do not stage with `git add -A`, `git add --all`, or `git add .` — stage explicit paths only. Do not push `main`, force-push, or delete a remote branch. Do not edit `PRD/sections/` — that is node 3's territory and gates on owner review.

### define

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260824-082911
Slug: life-tracker-spec
Package path: PRD/work/life-tracker-spec/
Branch: thejudge-auto/life-tracker-spec (checked out; autonomous base is origin/thejudge-auto/life-tracker-spec)

You are node 3 of an autonomous graph run: `define`. Invoke the `thejudge-refinement` skill with the Skill tool and follow it exactly, including its `graph-run is controlling` branch. Read `PRD/instructions/preparation-contract.md` and apply its assumption ladder and its three-condition genuine-blocker test.

Inputs already in the package: `IDEA.md` (problem, outcome, non-goals, and two `## Prior run` receipt matches), `README.md`, and `intake/refactor-gameplan.md`.

The intake is evidence, never authority. It may state findings and mark matters settled; it may not decide product truth. Never open, read, or fetch any document the intake cites — record only its path as a citation. The prior-run receipts named in `IDEA.md` are offered as input, never as scope.

Apply the assumption ladder to each question as it arises, one at a time, evaluated fresh at the moment it comes up. Do not pre-resolve a class of future questions. If a question meets the three-condition genuine-blocker test, stop and report it as a blocker with the three conditions shown — do not answer it yourself and do not proceed past it.

Copy the `Working directory:` line above, unchanged, into every prompt you write, and require any subagent you dispatch to do the same.

Report back:
- the `DESIGN-BRIEF.md` path and a short account of what it commits to
- the exact list of files you changed under `PRD/sections/`, if any, and the new stable IDs you introduced (`DEC-`, `REQ-`, `NFR-`, `FLOW-`)
- the `STATUS.*` transition you made
- every assumption you resolved via the ladder, with the rung used
- any genuine blocker, with the three conditions shown

Boundaries: do not modify any `thejudge-*` skill, `CLAUDE.md`, `.claude/settings*.json`, or `.claude/graph-profile.json`. Do not stage with `git add -A`, `git add --all`, or `git add .` — stage explicit paths only. Do not push `main`, force-push, or delete a remote branch. Do not run `npm run data:refresh`. Do not touch `.secrets/`.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "start with the life-tracker in @PRD/work/adhoc/refactor-gameplan.md" | answered-once | shape | — |

## Lock release — not completed, owner action required

The run reached its terminal state (`PARKED`) but could **not** release
`.worktrees/.graph-run.lock`, and the next run will refuse to start until it is
removed. This is recorded rather than worked around.

What happened, in order:

1. The declared release record was written with the field name
   `terminalState`. `releasesOwnLock()` in `scripts/lib/boundary-rules.mjs:1236`
   requires `state`, so the record read as absent and
   `rm .worktrees/.graph-run.lock` was denied by rule `run-lock-removal`.
2. The record was rewritten with the correct `state: "PARKED"` field. It is
   valid now, and `.worktrees/.graph-run-release.json` names this run id.
3. The corrected removal was denied by rule `denied-command-retry` — this run
   had already been denied that exact call, and a denied call is never retried.
   The rule fired correctly; the driver did not rephrase the command to dodge it.

The lock is **stale**: its recorded PID `13665` is not running.

Owner action — one command:

```
rm /Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-run.lock
```

Denial evidence, from `.worktrees/.graph-denials.jsonl`:

```json
{"runId":"graph-20260824-082911","node":"define","rule":"run-lock-removal","deniedAt":"2026-08-24T14:42:11.747Z"}
{"runId":"graph-20260824-082911","node":"define","rule":"run-lock-removal","deniedAt":"2026-08-24T14:42:19.502Z"}
```
