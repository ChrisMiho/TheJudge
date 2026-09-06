# Gate questions — graph-workflow-land

One block per stable ID. Each opens with the plain-language block, then the
complete proposed `PRD/sections/` diff, then the verdict slot. `Current:` excerpts
are byte-identical to the live section files at `8d29ce4` (checked by script).
New entries append after REQ-192 in `PRD/sections/functional-requirements.md`.

The verdict slots are answered at PR review (see `DESIGN-BRIEF.md`,
`## Deviation from the refinement skill`): the PR diff is the applied proposal.
Reworked after quality check 1 (FAIL, 14 findings) on 2026-09-06.

## REQ-193 — the build half works in one folder on one branch

**What this decides:** whether the build loop and the builder keep writing the
same four bookkeeping files on two different branches, or share one folder and
one branch and write it in turns.

**In plain terms:** when the build loop picks up a spec you approved, it makes
one folder (`.worktrees/implement-<slug>`) on one branch
(`thejudge-auto/<slug>-work`) cut from `origin/main`, and every step —
finalizing your verdicts, planning, building, reviewing, writing the receipt —
happens there. The loop's own notes (the run ledger, the package README, the
status marker, the board row) go to that same branch between steps. Today the
loop writes them on the docs branch while the builder writes them on the code
branch, so the code PR conflicts on those files every time (seven of seven
recorded runs). Your checkout is never switched or committed to by the build
half, the same rule the spec-forming half already follows (REQ-191: kickoff
works in `.worktrees/kickoff-<slug>` and leaves your checkout alone).

**What happens if you say no:** the driver keeps committing on one branch and
the builder on another, every code PR keeps conflicting on the ledger and status
files, and the "base is frozen once build opens the PR" patch stays.

Proposed (new entry, appended after REQ-192):

```markdown
### REQ-193
- Title: The build half works in one folder on one branch, and the driver and builder write it in turns
- Priority: high
- Description: `graph-implement` claims an approved spec by cutting `thejudge-auto/<slug>-work` from `origin/main` into `.worktrees/implement-<slug>` and pushing it. Every build-half node — gate resolution, `gate-qc`, `plan`, `build`, `review`, `close` — works in that folder on that branch, and the driver's own commits (ledger rows, package `README.md` sections, the `STATUS.*` marker, the `PRD/work/STATUS.md` board row) go to the same branch between nodes. The launch checkout is never switched, committed to, or stashed by the build half — REQ-191's rule, extended.
- Acceptance Criteria:
  - a spec is ready (REQ-171) only when, in addition, no `thejudge-auto/<slug>-work` branch exists locally or on `origin` and no `.worktrees/implement-<slug>` exists; when either exists the spec is already claimed, and the loop resumes it from the `STATUS.*` marker inside that worktree or leaves it alone when its package folder is gone and its code PR is open
  - ready-detection reads `origin/main` after `git fetch origin` with forms the profile allows — `git show origin/main:PRD/work/` for the package list, `git show origin/main:PRD/work/<slug>/` for the marker, `git show origin/main:PRD/work/<slug>/GATE-QUESTIONS.md` for the slots; the launch checkout's `main` is not pulled or read, and no `git ls-tree` (not in the profile) is issued
  - the claim runs `git fetch origin` and `git worktree add .worktrees/implement-<slug> -b thejudge-auto/<slug>-work origin/main`, then commits `STATUS.active`, the package README's `## Autonomous metadata` rewritten to `- Autonomous base: origin/main`, and the ledger header's `- Worktree: <root>/.worktrees/implement-<slug>` and `- Autonomous base: origin/main` lines as the branch's first commit, and pushes with `git push -u origin thejudge-auto/<slug>-work` from inside the worktree; the branch is the claim, and `STATUS.active` is the marker a resume reads inside it (REQ-171)
  - the autonomous base is defined in the contract as the branch the package's next PR targets: node 1's `thejudge-auto/<slug>` while the docs PR is open, `main` once it has merged and the build half has claimed the spec; `preparation-contract.md` `## Autonomous base` (the canonical home, "never defaults to `main`") gains a paragraph scoping that rule to `thejudge-prepare`'s choice of a base and naming the graph claim's one rewrite as a recorded value, not a default; `thejudge-implement-fanout` and `thejudge-cleanup` read the recorded value unchanged
  - the kickoff worktree is handled before anything is created: a clean `.worktrees/kickoff-<slug>` is removed as REQ-191 states, a dirty one is reported by path and the spec is skipped unclaimed (no branch, no worktree, nothing pushed) so the next tick claims cleanly once the owner has committed or discarded it; the local `thejudge-auto/<slug>` branch is neither deleted nor used again by the build half (REQ-194)
  - every build-half dispatch carries `Working directory: <root>/.worktrees/implement-<slug>` on its own line; the driver runs its own commits as `cd <that path> && git add <paths> && git commit …` and pushes with `git push -u origin thejudge-auto/<slug>-work` — forms `.claude/graph-profile.json` allows; no `git -C` form is used by either graph driver
  - `thejudge-implement-all`, under `graph is controlling`, works in place when the dispatch's `Working directory:` names `.worktrees/implement-<slug>` already checked out on the shared branch: no second worktree, no contributor branch; the dispatch names the shared branch `thejudge-auto/<slug>-work` explicitly and the skill blocks when that name is missing or differs from the worktree's checked-out branch (its "shared branch equals the recorded base" guard no longer fires once the base is `main`); its fetch, rebase onto `origin/thejudge-auto/<slug>-work`, commit, and push-without-force loop is unchanged, and its code PR targets the recorded autonomous base (`main`); direct invocation is unchanged
  - the driver writes nothing to the branch while a node is running, so the two writers alternate and the code PR never conflicts on `GRAPH-RUN.md`, the package `README.md`, the `STATUS.*` marker, or `PRD/work/STATUS.md`
  - `graph-implement/reference.md`'s "the base is frozen once `build` opens the PR" rule and every `land`/`close` reconcile step are removed; the node 6 return-side assertion becomes: the launch checkout's `git status --porcelain` is captured before `build` and must be identical after it, and every path the node reports lies under `.worktrees/implement-<slug>/` — a write to the launch checkout (the 2026-09-05 mirror failure) fails the node and parks; `buildWriteScope(slug)` in `scripts/graph-ledger-check.mjs` returns that single prefix (today it also allows `PRD/work/<slug>/`), with its tests updated, and `graph-implement/SKILL.md` `## Loop` item 3 says the same
  - a resume reads `GRAPH-RUN.md` at `.worktrees/implement-<slug>/PRD/work/<slug>/GRAPH-RUN.md` under the launch root; when `thejudge-auto/<slug>-work` exists on `origin` but no local build worktree does, the loop re-creates the worktree from the remote branch and resumes; `BLOCKED` is reserved for a path that exists but is not a usable worktree
- Constraints:
  - the lock, run state, counters, and evidence log stay at the launch root; the hook, its tiers, and every rule are unchanged
  - `.claude/graph-profile.json` is not edited by this work; the drivers use only forms it already allows
  - `thejudge-implement` (single slice), `thejudge-implement-fanout`, and `thejudge-prepare` are unchanged
  - concurrent builds stay out of scope: one build worktree at a time, one lock
- Dependencies:
  - REQ-171
  - REQ-191
  - REQ-194
- Notes:
  - closes the 2026-09-06 audit's finding 2 (`PRD/work/probe-graph-workflow-audit/`): the `land` rows of the trade-balancer, quick-lookup, shared-chrome, in-depth, user-feedback, scan-spec, and hybrid receipts each record a conflict on these files
  - finding 3 (the PR head reads `ship-ready` while the checkout reads `owner-action`) dissolves with it: no package state exists outside the branch
  - the mirror failure of 2026-09-05 — the builder writing slice status to the launch checkout instead of the PR head — cannot recur when the builder's only checkout is the branch
```

- Verdict:
- Reason:

## REQ-194 — a package costs two pull requests

**What this decides:** whether a built idea reaches `main` in two merges (the
docs PR you already answer, then one code PR) or keeps needing three.

**In plain terms:** today the code PR targets the docs branch, GitHub deletes
that branch when you merge the docs PR, the loop re-creates it, and after the
code PR merges into it the loop has to open a third PR to get everything onto
`main` (the #184/#185/#186-style triplets in the merge history). With this, the
code PR targets `main` directly, and cleanup — the receipt, deleting the work
folder, clearing the board — runs *before* you merge, inside that code PR. Your
merge is the last step. The docs branch is finished when its PR merges, and the
repository setting that deletes merged branches stays on.

**What happens if you say no:** three PRs per package, a branch re-created from
a stale local copy after every docs merge, and a final base-to-main merge nobody
reminds you about.

Proposed (new entry, appended after REQ-193):

```markdown
### REQ-194
- Title: A package costs two pull requests: `close` runs before `land`, inside the code PR
- Priority: high
- Description: The build half branches from `origin/main` and opens its code PR `thejudge-auto/<slug>-work → main`. `thejudge-cleanup` (`close`) runs on that branch before the owner merges, so the receipt, the `PRD/work/<slug>/` deletion, the board-row strip, and the `system-map.md` flip land in the same merge as the code. The docs branch `thejudge-auto/<slug>` is finished when the docs PR merges; GitHub's `delete_branch_on_merge` stays on, nothing re-creates the branch, and no third base→main PR exists.
- Acceptance Criteria:
  - the node table reads 8 `close` (`thejudge-cleanup`, sonnet, cap 120, advances to `land`) and 9 `land` (human PR merge, no cap, outside the run's ledger — the package is on `main` when the owner merges); node names, models, and per-name caps are unchanged
  - `thejudge-cleanup`'s autonomous gate chooses its path by the implementation PR's state, located by the `thejudge-auto:v1:registered:<slug>` marker: a **merged** PR takes the existing four merge-proof checks unchanged (a direct `thejudge-implement-all` package is cleaned up after the owner merges, and lives here); an **open** PR takes the new PR-ready gate: (1) the current checkout is `.worktrees/implement-<slug>` on `thejudge-auto/<slug>-work` and `HEAD` equals `origin/thejudge-auto/<slug>-work` after a fetch; (2) the PR's head is that branch and its base is the recorded autonomous base (`main`), verified with `gh pr view`; (3) the package is `ship-ready` with every criterion `true`; (4) every runtime-cleanup criterion is recorded passing; when the PR state is unknown (HTTP 5xx or no network) the path is decided by git — tip an ancestor of `origin/main` means merged, otherwise open with the PR state recorded as not verified and the tip proven pushed by `git ls-remote --heads origin` — because an outage is not evidence about the work
  - under `graph is controlling` only the open-PR path is valid: `close` runs in `.worktrees/implement-<slug>` after `review` approves and before any merge, and a merged PR at `close` fails the node with that evidence
  - on the open-PR path `close` writes the receipt with `Status: shipped` and a `- PR:` line naming the code PR, folds the ledger into `## Graph run`, flips `system-map.md`, deletes with `git rm -r PRD/work/<slug>/`, strips the board row, runs `npm run quality:check`, commits on the branch, and pushes without force; it removes no worktree and no branch
  - after `close` returns `ok`, the driver appends the `close` row to the receipt's `### Node ledger`, writes the receipt's `## Graph run` summary line as `Terminal state: COMPLETE — land: the owner's merge of <PR URL>`, commits and pushes that, releases the lock, and ends `COMPLETE`; `land` gets no ledger row, because the ledger's `Outcome` vocabulary (`ok` / `failed` / `parked`) has no value that is true of a merge not yet made; the contract's `COMPLETE` row reads "every dispatched node `ok` through `close`; the code PR is open carrying the receipt and the package deletion; `land` is the owner's merge, recorded by GitHub"
  - a resume that finds `.worktrees/implement-<slug>` with no `PRD/work/<slug>/` inside it is post-`close`: it reads the receipt's `### Node ledger` in that worktree, appends the `close` row if missing (evidence: the receipt commit and the PR URL from the registration marker), pushes, releases the lock, and ends `COMPLETE` — the one state where the ledger is read from the receipt
  - after the owner merges, nothing resumes: `PRD/work/<slug>/` is absent from `origin/main`, and `.worktrees/implement-<slug>`, `thejudge-auto/<slug>-work`, and `thejudge-auto/<slug>` are merged leftovers `npm run graph:prune` lists
  - `npm run graph:prune` no longer keeps a merged `thejudge-auto/<slug>` branch because its package is still on `main` (REQ-192)
  - the repository setting `delete_branch_on_merge` stays `true`, and no skill, script, or instruction depends on a branch surviving its own merge
  - `OPERATOR.md` recipe 6 says the code PR is the one merge that lands a package and that no separate base→main hop exists; recipe 7 drops its reminder
  - `thejudge-cleanup`'s fixtures `deleted-base-branch.md`, `gh-outage-during-merge-proof.md`, and `promote-once-at-close.md` seed a merged PR, so they exercise the unchanged merged path and keep their grading keys (each gains one line naming its path); a new fixture `close-inside-the-code-pr.md` seeds an open PR in a build worktree and grades the PR-ready path, authored unmeasured with its three-rep run owed; `graph-implement`'s fixture `build-loop-ready-detection.md` (also unmeasured) is rewritten so its preconditions read `origin/main`, its ready item adds the no-branch/no-worktree condition, and its second-pass item observes the `-work` branch and worktree rather than `STATUS.active` on `main`
- Constraints:
  - `gh pr merge` and `gh pr close` stay denied; `land` is the owner's merge and is never automated
  - `thejudge-cleanup`'s direct mode and its merged-PR gate are unchanged: a direct `thejudge-implement-all` package is still cleaned up after the merge, and a manual package still writes its receipt on the feature branch before the PR
  - no fifth terminal state; a package whose code PR is closed unmerged stays claimed (folder on `main`, branch present) until the owner removes the branch and worktree
  - the node 7 reviewer grades the code before `close`'s docs-only bookkeeping commits; those are reviewed by the owner in the PR
- Dependencies:
  - REQ-171
  - REQ-192
  - REQ-193
- Notes:
  - closes the 2026-09-06 audit's finding 7. Evidence: `gh api repos/ChrisMiho/TheJudge` → `delete_branch_on_merge: true`; `git log --first-parent origin/main` triplets #184/#185/#186, #187/#188/#189, #190/#191/#192, #195/#197/#199; the hybrid receipt's driver-bookkeeping row "GitHub had deleted the branch after PR #195 merged; re-created"
  - single-source-invariants (#188 `-work` → `main`, then #189 for cleanup) is the half-step precedent: it built from `main` but ran cleanup after the merge, so it still needed the third PR
  - the receipt says `shipped` before the merge because it exists on `main` only if the PR merges; on an abandoned branch it is never read
```

- Verdict:
- Reason:

## REQ-171 — the build loop's shape, aligned with the two requirements above

**What this decides:** whether the requirement that already describes the
build loop says what the loop now does — one worktree cut from `origin/main`,
a second PR into `main`, cleanup inside it.

**In plain terms:** REQ-171 already says the loop "branches off fresh `main`"
and "opens a code PR into `main`", but it also says that PR "grows from the
same PR the spec was merged on", which is the old three-PR picture, and it
reads the queue from local `main`. Five bullets change: ready also means "not
yet claimed" (no `-work` branch or build worktree); the claim is the branch,
with `STATUS.active` as its first commit rather than the claim itself; the
worktree and branch are named; the code PR is its own second PR with cleanup
inside it; and deleting the work folder happens inside that PR.

**What happens if you say no:** the requirement keeps describing a PR that
"grows from" the docs PR, which the skill has never done and which REQ-194 now
rules out.

Current:

```markdown
- Description: `graph-implement` is a single, background loop that detects an approved-but-unbuilt spec on local `main`, branches off fresh `main`, runs the build half of the lifecycle, and opens a code PR. It replaces the manual build-resume command with an unattended drain of the approved queue — the owner merges an approved spec PR and the loop picks it up.
```

Proposed:

```markdown
- Description: `graph-implement` is a single, background loop that detects an approved-but-unbuilt spec on `origin/main`, cuts `thejudge-auto/<slug>-work` from `origin/main` into `.worktrees/implement-<slug>` (REQ-193), runs the build half of the lifecycle there, and opens a code PR into `main` that carries the code, the applied product truth, the receipt, and the package's deletion (REQ-194). It replaces the manual build-resume command with an unattended drain of the approved queue — the owner merges an approved spec PR and the loop picks it up.
```

Current:

```markdown
  - a spec is "ready" when its `PRD/work/<slug>/` folder is on `main` at `STATUS.refined` with every `GATE-QUESTIONS.md` verdict slot answered (no blank) and no built code — this state is the queue and needs no bespoke ready-file
```

Proposed:

```markdown
  - a spec is "ready" when its `PRD/work/<slug>/` folder is on `origin/main` at `STATUS.refined` with every `GATE-QUESTIONS.md` verdict slot answered (no blank), and no `thejudge-auto/<slug>-work` branch or `.worktrees/implement-<slug>` exists (REQ-193) — this state is the queue and needs no bespoke ready-file
```

Current:

```markdown
  - on picking up a ready spec, `graph-implement` sets `STATUS.active` as the single claim point, so a second loop iteration or a loop restart never double-picks the same spec — the transition is the idempotency guard (never double-build, never miss)
```

Proposed:

```markdown
  - on picking up a ready spec, `graph-implement` claims it by creating and pushing `thejudge-auto/<slug>-work` in `.worktrees/implement-<slug>` (REQ-193); `STATUS.active` is that branch's first commit and the marker a resume reads inside the worktree, so a second loop iteration or a loop restart sees the branch and never double-picks the same spec (never double-build, never miss)
```

Current:

```markdown
  - for each ready spec the loop dispatches `graph-gate-review` to finalize the owner's verdicts, then re-enters at `gate-qc` and runs `plan → build → review`, branching off fresh `main` in its own worktree
```

Proposed:

```markdown
  - for each ready spec the loop dispatches `graph-gate-review` to finalize the owner's verdicts, then re-enters at `gate-qc` and runs `plan → build → review → close`, every node in `.worktrees/implement-<slug>` on `thejudge-auto/<slug>-work` cut from `origin/main` (REQ-193)
```

Current:

```markdown
  - each shipped build opens a code PR into `main` that grows from the same PR the spec was merged on; `land` (the code PR merge) stays human and is never automated
  - `thejudge-cleanup` deleting `PRD/work/<slug>/` on ship removes it from the queue, so a shipped spec is never re-seen
```

Proposed:

```markdown
  - each build opens its own code PR `thejudge-auto/<slug>-work → main` — a second PR, not a continuation of the merged docs PR — and `close` runs inside it before `land` (REQ-194); `land` (the code PR merge) stays human and is never automated
  - `thejudge-cleanup` deleting `PRD/work/<slug>/` inside the code PR removes the spec from the queue once the owner merges, so a shipped spec is never re-seen
```

- Verdict:
- Reason:

## REQ-191 — the docs branch's fate is now decided

**What this decides:** whether the spec-forming requirement keeps saying the
build half still uses the docs branch as its base, or points to the new answer.

**In plain terms:** REQ-191 (kickoff works in its own worktree and never
touches your checkout) deliberately left one thing open: what happens to the
local docs branch after GitHub deletes the remote copy. It said the build half
"keeps re-creating it from the local branch exactly as today" and told the claim
step never to delete it because it was "the build half's base". The build half
now starts from `origin/main` (REQ-194), so the branch is just a leftover
`npm run graph:prune` lists. Two lines change.

**What happens if you say no:** REQ-191 keeps stating a base-branch role that
no longer exists, and contradicts REQ-193 and REQ-194.

Current:

```markdown
  - at the `owner-action` park the worktree stays and the report names its path; `graph-implement` removes it at claim time with `git worktree remove` (never `--force`) when the tree is clean, parks naming the worktree otherwise, and never deletes the local `thejudge-auto/<slug>` branch, which the build half still records as its autonomous base
```

Proposed:

```markdown
  - at the `owner-action` park the worktree stays and the report names its path; `graph-implement` removes it at claim time with `git worktree remove` (never `--force`) when the tree is clean, parks naming the worktree otherwise, and leaves the local `thejudge-auto/<slug>` branch alone — the build half starts from `origin/main` and never uses that branch again (REQ-194); `npm run graph:prune` lists it once merged (REQ-192)
```

Current:

```markdown
  - the local base branch's re-creation after GitHub's delete-on-merge is not decided here; the build half keeps re-creating it from the local branch exactly as today
```

Proposed:

```markdown
  - the docs branch's fate after GitHub's delete-on-merge is decided in REQ-194: the build half cuts `thejudge-auto/<slug>-work` from `origin/main` (REQ-193) and never re-creates `thejudge-auto/<slug>`
```

- Verdict:
- Reason:

## REQ-192 — prune stops protecting the docs branch

**What this decides:** whether `npm run graph:prune` keeps a merged docs branch
alive because its package is still waiting to be built.

**In plain terms:** part 1 made prune keep a merged `thejudge-auto/<slug>`
branch whenever `PRD/work/<slug>/` was still on `main`, reasoning the build half
would need it as its base. It no longer does (REQ-194), so that rule is removed:
any merged `thejudge-auto/*` branch is safe to delete, and prune says so.

**What happens if you say no:** prune keeps listing merged docs branches as
"kept: the build half's base" for a build half that never touches them.

Current:

```markdown
  - candidates are: local `thejudge-auto/*` branches whose tip is an ancestor of `origin/main` and whose package folder `PRD/work/<slug>/` (slug = the name after the prefix, with any `-work` / `-cleanup` suffix removed) no longer exists on `origin/main`; worktrees under `.worktrees/` (excluding `.worktrees/.codehealth/`, which the codehealth loop manages) whose branch is merged into `origin/main` and whose `git status --porcelain` is empty; `.worktrees/.graph-intake/<run-id>/` folders whose run id does not match the live `.worktrees/.graph-run.lock`
  - a merged `thejudge-auto/<slug>` branch whose `PRD/work/<slug>/` still exists on `origin/main` is reported as kept ("package still on main: the build half's base"), never deleted
```

Proposed:

```markdown
  - candidates are: local `thejudge-auto/*` branches whose tip is an ancestor of `origin/main` — a docs branch whose package is still on `origin/main` awaiting build included, because the build half starts from `origin/main`, not from that branch (REQ-194); worktrees under `.worktrees/` (excluding `.worktrees/.codehealth/`, which the codehealth loop manages) whose branch is merged into `origin/main` and whose `git status --porcelain` is empty; `.worktrees/.graph-intake/<run-id>/` folders whose run id does not match the live `.worktrees/.graph-run.lock`
  - an unmerged `thejudge-auto/*` branch — a build in flight, or an abandoned run whose branch is evidence — is reported as kept, never deleted
```

- Verdict:
- Reason:

## REQ-164 — the prune command is spelled so npm passes the flag

**What this decides:** a spelling fix in one constraint.

**In plain terms:** `npm run graph:prune --apply` does nothing more than the
dry run, because npm keeps a bare `--apply` for itself. The working form is
`npm run graph:prune -- --apply`. The same fix goes into the part-1 receipt's
two lines directly (receipts are not product truth and need no block).

**What happens if you say no:** the requirement keeps naming a command that
silently does the dry run.

Current:

```markdown
  - the run does not delete the branch or the kickoff worktree it left behind. `graph-preflight`'s contract forbids tidying a failed run; the owner removes them deliberately with `npm run graph:prune --apply` (REQ-192) or by hand
```

Proposed:

```markdown
  - the run does not delete the branch or the kickoff worktree it left behind. `graph-preflight`'s contract forbids tidying a failed run; the owner removes them deliberately with `npm run graph:prune -- --apply` (REQ-192; the `--` is what makes npm pass the flag through) or by hand
```

- Verdict:
- Reason:

## FLOW-021 — the bug-report flow ends at the code PR merge

**What this decides:** three lines of the "owner reports a bug" flow that name
how the owner approves, where the run stops, and what the owner's last touch is.

**In plain terms:** the flow says the owner "resolves the gate with
`/graph-gate-review` and resumes with `/graph-implement`", that the run "stops
at node 8 (`land`) for the owner to merge", and that the owner's only touch is
"the merge at node 8". Approval is answer-then-merge today (you answer the
verdict slots in the docs PR and merge it; the build loop applies them), and
with `close` now node 8 and `land` node 9, the run ends with the code PR open
and your merge lands the fix, the receipt, and the folder deletion together.
Steps 3 and 6 of this flow are stale from earlier packages and are left alone
here.

**What happens if you say no:** the flow keeps describing a live resume command
you no longer run and points at a node number that now means cleanup.

Current:

```markdown
  7. Owner resolves the gate with `/graph-gate-review PRD/work/<slug>/` and resumes with `/graph-implement PRD/work/<slug>/`.
```

Proposed:

```markdown
  7. Owner answers the verdict slots in `GATE-QUESTIONS.md` in the docs PR and merges it; the `graph-implement` loop claims the spec, dispatches `graph-gate-review` to apply the verdicts, and continues.
```

Current:

```markdown
  8. The run continues through `gate-qc`, `plan`, `build`, and `review` unattended, and stops at node 8 (`land`) for the owner to merge.
```

Proposed:

```markdown
  8. The run continues through `gate-qc`, `plan`, `build`, `review`, and `close` unattended in `.worktrees/implement-<slug>` (REQ-193), ends `COMPLETE` with the code PR `thejudge-auto/<slug>-work → main` open, and the owner's merge (`land`, node 9) puts the fix, the receipt, and the package's deletion on `main` in one step (REQ-194).
```

Current:

```markdown
  - refinement changes no product truth → the `define` gate never parks, and the owner's only touch is the merge at node 8
```

Proposed:

```markdown
  - refinement changes no product truth → the `define` gate never parks, and the owner's only touches are merging the docs PR and then the code PR (`land`, node 9)
```

- Verdict:
- Reason:

## FLOW-022 — the intake flow's last step names `close` correctly

**What this decides:** one line of the "owner hands the door a context
document" flow.

**In plain terms:** the flow says the run "continues unattended to node 8, and
`thejudge-cleanup` later folds an `## Intake` section into the receipt". Node 8
is now `close` itself, and it runs inside the code PR before the owner merges.
One sentence is reworded to say so.

**What happens if you say no:** the flow keeps describing cleanup as something
that happens "later", after the merge, which REQ-194 no longer allows.

Current:

```markdown
  8. The run continues unattended to node 8, and `thejudge-cleanup` later folds an `## Intake` section into the receipt naming each intake file and its stated origin.
```

Proposed:

```markdown
  8. The run continues unattended through `close` (node 8), where `thejudge-cleanup` folds an `## Intake` section into the receipt naming each intake file and its stated origin, inside the code PR; the owner's merge (`land`, node 9) lands it (REQ-194).
```

- Verdict:
- Reason:

## Blocker questions

None. Both decisions the session brief delegated (one writer per branch; build
from `main` with `delete_branch_on_merge` left on) are made in `DESIGN-BRIEF.md`
D1–D3 with the evidence beside them.
