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

- Promoted durable outcomes in the affected `PRD/sections/*.md`; new decisions go into the relevant `PRD/sections/decisions/<domain>.md` file plus the router index line in `PRD/sections/decisions.md`
- Receipt at `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md` — **written before delete** — containing date, slug, status (shipped | partial | corpus-only), actions taken, every file created/updated/deleted, verification results
- `PRD/sections/system-map.md` entry flipped `planned`/`partial` → `shipped`, only once both code and the receipt exist
- `PRD/work/STATUS.md` — remove the slug from every section
- `PRD/README.md`, only if navigation changed (never re-introduce a multi-row work-package table)

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
- The shipped-vs-planned signal lives only in `sections/system-map.md` — never edit a `DEC`/`REQ` `Status:` field to convey it.
- `npm run quality:check` green for touched areas, and no secrets committed, before delete.
- Never start new features or slices from this skill; never delete `PRD/instructions/receipts/`.

### Autonomous merge-proof gate

A package whose `README.md` has an `## Autonomous metadata` section must
additionally satisfy all four of the following, in order, before deletion:

1. The current branch equals the recorded autonomous base exactly.
2. The implementation pull request — located via its
   `thejudge-auto:v1:registered:<slug>` marker, per
   `thejudge-implement-all/reference.md` — is merged, and its merge target is
   the recorded base. Verify with the GitHub CLI (for example `gh pr view
   <number> --json state,baseRefName,mergedAt`) rather than inferring it from
   local branch state alone.
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
