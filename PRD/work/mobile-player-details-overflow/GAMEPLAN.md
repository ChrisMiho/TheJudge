# GAMEPLAN — mobile-player-details-overflow

Source: `DESIGN-BRIEF.md`, DEC-128 / REQ-106 (`PRD/sections/decisions/ui-presentation.md`, `PRD/sections/functional-requirements.md`).

## Architecture

Narrow frontend presentation fix on In-Depth Question's game-context roster when
secondary details expand on phone widths. Three sequential slices:

1. **Reproduce with Playwright MCP** — prove horizontal overflow at ~390×844 and
   record which nodes overflow (do not change product CSS yet).
2. **Fix** — mobile-first Tailwind/CSS containment in the roster extras path.
3. **Verify with Playwright MCP** — same path as slice A; confirm no document
   horizontal overflow; spot-check `sm+`; run quality checks.

Playwright means Cursor MCP server `plugin-playwright-playwright`
(`browser_navigate`, `browser_resize`, `browser_click`, `browser_snapshot`,
`browser_take_screenshot`, `browser_evaluate` / run-code for
`scrollWidth`/`clientWidth` and bounding boxes). Do **not** add `@playwright/test`.

## Data flow

Unchanged. Disclosure state and `gameContext.players` values follow DEC-120;
only layout classes/structure for containment change.

## Non-goals (do not implement)

- Desktop roster redesign beyond incidental shared safety
- Life Tracker, chat shell, portal chrome
- Disclosure semantics, player-count bounds, data/API/prompt changes
- CI Playwright harness

## Verification checklist (full package)

```bash
npm run quality:check
```

- Playwright MCP at ~390×844: In-Depth → expand Players → expand secondary
  details → `document.documentElement.scrollWidth <= document.documentElement.clientWidth`
  and expanded cards fully on-screen in screenshots.
- Spot-check ≥768px / `sm+`: poison/energy/experience still read as a
  three-column row (or intentional shared wrap documented in the slice note).
- Existing `PlayerRosterEditor` / interaction-flow Vitest suites still pass.

## Slices

| Slice | Objective | Depends on | Files |
| --- | --- | --- | --- |
| A | Reproduce overflow with Playwright MCP; record evidence | none | evidence notes under this package (e.g. `evidence/`); no product CSS yet |
| B | Fix mobile containment in roster / extras layout | A (root cause confirmed) | `portal/MtgAssistantApp.tsx`, `PlayerRosterEditor.tsx`, optional `index.css`; tests only if a stable assertion fits |
| C | Re-verify with Playwright MCP; quality gate; ship readiness for cleanup | B | same as B if follow-up tweaks; package README / slice status |

Final slice: C. Carries the Ship gates block and PRD promotion checklist.
