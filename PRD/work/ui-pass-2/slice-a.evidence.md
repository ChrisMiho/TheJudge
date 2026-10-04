# Slice A evidence (manual criteria)

Isolated dev server on port 5391 from the implement-ui-pass-2 worktree; mockup served on 5392. Captures in `.playwright-mcp/`.

- 2026-10-04 A5 — desktop 1440x900, Side A tier 5 and Side B tier 2 (price route mocked at $100 / $30): rimmed coin stacks, rounded mounds, two-tone faceted gem and goblet render, flat-shaded and bronze-edged, one gem on tier 5. Compared with the direction-1 `trade-balancer.html` capture; the drawing matches. Captures: `a-desktop-piles-t5-t2.png`, `a-desktop-pile-closeup.png`, `a-desktop-mockup-piles-closeup.png`, `a-desktop-mockup-reference.png`.
- 2026-10-04 A6 — phone 390x844: pile box stays 132x73, art fills it with no clipping, and the svg carries `trade-pile-tier-up` after the tier change (drop-in class intact). Capture: `a-phone-piles.png`.
- 2026-10-04 A7 — Playwright browser closed, vite (5391) and mockup http.server (5392) stopped, `lsof` shows both ports free; captures under `PRD/work/ui-pass-2/.playwright-mcp/`.
