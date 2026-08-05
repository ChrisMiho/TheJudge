# Slice B — Mobile containment layout fix

## Status: planned

## Goal

Fix narrow-viewport horizontal overflow for expanded In-Depth secondary player
details using mobile-first fluid CSS, guided by slice A evidence.

## Requirements

1. Apply containment in the In-Depth roster extras path based on slice A
   findings — primary candidates:
   - `apps/frontend/src/components/portal/MtgAssistantApp.tsx` (`renderPlayerExtras`)
   - `apps/frontend/src/components/PlayerRosterEditor.tsx` (card chrome / flex row)
   - `apps/frontend/src/index.css` only if a shared utility is clearly needed
2. Prefer `min-w-0`, wrapping grids, and fluid input widths under the `sm`
   breakpoint over clipping the page with `overflow-x-hidden` on the shell.
3. Keep DEC-120 disclosure behavior and all player values unchanged.
4. Do not deliberately redesign `sm+` composition; incidental shared safety is OK.
5. Extend Vitest only if a stable, non-flaky class/structure assertion fits
   existing `PlayerRosterEditor` tests — Playwright MCP (slice C) remains the
   primary overflow proof.

## Acceptance criteria

- [ ] Layout change addresses the overflowing nodes identified in slice A
- [ ] No change to secondary-details sync, defaults, resets, or `gameContext` shape
- [ ] No Life Tracker / chat-shell edits
- [ ] No `@playwright/test` package added
- [ ] Frontend typecheck/tests for touched files pass

## Verification

```bash
npm --workspace apps/frontend run test -- --runPlayerRosterEditor
npm run typecheck
```

(Adjust test filter to the project's Vitest file/path convention if the above
filter is unsupported; run the relevant `PlayerRosterEditor` / interaction tests.)

## Files touched

- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/PlayerRosterEditor.tsx`
- optional: `apps/frontend/src/index.css`, `PlayerRosterEditor.test.tsx`,
  `App.interaction-flows.test.tsx`

## Dependencies

- sequential: slice A — root cause and overflow evidence must exist before
  locking the CSS fix
