# workflow-reference.md

## Purpose

This file is the lean operator reference for TheJudge PRD-driven work. All 10
`thejudge-*` skills are model-invocable and may also be called explicitly —
see `AGENT-SKILLS.md` for the full catalog, platform paths, and sync
instructions.

`thejudge-prepare` is the autonomous alternate path across kickoff, refinement,
quality-check, and map-out. Orchestrated mode applies only when the controlling
agent explicitly states `thejudge-prepare is controlling`; without that
predicate, those phase skills retain their direct interactive behavior. The
full autonomous contract lives in `preparation-contract.md`.

## Handoff prefix rule

Every skill that hands off ends with a **Next step**: one sentence plus the
literal command to run next. The command prefix is `/thejudge-*` in Cursor and
Claude Code, `$thejudge-*` in Codex. Substitute `<slug>`, slice letters, or
wave numbers from the session.

## Work Folder Lifecycle

1. `ideation` — kickoff may capture `IDEA.md` and `README.md`.
2. `refined` — refinement writes `DESIGN-BRIEF.md` and approved PRD updates.
3. `active` — map-out writes `GAMEPLAN.md` and lettered slice docs.
4. Deleted — cleanup writes the durable receipt, then removes `PRD/work/<slug>/`.

During autonomous preparation, `READY` means an `active` package has passed
quality-check, independent review, and fresh verification. `BLOCKED` preserves
the furthest valid lifecycle status and records a genuine decision plus restart
prompt. These are preparation-PR states, not additional package status values.

## Preparation PR boundary

`thejudge-prepare` may create or update one docs-only preparation branch and PR.
It stops before product code and never merges or closes the PR. A merged READY
PR hands off to `$thejudge-implement-all PRD/work/<slug>/`. See
`preparation-contract.md` for authorization, publication, and recovery rules.

## Slice status vocabulary

`planned` / `in-progress` / `done` / `blocked`, as a single status line near
the top of the slice doc. If a slice already uses another format, preserve it
and change only the value.

## Work package status vocabulary

`ideation` → `refined` → `active` → deleted. Format (YAML frontmatter vs. a
bare first line) varies by package — preserve whichever a package already
uses and change only the value.

## Related material

- Slice doc template and Ship gates block: `thejudge-map-out/reference.md` and
  `thejudge-map-out-parallel/reference.md`
- Quality-check checklist: `thejudge-quality-check/SKILL.md`
- Autonomous one-package preparation: `preparation-contract.md`
- Cleanup receipt convention and terminology table: `thejudge-cleanup/SKILL.md`
- Platform paths, sync command, and the full skill catalog: `AGENT-SKILLS.md`
