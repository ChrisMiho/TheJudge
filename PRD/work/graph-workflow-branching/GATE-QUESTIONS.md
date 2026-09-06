# Gate questions — graph-workflow-branching

Seven blocks: two new requirements (REQ-191, REQ-192) and five amendments
(REQ-170, REQ-162, REQ-164, REQ-161 in `PRD/sections/functional-requirements.md`;
FLOW-022 in `PRD/sections/user-flows.md`). Each `Current:` excerpt is
byte-for-byte the live text; each `Proposed:` is the complete replacement.
Answer every `- Verdict:` slot.

## REQ-191 — a fresh idea runs in its own folder and never touches your checkout

**What this decides:** whether starting an idea with `/graph-kickoff` keeps
your working checkout on `main`, untouched, by doing all the spec work in a
separate folder under `.worktrees/kickoff-<slug>` branched from `origin/main`.

**In plain terms:** today the run turns *your* checkout into its work area: it
creates the run branch from whatever you happen to be on, commits the design
work there, opens the docs PR, and leaves you sitting on that branch. If your
checkout was dirty it auto-commits or stashes your files first. With this
change the run makes a fresh folder for itself (a git worktree, a second
checkout of the same repository), always starting from `origin/main`, works
there, and opens the PR from there. Your checkout is never switched, committed
to, or stashed, so the auto-commit/stash step is removed entirely. The
"refuse to start while another idea's docs PR is open" rule is removed too,
because it only existed to stop a run branching off a stale base, and starting
from `origin/main` makes that impossible. The build loop deletes the idea's
folder (not its branch) once you have merged the docs PR and it picks the spec
up. One more thing rides along: the hook rule that stops a run editing its own
skills and settings only matched paths at the repository root, so a file inside
any `.worktrees/` folder was never actually protected, including the build
half's. That rule now matches the same paths inside a worktree. (Extends the
parallel-ideas requirement REQ-170; replaces the auto-commit/stash behavior
the intake rules REQ-162 and REQ-164 describe.)

**What happens if you say no:** the run keeps working in your checkout, you
keep landing on run branches, a dirty checkout keeps getting auto-committed or
stashed, and a second idea stays refused while the first waits for your answer.

Proposed (new entry, after REQ-190 in `PRD/sections/functional-requirements.md`):

```markdown
### REQ-191
- Title: Spec-forming runs work in a kickoff worktree off `origin/main` and never mutate the launch checkout
- Priority: high
- Description: `graph-preflight` (node 1) creates `.worktrees/kickoff-<slug>` as a git worktree on a new `thejudge-auto/<slug>` branch cut from `origin/main`, and every later spec-forming node (2–4) works inside it. The launch checkout — the directory the owner's session is rooted in — is never switched, committed to, or stashed by a graph run, so the owner stays on `main` and a second idea can start while the first waits at its gate.
- Acceptance Criteria:
  - from a root checkout, preflight's planned commands are `git fetch origin`, the branch-collision check, `git worktree add .worktrees/kickoff-<slug> -b thejudge-auto/<slug> origin/main` (or the explicit `--base`), and `git -C .worktrees/kickoff-<slug> push -u origin thejudge-auto/<slug>`; it prints the absolute worktree path and `base: origin/main`
  - the branch start point defaults to `origin/main`, never to the current branch; `--base <ref>` remains an explicit override and is reported as one
  - preflight never runs `git switch`, `git add`, `git commit`, or `git stash` against the launch checkout; the working-tree classification, its file/line thresholds, the secret gate, and the auto-commit message are removed from `scripts/graph-preflight.mjs`
  - preflight refuses when `.worktrees/kickoff-<slug>` already exists, naming it
  - `--slug <slug>` is required on the fresh-run path, as it already is with `--take-lock`; it names the worktree
  - a session already rooted in a linked worktree runs preflight in place: it requires a clean tree (`git status --porcelain` empty, else exit 1 naming the dirty paths), then `git switch -c thejudge-auto/<slug> origin/main` — from a branch or a detached HEAD — and push
  - the base→main guard (`classifyPendingBaseToMain`) is removed from the script, its tests, and every skill and instruction that describes it; a fresh run starts while another package's base→main PR is open
  - `graph-kickoff` dispatches nodes 2–4 with an absolute `Working directory:` line naming the kickoff worktree, runs its own ledger commits there, stages intake at the root's `.worktrees/.graph-intake/<run-id>/` and passes that absolute path, and opens the docs PR from the worktree branch
  - the ledger header carries `- Worktree: <absolute path>`; `graph-kickoff` resumes a slug by reading `.worktrees/kickoff-<slug>/PRD/work/<slug>/GRAPH-RUN.md` under the launch root and passes that path to `scripts/graph-ledger-check.mjs`; a missing worktree on resume ends the run `BLOCKED` naming it
  - the concurrency lock, run state, counters, and evidence log stay at the launch root; the hook's `protected-path-write` rule matches a written path after making it relative to the project root and stripping a leading `.worktrees/<dir>/` segment, so the relative, absolute, `.worktrees/kickoff-<slug>/…`, and `.worktrees/implement-<slug>/…` forms of a protected path are all denied while the lock is held and all allowed without it — asserted by tests for each form
  - at the `owner-action` park the worktree stays and the report names its path; `graph-implement` removes it at claim time with `git worktree remove` (never `--force`) when the tree is clean, parks naming the worktree otherwise, and never deletes the local `thejudge-auto/<slug>` branch, which the build half still records as its autonomous base
  - `OPERATOR.md` carries a recipe for starting a second idea while the first waits, and states that two runs *at the same time* need two sessions rooted in two checkouts (`git worktree add --detach .worktrees/session-<name> origin/main`, then launch the session there) because the hook counts every session's tool calls in one root against the live node's cap
- Constraints:
  - worktrees never escape the repo-local `.worktrees/` root; `.claude/worktrees/` (the harness's own feature) is not used by graph runs
  - the lock record, filename, keying, and `classifyLock()` behavior are unchanged; the hook's tiers and every other rule are unchanged
  - no `thejudge-*` skill changes; the retirement touches `graph-*` skills, scripts, the contract, the two `graph-kickoff` skill fixtures, and owner docs only
  - a dirty in-place worktree is refused, never resolved on the owner's behalf
  - the local base branch's re-creation after GitHub's delete-on-merge is not decided here; the build half keeps re-creating it from the local branch exactly as today
- Dependencies:
  - REQ-160
  - REQ-161
  - REQ-170
  - REQ-171
- Notes:
  - this closes the 2026-09-06 audit's findings 1, 4, 5, and 6 (`PRD/work/probe-graph-workflow-audit/`): every branch, sync, and parallel symptom traced to the launch checkout doubling as the driver's working branch
  - the build half already works this way — node 6 in `.worktrees/implement-<slug>` with the lock at the root. The first quality check of this package found that the protected-path rule never reached inside that worktree either (`isProtectedPath` is anchored to the repository root), which is why the rule is made worktree-aware here rather than left as a stated limit
  - the guard's original failure (`user-feedback-spec`, PR #107, a run branched off a `main` missing the prior package) cannot recur once every run starts from `origin/main`
```

- Verdict:
- Reason:

## REQ-192 — a `graph:prune` command that shows leftovers and deletes only on `--apply`

**What this decides:** whether the repository gets a housekeeping command,
`npm run graph:prune`, that lists finished-run leftovers on your machine and
removes them only when you pass `--apply`.

**In plain terms:** after a run ships, its local branch, its worktree folder,
and its intake staging folder stay behind; nothing cleans them up. Today your
checkout holds eight merged run branches and six stale staging folders. The
command lists what can go, and with `--apply` deletes only the safe cases:
branches fully merged into `origin/main` (with git's safe delete, never the
forced one) whose package has already shipped, worktrees whose branch is
merged and whose files are clean, and staging folders for runs that hold no
lock. A merged docs branch whose package is still waiting to be built is kept,
because the build loop still uses it. It never touches anything on GitHub and
never touches the run's control files.

**What happens if you say no:** leftovers keep piling up and the state of your
checkout stays hard to read at a glance; you clean by hand.

Proposed (new entry, after REQ-191 in `PRD/sections/functional-requirements.md`):

```markdown
### REQ-192
- Title: `graph:prune` lists local run leftovers and removes them only with `--apply`
- Priority: medium
- Description: `npm run graph:prune` reports local branches, worktrees, and intake staging folders left behind by finished graph runs, and deletes the safe subset only when invoked with `--apply`.
- Acceptance Criteria:
  - without `--apply` the command prints every candidate with the reason it qualifies or is kept, and changes nothing
  - candidates are: local `thejudge-auto/*` branches whose tip is an ancestor of `origin/main` and whose package folder `PRD/work/<slug>/` (slug = the name after the prefix, with any `-work` / `-cleanup` suffix removed) no longer exists on `origin/main`; worktrees under `.worktrees/` (excluding `.worktrees/.codehealth/`, which the codehealth loop manages) whose branch is merged into `origin/main` and whose `git status --porcelain` is empty; `.worktrees/.graph-intake/<run-id>/` folders whose run id does not match the live `.worktrees/.graph-run.lock`
  - a merged `thejudge-auto/<slug>` branch whose `PRD/work/<slug>/` still exists on `origin/main` is reported as kept ("package still on main: the build half's base"), never deleted
  - with `--apply` it deletes branches with `git branch -d` (never `-D`), worktrees with `git worktree remove` (never `--force`), and staging folders with a filesystem remove; anything that fails is reported and skipped
  - it never deletes a remote ref, never runs `git push`, and never removes `.worktrees/.graph-run.lock`, `.worktrees/.graph-stop`, `.worktrees/.graph-run-state.json`, `.worktrees/.graph-node-calls.json`, `.worktrees/.graph-evidence.jsonl`, or `.worktrees/.graph-denials.jsonl`
  - worktrees outside `.worktrees/` are reported as out-of-root and never removed
  - the classification is a pure, tested function over the observed branch list, worktree list, and lock; I/O lives in `main()`
- Constraints:
  - the command fetches first so "merged" is judged against a fresh `origin/main`
  - no `thejudge-*` skill invokes it; it is an owner command, listed in `OPERATOR.md`
- Dependencies:
  - REQ-191
- Notes:
  - a run does not prune its own leftovers because a failed run's branch is evidence (`graph-preflight`'s "never tidy a failed run" rule); pruning is the owner's deliberate act
```

- Verdict:
- Reason:

## REQ-170 — the parallel-ideas rule now says preflight makes the worktree

**What this decides:** whether the existing rule for running several ideas at
once is corrected so that preflight *creates* the per-idea worktree, instead
of handing you a command that preflight then refuses.

**In plain terms:** REQ-170 says two ideas can run at once, each in its own
git worktree, and that preflight "provides the worktree path and creation
command". That command creates the branch by hand, and then preflight refuses
the same branch as already existing, so the documented path never worked. With
REQ-191 preflight creates the worktree itself, so this bullet is rewritten to
say so and to state the two shapes: from a root checkout it makes the kickoff
worktree; from a session already rooted in a worktree it works in place.

**What happens if you say no:** REQ-170 keeps describing a command that
contradicts preflight, and REQ-191 and REQ-170 disagree about who creates the
worktree.

Current (`PRD/sections/functional-requirements.md`, REQ-170 acceptance criteria, third bullet):

```markdown
  - `graph-preflight` provides the worktree path and creation command (`kickoffWorktreePath` / `kickoffWorktreeCommand`), and running inside a fresh worktree does not auto-commit or stash the launch checkout on behalf of a per-idea run; the launch checkout is left untouched
```

Proposed:

```markdown
  - `graph-preflight` creates the per-idea worktree itself (`kickoffWorktreePath` names it; the `git worktree add … origin/main` step is a planned preflight command, REQ-191) when run from a root checkout, and works in place — clean tree required — when the session is already rooted in a linked worktree; in both shapes the launch checkout is never committed to, stashed, or switched
```

- Verdict:
- Reason:

## REQ-162 — the intake rule stops citing the stash that no longer exists

**What this decides:** whether the intake requirement's reasons for staging
your handed-in documents outside the working tree are updated, now that
preflight no longer stashes or auto-commits.

**In plain terms:** REQ-162 explains that your pasted or referenced documents
are copied to `.worktrees/.graph-intake/` before the run starts because
preflight might stash them away or auto-commit them. Both behaviors go with
REQ-191. The staging still makes sense, for a simpler reason: the run now works
in a different folder than your checkout, so a file left in your checkout would
not be there for the run to read. Three sentences are rewritten to say that.

**What happens if you say no:** the requirement keeps explaining the staging
by a stash and an auto-commit that the script no longer performs.

Current (`PRD/sections/functional-requirements.md`, REQ-162 constraints, first two bullets):

```markdown
  - intake is never staged inside the git working tree before node 1. `scripts/graph-preflight.mjs` counts untracked files (`git ls-files --others --exclude-standard`) and resolves an oversized tree with `git stash push -u`, which would sweep the intake off before the branch exists. `.worktrees/` is gitignored, and `git stash push -u` does not touch ignored paths
  - no size gate is placed on intake, because a gate would refuse exactly the thorough handoff document this accepts. Staging outside the working tree is what makes that hold: node 1's file-count and changed-line thresholds never see the intake
```

Proposed:

```markdown
  - intake is never staged inside the launch checkout's working tree before node 1. Nodes 2–4 run in `.worktrees/kickoff-<slug>` (REQ-191), a different checkout, so a file left in the launch tree is not visible to the run at all. `.worktrees/` is gitignored, and the driver passes the staging path as an absolute path under the launch root
  - no size gate is placed on intake, because a gate would refuse exactly the thorough handoff document this accepts. Staging under the ignored `.worktrees/` root is what makes that hold: nothing in preflight counts or resolves the launch tree any more
```

Current (`PRD/sections/functional-requirements.md`, REQ-162 notes, last bullet):

```markdown
  - node 1 sweeps the intake *source* as well, so the staged copy is the only one the run is guaranteed to read. A handed-in path that is itself untracked — `docs/whatIsGraph/graph-hardening-handoff.md` is one, at 276 lines — is stashed off the checkout when the tree exceeds the thresholds, and auto-committed as `chore(graph): auto-commit working tree before graph run` when it does not. The door takes its copy at launch, before either happens
```

Proposed:

```markdown
  - the staged copy is the only one the run is guaranteed to read. A handed-in path that is itself untracked — `docs/whatIsGraph/graph-hardening-handoff.md` is one, at 276 lines — exists only in the launch checkout, not in the kickoff worktree the nodes run in. The door takes its copy at launch, so the run reads it from `.worktrees/.graph-intake/<run-id>/` regardless
```

- Verdict:
- Reason:

## REQ-164 — the thin-request report names the worktree, not a stash

**What this decides:** whether the "request too thin to package" report is
updated to name the kickoff worktree the run left behind, instead of reporting
whether it auto-committed or stashed your files.

**In plain terms:** when a request is too thin to become a package, the run
stops and tells you what it left behind so a retry loses nothing. Today that
report says whether preflight auto-committed or stashed your working tree.
After REQ-191 there is no such step; what the run leaves behind is a pushed
branch and a kickoff worktree. Two sentences are rewritten to name those.

**What happens if you say no:** the report promises information about a step
that no longer runs, and does not tell you about the worktree it did leave.

Current (`PRD/sections/functional-requirements.md`, REQ-164 acceptance criteria, fourth bullet):

```markdown
  - the report names the `thejudge-auto/<slug>` branch node 1 created and pushed, whether node 1 auto-committed or stashed the working tree, and the staging path holding any intake, so a retry loses no work and re-pastes no material
```

Proposed:

```markdown
  - the report names the `thejudge-auto/<slug>` branch node 1 created and pushed, the `.worktrees/kickoff-<slug>` worktree it created (REQ-191), and the staging path holding any intake, so a retry loses no work and re-pastes no material; `npm run graph:prune` (REQ-192) lists both once the branch is merged or abandoned
```

Current (`PRD/sections/functional-requirements.md`, REQ-164 constraints, third bullet):

```markdown
  - the run does not delete the branch it left behind. `graph-preflight`'s contract forbids tidying a failed run, and node 1 may have auto-committed real working-tree changes onto that branch
```

Proposed:

```markdown
  - the run does not delete the branch or the kickoff worktree it left behind. `graph-preflight`'s contract forbids tidying a failed run; the owner removes them deliberately with `npm run graph:prune --apply` (REQ-192) or by hand
```

- Verdict:
- Reason:

## REQ-161 — the branch-naming rule stops promising preflight is "otherwise unchanged"

**What this decides:** whether one sentence in the branch-naming requirement
is updated so it no longer asserts that preflight's own contract is unchanged,
now that REQ-191 changes it.

**In plain terms:** REQ-161 says the door hands preflight the branch name as
its required `--branch` argument "and its own contract is otherwise
unchanged". That was true when the door was introduced. After REQ-191
preflight also needs `--slug`, creates a worktree, and no longer commits or
stashes. One line is rewritten so the two requirements agree.

**What happens if you say no:** REQ-161 keeps asserting something REQ-191
contradicts.

Current (`PRD/sections/functional-requirements.md`, REQ-161 acceptance criteria, third bullet):

```markdown
  - `graph-preflight` receives that branch as its required `--branch` argument, and its own contract is otherwise unchanged
```

Proposed:

```markdown
  - `graph-preflight` receives that branch as its required `--branch` argument and the slug as `--slug` (REQ-191); the branch is created in `.worktrees/kickoff-<slug>` off `origin/main`
```

- Verdict:
- Reason:

## FLOW-022 — the context-document flow stops describing a stash

**What this decides:** whether the flow for handing the door a context
document is updated in the two places it explains staging by preflight's
stash and auto-commit, which REQ-191 removes.

**In plain terms:** FLOW-022 walks through what happens when you hand
`/graph-kickoff` a document. Step 3 says the document is staged under
`.worktrees/` because that is "an ignored path node 1 cannot stash", and an
edge case says an untracked source file "is stashed off the checkout or
auto-committed". Neither happens any more. Both sentences are rewritten to the
real reason: the run works in a separate folder, so the staged copy is the one
it reads.

**What happens if you say no:** the flow keeps explaining the staging by a
step that no longer exists.

Current (`PRD/sections/user-flows.md`, FLOW-022 main flow, step 3):

```markdown
  3. The door writes each intake item verbatim into `.worktrees/.graph-intake/<run-id>/` before dispatching node 1 — an ignored path node 1 cannot stash — and records any document the material cites as a citation without fetching it.
```

Proposed:

```markdown
  3. The door writes each intake item verbatim into `.worktrees/.graph-intake/<run-id>/` under the launch root before dispatching node 1 — an ignored path the kickoff worktree's nodes read by absolute path (REQ-191) — and records any document the material cites as a citation without fetching it.
```

Current (`PRD/sections/user-flows.md`, FLOW-022 edge cases, fifth bullet):

```markdown
  - the handed-in source file is itself untracked → node 1 stashes it off the checkout or auto-commits it, and the run reads the copy the door staged at launch instead
```

Proposed:

```markdown
  - the handed-in source file is itself untracked → it exists only in the launch checkout, which the run never touches (REQ-191); the run reads the copy the door staged at launch instead
```

- Verdict:
- Reason:

## Blocker questions

None. The three open choices (retire auto-commit/stash, worktree removed at
build claim, include the prune command) were answered by the owner on
2026-09-06 and are recorded in `DESIGN-BRIEF.md`.
