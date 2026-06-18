---
name: thejudge-implement
description: >-
  Implements an existing TheJudge work-package slice from PRD/work/<slug>/ using
  GAMEPLAN.md and lettered slice docs. Use after map-out, or when the work folder
  already has a GAMEPLAN and slices and the user wants to kick off work without
  regenerating planning docs.
disable-model-invocation: true
---

# TheJudge Implement

## Goal

Execute one existing implementation slice from `PRD/work/<slug>/` end to end.

## Inputs

User provides a work slug or `PRD/work/<slug>/`.

Optional: user provides a specific slice letter or slice doc path. If omitted, choose the first slice whose status is not `done`, ordered alphabetically by slice letter.

## Required reads

1. `PRD/work/<slug>/README.md`
2. `PRD/work/<slug>/GAMEPLAN.md`
3. Selected `PRD/work/<slug>/slice-*.md`
4. Files listed in the selected slice's `Files touched` / implementation map
5. Relevant existing tests and local code patterns

Read other PRD files only when the selected slice references them or the code change needs a decision check.

## Process

1. Identify the selected slice and confirm its dependencies are done or satisfied.
2. Summarize the slice objective and verification commands in a short update.
3. Mark the selected slice `Status: in-progress` before code edits.
4. Implement only the selected slice's scope.
5. Add or update focused tests for the slice.
6. Run the slice verification commands.
7. If verification passes, mark the slice `Status: done`.
8. Update `PRD/work/<slug>/README.md` slice table/status notes when present.
9. Report changed files, verification results, and the next slice.

If verification fails, keep the slice `Status: in-progress` or mark `Status: blocked` only when the blocker cannot be resolved in-session. Report the failing command and concrete blocker.

## Implementation rules

- Follow `GAMEPLAN.md` and the selected slice doc; do not regenerate them.
- Keep edits limited to the selected slice unless a dependency forces a small supporting change.
- Preserve active product decisions and `PRD/instructions/technical-design-rules.md`.
- Preserve stack ordering semantics across UI, API, prompt, and tests.
- Do not change API request/response shapes unless the slice cites a confirmed decision requiring it.
- Do not add product-facing endpoints unless the slice cites a confirmed decision requiring it.
- Do not implement deterministic rules-engine, legality validation, or board-state simulation behavior.
- Any Scryfall download or network refresh requires explicit human approval before running.
- Do not commit changes unless the user explicitly asks for a commit.

## Status conventions

Slice docs should use one of:

- `planned`
- `in-progress`
- `done`
- `blocked`

Prefer a single status line near the top of each slice:

```markdown
## Status: in-progress
```

If a slice uses another existing status format, preserve the local format and update only the status value.

## Do not

- Run `thejudge-map-out`
- Rewrite `GAMEPLAN.md` or slice docs except for status/progress notes
- Start multiple slices in one session unless the user explicitly asks
- Run cleanup or delete `PRD/work/<slug>/`
- Promote durable PRD truth; leave that for `thejudge-cleanup`

## Handoff

When the selected slice is done, end with **Next step** — all three platforms, in order: Cursor, Codex, Claude Code. Substitute `<slug>` and slice letters from this session. Templates: `PRD/instructions/workflow-reference.md` (Handoff blocks).

- More slices remain → next skill: `thejudge-implement` with next slice letter (or `next slice` for Claude)
- All slices done → next skill: `thejudge-cleanup`
