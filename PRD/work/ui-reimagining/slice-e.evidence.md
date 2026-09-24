# Slice E — evidence log

Step order note: the slice doc's prose lists "game context, zone collection,
zone confirmation, answered workspace". Walking the live app in slice B's
capture session showed the real order is game context, then the checklist
screen headed "Zone confirmation", then the add-cards screen headed "Add
cards to zones" (which `REQ-130` calls "zone collection" — its strip is the
zone-collection strip). `in-depth-question.html` follows the real app's
observed order (game context -> zone confirmation -> zone collection ->
answered) rather than the doc's prose order, per E1's binding rule "none
added/removed/merged/reordered ... from today" — today's actual order
governs over a paraphrase of it.

2026-09-24 E2 — measured the zone-collection strip in a live Chromium tab at
390x844: `clientWidth` 325 vs `scrollWidth` 424, four 100px tiles with an
8px gap; 3 tiles measured fully within the strip's visible bounds
(`getBoundingClientRect` per tile compared to the strip's own rect), the
4th partially visible — clearing the "at least 3 visible without scrolling"
target and reversing the ~1.8-tiles-visible baseline in `DESIGN-BRIEF.md`.
Each tile keeps its Remove control, truncated name, and (where applicable)
a stack-position badge; the corner popup read path is represented by the
tile thumbnail itself acting as the detail trigger in this static mockup.

2026-09-24 (build attempt 2) E2 — SUPERSEDES the last sentence of the E2
entry above, which was wrong: the independent reviewer found the tile
thumbnail was an inert `<div>` with no click handler, and the page carried
zero `overlay-backdrop`/`overlay-panel` elements — there was no detail
popup at all, so a narrowed tile had silently dropped its read path
(`REQ-130` as applied).

Fix: added one shared `#card-detail-popup` overlay to
`in-depth-question.html`, reusing `shared-chrome-menu.html`'s
`overlay-backdrop`/`overlay-panel` markup (already styled by `shell.css`,
no new CSS needed for the overlay itself) and its `openOverlay`/
`closeOverlay` script verbatim. Each zone tile now also carries a corner
`.detail` button ("ⓘ", bottom-left, opposite the existing top-right Remove
control) and the `.thumb` itself is now a real `role="button"` control —
both call a new `showCardDetail()` that reads `data-card-name`/
`data-card-type`/`data-card-price` off the clicked element and opens the
shared overlay. Verified live at 390x844: before the fix,
`document.querySelectorAll('.overlay-backdrop').length` was 0; after,
it is 1, and clicking Sol Ring's detail button sets
`#card-detail-popup[data-open]` to `"true"` and populates the popup with
"Sol Ring" / "Artifact — {1}, T: Add {C}{C}." / "$1.85 (nonfoil)"; the
close button (`[data-close="card-detail-popup"]`) sets `data-open` back to
`"false"`. Measured both corner controls on the same tile:
`.remove` and `.detail` each render 44x44 (the `.tap-target` floor forces
this despite each having a smaller visual glyph inset inside it) — the
"44px Remove control" is unchanged, and the strip still shows exactly 3
tiles fully visible within the strip's bounds at 390x844 (the 4th
partially visible, scrollable) — tile width/gap were not touched by this
fix. Each tile keeps its Remove control, truncated name, and (where
applicable, none of the four Battlefield tiles today) a stack-position
badge, plus the now-real corner detail popup.

2026-09-24 E3 — measured in the same tab at 390x844: brand mark 132×44,
turn-phase select 325×44, active-player select 325×44, Confirm game context
195×44, zone-confirmation Back 70×44 / Continue 99×44, and the zone
checkbox row's label (the real hit area) 325×44 — all clear the 44px floor
in their smaller dimension, reversing every measured offender in
`DESIGN-BRIEF.md` for this screen (108×29, 307×37 ×2, 333×40, 160×42 ×2,
16×16).

2026-09-24 E4 — clicked the brand mark on the game-context step; the
page's local demo counter incremented from 0 to 1 and re-rendered its
status line, confirming the brand mark is a live tap target present on
every step (it renders in the shared header, outside the per-step panels,
so it persists across all four). The full session-wide, cross-screen count
is app-code logic and explicitly out of scope for this static mockup per
the slice doc's own requirement 4.

2026-09-24 E6 — at 1440x900, the game-context step's turn-phase and
active-player fields render side by side in one row (`.paired-row` switches
to `flex-direction: row` at the existing `640px` breakpoint), matching
today's `sm+` merged-panel layout; no step was added, removed, merged, or
reordered.

2026-09-24 E9 — visually audited every asset: the blue motif SVG (brand
mark only — this page fixes `data-profile="blue"` and does not carry a
Theme switcher of its own, since re-theming is demonstrated on slice C's
page), the zone-tile and card-ref thumbnails (flat CSS-gradient rectangles
with a text abbreviation, no card art), and the linked before screenshots
(this app's own UI). No official Wizards of the Coast mana glyph, icon
font, logo, or card art appears anywhere on the page.

2026-09-24 E10 — cleanup: served `docs/design/ui-reimagining/` over
`python3 -m http.server 8795` as a tracked background task and stopped it
with `TaskStop`, not `nohup`/`&`/`pkill`; `lsof` confirmed port 8795
released. `browser_close` was called after the last capture (no open tabs
remained). No dev server was started or attached to for this slice.
Disposable capture path: `PRD/work/ui-reimagining/.playwright-mcp/`
(`slice-e-zone-confirmation-390x844.png`,
`slice-e-zone-collection-390x844.png`,
`slice-e-gamecontext-1440x900.png`, `slice-e-answered-1440x900.png`).

2026-09-24 (build attempt 2) E10 amendment — the E2 fix re-verification
served `docs/design/ui-reimagining/` over `python3 -m http.server 8091` as
one tracked background task (shared with slice C's re-verification in the
same session) and stopped it with `TaskStop`, not `nohup`/`&`/`pkill`;
`lsof -iTCP:8091 -sTCP:LISTEN` confirmed no listener remained after.
`browser_close` was called once after the last capture across both
slices' re-verification (no open tabs remained). New disposable capture:
`PRD/work/ui-reimagining/.playwright-mcp/
in-depth-zone-collection-390x844-with-detail.png`. The Playwright MCP
tool's own automatic per-navigation console/snapshot logs are written to
a fixed tool-root `.playwright-mcp/` at the launch checkout regardless of
the served directory or working directory (not controllable via any tool
parameter); the three files this session's navigations produced there
(`console-2026-09-24T07-50-09-483Z.log`,
`page-2026-09-24T07-50-09-530Z.yml`,
`page-2026-09-24T07-52-34-370Z.yml`) were deleted after use, leaving that
gitignored directory's pre-existing contents untouched and
`git status --porcelain` clean at the launch root.
