# Agent Notes

Product truth and workflow: start at `PRD/README.md` and `AGENT-SKILLS.md`.

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

## Codex Git and GitHub CLI

Codex runs agent commands inside a sandbox that can protect `.git`, network
access, and macOS keychain credentials even when the repository is trusted.

- If a Git command that mutates `.git`, or a `gh` command, fails with a
  sandbox, permission, DNS, network, or credential-access error, retry the
  exact command with scoped escalation and a concise justification.
- Prefer narrow reusable command-prefix approvals when the same operation will
  recur. Do not request blanket shell or unrestricted command approval.
- Do not treat `gh auth status` inside the sandbox as proof that the stored
  token is invalid. Verify with the same read-only command under scoped
  escalation before suggesting reauthentication or changing credentials.
- Never print, copy, or expose GitHub tokens while diagnosing authentication.

## Playwright MCP Cleanup

When using Playwright MCP (`plugin-playwright-playwright` or `@playwright/mcp`):

- After finishing browser verification or interaction, call `browser_close` before ending the task.
- Do not leave browser sessions open across unrelated tasks.
- Hard process cleanup of orphaned `ms-playwright/mcp-chrome` trees is handled by user session-end hooks. Do not `pkill` mid-session unless the user asks.
