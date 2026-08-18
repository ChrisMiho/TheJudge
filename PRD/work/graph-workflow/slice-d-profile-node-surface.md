# Slice D — Profile matches the node command surface; `PROMPTED` terminal state

## Status: done

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

- [x] The nine-node command enumeration is written into this slice doc under
      `## Node command enumeration`, one row per node
- [x] **Every command in the enumeration** resolves to an `allow` entry in
      `.claude/graph-profile.json` or is deliberately denied with that node's
      park/`PROMPTED` behavior stated. No command is left unlisted
- [x] `.claude/graph-profile.json` parses: `node -e "require('./.claude/graph-profile.json')"`
- [x] Deny list contains `Bash(rm -r *)` and `Bash(rm --recursive *)`; allow list
      contains the **scoped** `Bash(git rm -r PRD/work/*)` and **no** unscoped
      `Bash(git rm -r *)`
- [x] **Dry run:** create a scratch `PRD/work/_profile-dryrun/` package folder,
      launch a session with `claude --settings .claude/graph-profile.json`, and
      confirm node 9's delete mechanism completes **without a prompt**. Record the
      exact command and its result as evidence; remove the scratch folder
- [x] `graph-run`'s `## Terminal states` table has four rows, `PROMPTED` among
      them, with required result and exact next step filled in
- [x] `git grep -c 'COMPLETE' PRD/instructions/graph-workflow-contract.md` shows
      the pointer line only — no second terminal-states table
- [x] `diff -rq .claude/skills .agents/skills` produces no output
- [x] `npm run quality:check` green

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

## Node command enumeration

Built by reading each delegate skill and `graph-run`'s own `reference.md`, then
diffing that list against `.claude/graph-profile.json` — not by guessing at the
profile. Every command below now resolves to an `allow` entry or is deliberately
denied.

| # | Node | Delegate | Commands it issues | Profile resolution |
| --- | --- | --- | --- | --- |
| 1 | `preflight` | `graph-preflight` | `npm run graph:preflight -- …`, `git status --porcelain`, `git branch --show-current`, `git fetch origin`, `git stash push`, `git stash list`, `git add <path>`, `git commit`, `git push -u origin <branch>` | all `allow` — `git branch --show-current*` added by this slice |
| 2 | `shape` | `thejudge-kickoff` | `npm run skills:ai-sync`, file writes under `PRD/work/<slug>/` | `Bash(npm run *)`, `Edit(./**)` |
| 3 | `define` | `thejudge-refinement` | file writes to `PRD/work/<slug>/` and `PRD/sections/`; `git grep` / `git log` for prior art | `Edit(./**)`, `Bash(git log*)`, `Bash(git grep *)` added by this slice |
| 4 | `gate-qc` | `thejudge-quality-check` | reads only; writes the QC report and `STATUS.*` marker | `Read(./**)`, `Edit(./**)` |
| 5 | `plan` | `thejudge-map-out` | `npm run quality:check`, writes `GAMEPLAN.md` and slice docs | `Bash(npm run *)`, `Edit(./**)` |
| 6 | `build` | `thejudge-implement-all` | `git fetch`, `git worktree add .worktrees/*`, `git worktree list`, `git switch`, `git rebase`, `git add <path>`, `git diff --cached`, `git commit`, `git push origin HEAD:<branch>`, `gh auth status`, `gh pr list/create/view/comment/edit`, `npm run quality:check`, `diff -rq`; **plus** `git worktree remove` and `git branch -d` on a leftover `.worktrees/prepare-<slug>` | `git worktree remove *`, `git branch -d *`, `gh auth status*`, `gh pr list *` added by this slice; the rest already allowed |
| 7 | `review` | `superpowers:requesting-code-review` | reads the diff; issues no repository-mutating command | `Read(./**)`, `Bash(git diff*)` |
| 8 | `land` | human | none — the driver never runs `gh pr merge` / `gh pr close` | both **denied**, deliberately: node 8 is a human action and the run parks |
| 9 | `close` | `thejudge-cleanup` | `git status --porcelain`, `git branch -r`, `git ls-remote --heads origin <base>`, `git merge-base --is-ancestor`, `git log --oneline --all --grep`, `gh pr view`, `npm run quality:check`, **delete `PRD/work/<slug>/`**, `git worktree remove`, `git branch -d` | `git branch -r*`, `git ls-remote *`, `git merge-base *`, `git rm -r PRD/work/*` added by this slice |

### Deliberately denied, with the node's behavior stated

| Command | Rule | Behavior |
| --- | --- | --- |
| `rm -r`, `rm --recursive`, and the six force spellings | deny | Node 9 never uses `rm`. A run reaching for one terminates `PROMPTED` with the command recorded |
| `git rm -r <anything outside PRD/work/>` | unlisted | Left unlisted on purpose: the scoped allow is what stops node 9's delete becoming a general tracked-file delete. Terminates `PROMPTED` |
| `git branch -D`, `git branch --delete --force` (both orders) | deny | Node 6 and node 9 delete only merged branches, with `-d` |
| `git checkout` | unlisted | No node issues it; `git switch` is the permitted form. Terminates `PROMPTED` if one ever does |
| `gh pr merge`, `gh pr close` | deny | Node 8 is a human action — the run parks and waits |
| `git push --force` / `-f` / `--force-with-lease` / `+refspec`, remote-branch delete | deny | Contract boundary; unchanged by this slice |

## Result

**Two defects found by measuring rather than reading.**

**1. Node 9 had no permitted delete, exactly as mapped.** Confirmed and closed:
the profile now allows the path-scoped `Bash(git rm -r PRD/work/*)` and denies
every recursive `rm` spelling including the previously unlisted bare `rm -r`.
`.claude/skills/thejudge-cleanup/SKILL.md` gains a `### Delete mechanism`
section naming `git rm -r PRD/work/<slug>/`, `git worktree remove <path>`, and
`git branch -d <name>` outright.

**2. Every `Write(...)` rule in the profile was inert.** Launching a session
with `--settings .claude/graph-profile.json` printed nine engine warnings:

```
Permission deny rule (.claude/graph-profile.json): Write(./CLAUDE.md) is not
matched by file permission checks — only Edit(path) rules are.
Use Edit(./CLAUDE.md) instead (Edit rules cover all file-editing tools).
```

One allow (`Write(./**)`) and eight denies were dead weight. Protection was not
actually lost — every `Write(…)` deny had a matching `Edit(…)` deny beside it,
and `Edit` rules cover all file-editing tools — but the profile was carrying
nine rules the engine ignores, and no amount of reading it would have shown
that. All nine are removed. This is precisely the class of defect the slice
exists to catch: the profile did not match the real command surface.

### Dry run — node 9's delete, under the profile

Run in an isolated scratch repository carrying a copy of the profile and a
committed `PRD/work/_profile-dryrun/`, so the launch checkout was never
mutated. Permission rules match on command text, so the measurement is faithful.

```
$ claude --settings .claude/graph-profile.json -p '… git rm -r PRD/work/_profile-dryrun/ …'
Exit code: 0 (success)
Permission layer: did not prompt and did not deny — the call went straight
through and executed.
  rm 'PRD/work/_profile-dryrun/README.md'
  rm 'PRD/work/_profile-dryrun/STATUS.ship-ready'
```

The deny side was measured in the same session shape:

```
$ claude --settings .claude/graph-profile.json -p '… rm -r PRD/work/_profile-dryrun/ …'
Denied. The permission layer rejected the call outright — no interactive
prompt: "Permission to use Bash with command rm -r PRD/work/_profile-dryrun/
has been denied."
```

The scratch package and scratch repository are removed.

### Terminal states

`graph-run`'s `## Terminal states` table now has four rows. `PROMPTED` carries
its required result (the denied or unlisted command verbatim under
`## Open gate`, plus the node it arose at, `STATUS.owner-action`, board row) and
its exact next step (run the command yourself or add the rule, then resume).
The prose beneath states the thesis: a prompt in an autonomous session is a
hang, not a question, so the run leaves the same evidence a parked one does, and
never rephrases the command to dodge the rule.

`graph-workflow-contract.md` gains a `## Terminal states` section that is a
**pointer only** — `git grep -c 'COMPLETE'` returns 1, that pointer line.

`diff -rq .claude/skills .agents/skills` produces no output.
`npm run quality:check` exits 0.
