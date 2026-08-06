# Design brief — root Playwright screenshot hygiene

## Status

Approved on 2026-08-05.

## Summary

Delete the ad-hoc PNG screenshots that have accumulated in the repo root from prior Playwright/browser-automation verification (33 as of the latest re-check), and add an agent-facing rule so future captures never land there again. The rule directs future screenshot output into the active work package's own folder (`PRD/work/<slug>/.playwright-mcp/`), which is already gitignored and gets removed automatically when `thejudge-cleanup` deletes the package folder — so disposable evidence cleans itself up with no separate maintenance policy.

This is repository/agent-tooling hygiene only. It does not change TheJudge product behavior, UI, API, or any committed test fixture.

## Problem and evidence

- 33 untracked `*.png` files sit in the repo root (`before-390.png`, `g-roster-1440.png`, `sliceD-mobile-maxgrow.png`, etc.) — verified via `git ls-files -- '*.png'` (none of the 33 are tracked) and `git status --porcelain --ignored=matching -- '*.png'` (all 33 show as `!!`, i.e. already gitignored by the `/*.png` root rule added in `.gitignore`).
- `grep -rl` for every filename across the repo (excluding `node_modules`/`.git`) returns zero matches — none are referenced by docs, tests, CI config, or committed fixtures. `apps/frontend/public/assets/cats-homescreen.png` and the two committed detector fixtures under `apps/frontend/src/lib/scan/__fixtures__/` are the only tracked PNGs in the repo and are unrelated to this cleanup.
- `.gitignore` already anticipated the problem (`# Ad-hoc debugging screenshots dropped in repo root (should live under .tmp/ instead)` / `/*.png`), but no rule currently tells agents where captures should actually go, so they keep landing in root as clutter that must be periodically deleted by hand.
- `CLAUDE.md`'s existing "Playwright MCP Cleanup" section (mirrored in `.cursor/rules/playwright-mcp-cleanup.mdc`) covers closing browser sessions but says nothing about screenshot output location.

## Approved design

### 1. Delete the accumulated root PNGs

Delete all 33 untracked root-level `*.png` files confirmed unreferenced above. This is a plain filesystem delete (they are untracked and gitignored, so `git status` shows no diff from removing them).

### 2. Per-package disposable screenshot location

Add a rule (root `CLAUDE.md`, mirrored into `.cursor/rules/playwright-mcp-cleanup.mdc` alongside the existing browser-cleanup guidance) stating: when a skill or session captures Playwright/browser screenshots while working inside an active `PRD/work/<slug>/` package, output them under `PRD/work/<slug>/.playwright-mcp/` (create the subfolder if absent) rather than the repo root or a bare top-level `.tmp/`.

This path is already covered by the existing `.gitignore` entries `.playwright-mcp/` and `.tmp/` — both patterns are unanchored (no leading `/`) and therefore already match at any depth, including inside `PRD/work/<slug>/`. No `.gitignore` change is required.

Because `thejudge-cleanup` deletes the entire `PRD/work/<slug>/` folder on package close, any screenshots captured under it are removed automatically with no separate retention or maintenance policy — satisfying the non-goal of not building a long-lived screenshot archive.

### 3. Fallback for captures outside an active package

For ad-hoc verification with no active work-package folder (e.g. a quick one-off check outside the refinement→cleanup lifecycle), the rule keeps the existing repo-root `.tmp/`/`.playwright-mcp/` root-level ignored folders as the fallback destination — never the bare repo root.

## Error handling

Not applicable — this is a static documentation/hygiene rule with no runtime behavior, error paths, or new code.

## Verification strategy

- Confirm `git status --porcelain` (unfiltered) shows no changes after deleting the 33 PNGs (they were untracked/ignored, so nothing to diff).
- Re-run the reference/fixture grep sweep after deletion to confirm nothing broke (expected: no references existed before deletion either).
- Confirm updated `CLAUDE.md` and `.cursor/rules/playwright-mcp-cleanup.mdc` stay content-equivalent for the shared guidance, consistent with how that section is already mirrored today.
- No test suite or `quality:check` impact expected; this is docs/hygiene only.

## Scope

- Delete the 33 confirmed-unreferenced root `*.png` files.
- Add the per-package screenshot-location rule to `CLAUDE.md` and `.cursor/rules/playwright-mcp-cleanup.mdc`.

## Non-goals

- Changing product UI, API, or any committed test fixture.
- Building a long-lived screenshot archive or retention policy.
- Adding CI/lint/pre-commit enforcement against stray root PNGs (the existing `.gitignore` `/*.png` rule plus this documented convention is sufficient; enforcement tooling was explicitly declined).
- Changing `.gitignore` (existing `.playwright-mcp/` / `.tmp/` patterns already cover the new per-package path).
- Any change to `thejudge-cleanup`'s deletion mechanics — it already deletes the whole package folder, which is what makes the per-package location self-cleaning.

## PRD alignment

- No new `REQ`, `FLOW`, `DEC`, or screen-layout entry is needed: this is agent-process/tooling convention, not product truth (per `PRD/README.md`'s "product truth in `sections/`; agent process in `instructions/`" split), and it lives in root `CLAUDE.md` / `.cursor/rules/`, not `PRD/sections/`.

## Material assumptions

- None beyond what's verified above — the "no references, all untracked/ignored" evidence is a direct command-output check, not an inference.
