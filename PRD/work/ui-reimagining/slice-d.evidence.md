# Slice D — evidence log

2026-09-24 D1 — measured in a live Chromium tab at 390x844 with all 5 cards
attached (Sol Ring, Lightning Bolt, Llanowar Elves, Swords to Plowshares,
Counterspell): `#send-request` measured `top` 688.4 / `bottom` 732.4 —
fully inside the first viewport, reversing the measured baseline in
`DESIGN-BRIEF.md` (2 cards, document 1159px, Send Request `bottom` 1067,
179px below the fold). First pass embedded the full-size "before" screenshot
inline above the interactive panel, which alone pushed the document to
1881px and Send Request's `bottom` to 1461px — fixed by moving that
comparison image below both interactive sections (it's still linked at the
top and embedded at the bottom, satisfying D7 without bloating the first
viewport the fix is measured against).

2026-09-24 D5 — measured `.page-content`'s rendered width at 1440x900:
768px, exactly `min(48rem, 92vw)` = `min(768px, 1324.8px)` = 768px, matching
`REQ-124`'s unchanged cap.

2026-09-24 D6 — the page imports the same `tokens.css`/`shell.css`/`motifs/`
as slice C's `shared-chrome-menu.html`, with no locally redefined palette
value; the header, brand mark, panel, and button treatments read identically.

2026-09-24 D8 — visually audited every asset on the page: the six-language
motif SVG (brand mark only, `motifs/blue.svg`), the card chip
thumbnails (flat CSS-gradient rectangles with a plain text abbreviation, no
card art), and the before screenshots (this app's own UI). No official
Wizards of the Coast mana glyph, icon font, logo, or card art appears
anywhere on the page.

2026-09-24 D9 — cleanup: this slice served `docs/design/ui-reimagining/`
over `python3 -m http.server 8794` as a tracked background task (relative
`../before/` links can't resolve under the sandbox's blocked `file:`
protocol) and stopped it with `TaskStop`, not `nohup`/`&`/`pkill`; `lsof`
confirmed port 8794 released. `browser_close` was called after the last
capture (no open tabs remained). No dev server was started or attached to
for this slice. Disposable capture path:
`PRD/work/ui-reimagining/.playwright-mcp/` (`slice-d-presubmit-390x844.png`,
`slice-d-answered-390x844.png`, `slice-d-1440x900.png`).
