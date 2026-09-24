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
