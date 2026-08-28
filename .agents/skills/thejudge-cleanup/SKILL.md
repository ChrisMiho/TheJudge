---
name: thejudge-cleanup
description: >-
  Closes out a ship-ready work package: verifies slice completion, promotes
  durable PRD truth, writes a receipt, updates PRD/work/STATUS.md, and deletes
  PRD/work/<slug>/. Also handles explicit corpus-hygiene sweeps. Use when a
  feature has shipped (STATUS.ship-ready), when the user force-overrides for
  cleanup, or when the user explicitly asks for PRD corpus hygiene — not for
  general code tidying requests.
---

# TheJudge Cleanup

## Goal

Close out a work package: verify what's done, promote durable docs, write the receipt, delete `PRD/work/<slug>/`.

## Mode

Direct invocation keeps the gates, receipt, and delete behavior below, including
the user force-override.

When the controlling agent explicitly states that an orchestrator is
controlling — `thejudge-prepare is controlling` or `graph-run is controlling` —
read `PRD/instructions/graph-workflow-contract.md`, and apply every gate below
as a **park rather than a question**: a package that is not `ship-ready`, a
merge-proof check that cannot be satisfied, or a dirty worktree ends the node
`failed` with the evidence and returns control to the named orchestrator. **The
force override is unavailable under a predicate** — it exists for a human who
has judged the exception, and an autonomous run has no human to judge it. Fold
the run ledger into the receipt before deleting the work folder, per
`### Graph run in the receipt` below.

## Inputs

Work slug. Optional force override when the user explicitly requests cleanup of a non-`ship-ready` package.

## Reads

1. `PRD/work/<slug>/README.md` + `GAMEPLAN.md` + slice docs, including the
   README's `## Autonomous metadata` section (`Autonomous base:
   origin/<branch>`) when present
2. `PRD/work/<slug>/STATUS.*` marker and `PRD/work/STATUS.md`
3. `PRD/instructions/doc-lifecycle.md`
4. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties
5. Relevant codebase paths from slice implementation maps
6. When they exist, the Git state of `.worktrees/implement-<slug>` and
   `.worktrees/prepare-<slug>`

## Writes

- Promoted durable outcomes into the relevant feature spec `PRD/sections/<feature>/README.md` and its cited `REQ`/`FLOW` entries, plus any other affected `PRD/sections/*.md`; the decision log is retired, so no new `DEC-###`
- Receipt at `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md` — **written before delete** — containing date, slug, status (shipped | partial | corpus-only), actions taken, every file created/updated/deleted, verification results, `## Graph run` when the package holds a `GRAPH-RUN.md`, and `## Intake` when it holds `intake/`
- `PRD/sections/system-map.md` entry flipped `planned`/`partial` → `shipped`, only once both code and the receipt exist
- `PRD/work/STATUS.md` — remove the slug from every section
- `PRD/README.md`, only if navigation changed (never re-introduce a multi-row work-package table)

### Graph run in the receipt

`PRD/work/<slug>/` holds `GRAPH-RUN.md` — the node ledger with its evidence
column, and the `## Instruction ledger` recording which user instructions the
run refused. Deleting the folder deletes both. Receipts are durable, so the
receipt is where that record has to land, and it has to land there **before**
the delete.

When `PRD/work/<slug>/GRAPH-RUN.md` exists, the receipt carries:

```markdown
## Graph run

- Run ID: `<id>` | Profile: `<value>` | Terminal state: `<state>`

### Node ledger

<the complete `## Node ledger` table from GRAPH-RUN.md, verbatim>

### Instruction ledger

<the complete `## Instruction ledger` table from GRAPH-RUN.md, verbatim>
```

**Verbatim, not summarized.** Copy both tables through unchanged, header rows
and separator rows included. A summary of a refusal ledger is the driver grading
its own compliance — the one thing the ledger exists to prevent.

**The sub-headings drop to `###`.** `GRAPH-RUN.md` writes them at `##`; copying
that level through ends the `## Graph run` section at the first one, so a reader
looking inside `## Graph run` finds only the summary line. The tables are
verbatim; their headings are not part of them.

**Refusal condition.** With `GRAPH-RUN.md` present and `## Graph run` absent
from the receipt, refuse to delete the package folder. Report the missing
section and stop. Otherwise the proof that a run refused a pre-authorization
survives exactly until the run succeeds, which is backwards.

A package with no `GRAPH-RUN.md` cleans up normally. Do not add an empty
`## Graph run` section to its receipt.

### Intake in the receipt

`PRD/work/<slug>/intake/` holds the context documents the owner handed over —
a supplied file path, or markdown pasted in the launch request. Deleting the
folder deletes that record. `## Intake` sits beside `## Graph run`, not inside
it: a package built without a graph run — a direct `thejudge-kickoff` session
— can hold `intake/` too.

When `PRD/work/<slug>/intake/` exists, the receipt carries:

```markdown
## Intake

- `intake/<file>` — <origin: the supplied path, or "pasted in the request">
```

One line per file, named for its stated origin. A package with no `intake/`
folder cleans up normally. Do not add an empty `## Intake` section to its
receipt.

No new refusal condition. Missing intake is not a reason to refuse the
delete — the refusal condition above governs `GRAPH-RUN.md` alone.

### Delete mechanism

Delete the work folder with `git rm -r PRD/work/<slug>/` — the path-scoped form,
named here rather than left to the implementer. It is the only delete a graph
run is permitted: every recursive `rm` spelling is denied by
`.claude/graph-profile.json`, and an unscoped `git rm -r` is not allowed either,
because node 9's delete must not be able to become a general tracked-file
delete. A run reaching for any other form terminates `PROMPTED`.

Remove the worktree and its local branch with `git worktree remove <path>` and
`git branch -d <name>` — never `git branch -D`, which is denied, and never a
remote-branch delete.

For an autonomous package that passes the merge-proof gate below, cleanup also
removes the clean, fully-merged `.worktrees/implement-<slug>` and its local
branch. Never delete the remote branch. If `.worktrees/prepare-<slug>` still
exists — a safety net for a package whose implementation preflight did not
already remove it — confirm its preparation PR merged into the recorded base
and remove that worktree and local branch too, under the same clean-and-merged
rule.

## Ship checklist

- Package is `ship-ready` (`status: ship-ready` + `STATUS.ship-ready`) **or** user explicitly forced cleanup
- Slice acceptance criteria satisfied and verified
- Tests updated; `npm run quality:check` green for touched areas
- Public contract unchanged unless a slice scoped a change
- No secrets committed
- Durable outcomes promoted; `PRD/work/<slug>/` ready to delete

## Gates

- **Status gate:** refuse cleanup unless the package is `ship-ready`, or the user explicitly ordered a force override. If refusing, report the current status and next skill.
- **Autonomous merge-proof gate:** for a package with `## Autonomous metadata`, apply the four checks in the subsection below immediately after the status gate.
- **Never delete a remote branch**, for autonomous or collaborative packages.
- Receipt is written **before** `PRD/work/<slug>/` is deleted. Receipts are durable — never deleted with the work folder.
- **Graph-run gate:** when `PRD/work/<slug>/GRAPH-RUN.md` exists, refuse the delete until the receipt carries `## Graph run` with both ledger tables verbatim. See `### Graph run in the receipt`.
- The shipped-vs-planned signal lives only in `sections/system-map.md` — never edit a `DEC`/`REQ` `Status:` field to convey it.
- `npm run quality:check` green for touched areas, and no secrets committed, before delete.
- Never start new features or slices from this skill; never delete `PRD/instructions/receipts/`.

### Autonomous merge-proof gate

A package whose `README.md` has an `## Autonomous metadata` section must
additionally satisfy all four of the following, in order, before deletion:

1. The current branch equals the recorded autonomous base exactly — **or**, when
   that base no longer exists on the remote, the current branch contains the
   implementation merge. A base branch that was deleted after merging is a
   normal end state, not a cleanup blocker: check 2 is what proves the work
   shipped, and this check only establishes that the checkout you are cleaning
   from actually has it.

   To take the second path, all three must hold, and each must be reported:
   - The base resolves nowhere — absent from `git branch -r` after a fetch, and
     from `git ls-remote --heads origin <base>` when the remote is reachable.
   - The implementation merge commit is an ancestor of `HEAD`
     (`git merge-base --is-ancestor <merge-sha> HEAD`). Locate it locally —
     `git log --oneline --all --grep "<slug>"` finds the
     `Merge pull request #N` commit without needing the API.
   - The recorded base is named in the receipt alongside the merge SHA, so the
     deleted branch stays traceable.

   A base that still exists but is not checked out remains a failure — switch to
   it rather than taking the second path.
2. The implementation pull request — located via its
   `thejudge-auto:v1:registered:<slug>` marker, per
   `thejudge-implement-all/reference.md` — is merged, and its merge target is
   the recorded base. Verify with the GitHub CLI (for example `gh pr view
   <number> --json state,baseRefName,mergedAt`) rather than inferring it from
   local branch state alone.

   **When the GitHub API is unreachable** — `gh` returns HTTP 5xx, or there is
   no network — cleanup is not automatically blocked, because an outage is not
   evidence about the work. Fall back to local proof: that PR's merge commit is
   present, is an ancestor of `HEAD`, and is an ancestor of `origin/main`.
   Report that the API was unavailable, name the merge SHA used, and record
   both in the receipt. Never treat a 5xx as a failed check. Never take this
   fallback while the API *is* reachable — there, `gh` stays authoritative.
3. `.worktrees/implement-<slug>`, if it still exists, has a clean working tree
   and no local commits absent from the recorded base's tip — that is, it is
   fully merged. "Clean" means `git status --porcelain` is empty; gitignored
   artifacts do not count as dirty. This matters concretely: that worktree
   legitimately contains `PRD/work/<slug>/.playwright-mcp/` captures, and
   `.gitignore`'s unanchored `.playwright-mcp/` pattern keeps them out of
   `--porcelain`. Cleanup must not block on a slice's own screenshots.
4. Every runtime-cleanup acceptance criterion recorded in the package's slice
   verification evidence is passing — owner/session, worktree, ports,
   started-vs-attached, and `browser_close`/process-stop/port-release results,
   per the recording contract in
   `PRD/instructions/runtime-process-hygiene.md`.

If any of the four fails, refuse cleanup and report the exact unmet
condition — which check failed and the observed state. A user force-override
still requires the operator to explicitly acknowledge which of these checks is
being skipped and why; it does not silently bypass all four.

A package with no `## Autonomous metadata` section is an ordinary
collaborative package and keeps the existing local-only cleanup path
unchanged — no branch, PR, or worktree checks are added for it.

## Corpus hygiene mode

When the user explicitly requests a terminology/sections sweep (no feature slug): apply the terminology table below, and record every edit in a receipt named `skill-migration-<date>.md` or `<slug>-<date>.md`.

| Retire | Replace with |
| --- | --- |
| old milestone labels | core product |
| old provider-stage labels | provider modes (`mock` / `openai`) |
| retired provider names | current provider boundary language |
| simplification language | intentional constraints |

## Next step

Terminal — no required handoff. If the user wants to start new work, offer `/thejudge-kickoff` (`$thejudge-kickoff` in Codex).
