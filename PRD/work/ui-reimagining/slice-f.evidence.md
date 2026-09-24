# Slice F — evidence log

2026-09-24 F2 — in a live Chromium tab at 390x844: typed "Test typed text"
into Side A's search field, then clicked the Side B tab. Side A's panel is
hidden via CSS (`display: none` through `[data-active]`), never unmounted
or re-rendered, so `document.getElementById('search-a').value` still read
"Test typed text" after switching away and — re-checked at 1440x900 —
after crossing the desktop breakpoint too. The page URL and title were
unchanged throughout (no reload).

2026-09-24 F3 — measured at 1440x900: both `.side-panel` elements render
with `display: block` inside a two-column `.sides-wrap` grid, the
`.tab-control` is hidden (`display: none` under the `768px`+ media query),
and the totals bar, both side lists, and both side totals all render
exactly as at mobile width, just paired — matching today's shipped
side-by-side composition. The phone tab treatment (display toggling by
`[data-active]`) never reaches this composition because the same media
query that hides the tabs also forces every side-panel visible,
overriding the `[data-active]` rule.

2026-09-24 F4/F5 — measured in the same tab at 390x844: tab buttons 81×44
(Side A) and 80×44 (Side B), each showing a visible focus/selected ring
(`box-shadow: 0 0 0 2px var(--focus-ring) inset` on `aria-selected="true"`);
Side A's search input 0×0 while hidden (expected — not the active panel)
and Side B's search input 247×44 / Scan button 70×44 while active, both
clearing the 44px floor in their smaller dimension. Reversed the measured
baseline (299×38 / 299×40).

2026-09-24 F7 — the page imports the same `tokens.css`/`shell.css`/
`motifs/` as slices C-E, with no locally redefined palette value.

2026-09-24 F9 — visually audited every asset: the blue motif SVG (brand
mark only), and the linked before screenshots (this app's own UI). No card
art or thumbnails appear on this page (Trade Balancer's real entries are
represented as plain text rows with a name and price, not images), and no
official Wizards of the Coast mana glyph, icon font, logo, or card art
appears anywhere on the page.

2026-09-24 F10 — cleanup: served `docs/design/ui-reimagining/` over
`python3 -m http.server 8796` as a tracked background task and stopped it
with `TaskStop`, not `nohup`/`&`/`pkill`; `lsof` confirmed port 8796
released. `browser_close` was called after the last capture (no open tabs
remained). No dev server was started or attached to for this slice.
Disposable capture path: `PRD/work/ui-reimagining/.playwright-mcp/`
(`slice-f-sideA-390x844.png`, `slice-f-sideB-390x844.png`,
`slice-f-1440x900.png`).
