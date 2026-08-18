# Slice D — Profile matches the node command surface; `PROMPTED` terminal state

## Status: planned

Scope item 8. Depends on: **A** (the profile's Cursor denies are scrubbed there).
Sequential with E and F — all three edit `.claude/graph-profile.json`.

## Goal

Every command the nine nodes actually issue resolves to an `allow` entry or is
deliberately denied, and a permission prompt becomes a recorded run-ending state
instead of a silent stall.

## Requirements

1. **Enumerate first, diff second.** Read each of the nine delegate skills and
   record, in this slice doc, every command that node issues. The enumeration is
   the diff basis for the profile edit — do not guess at the profile. Known
   gaps on the current tree:

   | Node | Command it needs | Profile status |
   | --- | --- | --- |
   | 9 `close` | delete `PRD/work/<slug>/` (`thejudge-cleanup/SKILL.md:16,57`) | **no permitted mechanism** — six force-form `rm` denies, no `git rm` entry, bare `rm -r` unlisted so it prompts |
   | 6 `build` | `git worktree remove` + `git branch -d` on the prep worktree (`thejudge-implement-all/reference.md:33`) | unlisted — prompts |
   | 6 `build` | `git branch`, `git checkout` variants | unlisted — `git switch` allowed, `git checkout` is not |

2. Add the missing allows: `Bash(git rm -r PRD/work/*)` **scoped to the work
   folder**, `Bash(git worktree remove *)`, `Bash(git branch -d *)`, and whatever
   else the enumeration surfaces. Name the cleanup delete mechanism explicitly in
   `thejudge-cleanup` rather than leaving it to the implementer.
   **`Bash(git rm -r *)` unscoped is not acceptable** — the scoped pathspec form
   is what keeps node 9's delete from becoming a general tracked-file delete.
3. Close the unlisted `rm` path. The profile carries **six** `Bash(rm ...)`
   denies at `.claude/graph-profile.json:52-57`, and every one is a *force* form:

   ```
   rm -rf        rm -fr        rm -r -f
   rm -f -r      rm --recursive --force        rm --force --recursive
   ```

   A bare `rm -r <path>` is **not denied** — it is unlisted, so it prompts, and
   by this slice's thesis a prompt is a hang. Add `Bash(rm -r *)` and
   `Bash(rm --recursive *)`. After that every recursive spelling is denied, the
   only permitted delete is the work-folder-scoped `git rm -r PRD/work/*`, and a
   run reaching for anything else terminates `PROMPTED` with the denied command
   recorded.
4. Add a **`PROMPTED` terminal state** to `.claude/skills/graph-run/SKILL.md`'s
   `## Terminal states` table (currently `:128-134`, recovery guidance
   `:136-149`): a permission prompt in a graph run is a run-ending condition that
   writes the denied command into `## Open gate` before stopping. A stalled run
   must leave the same evidence a parked one does.
5. `PRD/instructions/graph-workflow-contract.md` gains a **one-line pointer**
   naming that table as the authority — **not a second copy**. Two tables of
   terminal states is the drift surface this brief exists to remove. Verified:
   `git grep -n 'COMPLETE\|PARKED\|BLOCKED\|terminal' PRD/instructions/graph-workflow-contract.md`
   returns nothing today; keep it that way apart from the pointer.
6. Run `npm run skills:ai-sync`; commit the regenerated mirror.

## Acceptance criteria

- [ ] The nine-node command enumeration is written into this slice doc under
      `## Node command enumeration`, one row per node
- [ ] **Every command in the enumeration** resolves to an `allow` entry in
      `.claude/graph-profile.json` or is deliberately denied with that node's
      park/`PROMPTED` behavior stated. No command is left unlisted
- [ ] `.claude/graph-profile.json` parses: `node -e "require('./.claude/graph-profile.json')"`
- [ ] Deny list contains `Bash(rm -r *)` and `Bash(rm --recursive *)`; allow list
      contains the **scoped** `Bash(git rm -r PRD/work/*)` and **no** unscoped
      `Bash(git rm -r *)`
- [ ] **Dry run:** create a scratch `PRD/work/_profile-dryrun/` package folder,
      launch a session with `claude --settings .claude/graph-profile.json`, and
      confirm node 9's delete mechanism completes **without a prompt**. Record the
      exact command and its result as evidence; remove the scratch folder
- [ ] `graph-run`'s `## Terminal states` table has four rows, `PROMPTED` among
      them, with required result and exact next step filled in
- [ ] `git grep -c 'COMPLETE' PRD/instructions/graph-workflow-contract.md` shows
      the pointer line only — no second terminal-states table
- [ ] `diff -rq .claude/skills .agents/skills` produces no output
- [ ] `npm run quality:check` green

## Verification

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/graph-profile.json','utf8')); console.log('profile parses')"
grep -n '"Bash(rm' .claude/graph-profile.json
grep -n '"Bash(git rm' .claude/graph-profile.json
git grep -n 'PARKED\|PROMPTED' PRD/instructions/graph-workflow-contract.md
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

## Files touched

- `.claude/graph-profile.json`
- `.claude/skills/graph-run/SKILL.md` (+ mirror)
- `.claude/skills/thejudge-cleanup/SKILL.md` (+ mirror) — delete mechanism named
- `PRD/instructions/graph-workflow-contract.md`
- this slice doc — the enumeration
