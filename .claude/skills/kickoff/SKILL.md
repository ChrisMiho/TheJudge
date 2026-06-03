---
name: kickoff
description: >-
  Loads minimal onboarding context for TheJudge by reading root README.md and
  PRD/README.md. Use when starting a new agent session, when the user asks for
  project context, or when they attach this skill at the beginning of work.
disable-model-invocation: true
---

# Kickoff

## Goal

Give the agent enough orientation to work without pre-loading the full PRD corpus.
The user should get a short confirmation that context is loaded and the agent is ready for the next task.

## Required reads (every invocation)

Read only these two files from the workspace root, in order:

1. `README.md` — setup, stack, repo layout, quality gates, implementation status
2. `PRD/README.md` — doc control plane, source-of-truth precedence, navigation tables

Do not read other PRD files during kickoff unless the user explicitly provides paths in the same message.

## Optional reads (separate from kickoff)

`PRD/instructions/` may be loaded on its own when the user asks for process or generation rules (for example `agent-working-rules.md`, `technical-design-rules.md`). Do not pull instruction files into kickoff automatically.

All other PRD content (`sections/`, `gameplan/`, `stories/`, `features/`, `archive/`, etc.) is **user-provided only** during kickoff. Wait for the user to name files or paste paths before reading them.

## After reading

Internalize:

- What TheJudge is and the current product phase
- Where product truth lives (`PRD/sections/`, especially `decisions.md` when needed later)
- Monorepo layout and baseline commands from root README
- That you have not yet loaded task-specific requirements

## Response format

Reply with a **short paragraph** (2–3 sentences), not a bullet dump. Cover:

1. Product in one phrase (flow-validation MTG stack assistant)
2. Current phase / baseline (from README + PRD/README)
3. That doc source of truth is `PRD/sections/` via `PRD/README.md`, and you are ready for the user's next task

End by inviting the next task. If the user already named a task, ask only for any missing file paths you still need (do not guess which section files to open).

### Example response

> I've read the root README and PRD control plane. TheJudge is a flow-validation assistant for MTG stack questions; MVP1 is closed and product truth lives in `PRD/sections/` (decisions override older wording). I haven't loaded task-specific section files yet—share paths or your task and I'll pull the right docs. Ready for your next instruction.

## Do not

- Summarize entire section files or gameplan during kickoff
- Read `PRD/archive/` unless the user explicitly asks
- Invent scope from memory; defer to files the user provides
- Run a long briefing unless the user asks for one

## Additional reference

For PRD navigation tables without re-opening `PRD/README.md`, see [reference.md](reference.md).
