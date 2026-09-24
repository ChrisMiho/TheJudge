# Slice C — evidence log

2026-09-24 C2 — clicked the Red theme swatch in `shared-chrome-menu.html`'s
Menu tray (served over a temporary local static server, live Chromium tab):
the page wash, every panel edge in the tray/nav list, the theme-swatch focus
ring, and (opened next) the card-detail popup's border and "Price" accent
text all re-themed to red instantly, with no page reload (`document.title`
and the URL were unchanged across the interaction). Confirmed the same for
the default Blue state before switching. Screenshots:
`slice-c-shared-chrome-390x844.png` (Blue), `slice-c-tray-open-390x844.png`
(Blue, tray open), `slice-c-red-theme-390x844.png` (Red, tray open),
`slice-c-card-detail-red-390x844.png` (Red, popup open) — all disposable,
under `.playwright-mcp/`.

2026-09-24 C5 — compared `docs/design/ui-reimagining/after/life-tracker-
390x844.png` and `-1440x900.png` against their `before/` counterparts: the
life-table content (four player cards, the diagonal cyan-to-blue gradient
fill, the "40" life numbers, the rotated Player N labels, the +/- controls,
the counter-bubble grids) is visually unchanged in position, size, and
styling between before and after at both viewports — the life-table markup
in `life-tracker-after.html` uses fixed, hardcoded CSS values (not
`tokens.css` variables), so it cannot drift when the profile changes. Only
the header chrome around it (brand mark, menu toggle, Day/settings icons)
differs, reading the new REQ-200 token set exactly as every other
destination's header does.

2026-09-24 (build attempt 2) C5 — SUPERSEDES the C5 entry above, which was
wrong: the independent reviewer found `life-tracker-after.html` had
redrawn Life Tracker's own table by hand (upright life numbers instead of
per-seat rotation, a single-column layout at 390x844 instead of the real
2x2 arrangement, `gap: 0` square panels instead of rounded cards with
gutters, and +/- pushed to the panel edges) — none of which matches
`docs/design/ui-reimagining/before/life-tracker-*.png` or the live
`seatArrangement()` contract in `apps/frontend/src/lib/lifeTracker/
seatArrangement.ts` (4 players is always a 2x2 grid, left column rotated
90deg, right column rotated 270deg, independent of viewport width — so the
real table shows all 4 seats at 390x844 too, not 2 of 4).

Fix: stopped hand-redrawing the table. `life-tracker-after.html` now crops
the real table pixels straight out of the "before" captures — below the
measured header line (y=120 at 390x844, y=104 at 1440x900) — into
`life-tracker-table-390x844.png` / `life-tracker-table-1440x900.png`
(new, same folder) and embeds the matching crop with a `<picture>` element
sized to fill the space below the new header (`object-fit: cover`, no
stretch). The table pixels in the composite are therefore the literal
before-capture pixels, not a reproduction, so there is no drift to
describe: they are byte-for-byte the "before" table region.

Re-captured `docs/design/ui-reimagining/after/life-tracker-390x844.png`
and `-1440x900.png` from the fixed page (temporary local static server,
live Chromium tab, `browser_take_screenshot`). What the new images show,
compared to `before/`: at 390x844, all 4 players in a 2x2 grid (Player 2
top-left, Player 3 top-right, Player 1 bottom-left, Player 4 bottom-right),
each "40" life number upright and each `Player N` label rotated 90/270deg
to face its seat, rounded card corners with visible gutters between the
four cards, and the +/- controls sitting inboard beside the life number
(not at the panel edges) — identical to `before/life-tracker-390x844.png`.
At 1440x900, the same 2x2 arrangement and per-seat rotation, identical to
`before/life-tracker-1440x900.png`. Only the header above (brand mark,
menu icon, Day/settings icons, mock-mode banner) reads the new token set;
everything below the header line is the unmodified before-capture. REQ-202
holds: the one-screen fit at 4 players is unaffected because the table
pixels themselves never changed.

2026-09-24 C7 — visually audited every asset referenced from
`shared-chrome-menu.html` and `life-tracker-after.html`: the six
`motifs/*.svg` files (abstract gradients/shapes authored for this package,
see slice B), the brand mark (an SVG motif plus a text wordmark), and the
`before`/`after` screenshots (captures of this app's own UI). No official
Wizards of the Coast mana glyph, icon font, set symbol, logo, or card art
appears anywhere on the page or in the Life Tracker composite.

2026-09-24 C8 — cleanup: this slice served `docs/design/ui-reimagining/`
over `python3 -m http.server` on three short-lived ports in turn (8792 while
iterating layout, then 8793 to re-verify the final Life Tracker pair section)
because the mockup pages' relative `../before/` and `../after/` links can't
resolve under the sandbox's blocked `file:` protocol; each was started as a
tracked background task and stopped with `TaskStop` (never `nohup`/`&`/
`pkill`), and `lsof` confirmed each port released immediately after.
`browser_close` was called after the last capture on each pass (no open
tabs remained). No dev server (`npm run dev`) was needed for this slice —
slice B's dev server is not reused; slices C-F consume only slice B's
static `tokens.css`/`shell.css`/`motifs/` and the already-captured `before/`
screenshots. Disposable capture path:
`PRD/work/ui-reimagining/.playwright-mcp/` (the interaction screenshots
above). Committed capture path:
`docs/design/ui-reimagining/after/life-tracker-390x844.png` and
`-1440x900.png`.

2026-09-24 (build attempt 2) C8 amendment — the C5 fix re-verification
served `docs/design/ui-reimagining/` over `python3 -m http.server 8091`
as one tracked background task (shared with slice E's re-verification in
the same session) and stopped it with `TaskStop`, not `nohup`/`&`/
`pkill`; `lsof -iTCP:8091 -sTCP:LISTEN` confirmed no listener remained
after. `browser_close` was called once after the last capture across
both slices' re-verification (no open tabs remained). New disposable
captures: `PRD/work/ui-reimagining/.playwright-mcp/
life-tracker-after-390x844-check.png` and
`life-tracker-after-1440x900-check.png`. Re-committed capture path:
`docs/design/ui-reimagining/after/life-tracker-390x844.png` and
`-1440x900.png` (overwritten with the fixed composite). See slice-e's
E10 amendment for the note on the Playwright MCP tool's own
automatic console/snapshot logs and their cleanup.
