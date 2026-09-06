# Design brief — graph-workflow-land

**What this decides:** how a built idea reaches `main`. Today it takes three
pull requests and a hand-fixed merge conflict every time. After this, it takes
two pull requests and no conflict: the docs PR you already answer and merge,
then one code PR that carries the code, the applied product truth, the receipt,
and the deletion of the work folder.

**In plain terms:** the build half gets one folder and one branch. When the
build loop picks up an approved spec it cuts `thejudge-auto/<slug>-work` from
`origin/main` into `.worktrees/implement-<slug>`, and everything that happens
next — finalizing your verdicts, planning, building, reviewing, and writing the
receipt — happens in that folder on that branch. The loop's own bookkeeping
(the run ledger, the package README, the status marker, the board row) goes to
the same branch, between steps, so there are never two versions of those files
to reconcile. Cleanup runs *before* you merge, inside the code PR, so your merge
is the last step and there is no third "base to main" PR afterward. The docs
branch GitHub deletes on merge is simply finished; nothing re-creates it.

**What happens if you say no:** every build keeps conflicting on the ledger and
status files at `land`, the driver keeps re-creating a branch GitHub deleted,
and every package keeps costing a third pull request you have to remember to
merge.

- Slug: `graph-workflow-land`
- Status: refined (quality checks 1–3 FAIL with 14, 12, and 16 findings, each
  reworked; quality check 4 PASS with 14 non-blocking notes, folded in) on the
  deviation stated next
- Source: `PRD/work/probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`,
  findings 2 and 7; prior run
  `PRD/instructions/receipts/graph-workflow-branching-2026-09-06.md` (part 1)
- Kind: manual package (`OPERATOR.md` recipe 9) on `fix/graph-workflow-land`
  from `origin/main` (`8d29ce4`), in `.worktrees/graph-workflow-land`

## Deviation from the refinement skill, stated as one

`thejudge-refinement` sets `refined` on the owner's explicit approval, and the
verdict slots in `GATE-QUESTIONS.md` are the owner's. Neither happens live
here: the session brief delegated both decisions ("design a single-writer
arrangement", "decide between turning the setting off and building from `main`
directly"), asked for one PR the owner merges, and no owner is present in the
session. So `refined` is set on that delegation, the slots stay blank, and the
owner's review is the PR: the diff applies the proposal, and a rejected block is
reverted in the PR before merge. This is a deviation, not an assumption, and it
is recorded here so nobody reads the blank slots as an oversight.

## The problem, grounded

Two writers, one set of files. Evidence: the `land` rows of seven receipts
(trade-balancer, quick-lookup, shared-chrome, in-depth, user-feedback,
scan-spec, hybrid) each record a conflict on `GRAPH-RUN.md`, the package
`README.md`, the `STATUS.*` marker, or `PRD/work/STATUS.md`, resolved by the
driver merging the base into the launch checkout by hand. `graph-implement/
reference.md` § "The base is frozen once `build` opens the PR" is the patch over
it. On 2026-09-05 (hybrid, build attempt 2) the mirror failure happened: the
builder wrote slice status and `STATUS.ship-ready` to the launch checkout, not
to the PR head.

Three PRs, two branch re-creations. `gh api repos/ChrisMiho/TheJudge` reports
`delete_branch_on_merge: true`. `git log --first-parent origin/main` shows the
triplets #184/#185/#186, #187/#188/#189, #190/#191/#192, #195/#197/#199. The
hybrid receipt's driver-bookkeeping row: "GitHub had deleted the branch after
PR #195 merged; re-created".

Already half-decided in product truth: REQ-171 says the loop "branches off fresh
`main` in its own worktree" and "opens a code PR into `main`"; the skill built
`-work` → `thejudge-auto/<slug>` instead. This package aligns the skill with
REQ-171 and finishes the design.

## Decisions

### D1 — One folder, one branch, writers take turns

At claim, the driver (rooted in the launch checkout, which it never switches,
commits to, or stashes — REQ-191's rule extended to the build half) runs:

```
git fetch origin
git worktree add .worktrees/implement-<slug> -b thejudge-auto/<slug>-work origin/main
```

then commits the claim as the branch's first commit — the package README's
`## Autonomous metadata` rewritten to `- Autonomous base: origin/main`, and the
ledger header's `- Worktree:` and `- Autonomous base:` lines — and pushes with
`cd .worktrees/implement-<slug> && git push -u origin thejudge-auto/<slug>-work`.
The claim commit does **not** touch the `STATUS.*` marker: the marker stays
`refined` (as merged from `main`) until `plan` sets `active`, exactly as the
entry-point table expects, so a resume at any point between claim and `plan`
enters at gate resolution or `gate-qc` and never skips the owner's verdicts.
(Today the claim writes `STATUS.active` and `graph-gate-review` flips it back;
a resume inside that window would route to `plan` with the verdicts unapplied.)

Every build-half node — gate resolution (`graph-gate-review`), `gate-qc`,
`plan`, `build`, `review`, `close` — is dispatched with
`Working directory: <root>/.worktrees/implement-<slug>` and works there. The
driver writes to the branch only between nodes (`cd <worktree> && git add
<paths> && git commit …`, then the same push), so the driver and the builder
alternate and no two commits ever compete for the same file.

`thejudge-implement-all`, under `graph is controlling`, works **in place** when
the dispatch's `Working directory:` already names `.worktrees/implement-<slug>`
checked out on the shared branch: no second worktree, no contributor branch. The
dispatch must name the shared branch explicitly and it must equal the worktree's
checked-out branch — the skill blocks otherwise, because its existing
"shared branch equals the recorded base" guard stops firing once the base is
`main`. Its fetch/rebase/commit/push-without-force loop and PR lifecycle are
unchanged; the PR base is the recorded autonomous base, now `main`. Direct
invocation is untouched.

The node 6 write-scope assertion becomes a real check rather than a tautology:
the launch checkout's `git status --porcelain` is captured before `build` and
must be identical after it (the launch checkout is on `main`; any write there
shows), and every path the node reports lies under `.worktrees/implement-<slug>/`.
The rule is executable code, not only prose: `buildWriteScope(slug)` in
`scripts/graph-ledger-check.mjs` returns the two-prefix pair today and drops
`PRD/work/<slug>/`, with its tests in `graph-ledger-check.test.mjs` updated to
the single prefix; the contract's §Instruction ledger paragraph "Node 6 carries
the return-side half", `graph-implement/SKILL.md` `## Loop` item 3, and
`reference.md` §Node 6 return-side assertion say the same thing in prose. Paths
are compared launch-root-relative: the `build` dispatch requires the node to
report every written path relative to the launch root or absolute, and the
driver strips the launch root from absolute paths before `classifyBuildWrites`,
so a correct build reporting `.worktrees/implement-<slug>/PRD/work/<slug>/…`
passes and a bare `PRD/work/<slug>/…` (a launch-checkout write) parks.

Claim ordering: the kickoff worktree is dealt with **before** anything is
created. A clean `.worktrees/kickoff-<slug>` is removed; a dirty one is reported
by path and the spec is skipped **unclaimed** (no branch, no worktree, nothing
pushed) so the owner can commit or discard it and the next tick claims cleanly.
Only then does the claim create the branch and worktree.

Consequences: the "base frozen" rule and every `land`/`close` reconcile step are
deleted; audit finding 3 ("PR ready and local state disagree") dissolves because
no package state exists outside the branch.

### D2 — Build from `main`; keep `delete_branch_on_merge` on

The docs branch `thejudge-auto/<slug>` is finished when the docs PR merges.
GitHub deleting it is correct behavior, not a problem to work around. The build
half never reads, pushes, or opens a PR against that branch again, and nothing
re-creates it. The setting stays `true`; no skill, script, or instruction may
depend on a branch surviving its own merge.

The **autonomous base** is redefined as "the branch the package's next PR
targets": node 1's `thejudge-auto/<slug>` while the docs PR is open; `main`
once that PR has merged and the build half has claimed the spec. The contract's
`## Autonomous metadata` section and `graph-kickoff`'s "Package sections the
driver owns" say node 1's branch today and are amended to say both halves. The
canonical home both point at, `PRD/instructions/preparation-contract.md`
`## Autonomous base` ("never defaults to `main`"), gains one scoping paragraph:
that rule binds `thejudge-prepare`'s choice of a base; in a graph run the
recorded value is rewritten once, to `origin/main`, at the build half's claim,
because the package's next PR then targets `main` — a recorded value, not a
default. `thejudge-implement-fanout` and `thejudge-cleanup` read the recorded
value and need no change.

Rejected alternative: turning the setting off. It removes the re-creation but
still leaves three PRs (docs → main, `-work` → base, base → main), and it makes
the workflow depend on a repository setting the owner can flip without noticing.

### D3 — `close` runs before `land`, inside the code PR

Node table: 5 `plan` → 6 `build` → 7 `review` → **8 `close`** → **9 `land`**.
Names, models, and caps are unchanged (`NODE_CALL_CAPS` is keyed by node name;
only its "node 8" comment and one test message move). `close`
(`thejudge-cleanup`) runs in the build worktree on the `-work` branch after
`review` approves and before any merge. It writes the receipt (with the code
PR's URL and the folded `## Graph run` ledgers), flips `system-map.md`, deletes
with `git rm -r PRD/work/<slug>/`, strips the board row, runs
`npm run quality:check`, commits, and pushes. It removes no worktree and no
branch — it is standing in the worktree it would be removing.

After `close` returns `ok`, the driver appends the `close` row to the receipt's
`### Node ledger` (the ledger file is gone; the receipt is its durable home —
today's receipts already carry this row "written by the driver after the fact"),
commits, pushes, releases the lock, and ends **`COMPLETE`**. The receipt's
`## Graph run` summary line is written by `close` itself, on the PR-ready path,
as `Terminal state: COMPLETE — land: the owner's merge of <PR URL>` (cleanup
knows the URL from its own check 2, and under graph control the run is complete
the moment `close` returns `ok`); the driver adds only the `close` row. `land` gets **no ledger
row**: the ledger's `Outcome` vocabulary is `ok` / `failed` / `parked` and none
of them is true of a merge that has not happened; the node table's row 9 says
"human (PR merge); outside the run's ledger — the package is on `main` when the
owner merges", and `COMPLETE`'s required result becomes "every dispatched node
`ok` through `close`; the code PR is open carrying the receipt and the package
deletion; `land` is the owner's merge, recorded by GitHub".

Resume in the gap between `close` returning and that final commit: the worktree
exists but holds no `PRD/work/<slug>/`. The resume rule is: a build worktree
with no package folder is post-`close`; read the receipt's `### Node ledger`,
append the `close` row if it is missing (evidence: the receipt commit and the PR
URL from the PR's registration marker), push, release the lock, end
`COMPLETE`. This is the one state where the ledger is read from the receipt.

After the owner merges, nothing resumes: `PRD/work/<slug>/` is gone from
`origin/main`, so the loop never re-sees it, and `.worktrees/implement-<slug>`
plus both local branches are merged leftovers `npm run graph:prune` lists.

The manual path already works this way: part 1's receipt was written on
`fix/graph-workflow-branching` before PR #201 merged. Autonomous packages now
match it.

### D4 — Cleanup's autonomous gate gains a pre-merge path; the merged path is unchanged

The existing four merge-proof checks assume cleanup runs after the merge. That
stays true for a direct `thejudge-implement-all` package (it also writes
`## Autonomous metadata` and is cleaned up after the owner merges), so those
checks are kept exactly as written. Cleanup chooses the path by the
implementation PR's state, located by its `thejudge-auto:v1:registered:<slug>`
marker:

- **PR merged** → the existing merge-proof gate, unchanged (checks 1–4, the
  deleted-base second path, the `gh` 5xx fallback). Direct mode lives here.
- **PR open** → the new **PR-ready gate**: (1) the current checkout is
  `.worktrees/implement-<slug>` on `thejudge-auto/<slug>-work`, and `HEAD`
  equals the remote tip after a fetch; (2) the PR's head is that branch and its
  base is the recorded autonomous base (`main`); (3) the package is `ship-ready`
  with every criterion `true`; (4) every runtime-cleanup criterion is recorded
  passing. On this path cleanup removes no worktree and no branch.
- **PR state unknown** (`gh` 5xx, no network): decide by git — the branch tip an
  ancestor of `origin/main` means merged (take the merged path and its existing
  outage fallback); not an ancestor means open (take the PR-ready path, record
  that the PR state was not verified, prove the tip is pushed with
  `git ls-remote --heads origin`). An outage is not evidence about the work.

Under `graph is controlling`, only the PR-ready path is valid: a merged PR at
`close` means the order was violated, and the node fails with that evidence.

Fixtures: `deleted-base-branch.md`, `gh-outage-during-merge-proof.md`, and
`promote-once-at-close.md` all seed a **merged** PR, so they exercise the
unchanged path and keep their grading keys; each gets one line saying which path
it exercises, and the two "merge-proof gate does not apply" pointers in
`intake-in-the-receipt.md` are reworded. One new fixture,
`close-inside-the-code-pr.md`, seeds an open PR in a build worktree and grades
the PR-ready path (authored unmeasured, as `build-loop-ready-detection.md` was;
its three-rep run is owed and is the owner's call).

### D5 — The claim is the branch

A spec is ready (REQ-171) only when, in addition, no `thejudge-auto/<slug>-work`
branch exists locally or on `origin` and no `.worktrees/implement-<slug>`
exists. The branch check is `git branch --list thejudge-auto/<slug>-work` plus
`git ls-remote --heads origin thejudge-auto/<slug>-work` (both allowed). Either
existing means the spec is claimed, and the loop does exactly one of three
things: the worktree holds `PRD/work/<slug>/` → resume from the `STATUS.*`
marker inside it (entry-point table); the worktree holds no package folder and
the receipt's `### Node ledger` lacks the `close` row → finish per D3's
post-`close` rule; the receipt already carries the `close` row → nothing to do,
the code PR is the owner's. A branch that exists on `origin` with no local
worktree (claimed from another root, or a worktree removed by hand) is not a
dead end: the loop re-creates the worktree with
`git worktree add .worktrees/implement-<slug> -b thejudge-auto/<slug>-work origin/thejudge-auto/<slug>-work`
— the one allowed form that also creates the local tracking branch (the profile
has no bare `git branch <new> <start>` rule, and the no-`-b` form would check
out a detached HEAD, not the branch) — and resumes. `BLOCKED` is reserved for a
path that exists but is not a usable worktree. REQ-171's "`STATUS.active` is
the single claim point" sentence is amended: the branch is the claim; the
marker inside the worktree stays `refined` until `plan` (D1). The
`graph-implement/reference.md` paragraph "if `## Autonomous metadata` is
missing, run `graph-preflight` first" is removed for the build half: the claim
writes that section, and a `graph-preflight` run here would create a kickoff
branch and worktree this design forbids. The `graph-implement` fixture
`build-loop-ready-detection.md` (unmeasured) is rewritten to this shape:
preconditions read `origin/main`; item 2 and its "no code" rationale add the
no-branch/no-worktree condition; item 3 ("claims by writing `STATUS.active`")
becomes "claims by creating and pushing the `-work` branch and worktree, and
leaves the marker `refined`"; item 6's observable becomes "the `-work` branch
and worktree exist" rather than "`STATUS.active` on `main`"; and the rationale
paragraph names the branch as the claim.

Ready-detection reads `origin/main` without touching the launch checkout, using
forms the profile allows: `git show origin/main:PRD/work/` lists the packages,
`git show origin/main:PRD/work/<slug>/` lists the marker, and
`git show origin/main:PRD/work/<slug>/GATE-QUESTIONS.md` gives the slots
(`Bash(git show *)`; the profile has no `git ls-tree` rule).

### D6 — Prune stops keeping the docs branch

`scripts/graph-prune.mjs` drops the "package still on main: the build half's
base" keep rule: every local `thejudge-auto/*` branch merged into `origin/main`
is deletable. With it go `packageSlug`, `packagesOnMain`,
`parsePackagesOnMain`, `KEEP_PACKAGE_ON_MAIN`, and the `git ls-tree` call:
their only other reader is `classifyBranch`'s delete reason ("merged into
origin/main; package `<slug>` is gone from main"), which becomes false for a
docs branch whose package is still on `main`, so that reason becomes
"merged into origin/main" alone (dead code is removed, not kept). The test file
loses the seven `packagesOnMain` inputs, the two `KEEP_PACKAGE_ON_MAIN`
assertions (lines 47 and 82), the `packageSlug`, `parsePackagesOnMain`, and
"the `-work` and `-cleanup` branches follow their package's fate" tests (the
last one's premise is the keep rule), the `formatReport` test's `queued`
keep-line and its `1 kept` count (lines 279–297, reworded to the new reason),
and the three matching imports (lines 8, 14, 15), and gains one test asserting
a merged docs branch whose package is still on `main` is deletable. `graph-implement`'s
claim step still removes only the kickoff worktree; the local docs branch is
left for prune.

### D7 — Owner-facing wording and lookups follow

`OPERATOR.md` recipe 6 ("The base→main merge — do not skip this") becomes "Merge
the code PR": that one merge lands the code, the receipt, and the folder
deletion, and there is nothing after it. Recipe 7 drops its reminder. The
"Where to look" table says the live ledger is
`.worktrees/kickoff-<slug>/PRD/work/<slug>/GRAPH-RUN.md` during spec-forming
and `.worktrees/implement-<slug>/…` during build (today it points at the launch
checkout's `PRD/work/`, which no run writes any more). `npm run graph:digest`
scans `.worktrees/*/PRD/work/*/GRAPH-RUN.md` as well as `PRD/work/*/`, preferring
a worktree copy for the same slug, so the morning digest sees in-flight runs;
its `## Pending base→main PRs` heading becomes `## PRs waiting on you` (docs PRs
and code PRs are both `thejudge-auto/*` → `main`), and its file-header comment,
the two test *names* that say "base→main" (lines 70 and 94), the "no graph
run ledgers found under `PRD/work/*/GRAPH-RUN.md`" message (line 101, which
must name both scan roots), and the identifiers `OPEN_BASE_TO_MAIN_PRS_COMMAND`
and `pendingBaseToMainPRs` (renamed `OPEN_GRAPH_PRS_COMMAND` and
`pendingGraphPRs`; no sweep term catches them) follow. `codehealth`'s
description of the graph ("an evolving base→main PR merged last") is corrected
too. The repo's own `.claude/settings.json` denies nothing (it carries only the
hook), so the edit is attempted directly; part 1 observed a denial on that path
from outside the repo, and if it recurs the owner applies the one-line edit
handed over in the receipt. `thejudge-implement-all` and `thejudge-cleanup`
are denied only in a profile session and in the hook's graph tier while a run
holds the lock; this ordinary session edits them directly.

### D8 — `npm run graph:prune -- --apply`

npm swallows a bare `--apply`. Four homes: two lines in the part-1 receipt,
REQ-164's constraint, and `OPERATOR.md`'s "Where to look" table row ("add
`--apply`" → "add `-- --apply`"), which the first grep missed because it spells
the flag apart from the command.

### D9 — `cd <worktree> && git …`, not `git -C`, in agent-run commands

`.claude/graph-profile.json` allows `Bash(cd *)`, `Bash(git add *)`,
`Bash(git commit *)`, `Bash(git status*)`, `Bash(git branch --show-current*)`,
and `Bash(git push -u origin *)`, but no `git -C` form. Three agent-run
commands say `git -C` today and would end a profile session `PROMPTED`:
`graph-kickoff/SKILL.md` line 42 (ledger commits), `graph-implement/SKILL.md`
line 57 (the claim's `status --porcelain` on the kickoff worktree), and
`graph-preflight/SKILL.md` line 212 (the end-state `branch --show-current`).
All three become `cd <absolute path> && git …`. Not affected:
`graph-preflight/SKILL.md` line 52, `scripts/graph-preflight.mjs` line 140, and
REQ-191's planned-commands bullet — that push runs inside the script via
`execFileSync` under `Bash(node scripts/*)`, so the profile never sees it. The
profile is not edited.

## Scope

In:

- `graph-implement` SKILL: every `plan → build → review → land → close`
  sequence (`## Goal and inputs` line 17, `## Resolving the gate` first bullet
  line 122); `## The build loop` items 1–4 including "Claim it" and the
  `git -C` at line 57; `## Resolving the gate` last paragraph; `## Loop` item 3
  (node 8/9 wording and the node 6 assertion); `## Next step` lines 187–189
  (the "parks at `land`, a later run records `land` as `ok` and continues to
  `close`" resume, abolished). Reference: node table, entry-point table +
  post-`close` row + remote-branch-no-worktree row, §Publishing before build,
  §The base is frozen — removed, §Worktree and branch shape, §Node 8, §Node 6
  return-side assertion, and the paragraph under the entry-point table ("if
  `## Autonomous metadata` is missing, run `graph-preflight` first") — removed
  for the build half, since the claim writes the section.
- `scripts/graph-ledger-check.mjs` `buildWriteScope` / `classifyBuildWrites`
  (+ `graph-ledger-check.test.mjs`).
- `PRD/instructions/preparation-contract.md` `## Autonomous base`: one scoping
  paragraph for graph runs.
- `PRD/instructions/skill-fixtures/graph-implement/build-loop-ready-detection.md`:
  rewritten to the branch-is-the-claim shape (unmeasured before and after).
- `graph-kickoff` SKILL (line 42 `git -C`; step 2's "grows into / merges it
  last" and its PR-body instruction "hold the PR open (not merge yet)" at lines
  155–156, which contradicts answer-then-merge and step 3 of the same skill;
  "Package sections the driver owns" base definition) and reference (node-4
  note).
- `graph-preflight` SKILL line 212.
- `graph-gate-review` SKILL: the "node 8" pointer, plus one sentence that under
  dispatch by `graph-implement` it runs in the build worktree the dispatch's
  `Working directory:` names.
- `thejudge-implement-all` SKILL: `## Mode`, `## Inputs`, `## Workflow
  contract` item 1, `## Completion gate` ("cleanup removes the worktree and its
  captures" — true only on the merged path now), `## Common mistakes` "Sharing
  one local branch across worktrees"; reference `### Preflight` steps 3–7
  (guard wording, in-place worktree, baseline at the shared tip,
  launch-checkout sentence).
- `thejudge-cleanup` SKILL: `## Mode`, `## Reads` 6, `## Writes` (`- PR:` line),
  `### Delete mechanism`, `## Gates` bullet, the gate section (two paths), the
  "node 9's delete" comment; fixtures per D4.
- `PRD/instructions/graph-workflow-contract.md`: §Overall flow 5–7,
  §Propose/apply/close, §The two runs (both PR paragraphs), node table,
  §Autonomous metadata (the section text at line 314; its fenced example shape
  at line 321 is unchanged), §Ledger (`Worktree`), §Instruction ledger's "Node 6
  carries the return-side half" paragraph (lines 558–560, the contract's own
  copy of the write scope), §Boundaries "The one merge that matters", §The
  ledger outlives the run, §Terminal states `COMPLETE`.
- `OPERATOR.md` recipes 6–7 and the "Where to look" table (ledger location and
  the `-- --apply` spelling); `AGENT-SKILLS.md` graph rows; `PRD/README.md`
  line 130.
- `scripts/graph-prune.mjs` (+ test), `scripts/graph-digest.mjs` (+ test,
  header comment), `scripts/lib/boundary-rules.mjs` comment,
  `boundary-rules.test.mjs` message.
- Product truth in `GATE-QUESTIONS.md`; both skill trees synced.

Out (non-goals): the spec-forming half's mechanics beyond D9; the hook, the
lock, the caps, the gate-parking model; concurrent builds; the GitHub setting;
`thejudge-implement`, `thejudge-implement-fanout`, `thejudge-prepare`;
`docs/prd-workflow-guide/` and `PRD/ideasForLater/` (history, not truth);
FLOW-021 steps 3 and 6 and FLOW-022 step 7 are stale since earlier packages
("resolves uncommitted work", "the driver diffs `PRD/sections/`", "the `define`
gate parks on any resulting `PRD/sections/` diff") and are **not** touched here
— noted for the owner.

## Product truth proposed (`GATE-QUESTIONS.md`)

New: REQ-193 (one folder, one branch, writers in turns), REQ-194 (two PRs;
`close` before `land`; base branch retired from the build half). Amended:
REQ-171 (five bullets incl. the claim point), REQ-191, REQ-192, REQ-164,
FLOW-021 (steps 7–8, one edge case), FLOW-022. The amendment set was enumerated
by grep, then re-enumerated after quality checks 1–3 added `single claim
point`, `Autonomous base`, `git -C` (agent-run only), `buildWriteScope`,
`PRD/work/<slug>/` as a write prefix, and every `land → close` sequence to the
terms.

## Amendment set (by grep, 2026-09-06, re-run after QC 1–3)

| Rule being changed | Homes found |
| --- | --- |
| base branch / base→main hop / "grows into, merges it last" | contract §Overall flow 7, §The two runs (two paragraphs), §Boundaries "The one merge that matters"; `graph-kickoff/SKILL.md` step 2; `graph-kickoff/reference.md` node-4 note; `graph-implement/SKILL.md` "Resolving the gate" last paragraph, "Claim it" step 3; `graph-implement/reference.md` §Publishing before build, §The base is frozen, §Worktree and branch shape, §Node 8; `OPERATOR.md` recipes 6–7; `AGENT-SKILLS.md` graph rows; `PRD/README.md` line 130; `scripts/graph-digest.mjs` heading + test; `codehealth/SKILL.md` line 43 (denied — owner); REQ-171, REQ-191 |
| autonomous base = node 1's branch / never `main` | `preparation-contract.md` `## Autonomous base` (canonical; scoping paragraph added); contract §Autonomous metadata; `graph-kickoff/SKILL.md` "Package sections the driver owns"; readers needing no change: `thejudge-implement-fanout/SKILL.md` line 24, `thejudge-cleanup/SKILL.md` `## Reads` 1 |
| `STATUS.active` is the single claim point | REQ-171 bullet 2; `graph-implement/SKILL.md` "Claim it"; `graph-implement/reference.md` entry-point table (a `refined` marker in a claimed worktree enters at gate resolution) and the "run `graph-preflight` first" paragraph beneath it; fixture `graph-implement/build-loop-ready-detection.md` (rationale, preconditions, items 2, 3, 6 — rewritten) |
| docs PR "hold open, do not merge yet" | `graph-kickoff/SKILL.md` lines 155–156 (PR-body instruction) |
| node 8 = land / node 9 = close, and every `… → land → close` sequence | contract §Overall flow 7, §Propose/apply/close, node table, §Boundaries; `graph-implement/SKILL.md` lines 17, 122 (sequences), `## Loop` item 3, `## Next step` lines 187–189 (the park-at-`land`-then-`close` resume); `graph-implement/reference.md` (table, §Node 8); `graph-gate-review/SKILL.md` line 24; `thejudge-cleanup/SKILL.md` line 141; `scripts/lib/boundary-rules.mjs` comment + `boundary-rules.test.mjs` message; FLOW-021 step 8 + edge case; FLOW-022 step 8 |
| merge-proof gate (kept as the merged path; pre-merge path added) | `thejudge-cleanup/SKILL.md` (4 places); fixtures `deleted-base-branch.md`, `gh-outage-during-merge-proof.md`, `promote-once-at-close.md` (path note each), `intake-in-the-receipt.md` (2 pointer lines); new `close-inside-the-code-pr.md` |
| prune keep rule | `scripts/graph-prune.mjs` (`KEEP_PACKAGE_ON_MAIN`, `classifyBranch`, `packageSlug`, `packagesOnMain`, `parsePackagesOnMain`, the `ls-tree` call), `graph-prune.test.mjs` (7 `packagesOnMain` inputs, 2 `KEEP_PACKAGE_ON_MAIN` assertions at 47/82, the `packageSlug`, `parsePackagesOnMain`, and `-work`/`-cleanup` tests, the `formatReport` test's keep line and count at 279–297, imports at lines 8/14/15); REQ-192; `graph-implement/SKILL.md` "Claim it" |
| `graph:prune --apply` | part-1 receipt lines 17 and 83; REQ-164; `OPERATOR.md` line 280 |
| `git -C` (agent-run) | `graph-kickoff/SKILL.md` line 42; `graph-implement/SKILL.md` line 57; `graph-preflight/SKILL.md` line 212 |
| write scope of node 6 | `scripts/graph-ledger-check.mjs` `buildWriteScope`/`classifyBuildWrites` + test; contract §Instruction ledger lines 558–560; `graph-implement/SKILL.md` `## Loop` item 3; `graph-implement/reference.md` §Node 6 return-side assertion; `thejudge-implement-all/SKILL.md` `## Mode` |
| cleanup removes the implement worktree | `thejudge-implement-all/SKILL.md` `## Completion gate` line 90; `thejudge-cleanup/SKILL.md` `### Delete mechanism` |
| ledger `Outcome` vocabulary vs `land` | contract §Ledger, node table row 9, §Terminal states `COMPLETE`; `thejudge-cleanup/SKILL.md` `### Graph run in the receipt` (the summary line) |
| implement-all worktree ownership | `thejudge-implement-all/SKILL.md` lines 48, 105; `reference.md` preflight 3–7 |

## Verification

- `npm run quality:check` exit 0 (prune, digest, boundary tests).
- Every `Current:` excerpt in `GATE-QUESTIONS.md` byte-identical to the live
  section, checked by script, before quality check and again before the PR.
- `npm run skills:ai-sync` then `diff -rq .claude/skills .agents/skills` empty.
- Grep sweeps after build, each with its allowed survivors named so the check
  is decidable: `frozen once` — none anywhere outside receipts; `base→main` —
  survivors are history only: `PRD/instructions/receipts/`,
  `PRD/ideasForLater/`, `docs/`, `PRD/work/probe-graph-workflow-audit/`, other
  packages' run ledgers `PRD/work/*/GRAPH-RUN.md` (records of runs already
  made), the digest constant's history comment (lines 16–18), REQ-171's Notes
  sentence about the retired guard, REQ-191's "the base→main guard … is
  removed" criterion, and `codehealth/SKILL.md` only if its edit was denied;
  every other hit is a defect. `node 8 (\`land\`)` / `node 9 (\`close\`)` —
  none. `graph:prune --apply` and "add `--apply`" — none without `--`. `git -C`
  in `.claude/skills/graph-*/SKILL.md` — none except `graph-preflight/SKILL.md`
  line 52, which quotes a command the script runs through `execFileSync`.
  `ls-tree` in any skill file — none. `PRD/work/<slug>/` as an allowed write
  prefix (`buildWriteScope`, contract, skills) — none.
- Local rehearsal, no push: `git worktree add .worktrees/implement-smoke -b
  thejudge-auto/smoke-land-work origin/main` from the launch root, a commit via
  `cd … && git commit`, `git show origin/main:PRD/work/` for ready-detection,
  then `git worktree remove` and `git branch -D` of the never-pushed smoke
  branch (the owner-run form; the agent hands it over if denied).
- Receipt under `PRD/instructions/receipts/graph-workflow-land-2026-09-06.md`
  written on this branch before the PR, as in part 1.

## Risks and stated limits

- The node 7 reviewer grades the code before `close`'s bookkeeping commits
  (receipt, deletion, board, map). Those are docs-only and the owner reads them
  in the PR; this is stated, not hidden.
- The receipt says `shipped` before the merge. It exists on `main` only if the
  PR merges, so it is never false on `main`; on an abandoned branch it is
  simply never read.
- If the code PR is closed unmerged, the package folder is still on `main` at
  `refined` and the `-work` branch exists, so the loop treats it as claimed and
  does nothing. Prune cannot remove that branch (it is unmerged), so the claim
  key cannot be destroyed by housekeeping; recovery is the owner deleting the
  branch (`git branch -D`, unmerged) and the worktree by hand, then the loop
  re-claims on its next tick.
- Skill files are served from the session's original project folder; the
  changed skills take effect for new sessions after merge.
