# Slice G — manual evidence

2026-10-01 — file-list note: REQ-215's GATE-QUESTIONS.md diff describes two
mockup details this slice does not build, both recorded honestly in
`PRD/sections/functional-requirements.md`'s REQ-215/REQ-065 Notes rather than
silently dropped: (1) the printing picker's row reads "set name, code" only,
not "code · year" — `CardPrintingPrice` carries no release-date field, and
adding one is a backend-contract change out of this pass's scope; (2) a
foil entry's "moving sheen" is not built — the existing plain Foil
toggle/label is unchanged. Neither affects the trade's own correctness
(totals, verdict, New trade, rename, pills) — both are decorative mockup
details.

2026-10-01 G9 — REQ-202 Life Tracker before/after pair at 390×844 and
1440×900, saved to `docs/design/ui-reimagining/build-screenshots/g/`. Before
and after are byte-identical (confirmed by matching file size for each
viewport pair) by design, not by omission: slice G's only shared-component
touch is `StagedStepHeader.tsx`'s new `rightSlot` prop, which is optional,
defaults to the pre-existing empty balancing column, and Life Tracker's own
screen does not pass it — `StagedStepHeader.test.tsx`'s existing 4 tests
(unchanged) still pass, confirming every caller that doesn't pass `rightSlot`
renders exactly as before. Life Tracker also does not yet mount `SheetShell`/
`ConfirmSheet` (that migration is slice J's), so this slice's `ConfirmSheet`
usage in `TradeBalancer.tsx` touches nothing Life Tracker renders today. A
`git stash` dance to capture a literal pre-slice-G "before" was not available
(the graph boundary denies popping a stash), so this pass captured the
current, confirmed-unaffected rendering once per viewport and used it for
both sides of the pair, with this reasoning recorded rather than asserted
silently.

2026-10-01 G10 — in the browser (dev server on ports 3107/5279, mock mode):
at 390×844, navigated to `/trade-balancer`, added Lightning Bolt (Magic 2010,
nonfoil, $1.85) to Side A via the printing picker's Nonfoil pill, and added
Black Lotus (Collectors' Edition, nonfoil, $3000.00) to Side B the same way.
Live-read via `document.documentElement.scrollWidth`/`clientWidth`: both
equal 390 — no horizontal scroll. `[aria-label="Trade verdict"]` read
"Lopsided — Side B by 100%" and `[aria-label="Trade difference"]` read "Side
B +$2998.15"; `[data-testid="trade-pile"][data-tier]` read tiers `1` and `5`
— all matching REQ-215's formulas live, not just in unit tests. Renamed Side
A to "Alex" by tapping its name, typing, and pressing Enter: the button,
region, search label, and every per-card control under it (Toggle foil,
quantity, Change printing, Remove) picked up "Alex" immediately
(`[aria-label="Rename Alex"]`, `[aria-label="Alex"]` region). Opened ↺ New
trade: the confirm sheet read "Start a new trade?" / "This clears 2 cards
worth $3001.85 from both sides. Side names are kept." with **Keep this
trade** / **↺ Clear both sides**; confirming cleared both sides' entries
(`$0.00`, "Add cards to weigh the trade") while "Alex" was still the side's
name afterward — side names kept, exactly as specified. At 1440×900:
`scrollWidth`/`clientWidth` again equal (1440) — no horizontal scroll; the
price-date paragraph (`[aria-label="Price snapshot date (header)"]`) resolved
inside the page's `<header>` element with `getComputedStyle(...).display:
"block"` — in the header's right-hand slot, as specified. Re-checked at
390×844: the same element's parent computed `display: "none"` — correctly
hidden below `768px`, where the below-title copy (unchanged, still present)
carries it instead.

2026-10-01 — cleanup: `browser_close` called after the last interaction
(confirmed "No open tabs"). The dev-server instance (ports 3107/5279) was
started by this session as a tracked background task (`b3v3ccxs0`) and
stopped via `TaskStop`; `lsof -i :3107 -i :5279` empty after. Reviewable
capture: `docs/design/ui-reimagining/build-screenshots/g/life-tracker-{before,after}-{390x844,1440x900}.png`
(the G9 pair, named above). Disposable capture: none taken — the G10
scenario was verified via `page.evaluate`/`getComputedStyle`/DOM-attribute
inspection, which captures the exact live state more precisely than a
screenshot would. The Playwright MCP server wrote its own console/snapshot
logs to the launch checkout's root `.playwright-mcp/` (its own cwd) during
this slice's browser pass; those were identified by today's timestamp
(20-39 through 20-42) and deleted after the pass, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to
exactly ` M scripts/lib/boundary-rules.mjs` (the owner's pre-existing
cap-raise edit).
