# Slice J — The predicate covers nodes 6 and 9

## Status: planned

Scope item 16. Depends on: **D** (same `thejudge-cleanup/SKILL.md`).

## Goal

Every skill a graph run dispatches declares what changes under
`graph-run is controlling`, so its autonomous behavior is testable rather than
assumed.

## Requirements

1. Contract `:32-34` names four predicate-gated skills — `thejudge-kickoff`,
   `thejudge-refinement`, `thejudge-quality-check`, `thejudge-map-out`. Nodes 6
   (`thejudge-implement-all`) and 9 (`thejudge-cleanup`) are dispatched by
   `graph-run` and **check nothing**, so their graph-mode behavior is undeclared:
   whether they pause for a human in a run with no human is not knowable from the
   skill files.
2. Both gain the `## Mode` section the other four carry, naming
   `graph-run is controlling` and stating what changes under it.
3. The contract's predicate paragraph names **six** skills instead of four.
4. **Node 7 (`superpowers:requesting-code-review`) is out of scope.** It is not a
   `thejudge-*` skill and is not this repository's to gate; its limits are
   recorded in the brief's `## Stated limits`. Do not add a `## Mode` section to
   it.
5. Run `npm run skills:ai-sync`; commit the regenerated mirror.

## Acceptance criteria

- [ ] `.claude/skills/thejudge-implement-all/SKILL.md` carries a `## Mode`
      section naming `graph-run is controlling` and stating the behavior change
- [ ] `.claude/skills/thejudge-cleanup/SKILL.md` carries the same
- [ ] Both sections follow the shape the existing four use — compare against
      `thejudge-map-out/SKILL.md`'s `## Mode` and match its structure
- [ ] The contract's predicate paragraph names six skills, all six spelled out
- [ ] `git grep -c 'graph-run is controlling' .claude/skills/*/SKILL.md` returns
      six `thejudge-*` skills
- [ ] No `## Mode` section is added for `superpowers:requesting-code-review`
- [ ] `diff -rq .claude/skills .agents/skills` produces no output
- [ ] `npm run quality:check` green

## Verification

```bash
git grep -ln 'graph-run is controlling' .claude/skills
git grep -n 'predicate' PRD/instructions/graph-workflow-contract.md | head -20
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

Behavioral measurement of cleanup's gated mode is slice **N**'s fixture, not this
slice's.

## Files touched

- `.claude/skills/thejudge-implement-all/SKILL.md` (+ mirror)
- `.claude/skills/thejudge-cleanup/SKILL.md` (+ mirror)
- `PRD/instructions/graph-workflow-contract.md` (:32-34)
