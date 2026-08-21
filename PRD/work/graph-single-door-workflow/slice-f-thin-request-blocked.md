# Slice F — A request too thin to package ends `BLOCKED`

## Status: done

## Goal

When node 2 cannot turn the request into an actionable package, the run stops
and tells the owner exactly what it needs and exactly what it left behind —
rather than guessing at scope or leaving the driver with an outcome it has no
rule for.

## Requirements

REQ-164.

1. `graph-run` gains a named edge for `NO ACTIONABLE PACKAGE` returned by node
   2, in both the skill and the contract. It exists in `thejudge-kickoff` and
   `thejudge-prepare` today and nowhere in `graph-run` or the contract.
2. The run terminates at `BLOCKED`, reporting what was tried, what exists, what
   does not, and the recovery action — the shape `BLOCKED` already requires.
3. **`graph-run`'s `BLOCKED` definition is widened.** As written
   (`graph-run/SKILL.md:328-332`), `BLOCKED` is "an external condition outside
   the repository", `PARKED` is "anything requiring a human decision, judgment,
   or review", and the tiebreak is "when it is not clear which applies, park".
   A thin request is neither external nor outside the repository, so the
   paragraph as it stands routes it to `PARKED`. Amend it so `BLOCKED` also
   covers a request too thin to package.
4. This is the **only** terminal-state text this package changes, and no fifth
   terminal state is added.
5. Why `BLOCKED` and not `PARKED`, stated in the skill: `PARKED` means the run
   resumes from a recorded gate, and a thin request leaves no artifact to resume
   from. Mechanically, parking needs a package folder for `## Open gate`, a
   `STATUS.*` marker, and a board row — none exists, because
   `thejudge-kickoff` returns `NO ACTIONABLE PACKAGE` without creating them and
   intake stays staged outside the working tree until node 2 creates the
   package folder.
6. **The report names the branch it left behind.** Node 1 runs before node 2 can
   judge the request, so this `BLOCKED` always leaves a pushed
   `thejudge-auto/<slug>`. The report names that branch, whether node 1
   auto-committed or stashed the working tree, and the staging path holding any
   intake.
7. The run does not delete the branch. `graph-preflight`'s contract forbids
   tidying a failed run, and node 1 may have auto-committed real working-tree
   changes onto it.
8. The recovery action is a fuller description or intake material **plus an
   explicit `--branch`**, because the same description derives the same slug and
   `graph-preflight` exits 2 on the collision
   (`.claude/skills/graph-preflight/SKILL.md:118`).
9. The concurrency lock is released, as every terminal state requires.
10. The door never invents scope to make a thin request actionable.

## Files touched

- `.claude/skills/graph-run/SKILL.md` — the `NO ACTIONABLE PACKAGE` edge, the
  widened `BLOCKED` paragraph, the report contents
- `PRD/instructions/graph-workflow-contract.md` — the edge named beside the node
  table
- `.agents/skills/**` via `npm run skills:ai-sync`

## Acceptance criteria

- [x] F1 — `grep -n "NO ACTIONABLE PACKAGE" .claude/skills/graph-run/SKILL.md`
      and the same grep against `graph-workflow-contract.md` both match; before
      this slice neither did.
- [x] F2 — `graph-run/SKILL.md`'s `BLOCKED` paragraph covers both an external
      condition outside the repository **and** a request too thin to package.
- [x] F3 — `graph-run/SKILL.md`'s `## Terminal states` table still lists
      exactly four states: `COMPLETE`, `PARKED`, `BLOCKED`, `PROMPTED`.
- [x] F4 — `graph-run/SKILL.md` states why this is `BLOCKED` rather than
      `PARKED`, giving both the no-artifact-to-resume-from reason and the
      mechanical one (no package folder, no marker, no board row).
- [x] F5 — `graph-run/SKILL.md` requires the report to name the
      `thejudge-auto/<slug>` branch, whether node 1 committed or stashed, and
      the intake staging path.
- [x] F6 — `graph-run/SKILL.md` states the branch is not deleted, with the
      reason, and that the recovery action needs an explicit `--branch` because
      of the exit-code-2 collision.
- [x] F7 — `graph-run/SKILL.md` still requires the lock released on every state
      in the table, and no second list of releasing states is introduced.
- [x] F8 — `git diff` for this slice shows no change to the contract's
      `## Boundaries` list, the node table rows, the model column, or the cap
      column.
- [x] F9 — `npm run skills:ai-sync` run and
      `diff -rq .claude/skills .agents/skills` prints nothing.
- [x] F10 — read the widened `BLOCKED` paragraph against the tiebreak sentence:
      confirm a thin request now resolves to `BLOCKED` and that no other case
      moved out of `PARKED`. Record the reading.

## Verification

```bash
grep -n "NO ACTIONABLE PACKAGE" .claude/skills/graph-run/SKILL.md
grep -n "NO ACTIONABLE PACKAGE" PRD/instructions/graph-workflow-contract.md
grep -n "COMPLETE\|PARKED\|BLOCKED\|PROMPTED" .claude/skills/graph-run/SKILL.md
git diff -- PRD/instructions/graph-workflow-contract.md
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
```

## F10 reading

The widened paragraph adds one clause to `BLOCKED` — "and for a request node 2
cannot turn into an actionable package" — and adds one qualifier to `PARKED` —
"over an existing artifact." Every other `PARKED` trigger already named in the
contract (`gate-qc` fourth FAIL, a `build`/`review` blocker, a genuine decision
blocker) operates on an artifact the package already has, so none of them move.
Only the request-not-yet-a-package case, which previously fell to the tiebreak
sentence ("when it is not clear which applies, park") for lack of a named
bucket, now has one. The tiebreak sentence itself is unchanged and still
applies to any case this paragraph does not name.
