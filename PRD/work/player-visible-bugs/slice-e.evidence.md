# Slice E evidence

Dated 2026-10-19. Vite dev server on port 5473 (frontend only), viewport 390x844
unless noted. Captures live in `PRD/work/player-visible-bugs/.playwright-mcp/`
(gitignored, so they stay in the build worktree).

## Measurements (element height in px)

| Element | Before | After |
| --- | --- | --- |
| In-Depth zone tabs (Cards station) | 40 | 44 |
| In-Depth Reorder buttons (card actions sheet) | 40 | 44 |
| Life Tracker Counters / Commander damage tabs | 42 | 42 |
| Life Tracker Game Setup Layout and Card style buttons | 42 | 42 |

Copies buttons share the base `.seg button` rule with Reorder, so they follow
it; they were not opened separately in the browser.

## Captures

- indepth-cards-390-before.png, indepth-cards-390-after.png
- indepth-reorder-390-before.png, indepth-reorder-390-after.png
- lt-counters-390-before.png, lt-counters-390-after.png
- lt-counters-1440-before.png, lt-counters-1440-after.png (1440x900)
- lt-setup-390-before.png, lt-setup-390-after.png
- lt-setup-1440-before.png, lt-setup-1440-after.png (1440x900)

## Cleanup

Browser closed with `browser_close`. Dev server PID 52556 stopped with `kill`;
`lsof -iTCP:5473 -sTCP:LISTEN` then returned no rows (port released).
