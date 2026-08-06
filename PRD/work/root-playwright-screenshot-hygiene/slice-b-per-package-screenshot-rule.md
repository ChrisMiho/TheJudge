# Slice B — Add per-package screenshot-location rule

## Status: done

## Goal

Tell future agent sessions where Playwright/browser-automation screenshot captures should land so root-level clutter (Slice A's cleanup) doesn't recur.

## Requirements

1. In `CLAUDE.md`, extend the existing "Playwright MCP Cleanup" section (do not create a new section) with a concise, self-sufficient rule: when capturing screenshots while working inside an active `PRD/work/<slug>/` package, output them under `PRD/work/<slug>/.playwright-mcp/` in the current checkout (create the subfolder if absent), not the repo root or a bare top-level `.tmp/`.
2. Add the fallback rule: for ad-hoc verification with no active work-package folder, use the existing root-level `.tmp/` or `.playwright-mcp/` ignored folders — never the bare repo root.
3. Add a link line pointing at `PRD/instructions/runtime-process-hygiene.md` for the full contract — that doc is the canonical authority for capture location, and `agent-workflow-alignment` Slice F creates it. Keep requirements 1–2 stated inline and self-sufficient rather than replaced by the link, so this rule is actionable whether or not Slice F has landed yet; a link to a not-yet-existing path is acceptable and resolves when that slice ships. Do not restate the full contract (worktree-relative resolution for autonomous runs, the recorded capture-path evidence field, disposal semantics) — that belongs to the authority doc.
4. Mirror the same addition into `.cursor/rules/playwright-mcp-cleanup.mdc`, keeping the shared guidance content-equivalent between the two files (consistent with how the existing browser-cleanup bullets are already mirrored).
5. Do not edit `AGENTS.md` — `agent-workflow-alignment` Slice F rewrites its Playwright section into this same concise-rule-plus-link shape. Editing it here would collide with that slice.
6. Do not modify `.gitignore` — `.playwright-mcp/` and `.tmp/` are already unanchored patterns that match at any depth, including under `PRD/work/<slug>/`.
7. Do not add CI/lint/pre-commit enforcement — this is a documented convention only, per the design brief's non-goals.

## Acceptance criteria

- [ ] `CLAUDE.md`'s "Playwright MCP Cleanup" section states the `PRD/work/<slug>/.playwright-mcp/` destination and the root `.tmp/`/`.playwright-mcp/` fallback
- [ ] Both files link to `PRD/instructions/runtime-process-hygiene.md` for the full contract, and both remain actionable without it
- [ ] `.cursor/rules/playwright-mcp-cleanup.mdc` contains the same guidance, content-equivalent to `CLAUDE.md`
- [ ] `AGENTS.md` is untouched by this slice (owned by `agent-workflow-alignment` Slice F)
- [ ] `.gitignore` is unchanged (`git diff .gitignore` empty)
- [ ] No new files created outside the two edited docs

## Verification

```bash
git diff CLAUDE.md .cursor/rules/playwright-mcp-cleanup.mdc
git diff --stat .gitignore AGENTS.md
grep -n "runtime-process-hygiene.md" CLAUDE.md .cursor/rules/playwright-mcp-cleanup.mdc
```

Manual check: read both updated files side by side and confirm the new rule text conveys the same destination/fallback guidance in each.

## Files touched

- `CLAUDE.md`
- `.cursor/rules/playwright-mcp-cleanup.mdc`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas (N/A — docs-only, no test/lint impact expected; confirm no unexpected failures if run)
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
