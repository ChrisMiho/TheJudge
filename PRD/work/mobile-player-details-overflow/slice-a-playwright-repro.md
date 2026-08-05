# Slice A — Playwright MCP reproduce overflow

## Status: planned

## Goal

At a phone-sized viewport, reproduce In-Depth secondary-details horizontal
overflow with the Playwright MCP plugin and record measurable evidence before
any product CSS change.

## Requirements

1. Start (or reuse) the local frontend so In-Depth Question game context is
   reachable (typically `npm run dev` / `npm run dev:frontend`).
2. Using Cursor MCP `plugin-playwright-playwright`:
   - `browser_navigate` to the app
   - `browser_resize` to approximately **390×844**
   - open **In-Depth Question** if not already there
   - expand **Players in game**
   - activate any **Show secondary details for all players** control
3. Capture at least one screenshot of the expanded state.
4. Measure and record: `document.documentElement.scrollWidth` vs
   `clientWidth`, and/or bounding boxes of expanded player cards vs viewport
   width (via `browser_evaluate` / run-code).
5. Note the most likely overflowing node(s) (e.g. fixed `w-28` inputs, flex
   row without `min-w-0`) in `PRD/work/mobile-player-details-overflow/evidence/repro.md`
   (create `evidence/` as needed). Do **not** edit product layout CSS in this slice.

## Acceptance criteria

- [ ] Playwright MCP session used (not a manual-only claim without tool use)
- [ ] Viewport ~390px wide documented in evidence
- [ ] Screenshot of expanded secondary details saved or path recorded
- [ ] Overflow confirmed with a numeric measurement (`scrollWidth > clientWidth`
      and/or card right edge past viewport)
- [ ] Suspected root-cause nodes listed for slice B
- [ ] No product CSS/layout fix committed in this slice

## Verification

```text
Playwright MCP: resize 390×844 → In-Depth → expand Players → expand secondary
details → screenshot + scrollWidth/clientWidth (or bounding-box) evidence in
PRD/work/mobile-player-details-overflow/evidence/repro.md
```

## Files touched

- `PRD/work/mobile-player-details-overflow/evidence/repro.md` (new)
- optional screenshot artifacts under `evidence/` (gitignored if binary noise;
  prefer YAML/markdown measurements when screenshots are large)

## Dependencies

- parallel-ready: DEC-128, REQ-106 (no prerequisite slice)
