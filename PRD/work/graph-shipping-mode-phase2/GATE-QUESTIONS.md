# Gate questions — graph-shipping-mode-phase2

The proposed `PRD/sections/` product truth for this package. Refinement records
it here; implementation applies the finalized proposal at `build`. Nothing below
is written to `PRD/sections/` yet.

**How to answer:** for each block, set `- Verdict:` to `accept`, `edit`, or
`reject`. `edit` and `reject` require a `- Reason:` line. Then merge the spec PR
into `main` — the merge is the "build it" signal. `graph-implement` runs
`graph-gate-review` to finalize these verdicts before it builds.

New IDs reserved: **REQ-170, REQ-171, REQ-172**. Edited: **REQ-154, REQ-159,
REQ-160**. (REQ-153 needs no edit — its single-lock language is still true
per-root; isolation comes from separate worktree-rooted sessions, not lock
re-keying.)

---

## REQ-170

- **What this decides:** Whether you can shape several ideas at the same time
  instead of one at a time.
- **In plain terms:** Today only one graph run may exist at once — a single lock
  file (`.worktrees/.graph-run.lock`) blocks a second. This makes the spec-former,
  now named `graph-kickoff`, runnable many-at-once — **without touching the safety
  hook**. The trick: the hook and scripts already resolve every control file
  (lock, run-state, node-calls) relative to `$CLAUDE_PROJECT_DIR`, the root fixed
  when a session launches. So each idea runs as **its own session inside its own
  worktree** (a separate working copy of the repo on its own branch); each root
  then has exactly one lock and one control plane, and the runs are isolated by
  construction. The lock filename and keying **do not change** — one lock per
  root still prevents two runs in the same checkout. Preflight branches into a
  per-idea worktree instead of mutating the launch checkout, so parallel ideas
  never contend on `main`'s working tree.
- **What happens if you say no:** Spec-forming stays single-file — one idea at a
  time, as today. `graph-implement` (REQ-171) could still run, but you could
  never shape a second idea while the first is in flight.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ after REQ-169 @@
+### REQ-170
+- Title: Concurrent spec-forming via per-worktree-session isolation
+- Priority: high
+- Description: `graph-kickoff` (the spec-former, formerly `graph-run` run-one) is runnable many-at-once by running each idea as its own session rooted in its own git worktree. The boundary hook and scripts already resolve control files relative to `$CLAUDE_PROJECT_DIR`, so separate roots give each concurrent run an isolated lock and control plane with no change to the hook and no re-keying of the lock.
+- Acceptance Criteria:
+  - two `graph-kickoff` ideas, each launched as its own session in its own worktree, proceed at the same time without either refusing on the other's lock — because each root holds its own `.worktrees/.graph-run.lock`
+  - each idea's worktree is created under the repo-local `.worktrees/` root, off one shared base branch, and each writes only its own `PRD/work/<slug>/` folder
+  - `graph-preflight` branches into the idea's worktree and does not auto-commit or stash the launch checkout on behalf of a per-idea run; the launch checkout is left untouched
+  - the boundary hook is unchanged: the graph tier still arms on the presence of the per-root lock, and `classifyLock()` stale/corrupt/held behavior is preserved as-is
+  - the shared-working-directory hazard is closed structurally: no two runs share a working tree, commit to the same checkout, or rewrite the same `GRAPH-RUN.md`
+  - `graph-implement` (REQ-171) runs in its own root as a single background loop; it and any `graph-kickoff` sessions never contend because each root is isolated
+- Constraints:
+  - worktrees never escape the repo-local `.worktrees/` root, preserving the existing boundary
+  - the lock record, filename, and keying are unchanged — isolation comes from separate `$CLAUDE_PROJECT_DIR` roots, not from re-keying one shared lock
+  - fanning out N ideas as subagents inside one root is explicitly not the model — that is the only case that would force a hook run-identity rework, and it is avoided
+  - `main`/`master` push and force-push denials are unchanged; per-idea isolation adds no new publish path
+- Dependencies:
+  - REQ-160
+  - DEC-166
+- Notes:
+  - the lock does two jobs today, conflated: mutual exclusion of the checkout, and arming the hook's graph tier. Per-worktree isolation removes the need for the first (separate checkouts cannot collide) while keeping the second unchanged (each root still has its lock). This is why concurrency needs no hook surgery — verified against `graph-boundary-hook.mjs:71`, which resolves control files from `$CLAUDE_PROJECT_DIR`
```

- Verdict:
- Reason:

---

## REQ-171

- **What this decides:** Whether approved specs build themselves in the
  background, and how a spec becomes "ready to build."
- **In plain terms:** Today you type a build command ("run two") for each
  approved spec. This adds `graph-implement` — a single background loop that
  watches your local `main`. When it finds a spec you've approved and merged but
  not yet built, it branches off fresh `main`, runs the build half
  (`graph-gate-review → plan → build → review`), and opens a code pull request
  you merge. "Ready" means the merged spec's `PRD/work/<slug>/` folder sits on
  `main` at status `refined` with every question slot answered and no code built
  yet — no new marker file, just the status you already use. The loop builds one
  spec at a time; when one build parks (a gate, a budget cap, or a blocker), that
  one spec goes to `owner-action` and the loop moves on to the next ready spec.
- **What happens if you say no:** You keep typing the build command per spec, as
  today. Parallel spec-forming (REQ-170) still works, but nothing drains the
  approved queue for you.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ after REQ-170 @@
+### REQ-171
+- Title: The `graph-implement` background loop builds approved specs from `main`
+- Priority: high
+- Description: `graph-implement` is a single, background loop that detects an approved-but-unbuilt spec on local `main`, branches off fresh `main`, runs the build half of the lifecycle, and opens a code PR. It replaces the manual "run two" (`/graph-run PRD/work/<slug>/`) command with an unattended drain of the approved queue.
+- Acceptance Criteria:
+  - a spec is "ready" when its `PRD/work/<slug>/` folder is on `main` at `STATUS.refined` with every `GATE-QUESTIONS.md` verdict slot answered (no blank) and no built code — this state is the queue and needs no bespoke ready-file
+  - on picking up a ready spec, `graph-implement` sets `STATUS.active` as the single claim point, so a second loop iteration or a loop restart never double-picks the same spec — the transition is the idempotency guard (never double-build, never miss)
+  - a `GATE-QUESTIONS.md` with any blank slot is not ready and is skipped, matching today's run-two resume rule
+  - for each ready spec the loop dispatches `graph-gate-review` to finalize the owner's verdicts, then re-enters at `gate-qc` and runs `plan → build → review`, branching off fresh `main` in its own worktree
+  - the loop processes one spec at a time (single background loop); it holds exactly one build lock, per REQ-170
+  - a build that parks (a gate blocker, a per-node cap, a `gate-qc`/`review` loop-limit) sends that one slug to `owner-action` and the loop continues to the next ready spec — one parked build never stalls the queue
+  - each shipped build opens a code PR into `main` that grows from the same PR the spec was merged on; `land` (the code PR merge) stays human and is never automated
+  - `thejudge-cleanup` deleting `PRD/work/<slug>/` on ship removes it from the queue, so a shipped spec is never re-seen
+- Constraints:
+  - the loop never merges or closes any PR, spec or code — `gh pr merge`/`gh pr close` stay denied
+  - approval is answer-then-merge: the owner's per-ID verdicts in the merged `GATE-QUESTIONS.md` govern; a merge is not blanket-accept
+  - no "ship multiple specs together" grouping — each spec is its own package, branch, and PR
+  - concurrent builds are out of scope: `graph-implement` is single and sequential in this package
+- Dependencies:
+  - REQ-172
+  - DEC-164
+  - DEC-166
+- Notes:
+  - the loop is independent of concurrent spec-forming (REQ-170) and ships first: it builds one spec at a time in its own root, so it needs none of the per-worktree isolation machinery
+  - handoff is `main`: merge a spec, sync, and the loop picks it up. Because approved specs are already in `main`, the loop always branches off a base that has them — the base→main staleness the two-run flow guarded against never arises
+  - ready-detection reuses `STATUS.*` deliberately: the status vocabulary already distinguishes refined (approved, unbuilt) from active (being built) from deleted (shipped), so no new marker or its own drift risk is introduced
```

- Verdict:
- Reason:

---

## REQ-172

- **What this decides:** The safety rails on the unattended background loop.
- **In plain terms:** The loop runs while you're away, so it carries the same
  proofs a single run does. Your kill switch (creating `.worktrees/.graph-stop`)
  halts the loop cleanly at a spec boundary, not mid-build (extends REQ-154). The
  proof that the safety hook is actually firing — a denied "canary" call at start
  plus a per-node heartbeat — runs for every build the loop does (extends
  REQ-159). Splitting work across helper subagents to go faster stays a knob
  that's **off by default**, and whenever it's on the extra cost is written to
  the run's ledger, so you can weigh cost deliberately.
- **What happens if you say no:** The loop would run without a clean stop, without
  per-build liveness proof, or with fan-out cost invisible — the exact unattended
  risks the single-run rails already close, left open on the loop.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ after REQ-171 @@
+### REQ-172
+- Title: The background loop carries the kill switch, liveness proof, and cost bounds
+- Priority: high
+- Description: `graph-implement` runs unattended, so the stop sentinel, the hook-liveness proof, and the per-node caps that guard a single run all apply to it, and its optional subagent fan-out is off by default with per-run cost logged.
+- Acceptance Criteria:
+  - the stop sentinel `.worktrees/.graph-stop` halts the loop at a spec boundary — the current build finishes, no next spec is picked up, and no ledger is left half written (extends REQ-154 to the loop)
+  - the hook-liveness canary at build start and the per-node heartbeat run for every build the loop performs; a failed proof ends that build at `BLOCKED` and the loop does not silently continue past an unproven enforcer (extends REQ-159 to each build)
+  - the per-node tool-call caps apply per build exactly as for a single run; a cap overrun parks that build's slug at `owner-action` and the loop continues (per REQ-171)
+  - subagent/parallel fan-out inside a build is off by default and opt-in; when on, the per-run cost is written to that run's `GRAPH-RUN.md` ledger
+  - the loop is bounded and fail-closed: it stops rather than spinning when there is no ready spec, and a liveness or lock failure ends the affected build rather than the whole repository
+- Constraints:
+  - the sentinel and all liveness/counter state live under the already-ignored `.worktrees/` root and never travel with a branch
+  - `nohup`, untracked background `&`, `pkill`, and `killall` stay denied; the loop's background execution uses no denied backgrounding primitive
+  - no fifth terminal state is added; the loop reuses `BLOCKED`/`PARKED` per build
+- Dependencies:
+  - REQ-154
+  - REQ-159
+  - REQ-171
+  - DEC-166
+- Notes:
+  - the loop is the sharpest case of "a run never proceeds on an unproven enforcer" — it runs longest and least watched, so a hook that quietly stopped firing would do the most damage there
```

- Verdict:
- Reason:

---

## REQ-154 (edit)

- **What this decides:** Making the kill switch explicitly cover the background
  loop.
- **In plain terms:** REQ-154's stop sentinel halts "a graph run." The loop is a
  new kind of run, so this edit states the sentinel also halts `graph-implement`
  at a spec boundary (the current build finishes, no next spec starts). The
  mechanism is unchanged; the coverage is made explicit.
- **What happens if you say no:** The kill switch's coverage of the loop lives
  only in REQ-172; REQ-154 would still read as single-run-only, leaving the two
  in tension.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ REQ-154 acceptance criteria @@
   - a sentinel created mid-node lets the current node finish; the halt happens at the node boundary, so no ledger is left half written
+  - for the `graph-implement` background loop, the sentinel halts at a spec boundary: the current build finishes and no next ready spec is picked up (see REQ-172)
 - Dependencies:
   - REQ-152
   - DEC-166
+  - REQ-172
```

- Verdict:
- Reason:

---

## REQ-159 (edit)

- **What this decides:** Making the "prove the hook is firing" rule apply to each
  build the loop runs.
- **In plain terms:** REQ-159 proves the safety hook fires before and during a
  run. The loop runs many builds unattended, so this edit states the canary and
  heartbeat run for *each* build the loop performs, not once for the loop as a
  whole. Same proof, applied per build.
- **What happens if you say no:** The loop's per-build liveness proof lives only
  in REQ-172; REQ-159 would still read as one-proof-per-run, understating what an
  unattended loop needs.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ REQ-159 acceptance criteria @@
   - the ledger records the canary result at run start and the heartbeat result at each node boundary, so the proof is in the record rather than in the agent's word
+  - when the `graph-implement` loop runs multiple builds unattended, the canary and heartbeat are proven per build, not once for the loop as a whole; a failed proof ends that build at `BLOCKED` without halting the loop (see REQ-172)
 - Dependencies:
   - REQ-152
   - REQ-153
   - REQ-156
   - DEC-166
+  - REQ-172
```

- Verdict:
- Reason:

---

## REQ-160 (edit)

- **What this decides:** Renaming the intake door from `graph-run` to
  `graph-kickoff`, and naming `graph-implement` as the build entry.
- **In plain terms:** REQ-160 makes `graph-run` "the single intake door." Phase 2
  splits that skill in two: `graph-kickoff` becomes the door you use to start a
  fresh idea, and `graph-implement` is the background build entry. `graph-run`
  retires as a name. This edit retitles the door and updates the acceptance
  criteria, the `AGENT-SKILLS.md` diagram references, and the skill-count wording
  to match (four `graph-*` skills, not three).
- **What happens if you say no:** REQ-160 keeps naming `graph-run` as the door,
  contradicting the agreed rename; every skill file and diagram would disagree
  with the product truth.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ REQ-160 @@
-- Title: `graph-run` is the single intake door
+- Title: `graph-kickoff` is the single intake door; `graph-implement` is the build entry
 - Priority: high
-- Description: The owner starts any work — an idea, an observation, a bug, or a context document — by invoking `graph-run` with a description and nothing else. No branch name is required, no orchestrator is chosen, and nothing is classified before it is described.
+- Description: The owner starts any work — an idea, an observation, a bug, or a context document — by invoking `graph-kickoff` with a description and nothing else. No branch name is required, no orchestrator is chosen, and nothing is classified before it is described. The build half is entered by `graph-implement`, the background loop, not by a per-spec command. `graph-run` retires as a name; its run-one role is `graph-kickoff` and its run-two role is `graph-implement`.
 - Acceptance Criteria:
-  - `graph-run` accepts a bare request with no `--branch` argument and starts a fresh package from it
+  - `graph-kickoff` accepts a bare request with no `--branch` argument and starts a fresh package from it
   - `--branch <name>`, when supplied, is used verbatim and overrides derivation
-  - `AGENT-SKILLS.md`'s `## Workflow sequence` mermaid diagram names `graph-run` as the door
+  - `AGENT-SKILLS.md`'s `## Workflow sequence` mermaid diagram names `graph-kickoff` as the door and `graph-implement` as the background build entry
-  - `AGENT-SKILLS.md`'s `## Graph workflow skills` paragraph says three `graph-*` skills, matching its own three-row table
+  - `AGENT-SKILLS.md`'s `## Graph workflow skills` paragraph says four `graph-*` skills, matching a four-row table (`graph-preflight`, `graph-kickoff`, `graph-gate-review`, `graph-implement`)
-  - `PRD/instructions/graph-workflow-contract.md` names `graph-run` as the entry point for new work
+  - `PRD/instructions/graph-workflow-contract.md` names `graph-kickoff` as the entry point for new work and `graph-implement` as the background build loop; no `graph-run` name remains except in historical receipts
   - a new issue arriving against an `active`, already-mapped-out package still routes to `thejudge-amend`, and the door does not claim that case
 - Constraints:
-  - no skill is deleted; all 14 remain callable
+  - `graph-run` is renamed, not deleted as a capability; its two roles survive as `graph-kickoff` and `graph-implement`
   - the node table, models, per-node caps, loop limits, the `define` gate trigger, and every entry in the contract's `## Boundaries` are unchanged
 - Dependencies:
   - DEC-163
   - DEC-166
   - DEC-167
+  - REQ-170
+  - REQ-171
```

- Verdict:
- Reason:

---

## Blocker questions

None. Every open design fork was resolved with the owner in refinement (skill
names, approval mechanism, ready-detection, parked-build behavior). Remaining
detail — the exact worktree/lock key format, and the loop's polling vs.
event-driven trigger — is implementation mechanics for map-out, not a product
decision that blocks the gate.
