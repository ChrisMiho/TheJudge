# TheJudge preparation Git and PR reference

## Isolated preflight

1. Inspect the launch checkout with read-only Git commands, then resolve the
   required `--base` argument (or a compatible supplied branch/PR's base) and
   fetch the latest `origin/<recorded base>`. If the base is unresolved, stop
   with an external-blocker-shaped report naming the missing base — never fall
   back to `main`. If request-relevant uncommitted inputs are not on that base,
   stop with an external-blocker report; never copy, stash, or commit them.
2. If a PR or branch is supplied, inspect its repository, base, head, changed
   files, work-folder slug, and marker before adopting it. Adopt only when it
   targets the recorded autonomous base, owns the same single work package,
   contains no product-code/test changes, and has no incompatible commits.
3. Otherwise create an isolated worktree at `.worktrees/prepare-<slug>`, based
   on the fetched recorded autonomous base, and use shared branch
   `thejudge-prep/<slug>`. A supplied compatible branch keeps its existing name.

## Registration and race rules

Use this exact stable hidden marker in the PR body:

```text
<!-- thejudge-prepare:slug=<slug> -->
```

Before creating a PR, search open and draft PR bodies for that marker and join
the matching PR instead of creating a duplicate. Before every push, fetch the
remote branch and verify it still matches the last inspected tip. Push without
force. On a non-fast-forward race, fetch, inspect the incoming docs-only commits,
rebase the local preparation commits onto the remote tip, re-run preparation
verification, and retry once. If ownership, scope, or history is incompatible,
stop with an external-blocker report; never force-push.

## READY publication

Title exactly:

```text
[THEJUDGE-PREP][READY] <work name> (<slug>)
```

Publish as non-draft with this body shape:

```markdown
<!-- thejudge-prepare:slug=<slug> -->

## Original request
<verbatim request>

## Selected finding and evidence
<finding, file-level evidence, and why it outranks viable alternatives>

## Material assumptions
<assumption → authoritative evidence, or None>

## PRD alignment
<REQ/FLOW/DEC references and durable PRD changes, or no durable changes>

## Work-package artifacts
<IDEA, README, DESIGN-BRIEF, GAMEPLAN, and slice summary>

## Planned slices and verification
<slice list and exact commands/checks>

## Preparation checks
<fresh verification evidence and independent-review disposition>

## Recorded base
origin/<branch>

## Post-merge command
`$thejudge-implement-all PRD/work/<slug>/`
```

## BLOCKED publication

Title exactly:

```text
[THEJUDGE-PREP][BLOCKED] <work name> (<slug>)
```

Publish as draft with this body shape:

```markdown
<!-- thejudge-prepare:slug=<slug> -->

## Original request
<verbatim request>

## Selected finding and evidence
<finding, file-level evidence, and why it outranks viable alternatives>

## Material assumptions
<assumption → authoritative evidence, or None>

## PRD alignment
<REQ/FLOW/DEC references and durable PRD changes, if any>

## Work-package artifacts
<valid artifacts and furthest completed phase>

## Planned slices and verification
<available plan/checks, or intentionally omitted because blocked>

## Preparation checks
<fresh verification evidence and independent-review result if reached>

## Recorded base
origin/<branch>

## Blocker
- Question: <unresolved question>
- Question ID: <question-id>
- Why PRD/code cannot answer: <evidence>
- Plausible outcomes: <materially different outcomes>
- Furthest valid phase: <phase>
- Omitted as invalid: <downstream artifacts>

## Restart prompt
Use $thejudge-prepare to resume PRD/work/<slug>/ after resolving <question-id>: <answer>. Re-run refinement, quality-check, map-out, independent review, and preparation verification before updating the PR.
```

The restart prompt is exact:

```text
Use $thejudge-prepare to resume PRD/work/<slug>/ after resolving <question-id>: <answer>. Re-run refinement, quality-check, map-out, independent review, and preparation verification before updating the PR.
```

## External-blocker recovery report

Report all fields:

```markdown
## External publication blocker
- Failed operation: <exact operation>
- Error: <exact relevant output>
- Preserved locally: <worktree, branch, commit, artifacts>
- Confirmed remote state: <what exists>
- Not completed: <push or PR operation that does not exist>
- Recovery action: <exact command or human action, then verification to rerun>
```

Never merge, close, force-push, stash, destructively clean up, or edit product
code/tests while recovering.
