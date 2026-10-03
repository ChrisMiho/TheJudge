# Slice D — Trade Balancer: pair results

Screen: Trade Balancer (a trade with cards on both sides; the printing picker open on an entry). Visual source: `docs/design/ui-reimagining/direction-1/trade-balancer.html`.

Slice threshold: differing fraction at most 0.04 per pair (below the 0.05 ceiling). Measured maximum 0.0148 (default trade at 1440x900), so the planner's 0.04 is kept. Tolerance 12 per channel on every pair.

How the pairs are made: the same as `translation/frame/DIFF-RESULTS.md` (build in mock mode on 5411, the seeded-scene mockup copy on 5413, reduced motion, Blue, Playwright). Both sides show the mockup's "Leans" demo trade: Side A is Rhystic Study and Lightning Bolt; Side B is Birds of Paradise x2, Counterspell (foil), Sol Ring x2, Swords to Plowshares, Path to Exile and Lightning Helix. The build side is filled through its own screen (search, tap the card, pick its printing and finish, tap + for quantity). The price route is answered in the capture with the mockup's demo printings and prices (set names, codes and USD, snapshot 2026-09-08), the printing ids coming from the real route so the picker's rows have their own art; nothing else about the app is faked. The phone shows Side A on its tab. The printing picker state opens Rhystic Study's Change on both sides.

| Pair | Mask file | Tolerance | Differing fraction (pixels / compared) | Threshold | Result |
| --- | --- | --- | --- | --- | --- |
| default-trade 390x844 | default-trade-mask-390x844.json | 12 | 0.00361 (805 / 223001) | 0.04 | PASS |
| default-trade 1440x900 | default-trade-mask-1440x900.json | 12 | 0.01482 (17416 / 1175294) | 0.04 | PASS |
| printing-picker 390x844 | printing-picker-mask-390x844.json | 12 | 0.00526 (1174 / 223001) | 0.04 | PASS |
| printing-picker 1440x900 | printing-picker-mask-1440x900.json | 12 | 0.00419 (4920 / 1175294) | 0.04 | PASS |

Pairs live beside this file as `<state>-build-<viewport>.png`, `<state>-mockup-<viewport>.png` and `<state>-mask-<viewport>.json`.

## Named mask regions (every one has its reason in the mask file)

- closed tray shadow and closed bottom sheets glow: as in `frame`.
- gold piles (`.piles`): `TradePile`'s gold, bronze and gem artwork is the app's own drawing and stays unchanged (REQ-215); the mockup draws a different heap in the same place.
- price date line (`.asof`): the app writes the snapshot date as `8 September 2026` (REQ-066's freshness copy, pinned by tests) where the mockup writes `8 Sep 2026 · USD`.

## Behaviour that wins over the mockup, and where the build differs on purpose

- REQ-215 merge: adding the same printing and finish again raises the row's quantity; the scanner commit merges the same way. `merged-row-build-390x844.png` shows Lightning Bolt (Commander Legends: Baldur's Gate) added twice as one row with quantity 2 ($6.40 = 2 x $3.20) and the foil copy as its own row; the side total is $13.30, the unmerged sum.
- REQ-065: tapping a search result opens the printing picker first (the player picks the printing and finish before the card is added); the mockup adds the card at once with its first printing.
- The picker's hero shows the art and the name, not the mana cost (the price route carries none), and its rows read set, code and collector number, not "code - year" (the route carries no year). The "N printings" count line is gone: the mockup's picker has none (REQ-070).
- Rename keeps REQ-215's tap-to-rename (a button that becomes a field); the mockup's name is always a field.
- REQ-205: the small controls (Foil, minus, plus, the remove cross, Change, the finish pills, the side tabs, the Add card and Scan chips, the side name, New trade) keep the mockup's look and get a transparent halo that makes the hit area 44px.
- The mockup's foil sheen on a foil entry's card (a slow moving highlight) is now built, as the mockup draws it (REQ-215's note that it was not built is out of date; flagged in the report, not edited).

## D6 and D7 — REQ-216 audit (the brief's verbatim command, as in `translation/frame/DIFF-RESULTS.md`)

`BASE` is `1de4e76` (the commit this slice started from). `FILES`: `TradeBalancer.tsx`, `TradeSide.tsx`, `TradeEntryRow.tsx`, `TradePile.tsx` (exempt) and `PrintingPicker.tsx`, all under `apps/frontend/src/components/trade/`.

(a1) printed 0 (the rebuilt files carried zinc, amber, rose and fixed-hue classes before; `TradePile.tsx` is on the exempt list). (a2) printed 0 over the working tree against `BASE` before the milestone commit. To get there: the mockup's literal shadow, foil sheen and foil dot moved into named tokens in `lib/theme/glows.css` (`--tb-shadow-2`, `--foil-sheen`, `--foil-dot`); the warning and error colours read `--status-warn` and `--status-error`.

## D8 — profile-switch pair

`default-trade-profile-red-build-390x844.png` and `default-trade-profile-green-build-390x844.png` (the mockup's own capture beside each): the heavy side's total, the active tab and its glow, the Add card and Scan chips, the Foil toggles' pressed state, the Change links, the entry cards' glow, the scene and the header recolour; nothing is left on Blue. Differing fractions against the mockup (unmasked, tolerance 12): red 0.1350, green 0.0974, shown for completeness (they include the piles and the date line, which the pairs above mask).

## D9 — Life Tracker table (REQ-202)

`translation/life-tracker-table/after-build-<viewport>.png` re-captured after this slice: pixel-identical to the previous capture (0 differing pixels at both widths).

## D10 — cleanup evidence

- Playwright browser closed with `browser_close` (result: no open tabs).
- Servers this slice started and stopped: the build server (`VITE_ASK_AI_PROVIDER=mock PORT=3411 FRONTEND_PORT=5411 node scripts/dev.mjs`), the mockup server (`python3 -m http.server 5413` on the scratch copy of the mockup folder) and the capture collector on 5414.
- Ports released: `lsof -i :5411`, `:3411`, `:5413`, `:5414` each printed nothing in the listening state. Ports 5273, 3100 and 5300 were never touched.
- Capture path: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ui-look-translation/docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/`.
