---
name: proj-cleanup
description: >-
  Closes out a ship-ready work package: verifies slice completion, promotes
  durable PRD truth, writes a receipt, updates PRD/work/STATUS.md, and deletes
  PRD/work/<slug>/. Also handles explicit corpus-hygiene sweeps. Use when a
  feature has shipped, when the user force-overrides for cleanup, or when the
  user explicitly asks for PRD corpus hygiene — not for general code tidying.
---

# <Product> Cleanup

## Goal

Convert a shipped package into durable truth plus a permanent receipt, then
delete the package.

## Inputs

A work package slug or path. Or: an explicit corpus-hygiene request.

## Reads

- `PRD/work/<slug>/` — README, GAMEPLAN, every slice, the `STATUS.*` marker
- `PRD/work/STATUS.md`
- `PRD/instructions/doc-lifecycle.md`
- `PRD/instructions/workflow-reference.md`
- The code paths the package touched
- Git state for any branches or worktrees the package used

## Writes

- `PRD/sections/` promotions — decision bodies, router index rows, requirement
  additions and amendments, flow updates
- `PRD/sections/system-map.md` — entries flipped to `shipped`
- `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md`
- `PRD/work/STATUS.md` — row removed
- Deletion of `PRD/work/<slug>/`
- `PRD/README.md` — **only** if navigation or read order changed

## Ship checklist

Verify before promoting:

- [ ] Every slice is `done`
- [ ] Every slice's acceptance criteria were verified with recorded evidence
- [ ] `<quality-command>` is green
- [ ] No secrets were committed
- [ ] Browser-risk slices recorded runtime cleanup evidence

## Merge-proof gate

If the package was implemented through a branch or PR flow, additionally verify:

- The contributor branch is merged into its recorded base
- The PR is merged, not merely approved
- The implementation worktree is clean and fully merged

Deleting the plan for unmerged work loses the plan for unmerged work. This gate
is the reason cleanup is a skill and not a shell script.

## Procedure

1. Gate on `ship-ready`, or an explicit human force-override. Refuse otherwise
   and say why.
2. Run the ship checklist and the merge-proof gate.
3. Promote durable outcomes into `PRD/sections/`. Every new decision gets a body
   **and** a router index row.
4. Flip `system-map.md` entries whose code now exists to `shipped`.
5. Write the receipt. **Before** the delete, always.
6. Delete `PRD/work/<slug>/` in full.
7. Remove the board row.
8. Remove merged local worktrees and branches. Never remote.
9. Update `PRD/README.md` only if navigation changed.

## Receipt

Path: `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md`

Contents: date, slug, status (`shipped` | `partial` | `corpus-only`), actions
taken, every file created, updated, and deleted, and verification results.

Receipts are permanent. They are never deleted with a work folder, and they are
half of the system-map promotion gate.

## Corpus hygiene mode

The same skill handles sweeps not tied to a shipped feature — terminology
renames, retiring a directory, reconciling stale navigation. These produce a
receipt with `Status: corpus-only` and no code changes. Routing both through one
skill is what keeps every corpus mutation receipted.

## Gates

- Refuse unless `ship-ready` or explicitly force-overridden.
- Never delete before the receipt is written.
- Never delete a remote branch.
- Never treat this as a general code-tidying request.

## Next step

Terminal. Optionally offer `/proj-kickoff` to start the next piece of work.
