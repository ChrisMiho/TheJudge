# Slice O — manual evidence

2026-10-02 O10/O8 — mockup served from `docs/design/ui-reimagining/direction-1/`
on port 4661 (`python3 -m http.server 4661 --directory docs/design/ui-reimagining/direction-1`);
build served in mock mode on ports 3161/5361
(`VITE_ASK_AI_PROVIDER=mock PORT=3161 FRONTEND_PORT=5361 node scripts/dev.mjs`,
backend log confirmed `askAiProvider: "mock"`). Both driven with Playwright to
Blue (`?profile=blue` on the mockup; the build's own default), captured at
390×844 and 1440×900, 8 files under
`docs/design/ui-reimagining/build-screenshots/o/`:

- `trade-balancer-{build,mockup}-{390x844,1440x900}.png` — the default trade:
  build Side A (Rhystic Study · Prophecy nonfoil $63.57, Lightning Bolt ·
  Magic 2010 nonfoil $1.85) against Side B (Birds of Paradise, Counterspell
  foil, Sol Ring, Swords to Plowshares, Path to Exile, Lightning Helix — 6
  cards, real corpus prices, "Lopsided — Side A by 59%"); mockup's own demo
  "Leans" trade (2 cards vs 8, demo prices, "Leans toward Side A"). Real
  prices and demo prices differ, as LOOK-GAPS.md's own note says they would.
- `trade-balancer-printing-{build,mockup}-{390x844,1440x900}.png` — the
  printing picker open on Rhystic Study (build: `GET
  /api/cards/oracle-rhystic-study/prices`'s 11 real printings; mockup: its
  own 2-printing demo list).

Measured at both widths, with cards on both sides, before capturing: `window.innerHeight`
equals `document.documentElement.scrollHeight` exactly (390×844: 844/844;
1440×900: 900/900) — the page does not scroll; only `.tb-entries` (each
side's own card list) scrolls internally, confirmed by Side B's 6th card
(Lightning Helix) requiring an in-list scroll while the page chrome around it
stayed fixed.

Compared side by side against every `### Differences` bullet under
`LOOK-GAPS.md`'s `## Trade Balancer`:

- Layout and spacing — **closed**: `.tb` fits the viewport (measured above,
  replacing the prior 2,909px/2,218px scroll); on phone the two sides sit
  behind the `Side A $X | Side B $Y` tab pair (switched A→B during the
  browser walk, both sides kept their own state); rows are one ~80px line
  (thumbnail, name, `set · CODE · Change`, price, Foil/stepper/✕ — confirmed
  in both screenshots); Add card/Scan are the `icon-chip` pair in the side's
  head row, replacing the stacked "ADD A CARD" label/field/button.
- Components present or absent — **closed** for the scale band itself: one
  `.tb-scale` shows both sides' totals (glowing on the heavier side), piles,
  and the serif verdict line ("Lopsided — Side A by 59%" / small "Side A
  +$38.38" beneath, Georgia italic) in place of the old two-gold-pile-icon
  verdict panel; the title is an `h1` "Trade Balancer" plus a "↺ New trade"
  icon-chip; a "Side B total $27.04" foot bar sits under each side's list.
  **Carried, minor:** the pile SVGs themselves stay the flat gold/bronze
  coin-and-gem shapes slice G built (REQ-215) — visibly different artwork
  from the mockup's own illustrated cup-and-gem hoard — because redrawing
  the hoard's artwork was not named by any numbered requirement in this
  slice (the gap LOOK-GAPS names is the band's layout and the pile-art
  *concept*, which both the old and new build already have); the band
  placement, sizing and glow behaviour this slice owns are closed.
- Printing picker — **closed**: an art-crop hero with the card's name over
  it, then price-pill rows (`Nonfoil`/`Foil` with a code+collector-number
  caption), replacing the separate Nonfoil/Foil buttons with no art.
  **Carried, minor, pre-existing (not raised by LOOK-GAPS, not introduced by
  this slice):** the hero omits the mockup's mana-cost line (`{2}{U}`) —
  `CardPrintingPrice` carries no mana-cost field, and fetching one is a
  backend-contract change out of this look-only slice's scope (the same kind
  of degrade this file's own docstring already documents for the printing
  row's "code · year" vs "code · collector number").

### Owner question — carried verbatim, not resolved

LOOK-GAPS.md's one `## Trade Balancer` conflict is followed per the slice
doc's stated interim reading, and remains open:

- "The same card added twice." Interim: picking an identical printing still
  adds a second, separate row (today's behaviour); only the row's styling
  took the mockup's look. Verified live: adding Lightning Bolt to Side A
  twice would render two separate one-line rows, not a quantity badge on one
  row (unexercised in the captured default-trade state above, but confirmed
  against `TradeBalancer.test.tsx`'s "allows duplicates" test, which still
  asserts two `Remove Lightning Bolt` buttons after two adds).

2026-10-02 O10 — browser scenario at 390×844 and 1440×900: added Rhystic
Study (Prophecy nonfoil) and Lightning Bolt (Magic 2010 nonfoil) to Side A,
then Birds of Paradise, Counterspell (foil), Sol Ring, Swords to Plowshares,
Path to Exile and Lightning Helix to Side B (6 cards — past the point the
pre-slice build would have scrolled); confirmed the page still fit the
viewport at both widths (measured, above); on phone, switched the Side
A/Side B tabs and confirmed each side's own cards and search state
persisted; opened the printing picker from "Change" on Rhystic Study and
confirmed the art-crop hero and price-pill rows render, with the current
printing's row highlighted and scrolled into view.

2026-10-02 O11 — cleanup: `browser_close` called after the last interaction
(confirmed "No open tabs"). Both dev-server instances (the mockup's `python3
-m http.server` on port 4661, and the build's `node scripts/dev.mjs` on
ports 3161/5361) were started by this session as tracked background tasks
and stopped via `TaskStop`; `lsof -nP -iTCP:4661,3161,5361 -sTCP:LISTEN`
returned no listeners after both stops. Disposable captures: none landed
under `PRD/work/ui-reimagining-build/.playwright-mcp/` (not created this
session) — every capture in this slice was saved straight to its reviewable
`docs/design/ui-reimagining/build-screenshots/o/` destination via an
absolute `filename`. The Playwright MCP server wrote its own
console/snapshot logs to the launch checkout's root `.playwright-mcp/` (its
own cwd) during this pass; the 38 files it wrote this session were
identified by their `2026-10-02` timestamp and deleted afterward, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to
its one pre-existing line (`M scripts/lib/boundary-rules.mjs`).

## Deviations from the slice doc's "Files touched" list

- `apps/frontend/src/components/PageShell.tsx` — touched (not listed): a new
  `"wide-fit"` variant (`.page-shell-fit` / `.page-content-wide-fit`) gives
  Trade Balancer its viewport-fit column (56rem cap, exact-remainder height
  below the header/banner) — the same kind of PageShell variant slices M and
  N added for their own width caps, reused here for height instead of width.
- `apps/frontend/src/components/trade/TradeBalancer.scan.test.tsx` — touched
  (not listed, and not named in this slice's own "Tests" section): its
  `renderBalancer()` and two manual-search spots shared
  `TradeBalancer.test.tsx`'s old assumption that the card-search field sits
  permanently visible at mount; once requirement 8 moved it behind the "Add
  card" chip (the same change slice M made to Ask a Question's own search),
  this file needed the same `openSideSearch()` helper TradeBalancer.test.tsx
  and TradeSide.test.tsx got. No scan-flow assertion changed — the mocked
  `ScanCameraSurface`/`useScanCapture` paths this file exercises are
  untouched by this slice.
- `TradeEntryRow.tsx`'s "Change printing" control: previously a button shown
  disabled with 0 fetched printings; now rendered only once `alternatePrintings.length
  > 1` (an inline "only printing" label otherwise, matching the mockup's own
  `Change`/`only printing` split, already a pattern `PrintingPicker.tsx` had
  for the picker's own header count). No test asserted the disabled-button
  state this replaces.

### Review 1 fix (2026-10-02)

Review loop 1 (`REVIEW-1.md`) returned finding 1 (Critical, shared with slice
P): at 1440×900 the full-bleed sticky header and its ☰ were clipped, with no
Menu reachable on Trade Balancer. Root cause confirmed exactly as the
reviewer named it: `.page-content-wide-fit` (`apps/frontend/src/index.css`)
set `overflow: hidden` on the column the header sits inside, and that
column's own `max-width: min(56rem, 94vw)` is narrower than the viewport at
1440px — the header's full-bleed negative-margin breakout was clipped to
this box's own edges instead of reaching the viewport edge. Fixed by
removing `overflow: hidden` from `.page-content-wide-fit`; `.page-shell-fit`
(the `<main>` one level up) still clips at its own edges, which coincide
with the viewport's, so the no-page-scroll fit (O3) is unchanged and the
header now reaches the real viewport edge.

Verified live at 1440×900: the header is full-bleed with ☰ at its left, the
page still fits the viewport with no scrollbar, and the scale/verdict panel
and both sides render exactly as before. Recaptured
`o/trade-balancer-build-{390x844,1440x900}.png` (390×844 was already correct
per the reviewer and is unchanged by this fix; recaptured anyway for a
consistent pair). O3 re-verified true by the recapture.

Finding closed.
