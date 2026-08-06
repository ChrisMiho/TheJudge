# Slice D — Cleanup and merge proof

## Status: planned

## Goal

Make `thejudge-cleanup` prove an autonomous package's implementation PR
actually merged into its recorded base — and that the implementation
worktree is clean and merged — before deleting the package, instead of
treating `ship-ready` alone as sufficient.

## Requirements

1. `.cursor/skills/thejudge-cleanup/SKILL.md` "Reads": add the package
   `README.md`'s `## Autonomous metadata` section (`Autonomous base:
   origin/<branch>`, from Slice B) and, when present, the corresponding
   `.worktrees/implement-<slug>` and `.worktrees/prepare-<slug>` Git state.
2. Add a new "Autonomous merge-proof gate" subsection under "Gates", after
   the existing "Status gate" bullet. For a package whose README has an `##
   Autonomous metadata` section, cleanup additionally requires, in order:
   - The current branch equals the recorded autonomous base exactly.
   - The implementation pull request (located via its `thejudge-auto:v1:registered:<slug>`
     marker, per `thejudge-implement-all/reference.md`) is merged, and its
     merge target is the recorded base — verify with the GitHub CLI (for
     example `gh pr view <number> --json state,baseRefName,mergedAt`) rather
     than inferring from local branch state alone.
   - `.worktrees/implement-<slug>` (if it still exists) has a clean working
     tree and no local commits that are not already present on the recorded
     base's tip — i.e. it is fully merged.
   - Every runtime-cleanup acceptance criterion recorded in the package's
     slice verification evidence is passing (owner/session, worktree, ports,
     started-vs-attached, `browser_close`/process-stop/port-release results —
     the recording contract Slice F defines in
     `PRD/instructions/runtime-process-hygiene.md`).
   Refuse cleanup and report the exact unmet condition — which check failed
   and the observed state — if any of the four fail. A user force-override
   still requires the operator to explicitly acknowledge which of these
   checks is being skipped and why; it does not silently bypass all four.
3. Add to "Writes"/"On success" behavior: for an autonomous package that
   passes the merge-proof gate, remove the clean, fully-merged
   `.worktrees/implement-<slug>` and its local branch. Never delete the
   remote branch. If `.worktrees/prepare-<slug>` still exists (a safety net
   for a package whose implementation preflight, Slice C, did not already
   remove it), confirm its preparation PR merged into the recorded base and
   remove that worktree/branch too under the same clean-and-merged rule.
4. Add one sentence clarifying scope: a package with no `## Autonomous
   metadata` section (an ordinary collaborative package) keeps the existing
   local-only cleanup path unchanged — no branch, PR, or worktree checks are
   added for it.
5. "Gates" section: add an explicit bullet — "Never delete a remote branch,
   for autonomous or collaborative packages."

## Acceptance criteria

- [ ] `thejudge-cleanup/SKILL.md` states all four autonomous merge-proof
      conditions (branch equals base, PR merged into that base, worktree
      clean and fully merged, runtime-cleanup evidence passing) and refuses
      cleanup naming the exact unmet condition when any fails
- [ ] Autonomous-package success path removes only the clean, fully-merged
      local implementation (and, if present, preparation) worktree/branch,
      never a remote branch
- [ ] Collaborative packages without `## Autonomous metadata` are explicitly
      exempted from the new checks
- [ ] `npm run skills:ai-sync` run; all three skill trees byte-identical

## Verification

```bash
grep -n "Autonomous merge-proof gate\|mergedAt\|baseRefName" .cursor/skills/thejudge-cleanup/SKILL.md
grep -n "Never delete a remote branch" .cursor/skills/thejudge-cleanup/SKILL.md
grep -n "Autonomous metadata" .cursor/skills/thejudge-cleanup/SKILL.md
npm run skills:ai-sync
diff -rq .cursor/skills .agents/skills
diff -rq .cursor/skills .claude/skills
```

## Files touched

- `.cursor/skills/thejudge-cleanup/SKILL.md`
- `.agents/skills/thejudge-cleanup/*` (synced)
- `.claude/skills/thejudge-cleanup/*` (synced)
