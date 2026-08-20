# Slice H — Absolute working directory in every dispatch; node 6 write scope

## Status: done

Scope item 14. Depends on: **G** (same `graph-run` SKILL/reference regions).
Converts the production half of boundary 2.

## Goal

A node that fans out cannot inherit the wrong working directory, and node 6's
writes are proved to land where they should.

## Requirements

1. `HANDOFF.md:37` — "Constraining a parent does not constrain its children."
   Scope item 5 (slice M) fixes that for fixture reps. `graph-run/SKILL.md:42-43`
   passes the package path, run ID, and predicate, and pins **no working
   directory** at any node — the same root cause on the production path, where a
   node dispatches its own subagents.
2. Every dispatch prompt `graph-run` emits carries an absolute
   `Working directory:` line, and **requires the node to propagate that same line
   into every prompt it writes**. Stated in `SKILL.md`'s loop step 3 and in
   `reference.md`'s dispatch table, so a node that fans out inherits the pin.
3. After node 6 (`build`) returns, the driver asserts every file the node wrote
   lies inside `.worktrees/implement-<slug>/` or `PRD/work/<slug>/`. A write
   outside that set **fails the node and parks** with the offending paths as
   evidence.
4. The rig's before/after snapshot does **not** port to production — a real run
   is supposed to change the repository. The write-scope assertion is its
   production equivalent, and must be stated that way rather than reused by name.
5. Slice G's `graph-ledger-check.mjs` gains the check that every recorded
   dispatch prompt contains an absolute `Working directory:` line.
6. Run `npm run skills:ai-sync`; commit the regenerated mirror.

## Acceptance criteria

- [x] `graph-run/SKILL.md` loop step 3 and `reference.md`'s dispatch table both
      require an absolute `Working directory:` line **and** its propagation into
      nested prompts
- [x] The ledger check fails a `GRAPH-RUN.md` whose dispatch prompt lacks the
      line, and fails one whose path is relative rather than absolute
- [x] The node-6 write-scope assertion is specified with its allowed set
      (`.worktrees/implement-<slug>/`, `PRD/work/<slug>/`) and its failure
      behavior (fail the node, park, offending paths as evidence)
- [x] Fixture: a simulated node-6 return with one out-of-scope path parks and
      names that path; one wholly in scope advances
- [x] `npm run test:scripts` green
- [x] `diff -rq .claude/skills .agents/skills` produces no output
- [x] `npm run quality:check` green

## Verification

```bash
node --test scripts/graph-ledger-check.test.mjs
git grep -n 'Working directory:' .claude/skills/graph-run/
npm run test:scripts
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

## Files touched

- `.claude/skills/graph-run/SKILL.md` (:42-43, loop step 3), `…/reference.md`
  (dispatch table) (+ mirror)
- `scripts/graph-ledger-check.mjs`, `scripts/graph-ledger-check.test.mjs`
- `PRD/instructions/graph-workflow-contract.md`

## Result

### The pin

`graph-run/SKILL.md` loop step 3 now requires an absolute `Working directory:`
line, **on its own line**, in every dispatch prompt, and requires the node to
copy that same line unchanged into every prompt it writes.
`reference.md`'s dispatch table carries the matching paragraph. Both state the
reason rather than the rule alone: constraining a parent does not constrain its
children, and a relative path is not a fix — it resolves against whatever
directory the child happens to start in, which is the inheritance itself.

`scripts/graph-ledger-check.mjs` gains `WORKING_DIRECTORY_LINE` and two
violation codes:

| Code | Fires when |
| --- | --- |
| `missing-working-directory` | a recorded dispatch prompt has no `Working directory:` line |
| `relative-working-directory` | the pinned path does not start with `/` |

The line must start its own line. Buried mid-sentence it is prose, not a pin a
node can propagate verbatim — a test asserts that case fails.
`./`, `../repo`, `PRD/work/demo`, and `.` are each rejected by name.

### Node 6's write scope

`classifyBuildWrites(paths, slug)` and `buildWriteScope(slug)` are pure, so a
simulated node-6 return is a fixture rather than a live run. Allowed set:
`.worktrees/implement-<slug>/` and `PRD/work/<slug>/`. Anything else returns
`outcome: "park"` with the offending paths in `outside` and in the evidence
string.

Three fixtures:

- a return wholly in scope (worktree source, worktree app code, package README,
  a `./`-prefixed package path) → `ok`
- a return with one out-of-scope path
  (`PRD/sections/decisions/card-collection.md` — the actual leak path) → `park`,
  naming exactly that path
- another package's worktree (`.worktrees/implement-other/`) → `park`. The
  allowed set is *this slug's*, not "any worktree", so two concurrent runs
  cannot write into each other

### The rig snapshot does not port, and is said not to

Stated in all three places — SKILL, reference, and
`graph-workflow-contract.md`: the rig asserts the invoking checkout is
byte-unchanged, which a real run is supposed to violate, so the write-scope
assertion is its production **equivalent**, not the same check under a new name.

`scripts/graph-ledger-check.test.mjs` is 22 tests; `npm run test:scripts` is 112,
all passing. `diff -rq .claude/skills .agents/skills` produces no output.
`npm run quality:check` exits 0.
