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
receipt — happens in that folder on that branch. The driver's own bookkeeping
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
- Status: refining → refined on the assumptions below
- Source: `PRD/work/probe-graph-workflow-audit/FINDINGS-graph-workflow-gaps.md`,
  findings 2 and 7; prior run
  `PRD/instructions/receipts/graph-workflow-branching-2026-09-06.md` (part 1)
- Kind: manual package (`OPERATOR.md` recipe 9) on `fix/graph-workflow-land`
  from `origin/main` (`8d29ce4`), in `.worktrees/graph-workflow-land`

## Assumptions recorded in place of a live approval

The session brief delegated both decisions ("design a single-writer
arrangement", "decide between turning the setting off and building from `main`
directly") and asked for one PR the owner merges. No owner is present in the
session to approve this brief live, so the status moves to `refined` on that
delegation, and the verdict slots in `GATE-QUESTIONS.md` are answered at PR
review: the PR diff **is** the applied proposal. A rejected block is reverted in
the PR before merge.

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

then commits the claim as the branch's first commit — `STATUS.active`, the
package README's `## Autonomous metadata` rewritten to
`- Autonomous base: origin/main`, the ledger header's `- Worktree:` line and
`- Autonomous base:` line — and pushes with
`cd .worktrees/implement-<slug> && git push -u origin thejudge-auto/<slug>-work`.

Every build-half node — gate resolution (`graph-gate-review`), `gate-qc`,
`plan`, `build`, `review`, `close` — is dispatched with
`Working directory: <root>/.worktrees/implement-<slug>` and works there. The
driver writes to the branch only between nodes (`cd <worktree> && git add
<paths> && git commit …`, then the same `git push -u origin …`), so the driver
and the builder alternate and no two commits ever compete for the same file.

`thejudge-implement-all`, under `graph is controlling`, works **in place** when
the dispatch's `Working directory:` already names `.worktrees/implement-<slug>`
checked out on the shared branch: no second worktree, no contributor branch. Its
fetch/rebase/commit/push-without-force loop and its PR lifecycle are unchanged;
the PR base is the recorded autonomous base, now `main`. Direct mode is
untouched.

Consequences: the "base frozen" rule and every `land`/`close` reconcile step are
deleted; the node 6 write-scope assertion simplifies to "every path `build`
wrote lies inside `.worktrees/implement-<slug>/`"; audit finding 3 ("PR ready
and local state disagree") dissolves because no package state exists outside
the branch.

### D2 — Build from `main`; keep `delete_branch_on_merge` on

The docs branch `thejudge-auto/<slug>` is finished when the docs PR merges.
GitHub deleting it is correct behavior, not a problem to work around. The build
half never reads, pushes, or opens a PR against that branch again, and nothing
re-creates it. The setting stays `true`; no skill, script, or instruction may
depend on a branch surviving its own merge.

Rejected alternative: turning the setting off. It removes the re-creation but
still leaves three PRs (docs → main, `-work` → base, base → main), and it makes
the workflow depend on a repository setting the owner can flip without noticing.

### D3 — `close` runs before `land`, inside the code PR

Node table: 5 `plan` → 6 `build` → 7 `review` → **8 `close`** → **9 `land`**.
Names, models, and caps are unchanged (`NODE_CALL_CAPS` is keyed by node name;
only its "node 8" comment moves). `close` (`thejudge-cleanup`) runs in the build
worktree on the `-work` branch after `review` approves and before any merge. It
writes the receipt (with the code PR's URL and the folded `## Graph run`
ledgers), flips `system-map.md`, deletes with `git rm -r PRD/work/<slug>/`,
strips the board row, runs `npm run quality:check`, commits, and pushes. It
removes no worktree and no branch — it is standing in the worktree it would be
removing.

After `close` returns `ok`, the driver appends the `close` row to the receipt's
`### Node ledger` (the ledger file is gone; the receipt is its durable home —
today's receipts already carry this row "written by the driver after the fact"),
records `land` as awaiting the owner's merge of the PR URL, commits, pushes,
releases the lock, and ends **`COMPLETE`**. `COMPLETE`'s required result becomes
"every dispatched node `ok` through `close`; the code PR is open carrying the
receipt and the package deletion; `land` is the owner's merge". After the owner
merges, nothing resumes: `PRD/work/<slug>/` is gone from `origin/main`, so the
loop never re-sees it, and `.worktrees/implement-<slug>` plus both local
branches are merged leftovers `npm run graph:prune` lists.

The manual path already works this way: part 1's receipt was written on
`fix/graph-workflow-branching` before PR #201 merged. Autonomous packages now
match it.

### D4 — Cleanup's autonomous gate becomes a pre-merge "PR-ready" gate

The four merge-proof checks (base checked out, PR merged into base, implement
worktree fully merged, runtime criteria) assumed cleanup ran after the merge.
Replaced by four pre-merge checks:

1. the current checkout is `.worktrees/implement-<slug>` on
   `thejudge-auto/<slug>-work`, and `HEAD` equals the remote tip after a fetch
   (nothing unpushed, nothing unfetched);
2. the code PR located by its `thejudge-auto:v1:registered:<slug>` marker is
   **open**, its head is that branch, and its base is the recorded autonomous
   base (`main`) — verified with `gh pr view`. When the API is unreachable
   (5xx / no network) the node records that the PR state was not verified,
   proves the tip is pushed with `git ls-remote --heads origin`, and continues:
   an outage is not evidence about the work (the existing principle);
3. the package is `ship-ready` with every criterion `true` (the status gate,
   restated so the order is explicit);
4. every runtime-cleanup criterion is recorded passing, as today.

Fixtures: `deleted-base-branch.md` is retired in place (its scenario — the
recorded base deleted after merge — cannot arise when the recorded base is
`origin/main`); `gh-outage-during-merge-proof.md` is regraded to the new gate
(same trap, different check); the pointer lines in `intake-in-the-receipt.md`
and `promote-once-at-close.md` are reworded. Re-running the regraded fixture is
the owner's call, as in part 1.

### D5 — The claim is the branch

A spec is ready (REQ-171) only when, in addition, no `thejudge-auto/<slug>-work`
branch exists locally or on `origin` and no `.worktrees/implement-<slug>`
exists. Either existing means the spec is claimed: the loop resumes it from the
marker inside that worktree (entry-point table), or leaves it alone when its
package folder is gone and its code PR is open (complete, awaiting merge). The
`STATUS.active` claim commit stays as today; the branch is what makes a restart
idempotent. Ready-detection reads `origin/main` (`git ls-tree`), so the launch
checkout's `main` need not be pulled.

### D6 — Prune stops keeping the docs branch

`scripts/graph-prune.mjs` drops the "package still on main: the build half's
base" keep rule: every local `thejudge-auto/*` branch merged into `origin/main`
is deletable. The `-work` / `-cleanup` slug suffix handling stays for historical
leftovers. `graph-implement`'s claim step still removes only the kickoff
worktree; the local docs branch is left for prune.

### D7 — Owner-facing wording follows

`OPERATOR.md` recipe 6 ("The base→main merge — do not skip this") becomes "Merge
the code PR": that one merge lands the code, the receipt, and the folder
deletion, and there is nothing after it. Recipe 7 drops its reminder. The
digest's `## Pending base→main PRs` heading becomes `## PRs waiting on you`
(both docs PRs and code PRs are `thejudge-auto/*` → `main`). `codehealth`'s
description of the graph ("an evolving base→main PR merged last") is corrected
— that file is denied to the agent, so the owner applies a one-line edit handed
over in the receipt.

### D8 — `npm run graph:prune -- --apply`

npm swallows a bare `--apply`. Three homes: two lines in the part-1 receipt and
REQ-164's constraint.

### D9 — `cd <worktree> && git …`, not `git -C`

`.claude/graph-profile.json` allows `Bash(cd *)`, `Bash(git add *)`,
`Bash(git commit *)`, and `Bash(git push -u origin *)`, but no `git -C` form.
Part 1's `graph-kickoff` skill tells the driver to commit with `git -C <path>`,
which would end a profile session `PROMPTED` on its first ledger commit. Both
graph drivers are written to `cd <absolute worktree> && git …`; the profile is
not edited.

## Scope

In: `graph-implement` (SKILL + reference), `graph-kickoff` (the `git -C`
wording and the "grows into / merges it last" sentence), `graph-gate-review`
(the one "node 8" pointer), `thejudge-implement-all` (SKILL `## Mode`/`## Inputs`,
reference preflight steps 3–5), `thejudge-cleanup` (mode, reads, writes, delete
mechanism, gate), the four cleanup fixtures as listed, `graph-implement`'s
fixture item 5 wording if needed, `PRD/instructions/graph-workflow-contract.md`,
`OPERATOR.md`, `AGENT-SKILLS.md`, `PRD/README.md` line 130, `scripts/graph-prune.mjs`
(+ test), `scripts/graph-digest.mjs` (+ test), `scripts/lib/boundary-rules.mjs`
(comment), the product truth in `GATE-QUESTIONS.md`, both skill trees synced.

Out (non-goals): the spec-forming half's mechanics beyond D9; the hook, the
lock, the caps, the gate-parking model; concurrent builds; the GitHub setting;
`thejudge-implement`, `thejudge-implement-fanout`, `thejudge-prepare`;
`docs/prd-workflow-guide/` and `PRD/ideasForLater/` (history, not truth);
FLOW-021 steps 3 and 6 are stale since earlier packages ("resolves uncommitted
work", "the driver diffs `PRD/sections/`") and are **not** touched here — noted
for the owner.

## Product truth proposed (`GATE-QUESTIONS.md`)

New: REQ-193 (one folder, one branch, writers in turns), REQ-194 (two PRs;
`close` before `land`; base branch retired from the build half). Amended:
REQ-171, REQ-191, REQ-192, REQ-164, FLOW-021, FLOW-022. The amendment set was
enumerated by grep (`base→main`, `frozen`, `-work`, `node 8`, `node 9`,
`delete-on-merge`, `merge-proof`, `graph:prune --apply`, `git -C`), not from
memory; the grep transcript is summarized under `## Amendment set` below and is
re-run at build.

## Amendment set (by grep, 2026-09-06)

| Rule being changed | Homes found |
| --- | --- |
| base branch / base→main hop / "grows into, merges it last" | contract §Overall flow 7, §The two runs (two paragraphs), §Boundaries "The one merge that matters"; `graph-kickoff/SKILL.md` step 2; `graph-kickoff/reference.md` node-4 note; `graph-implement/SKILL.md` "Resolving the gate" last paragraph and "Claim it" step 3; `graph-implement/reference.md` §Publishing before build, §The base is frozen, §Worktree and branch shape, §Node 8; `OPERATOR.md` recipes 6–7; `AGENT-SKILLS.md` graph rows; `PRD/README.md` line 130; `scripts/graph-digest.mjs` heading + test; `codehealth/SKILL.md` line 43 (denied — owner); REQ-171, REQ-191 |
| node 8 = land / node 9 = close | contract §Overall flow 7, §Propose/apply/close, node table, §Boundaries; `graph-implement/SKILL.md` loop step 3; `graph-implement/reference.md` (table, §Node 8); `graph-gate-review/SKILL.md` line 24; `thejudge-cleanup/SKILL.md` line 141; `scripts/lib/boundary-rules.mjs` comment + `boundary-rules.test.mjs` message; FLOW-021 step 8 + edge case; FLOW-022 step 8 |
| merge-proof gate | `thejudge-cleanup/SKILL.md` (4 places); fixtures `deleted-base-branch.md`, `gh-outage-during-merge-proof.md`, `intake-in-the-receipt.md` (2 lines), `promote-once-at-close.md` (1 line) |
| prune keep rule | `scripts/graph-prune.mjs` (`KEEP_PACKAGE_ON_MAIN`, `classifyBranch`, `packagesOnMain`), `graph-prune.test.mjs` (5 sites); REQ-192; `graph-implement/SKILL.md` "Claim it" |
| `graph:prune --apply` | part-1 receipt lines 17 and 83; REQ-164 |
| `git -C` | `graph-kickoff/SKILL.md` ("runs its own ledger commits with `git -C`"); contract grep at build |

## Verification

- `npm run quality:check` exit 0 (prune, digest, boundary tests).
- Every `Current:` excerpt in `GATE-QUESTIONS.md` byte-identical to the live
  section, checked by script, before quality-check and again before the PR.
- `npm run skills:ai-sync` then `diff -rq .claude/skills .agents/skills` empty.
- Grep sweeps after build: no `base frozen`, no `base→main` outside
  `PRD/instructions/receipts/`, `PRD/ideasForLater/`, `docs/`, and the digest
  constant's history comment; no `node 8 (\`land\`)`; no `graph:prune --apply`
  without `--`; no `git -C` in the graph drivers.
- Local rehearsal, no push: `git worktree add .worktrees/implement-smoke -b
  thejudge-auto/smoke-land-work origin/main` from the launch root, a commit via
  `cd … && git commit`, then `git worktree remove` and `git branch -D` of the
  never-pushed smoke branch (the owner-run form; the agent hands it over if
  denied).
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
  `active` and the `-work` branch exists, so the loop treats it as claimed and
  does nothing. Recovery is the owner deleting the local branch and worktree
  (or `graph:prune` once the branch is merged or pruned remotely) and restarting.
- Skill files are served from the session's original project folder; the
  changed skills take effect for new sessions after merge.
