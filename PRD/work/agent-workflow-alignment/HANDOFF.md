# Handoff — agent workflow alignment

## Resume prompt

Use `$thejudge-refinement PRD/work/agent-workflow-alignment/` after the parallel responsive-containment task has stopped touching the launch checkout. Read this handoff and `DESIGN-BRIEF.md`, verify the live Git state, complete the approved refinement artifacts/status transition, self-review them, and hand off to `$thejudge-quality-check PRD/work/agent-workflow-alignment/`. Do not repeat design questions and do not edit skills or implementation files during refinement.

## Current state

- The complete design was explicitly approved by the user on 2026-08-05.
- Playwright MCP is available in Codex.
- `DESIGN-BRIEF.md` has been written with the approved design.
- `DEC-154` has been added to `PRD/sections/decisions/doc-process.md` and indexed in `PRD/sections/decisions.md`.
- The package deliberately remains `status: refining` / `STATUS.refining`; the final transition to `refined` was paused because another process kept advancing and modifying the launch checkout during this refinement session.
- Responsive commit `ad3d1bb` accidentally committed and pushed the `agent-workflow-alignment` row under `## refining` in `PRD/work/STATUS.md`, but did not include the untracked package folder or the unstaged `DEC-154` edits. Nothing was lost, but the responsive branch therefore contains a dangling board link that must be reconciled deliberately rather than hidden.
- No skill, instruction, product-code, test, or `scripts/dev.mjs` implementation changes have been made for this package.

## Why the session paused

A parallel responsive-containment task was expected to run in its own worktree, but Git evidence showed the launch checkout itself changing during this session:

- the launch checkout moved between `feature/responsive-containment-and-density` and `feature/automated-refinement`
- a pull of `origin/main` created merge commit `0a82914`, followed by resets that moved the local `feature/automated-refinement` pointer to `origin/main`
- the checkout returned to `feature/responsive-containment-and-density`
- that branch then received and pushed multiple implementation commits while this refinement session was writing PRD files
- a responsive slice file was also observed changing in the launch checkout between audits

Because concurrent writes can accidentally absorb unrelated PRD work into another commit, do not finish the status transition until the launch checkout is stable or the operator explicitly chooses another safe checkout.

## Git integrity and recovery audit

The audit found no object-database or worktree-metadata corruption:

- `git fsck --full --no-dangling` exited successfully.
- `git worktree prune --dry-run --verbose` found no prunable registered worktrees.
- Registered secondary worktrees had clean tracked working trees at audit time. Some track remote refs that are now gone or have diverged; that is stale lifecycle state, not corruption, and must not be cleaned as part of this refinement.
- The responsive work was captured in commits and synchronized with its remote during the audit.
- The workflow package remained present throughout the branch/reset incident.

The one confirmed cross-task contamination is commit `ad3d1bb`: it moved the responsive package to `ship-ready` and also swept the already-modified `PRD/work/STATUS.md` into that commit, including this package's `refining` board row. Do not rewrite or amend that pushed commit. When resuming, either land this package on the intended branch so the row resolves there, or make a deliberate follow-up correction on the responsive branch after confirming the operator's desired branch layout.

### `feature/automated-refinement`

At the last audit:

- local `feature/automated-refinement`: `35d00f8980a386a54f19839a9fb81184f883f8c1` (`origin/main`)
- remote `origin/feature/automated-refinement`: `f67c649a0168716ae1f67f7c67073a92c25799f6`
- successful merge of that feature tip with main: `0a82914d4cadce52cfb65f6e455110f34d2b5115`

The reset moved only the local branch pointer. The feature commits remain on the remote, and the merged result remains recoverable.

The merge result is anchored at:

```text
rescue/automated-refinement-main-merge-20260805
```

Do not repoint `feature/automated-refinement` automatically. After concurrent work is idle, ask the user which state they want:

1. Recommended if the intent is “feature plus current main”: repoint the local branch to `rescue/automated-refinement-main-merge-20260805` (`0a82914`).
2. If the main merge should be discarded: repoint it to `origin/feature/automated-refinement` (`f67c649`).
3. Leaving it at `35d00f8` abandons the feature commits from the local branch view, although they remain safe remotely.

### Rescue snapshots

Local rescue refs created without altering the working tree:

- `rescue/merge-abort-20260805-1905` — exact tracked responsive working state captured before the parallel task committed it
- `rescue/automated-refinement-main-merge-20260805` — the successful feature/main merge commit
- `rescue/agent-workflow-refinement-20260805` — tracked approved refinement edits captured before pausing

Untracked package archive:

```text
/private/tmp/thejudge-agent-workflow-refinement-20260805.tar.gz
SHA-256 c68a4c6098c0820fec0aef4e1757a073a4ded4f699e072d83ce500bc354f970c
```

The archive contains `IDEA.md`, `README.md`, `HANDOFF.md` as it existed before this update, `DESIGN-BRIEF.md`, and `STATUS.refining`. Refresh the archive after this handoff if external backup of the latest handoff is desired.

There is also an older stash from 2026-08-03 named `wip: player-life-tracker + commander-spellbook-combos (do not lose)`. It is unrelated to the merge incident and must not be dropped or applied during this package.

## Approved design

`DESIGN-BRIEF.md` is authoritative. The approved outcome is:

- ten-skill catalog: retain the collaborative/autonomous core, add `thejudge-defer`, remove `thejudge-map-out-parallel` and `thejudge-implement-parallel`
- collaborative work stays in the current checkout/current local branch without automatic worktrees, branches, commits, pushes, or PRs
- autonomous preparation requires an explicit remote base recorded in package metadata
- autonomous preparation and implementation use `.worktrees/prepare-<slug>` and `.worktrees/implement-<slug>` respectively, with one branch/PR per package targeting the recorded base
- one agent implements sequential slices within each package; fanout concurrency exists only across packages and preserves file-overlap serialization
- cleanup proves the implementation PR merged into the recorded base and removes only clean, fully merged local worktrees/branches; no automatic remote-branch deletion
- deferral is reversible and preserves all artifacts/Git state; `ship-ready` and active packages with an `in-progress` slice cannot be deferred
- Playwright MCP is required when the user asks for it or browser-observable risk cannot be established by component tests
- create focused `PRD/instructions/runtime-process-hygiene.md`; record owner/session, worktree, ports, started-versus-attached state, and cleanup evidence
- every owning invocation calls `browser_close`, stops exact owned process trees, waits for exit, and verifies ports released before completion
- harden `scripts/dev.mjs` to use explicit ports, direct spawning, exact tree ownership, idempotent awaited shutdown, and bounded exact-tree escalation
- prohibit `nohup`, untracked background `&`, broad `pkill` / `killall`, and stopping attached/user-owned servers
- add focused process-manager tests and use failing-baseline-first skill contract scenarios before canonical skill edits

## Remaining refinement work

Once the launch checkout is stable:

1. Re-read `DESIGN-BRIEF.md` and the `DEC-154` router/body edits.
2. Confirm no concurrent commit absorbed or reverted the package/decision files.
3. Reconcile the `agent-workflow-alignment` board row already pushed in responsive commit `ad3d1bb`; do not amend or reset the pushed responsive commit.
4. Self-review for placeholders, contradictions, ambiguity, scope drift, and stable-ID correctness.
5. Change the package README from `status: refining` to `status: refined`.
6. Replace `STATUS.refining` with the empty `STATUS.refined` marker.
7. Move the board row from `## refining` to `## refined` in `PRD/work/STATUS.md` without altering unrelated rows.
8. Run fresh documentation/status checks and inspect the exact diff.
9. Report the merge-audit state separately; do not silently repair `feature/automated-refinement`.

Expected refinement artifacts:

- `PRD/work/agent-workflow-alignment/DESIGN-BRIEF.md`
- `PRD/work/agent-workflow-alignment/README.md`
- exactly one package marker (`STATUS.refined` after completion)
- `PRD/work/STATUS.md`
- `PRD/sections/decisions.md` (`DEC-154` router row)
- `PRD/sections/decisions/doc-process.md` (`DEC-154` body)
- this `HANDOFF.md`

No `REQ`, `FLOW`, `NFR`, open question, or screen-layout row is required because the package changes repository workflow/tooling rather than product behavior.

## Required discipline

- Preserve all unrelated responsive-containment changes and commits.
- Do not reset, checkout, stash, clean, or rewrite branches while concurrent work is active.
- Do not remove existing worktrees or local/remote branches during refinement.
- Do not edit `.agents/` or `.claude/` skill mirrors directly during implementation; edit canonical `.cursor/skills/thejudge-*/`, run `npm run skills:ai-sync`, and verify byte identity.
- Do not implement skills, instructions, process code, or tests until refinement passes quality-check and map-out.

## Next step after refinement is complete

Run:

```text
$thejudge-quality-check PRD/work/agent-workflow-alignment/
```
