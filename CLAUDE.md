# Claude Code Notes

Product truth and workflow: start at `PRD/README.md` and `AGENT-SKILLS.md`.

## Communication style

Speak in concise, direct sentences. No hedging, no padding.

When discussing anything related to this project, lead with game terms —
what a player experiences or does — before diving into technical details or
implementation decisions.

## Process skill precedence

The `thejudge-*` lifecycle owns the process layer in this repo: kickoff →
refinement → quality-check → map-out → implement → cleanup, with
`PRD/work/<slug>/` as the artifact and `PRD/sections/` as durable truth.

Superpowers' plan-authoring skills duplicate that lifecycle and are superseded
here — do not invoke `brainstorming`, `writing-plans`, `executing-plans`, or
`subagent-driven-development`, and do not write specs to
`docs/superpowers/specs/`. Use `thejudge-refinement` to shape an idea and
`thejudge-map-out` to plan slices; the design record is `DESIGN-BRIEF.md` plus
a `DEC-` entry, never a parallel spec file.

Superpowers' non-overlapping skills still apply: `systematic-debugging`,
`test-driven-development`, `verification-before-completion`,
`using-git-worktrees`, `requesting-code-review`, `receiving-code-review`.

## Playwright MCP Cleanup

When using Playwright MCP (`plugin-playwright-playwright` or `@playwright/mcp`):

- After finishing browser verification or interaction, call `browser_close` before ending the task.
- Do not leave browser sessions open across unrelated tasks.
- Hard process cleanup of orphaned `ms-playwright/mcp-chrome` trees is handled by user session-end hooks. Do not `pkill` mid-session unless the user asks.
- When working inside an active `PRD/work/<slug>/` package, output screenshot captures under `PRD/work/<slug>/.playwright-mcp/` in the current checkout (create the subfolder if absent) — never the repo root or a bare top-level `.tmp/`.
- With no active work-package folder, use the existing root-level `.tmp/` or `.playwright-mcp/` ignored folders instead — never the bare repo root.
- Full contract: `PRD/instructions/runtime-process-hygiene.md`.
