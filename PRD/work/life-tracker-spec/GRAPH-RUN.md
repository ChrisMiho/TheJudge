# Graph run — life-tracker-spec

- Run ID: `graph-20260824-082911`
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (rm -rf .worktrees/<nonexistent>)`; graph tier: `denied — tier armed (nohup, lock held)`
- Resume 2026-08-24: lock re-taken (`npm run graph:preflight -- --take-lock --slug life-tracker-spec --run-id graph-20260824-082911`); graph canary `nohup true` **denied** by graph-tier rule `denied-command-retry` — `Graph canary: denied — graph tier armed (nohup true)`. Lock pid `24000` is the script's dead parent, not the session pid `12491`; the hook keys on the lock file's existence, so the tier is armed regardless, and the next run would read the lock `stale` rather than silently steal it.
- Resume 2026-08-25: lock re-taken (`npm run graph:preflight -- --take-lock --slug life-tracker-spec --run-id graph-20260824-082911`), lock pid `48897`; graph canary `nohup true` **denied by the graph-tier rule itself** — `` `nohup` is denied while a graph run holds the lock: a detached command outlives the run that started it. `` This is a clean tier proof, unlike the 2026-08-24 resume where `denied-command-retry` fired first. Profile sentinel `THEJUDGE_GRAPH_PROFILE` present, so `Profile: loaded (env sentinel)` holds for this session too. Launch checkout fast-forwarded `763edf2 -> 4bb26c6`, `git status --porcelain` empty.
- Autonomous base: `origin/thejudge-auto/life-tracker-spec`
- Staging: `.worktrees/.graph-intake/graph-20260824-082911/` (copied into `PRD/work/life-tracker-spec/intake/`, staged copy deleted)
- Current node: `close` — `land` resolved 2026-08-25 when the owner merged https://github.com/ChrisMiho/TheJudge/pull/105 (merge commit `4bb26c6`)
- Next action: node 9 (`close`) — `/thejudge-cleanup` on `PRD/work/life-tracker-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 6` | `git switch -c thejudge-auto/life-tracker-spec main`; `git push -u origin thejudge-auto/life-tracker-spec`; base resolved `main`; classification `clean`, no stash; `Profile: loaded (env sentinel)`; `CANARY_COMMAND` denied (`'rm -rf' is denied in every session`); `GRAPH_CANARY_COMMAND` denied (`'nohup' is denied while a graph run holds the lock`); lock `free` → taken at `.worktrees/.graph-run.lock` | 2026-08-24 |
| 2 | shape | sonnet | ok | `0 → 29` | commit `ec08424` on `thejudge-auto/life-tracker-spec`, pushed; `PRD/work/life-tracker-spec/IDEA.md`, `README.md`, `STATUS.ideation`, `intake/refactor-gameplan.md`; board row added under `## ideation` in `PRD/work/STATUS.md`; staged intake deleted (`.worktrees/.graph-intake/graph-20260824-082911/` absent); prior-run matches `PRD/instructions/receipts/player-life-tracker-2026-08-03.md`, `PRD/instructions/receipts/player-life-tracker-refinement-2026-08-05.md` | 2026-08-24 |
| 3 | define | opus | ok — gate | `0 → 41` | commit `a6c4aec` on `thejudge-auto/life-tracker-spec`, pushed; `PRD/work/life-tracker-spec/DESIGN-BRIEF.md`; `PRD/sections/decisions/doc-process.md` + `PRD/sections/decisions.md` (DEC-168); `git diff main...HEAD -- PRD/sections/` non-empty -> parked at the `define` gate; `STATUS.refined` -> `STATUS.owner-action` | 2026-08-24 |
| 4 | gate-qc | sonnet | ok | `0 → 22` | verdict `PASS` on `PRD/work/life-tracker-spec/DESIGN-BRIEF.md`, findings `none`; no `STATUS.*` transition (stays `STATUS.refined`); `## Preparation gate` written to `PRD/work/life-tracker-spec/README.md` by the driver | 2026-08-24 |
| 5 | plan | sonnet | ok | `0 → 33` | `PRD/work/life-tracker-spec/GAMEPLAN.md`; slices `slice-a-write-spec.md` (write `PRD/sections/life-tracker/README.md`) and `slice-b-nav-row.md` (one `PRD/README.md` Section Inventory row + package-wide diff proof), B sequential on A; `slice-a.criteria.json` (A1–A9) and `slice-b.criteria.json` (B1–B5) — all 14 criteria `false`, each with an `evidence` block, verified by parsing both files; `STATUS.refined` -> `STATUS.active`; board row moved to `## active` in `PRD/work/STATUS.md`; every written path inside `PRD/work/life-tracker-spec/` plus the board file | 2026-08-24 |
| 6 | build | sonnet | ok | `0 → 136` | worktree `.worktrees/implement-life-tracker-spec` on `implement-life-tracker-spec-1787586821`; slice A `376b2a0`, slice B `3d18edf`, both pushed to `origin/thejudge-auto/life-tracker-spec-work` (forked because the derived shared-branch name collided with the recorded base itself, matching this repo's PR #97 precedent); PR https://github.com/ChrisMiho/TheJudge/pull/105 base `thejudge-auto/life-tracker-spec`; **write scope verified** — `git worktree list` and `git status --porcelain` show the launch checkout clean at `8799b1e`, and every path in `git diff --stat 8799b1e..3d18edf` lies inside `.worktrees/implement-life-tracker-spec/` or `PRD/work/life-tracker-spec/`; deliverables `PRD/sections/life-tracker/README.md` (new, 167 lines) and one `PRD/README.md` row; all 14 criteria `value: true` with 14 matching lines in the hook-written `.worktrees/.graph-evidence.jsonl` for this run id (A7/A8/B3/B5 `via: manual-observation` — a dated check that happened, not a passing check); `STATUS.active` -> `STATUS.ship-ready` | 2026-08-24 |
| 7 | review | opus | ok | `0 → 31` | no-write reviewer (`Plan` agent type — no `Write`/`Edit`/`NotebookEdit`), fresh context, graded against `slice-a.criteria.json` (A1–A9) and `slice-b.criteria.json` (B1–B5); verdict **APPROVE**, **0 Critical, 0 Important**, 3 Minor — no loop back to `build`; all 14 criteria satisfied as stated; supersession rule verified applied as a rule (four superseded shapes demoted to closed doors, `≈67px` band appears only under `## Rejected alternatives and deferred scope`); diff confined to `PRD/README.md`, `PRD/sections/life-tracker/README.md`, and `PRD/work/` bookkeeping; Minor 2 independently confirmed by the driver — `git ls-remote origin thejudge-auto/life-tracker-spec` = `376b2a0` and `gh pr view 105 --json files` lists 7 files without the spec | 2026-08-24 |
| 8 | land | — (human PR merge) | ok | — (not dispatched) | owner merged https://github.com/ChrisMiho/TheJudge/pull/105 on 2026-08-25T15:20:12Z, merge commit `4bb26c6`; `gh pr view 105 --json state,mergedAt,mergeCommit` -> `MERGED`; launch checkout fast-forwarded `763edf2 -> 4bb26c6` with `git merge --ff-only`, `git status --porcelain` empty; package now `STATUS.ship-ready` with both slices `done` in `PRD/work/life-tracker-spec/README.md` and the board row under `## ship-ready`; the driver ran no `gh pr merge` or `gh pr close` | 2026-08-25 |

## Gate verdicts

Walked 2026-08-24 by `/graph-gate-review PRD/work/life-tracker-spec/`. One
stable ID pending, one verdict taken.

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `DEC-168` | accept | — |

No `PRD/sections/` change was applied: an `accept` leaves the run's text
standing.

## Open gate

- None. The `land` gate resolved on 2026-08-25; the run is advancing to node 9
  (`close`). The evidence below is kept verbatim as the record of what was
  parked and what the owner was asked to do.

## Open gate — land (resolved)

**RESOLVED 2026-08-25 — the owner merged PR #105.** Merge commit `4bb26c6`,
merged at `2026-08-25T15:20:12Z`, base `thejudge-auto/life-tracker-spec`, head
`thejudge-auto/life-tracker-spec-work`. Verified by the driver with
`gh pr view 105 --json state,mergedAt,mergeCommit` -> `MERGED`. The driver ran
no `gh pr merge` and no `gh pr close`. The original park text follows verbatim.

**PARKED 2026-08-24 at node 8 (`land`) — the owner's pull-request merge.**

The `define` gate below this section is resolved; this is the run's second and
final gate. Nodes 4 through 7 all returned `ok` and the reviewer returned
`APPROVE` with 0 Critical and 0 Important findings.

**What the owner is being asked to do:** merge
https://github.com/ChrisMiho/TheJudge/pull/105. `land` is a human action — the
driver never runs `gh pr merge` or `gh pr close`.

**Read the spec here, not in the PR's Files tab.** Node 6 pushed slice A
directly onto the recorded autonomous base before opening the PR, so
`origin/thejudge-auto/life-tracker-spec` already carries the 167-line
`PRD/sections/life-tracker/README.md` and PR #105 shows slice B alone — seven
files, none of them the spec. Verified by the driver:

```
git ls-remote origin thejudge-auto/life-tracker-spec   -> 376b2a0 (slice A)
gh pr view 105 --json files                            -> 7 files, spec absent
git show 376b2a0:PRD/sections/life-tracker/README.md   -> the spec
git diff 8799b1e..3d18edf                              -> both slices together
```

Merging #105 loses nothing. It is not repairable inside this run: rewinding a
pushed base needs a force-push the graph tier denies. The contributing cause is
outside this package — `thejudge-implement-all/SKILL.md:36` derives the shared
remote branch as `thejudge-auto/<slug>`, the same name as the recorded
autonomous base, so the branch collided with itself and node 6 forked
`-work` after slice A had already landed. A graph run may not edit a
`thejudge-*` skill, so that fix belongs to an ordinary session.

**Deviation from the park procedure, stated rather than buried.** The contract's
park sets `STATUS.owner-action`, rewrites the README frontmatter, and moves the
`PRD/work/STATUS.md` board row. The driver did **not** do that here, because
doing so breaks the merge this gate is waiting for. Measured on a scratch branch,
not assumed:

```
git merge-tree --write-tree --name-only HEAD origin/thejudge-auto/life-tracker-spec-work
  baseline (no park):  merges clean
  with the park:       CONFLICT (content) in PRD/work/STATUS.md
                       CONFLICT (content) in PRD/work/life-tracker-spec/README.md
```

PR #105 moves the same board row to `## ship-ready` and the same frontmatter
line to `status: ship-ready`. Writing `owner-action` over them on the base is a
same-line collision on both. So the package keeps `STATUS.active` on the base
and `STATUS.ship-ready` on the PR branch, and the gate lives here in the ledger
— which `graph-run/reference.md` already treats as sufficient to resume from.
The merge itself resolves the state, and node 9 (`close`) deletes the package
folder outright.

**The reviewer's three Minor findings, none of which loops back to `build`:**

1. `B5` reads "A human confirmed", and in an unattended run no human exists. The
   build node recorded a dated agent observation and said so in
   `slice-b.evidence.md:15-17` rather than fabricating a sign-off. The reviewer
   re-verified the substance independently — exactly two files promotable,
   exactly two written. It resolves when the owner reviews the PR.
2. PR #105 does not display the spec — covered in full above.
3. Two current-state details in the sources are absent from the spec: the
   confirm-before-destroy step on Reset / New Game (`system-map.md:535`), and
   `NFR-001` / `NFR-006`, which are named on `Backed by:` but carry no attached
   behavior (DEC-101's CSS-only, reduced-motion-aware constraint). Neither
   fails a stated criterion — A5 asks for the seven surfaces and gets them, A4
   asks only that the IDs be named. Candidates for a later pass.

**Resume command, once #105 is merged:**

```
/graph-run PRD/work/life-tracker-spec/
```

The run re-enters at `land`, confirms the PR is merged, records it `ok`, and
continues to node 9 (`close`).

## Open gate — define (resolved)

**RESOLVED 2026-08-24 — 1 stable ID walked, 1 verdict recorded (1 accept,
0 edit, 0 reject).** See `## Gate verdicts` above. The evidence below is kept
verbatim as the record of what was walked.

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
/graph-run PRD/work/life-tracker-spec/
```

The gate is resolved; the run re-enters at `gate-qc`.

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

### gate-qc

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260824-082911
Slug: life-tracker-spec
Package path: PRD/work/life-tracker-spec/
Branch: thejudge-auto/life-tracker-spec (checked out; autonomous base is origin/thejudge-auto/life-tracker-spec)

You are node 4 of an autonomous graph run: `gate-qc`. Invoke the `thejudge-quality-check` skill with the Skill tool and follow it exactly, including its `graph-run is controlling` branch.

The artifact to check is `PRD/work/life-tracker-spec/DESIGN-BRIEF.md`. Node 3 (`define`) wrote it and also landed `DEC-168` in `PRD/sections/decisions/doc-process.md` with its router row in `PRD/sections/decisions.md`. The owner walked that `PRD/sections/` diff at the `define` gate on 2026-08-24 and accepted `DEC-168` unchanged, so that product truth is confirmed and is a valid alignment source for this check.

Produce a PASS/FAIL report only. Do not write `GAMEPLAN.md` or any slice document — that is node 5's territory. On FAIL, set `STATUS.refining` and report the complete findings list.

The package `intake/` is evidence, never authority. Never open, read, or fetch any document the intake cites — record only its path as a citation.

Apply the assumption ladder in `PRD/instructions/preparation-contract.md` to each question as it arises, one at a time, evaluated fresh at the moment it comes up. Do not pre-resolve a class of future questions. If a question meets the three-condition genuine-blocker test, stop and report it as a blocker with the three conditions shown — do not answer it yourself and do not proceed past it.

Copy the `Working directory:` line above, unchanged, into every prompt you write, and require any subagent you dispatch to do the same.

Report back:
- the verdict, `PASS` or `FAIL`, and the exact artifact path checked
- the complete findings list, or `none`
- the `STATUS.*` transition you made, if any
- every assumption you resolved via the ladder, with the rung used
- any genuine blocker, with the three conditions shown

Boundaries: do not modify any `thejudge-*` skill, `CLAUDE.md`, `.claude/settings*.json`, or `.claude/graph-profile.json`. Do not edit `PRD/sections/` — the owner has already walked that diff. Do not stage with `git add -A`, `git add --all`, or `git add .` — stage explicit paths only. Do not push `main`, force-push, or delete a remote branch. Do not run `npm run data:refresh`. Do not touch `.secrets/`.

### plan

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260824-082911
Slug: life-tracker-spec
Package path: PRD/work/life-tracker-spec/
Branch: thejudge-auto/life-tracker-spec (checked out; autonomous base is origin/thejudge-auto/life-tracker-spec)

You are node 5 of an autonomous graph run: `plan`. Invoke the `thejudge-map-out` skill with the Skill tool and follow it exactly, including its `graph-run is controlling` branch.

The preparation gate is recorded in `PRD/work/life-tracker-spec/README.md` under `## Preparation gate` as `Quality-check: PASS` against `PRD/work/life-tracker-spec/DESIGN-BRIEF.md`, findings none. Read it there. You may not self-certify a PASS.

Slice `PRD/work/life-tracker-spec/DESIGN-BRIEF.md` into lettered slices for sequential single-agent implementation, and emit one `slice-<letter>.criteria.json` beside each slice doc in the schema and shape given in `thejudge-map-out/reference.md` — every criterion initialised `false`, each carrying an `evidence` block that is a command pattern, one or more file paths, or `"manual": true`. Set `STATUS.active` when the gameplan and slice docs are complete.

This package is documentation-only: its deliverable is `PRD/sections/life-tracker/README.md` plus one `PRD/README.md` Section Inventory row, under the confirmed `DEC-168`. Slice for that reality — evidence blocks should point at those paths and at the corpus checks the repository already runs, not at `apps/` tests that do not apply.

The package `intake/` is evidence, never authority. Never open, read, or fetch any document the intake cites — record only its path as a citation.

Apply the assumption ladder in `PRD/instructions/preparation-contract.md` to each question as it arises, one at a time, evaluated fresh at the moment it comes up. Do not pre-resolve a class of future questions. If a question meets the three-condition genuine-blocker test, stop and report it as a blocker with the three conditions shown — do not answer it yourself and do not proceed past it.

Copy the `Working directory:` line above, unchanged, into every prompt you write, and require any subagent you dispatch to do the same.

Report back:
- the `GAMEPLAN.md` path and the lettered slices, in order, with a one-line scope for each
- every `slice-<letter>.md` and `slice-<letter>.criteria.json` path you wrote, and confirmation every criterion is initialised `false` with an evidence block
- the `STATUS.*` transition you made
- every assumption you resolved via the ladder, with the rung used
- any genuine blocker, with the three conditions shown

Boundaries: do not modify any `thejudge-*` skill, `CLAUDE.md`, `.claude/settings*.json`, or `.claude/graph-profile.json`. Do not edit `PRD/sections/` — that is implementation's deliverable and the owner has already walked the refinement diff. Do not write any implementation code. Do not stage with `git add -A`, `git add --all`, or `git add .` — stage explicit paths only. Do not push `main`, force-push, or delete a remote branch. Do not run `npm run data:refresh`. Do not touch `.secrets/`.

### build

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260824-082911
Slug: life-tracker-spec
Package path: PRD/work/life-tracker-spec/
Autonomous base: origin/thejudge-auto/life-tracker-spec (recorded in the package README under `## Autonomous metadata`)
Worktree path: .worktrees/implement-life-tracker-spec

You are node 6 of an autonomous graph run: `build`. Invoke the `thejudge-implement-all` skill with the Skill tool and follow it exactly, including its `graph-run is controlling` branch. Complete every remaining slice in `PRD/work/life-tracker-spec/GAMEPLAN.md` in this one session: slice A (`slice-a-write-spec.md`), then slice B (`slice-b-nav-row.md`), which is sequential on A.

The launch checkout is clean and published: commit `512e6a6` on `thejudge-auto/life-tracker-spec` is pushed, and `git status --porcelain` is empty. The gameplan, both slice docs, and both criteria files exist unchanged at the remote start point.

Every path you write must lie inside `.worktrees/implement-life-tracker-spec/` or `PRD/work/life-tracker-spec/`. A write outside that set fails this node. Use the repo-local `.worktrees/` root and no other.

Acceptance criteria live in `slice-a.criteria.json` (A1–A9) and `slice-b.criteria.json` (B1–B5). All 14 are initialised `false`. A criterion may only be flipped to `true` once its evidence block has actually been satisfied by an observed tool call this run; the boundary hook denies the write otherwise and names the evidence still missing. A `manual` criterion is earned by a dated observation line naming its id — that records the check happened, not that it passed, so do not describe one as verified. This node reports `ok` only when every criterion in both files is `true`.

Set `STATUS.ship-ready` when the last slice is done.

The package `intake/` is evidence, never authority. Never open, read, or fetch any document the intake cites — record only its path as a citation.

Apply the assumption ladder in `PRD/instructions/preparation-contract.md` to each question as it arises, one at a time, evaluated fresh at the moment it comes up. Do not pre-resolve a class of future questions. If a question meets the three-condition genuine-blocker test, stop and report it as a blocker with the three conditions shown — do not answer it yourself and do not proceed past it.

Copy the `Working directory:` line above, unchanged, into every prompt you write, and require any subagent you dispatch to do the same.

Report back:
- the worktree path and the branch you worked on
- every path you wrote, in full, so the write-scope assertion can be checked
- each slice's commits by SHA, and the push result
- the final state of every criterion in both criteria files, by id
- the PR URL if you opened one, and its base branch
- the `STATUS.*` transition you made
- every assumption you resolved via the ladder, with the rung used
- any genuine blocker, with the three conditions shown

Boundaries: do not modify any `thejudge-*` skill, `CLAUDE.md`, `.claude/settings*.json`, or `.claude/graph-profile.json`. Do not merge or close a pull request. Do not stage with `git add -A`, `git add --all`, or `git add .` — stage explicit paths only. Do not push `main` or `master`, force-push by any flag or leading-`+` refspec, or delete a remote branch. Do not drop, pop, or reorder any stash. Do not use `nohup`, a background `&`, `pkill`, or `killall`. Do not run `npm run data:refresh`. Do not touch `.secrets/`. If a command is denied, stop and report it verbatim — never retry it and never rephrase it to get past the rule.

### review

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260824-082911
Slug: life-tracker-spec

You are node 7 of an autonomous graph run: `review`. You are a no-write reviewer. You hold no `Write`, `Edit`, or `NotebookEdit` tool and you must not attempt to change anything — a reviewer that can modify the work it grades is not reviewing it. Read and search only. You did not see the build node's transcript and must not go looking for it; grade the artifact, not the justification.

**What to review.** The implementation diff `git diff 8799b1e..3d18edf` in the worktree `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-life-tracker-spec`, published as PR https://github.com/ChrisMiho/TheJudge/pull/105 (base `thejudge-auto/life-tracker-spec`, head `thejudge-auto/life-tracker-spec-work`). Its two deliverables are `PRD/sections/life-tracker/README.md` (new) and one `PRD/README.md` Section Inventory row.

**Your rubric is the slices' own acceptance criteria and nothing else.** Read them in the worktree at `PRD/work/life-tracker-spec/slice-a-write-spec.md` and `slice-a.criteria.json` (A1–A9), and `slice-b-nav-row.md` and `slice-b.criteria.json` (B1–B5). All 14 are marked `value: true`; the run's evidence log records each id as earned. Grade whether the shipped artifact actually satisfies each criterion as that criterion is stated. Supporting context: `PRD/work/life-tracker-spec/DESIGN-BRIEF.md`, `GAMEPLAN.md`, and the confirmed `DEC-168` in `PRD/sections/decisions/doc-process.md`, which the owner walked and accepted unchanged on 2026-08-24.

**Severity rule, and it binds you.** A preference, a style note, or an improvement outside the slices' stated requirements is **never** Critical or Important, and never loops back to `build`. Rate such a thing Minor or leave it out. A reviewer with a two-loop budget and an incentive to look useful manufactures findings, and each one spends a loop this run cannot get back. Only a gap that breaks correctness or a stated criterion earns Critical or Important.

Two things worth checking closely, because they are where this artifact could be wrong on its own terms:
- DEC-168 says a behavior enters the spec only in its current form, and that a measured bound travels with its behavior only if that surface still exists. The worked example: the ≈53px commander-damage band (REQ-112) survives, the ≈67px life-adjustment edge band does not, because DEC-136 replaced edge bands with half-card zones. Check the spec against that rule rather than against the example alone.
- DEC-168 says the spec moves, deletes, retires, reorders, and renumbers nothing, and that precedence is unchanged — `decisions.md` stays #1 and a cited DEC/REQ/FLOW wins any conflict with the spec. Check the diff actually touches only what it is allowed to touch, and that the spec carries its own non-authoritative marker.

Copy the `Working directory:` line above, unchanged, into every prompt you write, and require any subagent you dispatch to do the same.

Report back:
- an overall verdict: `APPROVE` or `CHANGES REQUESTED`
- every finding, each rated `Critical`, `Important`, or `Minor`, naming the criterion id it fails and the file and line it lives at
- for each of the 14 criteria, whether the shipped artifact satisfies it as stated
- `none` explicitly if you found nothing — that is a valid and expected outcome

### close

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260824-082911
Slug: life-tracker-spec
Package path: PRD/work/life-tracker-spec/
Autonomous base: origin/thejudge-auto/life-tracker-spec (recorded in the package README under `## Autonomous metadata`)

You are node 9 of an autonomous graph run: `close`. Invoke the `thejudge-cleanup` skill with the Skill tool and follow it exactly, including its `graph-run is controlling` branch. This is the run's last node.

The package is `STATUS.ship-ready`. Node 8 (`land`) resolved on 2026-08-25: the owner merged https://github.com/ChrisMiho/TheJudge/pull/105. The launch checkout is on the recorded base at `0763cbc`, and `git status --porcelain` is empty.

**Facts the driver measured for your autonomous merge-proof gate.** These are observations, not verdicts — apply your own four checks and reach your own conclusion.

- Check 1: the current branch is `thejudge-auto/life-tracker-spec`, which equals the recorded autonomous base exactly. The base still exists on the remote, so the deleted-base second path does not apply.
- Check 2: `gh pr view 105 --json state,baseRefName,mergedAt` returns `MERGED`, base `thejudge-auto/life-tracker-spec`, merged `2026-08-25T15:20:12Z`. The GitHub API is reachable, so `gh` stays authoritative and the local-proof fallback does not apply. Verify it yourself rather than taking this line's word.
- Check 3, and this is the one that needs your judgment: PR #105 was **squash-merged**. `git rev-list --parents -n 1 4bb26c6` shows a single parent `763edf2`, so the worktree's slice-B commit `3d18edf` is **not** an ancestor of the base tip and `git log origin/thejudge-auto/life-tracker-spec..HEAD` in the worktree lists it as absent. Content tells the other half: `git diff --stat 3d18edf origin/thejudge-auto/life-tracker-spec` reports one file, `PRD/work/life-tracker-spec/GRAPH-RUN.md`, and that file's difference is the driver's own park record written on the base after the worktree branched. Every deliverable is byte-identical. The worktree's `git status --porcelain` is empty. Decide whether check 3 is met on those facts; if you judge it unmet, refuse the delete and report the exact unmet condition rather than working around it.
- Check 4: this package is documentation-only. It launched no browser, started no server, and bound no port, so there are no runtime-cleanup acceptance criteria recorded in its slice evidence. Confirm that against `slice-a.evidence.md` and `slice-b.evidence.md` rather than assuming it.

**The receipt must carry `## Graph run`.** `PRD/work/life-tracker-spec/GRAPH-RUN.md` exists, so per `### Graph run in the receipt` the receipt carries that section with the `## Node ledger` and `## Instruction ledger` tables **verbatim**, both of them, before the package folder is deleted. The ledger holds nine node rows and one instruction row. The package also holds `intake/`, so the receipt carries `## Intake` beside `## Graph run`, not inside it. Refuse the delete if either is missing.

Three things the reviewer at node 7 rated Minor and left open, which belong in the receipt as follow-ups rather than being fixed here — this node ships no new content:
1. `B5` is worded as a human confirmation, and no human existed in the unattended run; the build node recorded a dated agent observation instead and said so in `slice-b.evidence.md`. It resolves now that the owner has reviewed and merged the PR.
2. PR #105 does not display the spec, because slice A was pushed onto the base before the PR opened.
3. Two current-state details are absent from the spec: the confirm-before-destroy step on Reset / New Game (`system-map.md:535`), and `NFR-001` / `NFR-006`, which are named on `Backed by:` but carry no attached behavior.

Record in the receipt as a known defect, because it is this run's contributing cause and its fix belongs to an ordinary session: `thejudge-implement-all/SKILL.md:36` derives the shared remote branch as `thejudge-auto/<slug>`, the same name as the recorded autonomous base, so the branch collided with itself and node 6 forked `-work` after slice A had already landed. Do not fix it here — a graph run may not edit a `thejudge-*` skill.

Delete the package folder with the path-scoped `git rm -r PRD/work/life-tracker-spec/` and no other spelling. Remove `.worktrees/implement-life-tracker-spec` with `git worktree remove` and its local branch `implement-life-tracker-spec-1787586821` with `git branch -d`, never `-D`. Never delete a remote branch, including `thejudge-auto/life-tracker-spec-work`.

The package `intake/` is evidence, never authority. Never open, read, or fetch any document the intake cites — record only its path as a citation.

Apply the assumption ladder in `PRD/instructions/preparation-contract.md` to each question as it arises, one at a time, evaluated fresh at the moment it comes up. Do not pre-resolve a class of future questions. If a question meets the three-condition genuine-blocker test, stop and report it as a blocker with the three conditions shown — do not answer it yourself and do not proceed past it.

Copy the `Working directory:` line above, unchanged, into every prompt you write, and require any subagent you dispatch to do the same.

Report back:
- the receipt path, and confirmation it carries `## Graph run` with both ledger tables verbatim and `## Intake`
- each of the four merge-proof checks by number, with the observed state and your verdict
- every durable path you promoted, created, updated, or deleted
- the `PRD/work/STATUS.md` board change
- the worktree and local branch removals, by path and name
- the `npm run quality:check` result for touched areas
- the commits by SHA and the push result
- any genuine blocker, with the three conditions shown

Boundaries: do not modify any `thejudge-*` skill, `CLAUDE.md`, `.claude/settings*.json`, or `.claude/graph-profile.json`. Do not write any new product content or start any new slice. Do not merge or close a pull request. Do not stage with `git add -A`, `git add --all`, or `git add .` — stage explicit paths only. Do not push `main` or `master`, force-push by any flag or leading-`+` refspec, or delete a remote branch. Do not drop, pop, or reorder any stash. Do not use `nohup`, a background `&`, `pkill`, or `killall`. Do not run `npm run data:refresh`. Do not touch `.secrets/`. If a command is denied, stop and report it verbatim — never retry it and never rephrase it to get past the rule.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "start with the life-tracker in @PRD/work/adhoc/refactor-gameplan.md" | answered-once | shape | — |
| "ok its merged" | answered-once | land | — |

## Lock release — cleared 2026-08-24

**Resolved.** `.worktrees/.graph-run.lock` is absent as of the gate review on
2026-08-24, and the release path itself was fixed in `a224d47`. The account
below is kept as the record of the original failure.

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
