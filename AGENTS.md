# Agent Notes

Product truth and workflow: start at `PRD/README.md` and `AGENT-SKILLS.md`.

## Playwright MCP Cleanup

When using Playwright MCP (`plugin-playwright-playwright` or `@playwright/mcp`):

- After finishing browser verification or interaction, call `browser_close` before ending the task.
- Do not leave browser sessions open across unrelated tasks.
- Hard process cleanup of orphaned `ms-playwright/mcp-chrome` trees is handled by user session-end hooks. Do not `pkill` mid-session unless the user asks.
