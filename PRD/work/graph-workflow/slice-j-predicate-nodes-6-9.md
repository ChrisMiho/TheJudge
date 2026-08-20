# Slice J — The predicate covers nodes 6 and 9

## Status: done

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

- [x] `.claude/skills/thejudge-implement-all/SKILL.md` carries a `## Mode`
      section naming `graph-run is controlling` and stating the behavior change
- [x] `.claude/skills/thejudge-cleanup/SKILL.md` carries the same
- [x] Both sections follow the shape the existing four use — compare against
      `thejudge-map-out/SKILL.md`'s `## Mode` and match its structure
- [x] The contract's predicate paragraph names six skills, all six spelled out
- [x] `git grep -c 'graph-run is controlling' .claude/skills/*/SKILL.md` returns
      six `thejudge-*` skills
- [x] No `## Mode` section is added for `superpowers:requesting-code-review`
- [x] `diff -rq .claude/skills .agents/skills` produces no output
- [x] `npm run quality:check` green

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

## Result

`thejudge-implement-all` and `thejudge-cleanup` each gain a `## Mode` section
placed where the other four put theirs — between `## Goal` and `## Inputs` —
following the same shape: one line on what direct invocation keeps, then what
changes under `thejudge-prepare is controlling` or `graph-run is controlling`.

**Node 6 (`thejudge-implement-all`)** under a predicate takes the recorded
autonomous base from `## Autonomous metadata` rather than asking for one, and
converts every stop into a park reported to the orchestrator — a blocked slice,
an unresolvable gate failure, or a rebase conflict whose intent is not derivable
ends the node `failed` with evidence, and never waits for an answer nobody is
there to give. It also restates slice H's two obligations: write only inside
`.worktrees/implement-<slug>/` and `PRD/work/<slug>/`, and carry the dispatch
prompt's absolute `Working directory:` line unchanged into every prompt it
writes. Merge and close stay human in both modes.

**Node 9 (`thejudge-cleanup`)** under a predicate applies every gate as a park
rather than a question, and — the sharp part — **the force override is
unavailable**. It exists for a human who has judged the exception; an autonomous
run has no human to judge it, so leaving it reachable would have made the status
gate optional in exactly the mode where it matters most.

The contract's predicate paragraph now names all six skills and spells out why
6 and 9 joined: a skill `graph-run` dispatches which checks nothing has
undeclared autonomous behavior. The same paragraph states that node 7's
`superpowers:requesting-code-review` is deliberately not on the list — not a
`thejudge-*` skill, not this repository's to gate, and its independence recorded
as a stated limit rather than papered over. No `## Mode` section was added to it.

`git grep -ln 'graph-run is controlling' .claude/skills/*/SKILL.md` returns
seven files: the six `thejudge-*` skills and `graph-run` itself, which states
the predicate rather than gating on it.

Behavioral measurement of cleanup's gated mode is slice N's fixture.

`diff -rq .claude/skills .agents/skills` produces no output.
`npm run quality:check` exits 0.
