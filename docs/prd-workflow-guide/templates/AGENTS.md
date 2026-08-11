# Agent Notes

<!-- Copy to your repo root as AGENTS.md. Duplicate as CLAUDE.md if you use
     Claude Code, and as any other runtime's root convention. Keep it short —
     this file is loaded every session and competes with the actual task for
     attention. -->

Product truth and workflow: start at `PRD/README.md` and `AGENT-SKILLS.md`.

## Process skill precedence

The `proj-*` lifecycle owns the process layer in this repo: kickoff →
refinement → quality-check → map-out → implement → cleanup, with
`PRD/work/<slug>/` as the artifact and `PRD/sections/` as durable truth.

Any plan-authoring skill from another library that duplicates this lifecycle is
superseded here. Do not write specifications to a parallel directory. The design
record is `DESIGN-BRIEF.md` plus a `DEC-` entry, never a separate spec file.

Non-overlapping skills from other libraries still apply — systematic debugging,
test-driven development, verification before completion, git worktrees, code
review.

<!-- This section is not hypothetical. Agent runtimes and plugin libraries ship
     their own planning conventions, and without an explicit statement of
     precedence an agent will sometimes write a spec into a directory nobody
     reads. Name what is superseded and what still applies. -->

## Working rules

- Read `PRD/sections/decisions.md` before making product decisions.
- Ambiguity becomes a `Q-###` in `PRD/sections/open-questions.md`, never a guess.
- IDs are never renumbered or reused.
- Ephemeral planning lives only in `PRD/work/<slug>/` and is deleted when the
  work ships.
- Secrets: `PRD/instructions/secrets-handling.md`. Never commit credential
  material.

<!-- Add a runtime-hygiene section here if agents drive browsers or dev
     servers, pointing at PRD/instructions/runtime-process-hygiene.md. -->
