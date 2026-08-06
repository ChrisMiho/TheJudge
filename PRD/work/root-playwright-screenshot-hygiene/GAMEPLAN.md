# GAMEPLAN — root-playwright-screenshot-hygiene

## Architecture

No product code changes. Two independent actions:

1. Filesystem cleanup: delete the 33 confirmed-unreferenced, untracked, gitignored root-level `*.png` files.
2. Documentation: add a screenshot-output-location rule to `CLAUDE.md`'s existing "Playwright MCP Cleanup" section, mirrored into `.cursor/rules/playwright-mcp-cleanup.mdc`, directing future captures to `PRD/work/<slug>/.playwright-mcp/` (or the existing root `.tmp/`/`.playwright-mcp/` fallback when no package is active) instead of the repo root.

## Data flow

None — no runtime code path is touched. This is a one-time cleanup plus a static convention for future agent sessions.

## Slices

| Slice | Objective | Depends on | Files touched |
| --- | --- | --- | --- |
| A | Delete the 33 unreferenced root PNGs | none | 33 root `*.png` files (delete only) |
| B | Add per-package screenshot-location rule | none | `CLAUDE.md`, `.cursor/rules/playwright-mcp-cleanup.mdc` |

Both slices are independent (disjoint files) and parallel-ready.

## Verification checklist

- [ ] `git status --porcelain` (unfiltered) shows no diff from the PNG deletion (files were untracked/ignored)
- [ ] `git ls-files -- '*.png'` still shows only the 5 pre-existing tracked PNGs (unchanged)
- [ ] `grep -rl <deleted-filename>` sweep across the repo (excluding `node_modules`/`.git`) confirms no references existed before or after deletion
- [ ] `CLAUDE.md` and `.cursor/rules/playwright-mcp-cleanup.mdc` stay content-equivalent for the shared Playwright guidance
- [ ] No `npm run quality:check` impact (docs/hygiene only — not run as part of this package, per design brief)

## Notes

- This package produces no `REQ`/`FLOW`/`DEC` — per the design brief's PRD alignment section, this is agent-process/tooling convention, not product truth, so cleanup's promotion step has nothing to move into `sections/`. The canonical capture contract is recorded by `agent-workflow-alignment` under `DEC-154` instead.
- Cross-package: `agent-workflow-alignment` Slice F owns `PRD/instructions/runtime-process-hygiene.md` (the authority), `AGENTS.md`, and the `thejudge-*` skill wiring. This package owns only `CLAUDE.md` and `.cursor/rules/playwright-mcp-cleanup.mdc`. File sets are disjoint, so the two packages can land in either order; Slice B's rule text is self-sufficient and its forward link resolves once Slice F ships.
