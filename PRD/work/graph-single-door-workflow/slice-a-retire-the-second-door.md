# Slice A — Retire the second door

## Status: done

## Goal

`graph-run` is the named entry point for new work, and `thejudge-prepare` stops
being advertised as an intake route — without changing what `thejudge-prepare`
does or removing it from the repository.

## Requirements

REQ-160.

1. `PRD/instructions/graph-workflow-contract.md` names `graph-run` as the entry
   point for new work. Nothing is removed there: the contract never claimed
   `thejudge-prepare` was an entry point. Its six mentions are the
   `thejudge-prepare is controlling` predicate and README section ownership, and
   they stay exactly as written.
2. `AGENT-SKILLS.md`'s `## Workflow sequence` mermaid diagram replaces the two
   `prepare` edges — `prepare -. controls .-> kickoff` and
   `prepare -. READY after human merge .-> implementall` — with `graph-run`
   edges. `graph-run` joins the diagram in `thejudge-prepare`'s place: a diagram
   that drops the retired door and names no replacement shows no door at all.
3. `AGENT-SKILLS.md`'s skill-catalog `When` cell for `thejudge-prepare` stops
   reading as an intake route. It names the skill as callable but not an entry
   point.
4. `AGENT-SKILLS.md`'s `## Graph workflow skills` paragraph says three
   `graph-*` skills, matching its own three-row table.
5. `.claude/skills/thejudge-prepare/SKILL.md` is unchanged in behavior, stays
   callable, and stays listed in the catalog.
6. `PRD/instructions/preparation-contract.md` is unchanged, and the
   `thejudge-prepare is controlling` predicate still resolves in all six phase
   skills that read it.
7. Routing for an issue against an `active`, already-mapped-out package is
   unchanged: it goes to `thejudge-amend`, and the door does not claim that case.

## Acceptance criteria

- [x] A1 — `PRD/instructions/graph-workflow-contract.md` names `graph-run` as
      the entry point for new work, in prose a reader can find without knowing
      the history.
- [x] A2 — `grep -n "prepare -\." AGENT-SKILLS.md` returns nothing; the two
      `prepare` edges are gone from the mermaid diagram.
- [x] A3 — `grep -n "graphrun\|graph-run" AGENT-SKILLS.md` shows `graph-run`
      present in the `## Workflow sequence` diagram with both replaced edges.
- [x] A4 — the `thejudge-prepare` catalog `When` cell no longer describes an
      intake route, and the row is still present.
- [x] A5 — `grep -n "Three \`graph-\*\` skills" AGENT-SKILLS.md` matches, and
      `grep -c "Two \`graph-\*\` skills" AGENT-SKILLS.md` is 0.
- [x] A6 — `git diff --name-only` for this slice lists exactly
      `AGENT-SKILLS.md` and `PRD/instructions/graph-workflow-contract.md`:
      `thejudge-prepare/SKILL.md` and `preparation-contract.md` are untouched.
- [x] A7 — `grep -rn "thejudge-prepare is controlling" .claude/skills/` still
      returns the same six phase skills as before the slice.
- [x] A8 — read the amended diagram and the amended catalog cell aloud: a
      reader who has never seen this package can tell which skill starts new
      work and that `thejudge-prepare` is not it.

## Verification

```bash
grep -n "prepare -\." AGENT-SKILLS.md; test $? -eq 1
grep -n "graph-run" AGENT-SKILLS.md
grep -c "Two \`graph-\*\` skills" AGENT-SKILLS.md
grep -n "Three \`graph-\*\` skills" AGENT-SKILLS.md
grep -rn "thejudge-prepare is controlling" .claude/skills/ | wc -l
grep -n "entry point" PRD/instructions/graph-workflow-contract.md
git diff --name-only
```

## Files touched

- `AGENT-SKILLS.md`
- `PRD/instructions/graph-workflow-contract.md`
