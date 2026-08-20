# Slice G — Node 7 reviewer with no write tools

## Status: planned

## Goal

The `review` node dispatches a fresh-context subagent holding no write tools
that grades the slice against its own stated acceptance criteria, replacing
`superpowers:requesting-code-review` at that node.

## Requirements

REQ-155.

1. The reviewer subagent is dispatched with no `Write`, `Edit`, or
   `NotebookEdit` tools and cannot modify the work it is grading.
2. Its context never saw the build. It reads the diff, the slice doc, and the
   package artifacts — not the build node's transcript.
3. The dispatch brief names the slice's acceptance criteria as the grading
   rubric and instructs the reviewer to flag only gaps affecting correctness or
   those stated requirements.
4. A finding that is a preference, a style note, or an improvement outside the
   slice's stated requirements is not rated Critical or Important and does not
   trigger a loop back to `build`. The counter-risk being managed is a reviewer
   manufacturing findings to look useful, on a loop budget of only two.
5. `superpowers:requesting-code-review` is removed from node 7 in the contract's
   node table, `graph-run/reference.md`'s mirrored table, and `AGENT-SKILLS.md`.
6. The existing loop cap is unchanged: `review` returns to `build` at most twice,
   and a third occurrence parks at `owner-action`.
7. The reviewer is dispatched by `graph-run` and is not a `thejudge-*` skill, so
   the run-predicate rules are unchanged. The contract paragraph explaining why
   node 7 is *not* on the predicate list is rewritten for the new reviewer
   rather than deleted.

## Acceptance criteria

- [ ] `grep -rn "requesting-code-review" PRD/instructions/graph-workflow-contract.md .claude/skills/graph-run/ AGENT-SKILLS.md` returns nothing. The unrelated mentions in `CLAUDE.md` and `preparation-contract.md` are untouched — they are not node 7.
- [ ] The contract's node table and `graph-run/reference.md`'s table both name
      the no-write reviewer, and the two tables agree line for line.
- [ ] `graph-run/reference.md` records the exact dispatch shape: the tool
      exclusion, the fresh-context requirement, the rubric, and the
      not-Critical-for-preferences rule.
- [ ] The loop cap text is byte-identical to what it was before this slice —
      confirmed by a targeted `git diff` over those lines showing no change.
- [ ] **Live dispatch rehearsal.** Dispatch the reviewer against this package's
      own first completed slice and record: the tools it held, that it produced
      findings graded against the slice's criteria, and that it wrote nothing.
- [ ] `npm run skills:ai-sync` run and the mirror clean in
      `git status --porcelain`.

## Verification

```bash
grep -rn "requesting-code-review" PRD/instructions/graph-workflow-contract.md .claude/skills/graph-run/ AGENT-SKILLS.md || echo "clean"
npm run skills:ai-sync && git status --porcelain
```

## Files touched

- `PRD/instructions/graph-workflow-contract.md`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-run/reference.md`
- `AGENT-SKILLS.md`
