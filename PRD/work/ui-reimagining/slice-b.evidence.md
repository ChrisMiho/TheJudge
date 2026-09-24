# Slice B — evidence log

2026-09-24 B2 — verified computed contrast in a live Chromium tab (Playwright,
served over a temporary local static server, `tokens.css` loaded as-authored,
no arithmetic from written hex values alone): for all six profiles, primary
text (#E2E8F0) against the raised panel fill measured 14.78-15.10:1 and
against the wash's lightest (45%) gradient stop measured 15.03-15.53:1, both
comfortably clearing the 14.37:1 floor. `accent-soft` text against the page
ground (`#09090B`) measured 6.19:1 (Red, the floor itself, unchanged from
today's shipped value) up to 18.73:1 (White). `accent-contrast` text against
the filled `accent` swatch measured 5.42:1 (Green, the floor itself) up to
16.11:1 (White). All values read via `getComputedStyle` on the rendered page
and computed with the standard WCAG relative-luminance formula in the browser
context, not reasoned from the written hex codes. First pass (mixing
`--accent-strong` directly into the wash/panel) failed for White — its
accent-strong (`#B0A382`) is itself light, so any tint pulled the panel above
the floor's razor-thin margin (12.25:1 at 10% mix); fixed by introducing a
dedicated `--wash-tint` per profile, chosen to be reliably darker than
`#18181B` so mixing it in can only hold or raise contrast, never regress it.

2026-09-24 B3 — verified via the same rendered page: `--surface-ground` is
literally `#09090b` in the computed style for all six profiles (unchanged
constant), and the wash gradient's darkest points (the 0% and 100% stops) are
also literally `#09090b`; the lightest (45%) stop was measured lighter than
`#09090b` in every profile (never darker), so no profile's wash renders
darker than the measured floor at any point.

2026-09-24 B4 — rendered a representative composition (header/brand mark,
mock-mode banner, Quick-Question-shaped card panel with a filled primary
button, a second panel with an accent-bordered control) using `tokens.css` +
`shell.css` at 390x844 for the Red and White profiles — the two profiles
carrying the most saturated (Red) and the lightest (White) accent values, the
two edges of the risk range. In both captures the page ground and panel
fills (dark neutral) are the clear visual majority of the frame; the profile
colour appears only as the mock-mode banner wash, panel edges, the focus/
accent border on the secondary button, and the filled primary button — never
as a dominant fill across the frame. Screenshots were disposable Playwright
captures under `.playwright-mcp/` (`b4-check-red-390x844.png`,
`b4-check-red-1440x900.png`, `b4-check-white-390x844.png`), not committed
deliverables, per `runtime-process-hygiene.md`. Token values (and therefore
the neutral-vs-accent area ratio) do not change with viewport — only layout
does — and the desktop capture confirms the same composition simply gains
more neutral wash at the frame's edges outside the `min(48rem, 92vw)`
content column (REQ-124), so the 390x844 and 1440x900 readings are the same
call; the majority does not narrow at the wider width.

2026-09-24 B8 — cleanup: `browser_close` called after the last capture (no
open tabs remained). This slice started its own isolated dev server
(`PORT=3101 FRONTEND_PORT=5273 ASK_AI_PROVIDER=mock node scripts/dev.mjs`,
background task `bgn792a0l`) to capture the 12 "before" screenshots from the
live app, and its own temporary static file server on port 8791 (background
task `b5fdegyco`, serving `docs/design/ui-reimagining/direction-1/` only) to
verify `tokens.css` contrast in a real browser tab before any dev-server
route existed for it. Both were stopped via `TaskStop`, not `nohup`/`&`/
`pkill`; ports 3101, 5273, and 8791 were confirmed released with `lsof`
afterwards (no listener). The two verification-only HTML files
(`_swatch-check.html`, `_b4-check.html`) used to drive the port-8791 checks
were deleted before commit — they are not part of the slice's deliverable
tree. Committed capture path:
`docs/design/ui-reimagining/before/` (12 files, listed in B7). Disposable
capture path: `PRD/work/ui-reimagining/.playwright-mcp/` (the three B4
screenshots above).
