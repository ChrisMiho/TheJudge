# Slice G — Node 7 reviewer with no write tools

## Status: done

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

- [x] `grep -rn "requesting-code-review" PRD/instructions/graph-workflow-contract.md .claude/skills/graph-run/ AGENT-SKILLS.md` returns nothing. The unrelated mentions in `CLAUDE.md` and `preparation-contract.md` are untouched — they are not node 7.
- [x] The contract's node table and `graph-run/reference.md`'s table both name
      the no-write reviewer, and the two tables agree line for line.
- [x] `graph-run/reference.md` records the exact dispatch shape: the tool
      exclusion, the fresh-context requirement, the rubric, and the
      not-Critical-for-preferences rule.
- [x] The loop cap text is byte-identical to what it was before this slice —
      confirmed by a targeted `git diff` over those lines showing no change.
- [x] **Live dispatch rehearsal.** Dispatch the reviewer against this package's
      own first completed slice and record: the tools it held, that it produced
      findings graded against the slice's criteria, and that it wrote nothing.
- [x] `npm run skills:ai-sync` run and the mirror clean in
      `git status --porcelain`.

## Verification

```bash
grep -rn "requesting-code-review" PRD/instructions/graph-workflow-contract.md .claude/skills/graph-run/ AGENT-SKILLS.md || echo "clean"
npm run skills:ai-sync && git status --porcelain
```

## Verification record

### Text checks

- `grep -rn "requesting-code-review" PRD/instructions/graph-workflow-contract.md .claude/skills/graph-run/ AGENT-SKILLS.md` — clean.
- `CLAUDE.md` and `PRD/instructions/preparation-contract.md` still mention it, untouched. Those are not node 7.
- Node 7 reads `no-write reviewer subagent` in both tables, and the two agree
  line for line on `#`, node, delegate, model, and cap. (The delegate column
  carries a pre-existing `/`-prefixed slash-command form in `reference.md`; the
  comparison normalizes that prefix, which predates this slice.)
- Loop-cap text byte-identical against `HEAD`, for both the `review → build`
  cap and the `gate-qc → define` cap.
- `npm run skills:ai-sync` run; the mirror is the sync output, with no drift on
  a re-run.

### Live dispatch rehearsal

A read-only subagent was dispatched against slice A's commit and slice doc, with
the slice's own acceptance criteria quoted as the rubric.

**Tools it held**, verbatim from its report:

> Directly callable: `Bash`, `ListAgents`, `Read`, `ReportFindings`, `Skill`, `ToolSearch`.
> No file-write tool (`Write`/`Edit`) is in my set — this was a read-only review.

Read-only in the sense that matters: no `Write`, `Edit`, or `NotebookEdit`. It
did hold and use `Bash`, running the classifier and the suite live — which is
what let it find the defects below rather than only reading for them.

**It graded all seven criteria** as met, two with caveats, and produced four
findings — one Important, three Low. Nothing in the repository changed: same
HEAD, identical working-tree diff before and after, empty staged diff, no new
untracked files.

### The rehearsal earned its keep — four real defects, fixed here

The reviewer found genuine correctness bugs in slices A and B. They are fixed in
this commit, with a regression test each.

1. **`&` inside a redirection read as a background launch.** `npm run build 2>&1`
   split into `npm run build 2>` and `1`, and set `backgrounded`. Under a live
   lock, slice C's rule denied it. `2>&1` appears in almost every command, so
   this would have blocked ordinary work at the first run. Now `&` is literal
   when it follows `>` or precedes `>`.
2. **The secrets rule denied discussion, not just access.** Any token *containing*
   `.secrets/` was denied, so `grep -rn '\.secrets/' scripts/` was blocked —
   including slice A's own verification command, which was therefore unrunnable
   as written. Matching is now anchored to path shape, and the pattern operand of
   `grep`/`rg`/`sed`/`awk` is excluded. Slice A's command runs.
3. **Git's global options hid the subcommand.** `git -C /elsewhere push --force`
   was allowed, because the rules keyed on `argv[1] === "push"`. A
   `gitSubcommand()` helper now strips global options first.
4. **The direct-invocation check compared a raw `file://` template against a
   percent-encoded `import.meta.url`.** A repository path containing a space
   would fail the match, and the hook would load without running — failing open,
   silently. Now `pathToFileURL`.

Finding 1 is the one that matters most, and it is exactly what an independent
reviewer is for: it is invisible from inside the work, and its symptom would have
appeared as "the boundary system is unusable" on the first real run.

### Stated limits carried forward

- The reviewer's independence is structural — no write tools, fresh context —
  but it is still a language model grading against a rubric. It can miss things,
  and it can be wrong. Two of its four findings needed checking before they were
  accepted as real.
- It held `Bash`. That is deliberate, since executing the code is how it found
  three of the four defects, but it means "no write tools" is not the same as
  "cannot affect the machine".
- The not-Critical-for-preferences rule is instruction, not mechanism. Nothing
  enforces the severity discipline except the brief.

## Files touched

- `PRD/instructions/graph-workflow-contract.md`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-run/reference.md`
- `AGENT-SKILLS.md`
