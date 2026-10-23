# Flow walks: scanner, Trade Balancer, card detail (FLOW-006, 009, 024, 025)

Walked live on 2026-10-20 at 390x844 and 1280x800, built app on :5792, mock AI, Chrome headless.
Scripts and screenshots: `/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/74cadfda-9e1b-4aea-877f-fe60b293ae3a/scratchpad/flow-walk/trade-scan/`.
Note: the repo has no `node_modules/playwright` installed (declared 1.63.0 in package.json). I used the cached 1.61.1 copy at `~/.npm/_npx/e41f203b7505f1fb`. The built test will need `npm ci` to give it the pinned version.

## Headline findings

1. **Real defect found (FLOW-006).** In In-Depth zone collection, holding two or more cards and tapping Exit scan adds only ONE card to the zone (the last one). Seen at phone and desktop. Two held cards gave `Battlefield 1`; eight held gave `Battlefield 1`. The PRD says Exit scan "commits every card still in the holding list to the zone, in hold order". Cause: `addCardToActiveZone` in `apps/frontend/src/components/ZoneCollectionStep.tsx` appends to a stale copy of the zone for each held card, so each add overwrites the last. Trade Balancer and Ask a Question commit all held cards correctly (checked). No existing test pins the multi-card zone commit. The test for FLOW-006 should assert the PRD, so it will fail until this is fixed. The owner needs to decide: fix first, or build the test red.
2. **A recognised card CAN be shown honestly.** Chrome's fake camera can play a video file of a real card (`--use-file-for-fake-video-capture=card.y4m`). I fed Scryfall large images of Fury Sliver, Kor Outfitter and Siren Lookout (printings the scan map knows); the scanner locked, showed "Added Fury Sliver", ran the count pill, and listed held cards. Details under FLOW-006.
3. **Printing picker has no "N printings" heading** (FLOW-025 / FLOW-009). PRD says it should; live does not.
4. **Detail popup shows a Price chip and fires a prices request** that FLOW-024 does not mention (FLOW-024).

---

## FLOW-006 Scan cards into a zone

### 1. Row

- **Flow:** FLOW-006 Scan cards into a zone (In-Depth, Battlefield).
- **Setup:** Open `/in-depth`. Chrome with fake camera + camera permission granted. A small fake-camera video file showing one real card (see "Can't assert / fixture"). Route `cards.scryfall.io` images to a 1x1 PNG.
- **Steps (player terms):**
  1. Tap Confirm game context, then Continue.
  2. Tap "Add a card to Battlefield". Tap **Scan** (the button reads "▣ Scan").
  3. See the camera screen. Wait until the count pill shows (accessible name "Scanned this session: N").
  4. Tap the caution (⚠) button "Card scanning is experimental" and read the note.
  5. Tap the count pill. Read the list. Tap **Remove** on one entry.
  6. Tap the mute button (name flips "Mute scan sound" to "Unmute scan sound").
  7. Tap **Exit scan** (✕).
  8. Back on the Battlefield tab, check the cards.
- **Expected results (each tied to the PRD):**
  - Camera opens as its own screen with Exit scan, Capture, caution and mute visible; the zone's search box, card list, Continue and station rail are gone. ("the destination's own search input, card list, and outer staged-flow navigation are hidden" — scan README; FLOW-006 step 1.)
  - Scan data loads on first scan: requests for `/data/cardhashes.bin` and `/data/cardScanMap.json` succeed. ("lazy-loaded on first scan" — FLOW-006 preconditions.)
  - The caution control is visible before any card is held; the pill is NOT. (FLOW-006 step 5.)
  - Tapping caution shows a note that scanning is experimental. (step 5.)
  - A recognised card shows a "Added <name>" confirmation, and the pill appears with a count of at least 1. (steps 3-4.)
  - The pill panel lists held cards with a Remove control, and its foot reads "Joins the Battlefield when you close the scanner". (step 5.)
  - Remove drops one entry and the count goes down by one. (step 5.)
  - Mute toggles the label; the confirmation popup still shows. (step 4.)
  - After Exit scan: scan screen gone, search/Add card/Continue are back, and the Battlefield tab count equals the number of cards that were still held, with every held card name present. (step 6.) **This fails today (finding 1).**
- **Sizes:** phone and desktop. Layout of overlays differs (REQ-068), and the finding reproduces at both.
- **Must-fail break:** in `apps/frontend/src/hooks/useScanCapture.ts` `closeScan`, delete the `entries.forEach(... onSelectRef.current ...)` loop (nothing is added); or in `ZoneCollectionStep.tsx` drop the `{!isScanOpen && ...}` guard on line 320 (search stays visible while scanning). For the multi-card assertion the live defect itself is the proof.

### 2. Verified live?

Yes, at both sizes.
- Scan opens in about 1 s; data requests `cardMetadata.json`, `cardhashes.bin`, `cardScanMap.json` all returned 200; no console errors.
- Plain fake camera (green test pattern): panel opens, "Hold steady" hint, Capture and Debug present. Never locks (as expected).
- With a card video: "Locking on Fury Sliver 1/3", then "Added Fury Sliver" popup, pill "Scanned this session: 1" within about 2 s. A static video keeps re-recognising the same card about once a second, so the count climbs (6 in 6 s). Tests must assert "at least 1", never an exact count, and should stop at a count they control (a video that cycles three cards gave Fury Sliver, Kor Outfitter, Siren Lookout, each recognised).
- Pill panel (desktop and phone): "ADDED THIS SESSION / Fury Sliver / Remove / Joins the Battlefield when you close the scanner". Remove took the count from 6 to 5.
- Caution note text: "This feature is experimental and isn't fully functioning yet... You can always add a card by search instead."
- Mute flips label, no error.
- Exit scan returned to the zone screen; the zone showed only 1 card (defect).
- No camera at all (Chrome without fake device): screen shows "Camera unavailable" and stays on the scan screen with ✕; manual search is reached by exiting.

### 3. PRD vs live discrepancies

- **Multi-card commit.** PRD step 6: "commits every card still in the holding list to the zone, in hold order, through the existing add path ... in one step". Live: 2 held (Fury Sliver, Fury Sliver) gave 1 zone card; 8 held gave 1 (the last: Kor Outfitter). Both sizes. Same Battlefield zone, which allows duplicates, so this is not the duplicate rule.
- **Camera-denied fallback.** PRD edge case: "if camera permission is denied or unavailable, fall back to manual search and surface the reason". Live: the reason ("Camera unavailable") shows but the player stays on the scan screen and must tap ✕ to reach search. This matches the scan README ("manual search is reached by exiting scan"), so it is a PRD wording gap, not a bug. I did not test an explicit permission denial, only no device.
- **Corner control.** FLOW-006 step 5 says a "corner control opens a popup"; the scan README says the thumbnail tap opens it. Live: each held entry has a button "Show details for <name>". Not worth asserting.
- **Scanned printing.** PRD: the added card keeps the scanned printing. I scanned a Time Spiral print (TSP #157); the Trade Balancer entry defaulted to "The List · PLST". The scanner matches art, and a reprint with identical art can win. Do not assert a specific printing from a scan.

### 4. Edge cases

| Edge case | In test? | Why |
|---|---|---|
| Lock thresholds / runner-up margin guard | skip | Tuning numbers, pinned by `useScanCapture.test.ts` and scan unit tests. |
| No confident match keeps scanning, manual capture available | include (light) | The plain fake camera never locks: assert Capture is visible and the screen stays open. |
| Glare/dim/shake conditioning, finger occlusion, hard captures, card back | skip | Needs real camera frames; covered by scan unit tests. |
| Duplicate in stack blocks at recognition with notice | skip | Stack-only rule, owned by FLOW-004; unit-tested in `ZoneCollectionStep.test.tsx` / `useScanCapture.test.ts`. Re-recognition of the same card in Battlefield is allowed and was seen. |
| 10-card stack cap at hold time | skip | Same reason. |
| Camera denied/unavailable shows a reason | include | Cheap: Chrome without the fake-device flags shows "Camera unavailable". Overlaps the smoke suite check (see below), so keep it to one assertion. |
| Added in scan order bottom-to-top | skip | Cannot be shown while the commit defect stands; unit-tested. |
| Scanned printing art / name-only fallback offline | skip | Images are stubbed to a 1x1 PNG; art is not assertable. |
| Remove drops a held card before it joins the zone | include | One tap, player-visible. |

### 5. Can't assert / fixture notes

- Real hardware: sound ("ding"), focus, glare, shake, occlusion, true permission-denied prompt, torch/zoom.
- Thumbs-up popup timing (fades out); assert it appears, not how long.
- The test cannot rely on the plain fake camera for a recognised card. The honest route: a small `.y4m` video of one real card, fed by `--use-file-for-fake-video-capture`. Facts: a 2-frame 1280x960 y4m is 3.7 MB and locks fine; 640x480 or a downscaled card is too blurry and never locks. A card must be one the scan map knows and an older print worked (a 2026 Sol Ring print did not lock). Recommend: commit one small JPEG (about 80 KB; owner to decide on using a card image) and generate the `.y4m` at test time with `sharp`, which is already in the repo. Pin the card and the hashes file together; if the hash data is rebuilt, the test card must be re-checked.

### Overlap with smoke suite

`scripts/smoke-browser.mjs` step "scanner" already opens scan from the home screen, waits for `cardhashes.bin` and `cardScanMap.json`, and checks the fake camera does not show "Camera unavailable". Do not repeat the open + data-load + camera-available assertions in a second place. The new test should start from the In-Depth zone (a different entry point) and add what smoke cannot: a recognised card, the pill, Remove, Exit, and the zone result. Camera-unavailable can be dropped from the new test if the smoke step stays.

---

## FLOW-009 Build a two-sided trade and read the balance

### 1. Row

- **Flow:** FLOW-009 Build a two-sided trade and read the balance.
- **Setup:** Open `/trade-balancer` from the menu (also test one menu-driven entry: Switch feature, Trade Balancer). Fresh page. Mock backend, committed price data.
- **Steps (player terms):**
  1. Open Trade Balancer. See Side A and Side B, each `$0.00`, "Add cards to weigh the trade". (Phone: two tabs "Side A $0.00" / "Side B $0.00".)
  2. Phone: tap Side A tab. Tap **Add card**, type "Sol Ring" in "Side A card search", tap the **Sol Ring** suggestion. The printing picker opens ("Tap a price to use that printing and finish."). Tap one Nonfoil price pill (first row with a price).
  3. See the entry: card, printing (set · code), a **Foil** toggle, quantity − 1 +, a price, and Side A total above `$0.00`.
  4. Tap + to make quantity 2: Side A total doubles.
  5. Tap Side B (phone), add the same printing there. See "Even".
  6. Add a cheaper second printing to Side B: verdict names Side B and a dollar difference shows.
  7. Remove an entry (✕): totals drop.
  8. Tap Foil on an entry whose printing has no foil price: price shows `$0.00` with a warning ⚠ ("No foil price for Sol Ring") and "No price — $0".
  9. Pick a foil-only printing (a row where Nonfoil says "— no price" and Foil has a price): it opens already in Foil mode, priced.
- **Expected results:**
  - Two sides, each with a total, plus a verdict line and a difference. ("two sides ... a running total per side plus the difference" step 1.)
  - On open a request goes to `/api/health` (warm-up), shows nothing. (step 1, REQ-064.)
  - Picker lists printings, each row with set, collector number, nonfoil and foil price (or "— no price") and a thumbnail slot. (step 2.)
  - Entry has printing, USD price, Foil toggle, quantity control. (step 3.)
  - Side total above `$0.00` after a priced add; doubles with quantity 2 (shape: total after > total before, not exact dollars). (step 4.)
  - Equal sides read "Even"; unequal reads "Lopsided — Side X by N%" naming the side that is ahead, with a "+$" difference. (step 4: "verdict line naming the side ahead (or 'Even'), and the dollar difference".)
  - Remove lowers the total. (step 5.)
  - Unpriced mode gives `$0.00` + caution icon (role img, label starts "No ... price for"). (edge case 1.)
  - Foil-only printing opens with the Foil toggle pressed (aria-pressed true) and a total above `$0.00`. (edge case 2.)
  - "Prices as of <date>" line is shown once a price is loaded. (screen-layout price freshness.)
- **Sizes:** phone and desktop. Phone shows one side at a time under tabs and the search stays open after an add; desktop shows both sides.
- **Must-fail break:** in `apps/frontend/src/lib/trade/pricing.ts` line 28 swap the foil/nonfoil choice (`entry.foil ? entry.printing.usd : entry.printing.usdFoil`) so foil-only and unpriced checks fail; or change the "Even" return at line 115 to `"Lopsided"`; or in `TradeBalancer.tsx` line 170 remove the `/api/health` fetch.

### 2. Verified live?

Yes at both sizes.
- Open: both `$0.00`, "Add cards to weigh the trade"; `GET /api/health` and `GET /data/cardMetadata.json` fired.
- Sol Ring FRC nonfoil: Side A `$1.19` (never assert this figure). Quantity 2: `$2.38`. Foil on that printing: `$0.00` with `role=img aria-label="No foil price for Sol Ring"` and "No price — $0".
- Both sides same printing: "Even / Side A and Side B are even". B gets a second cheaper printing: "Lopsided — Side B by 44% / Side B +$0.94".
- Foil-only printing (SLD foil `$43.96`) opened in foil (aria-pressed true), side total jumped by that price.
- Remove lowered the total. "New trade" opens a confirm ("Start a new trade? This clears 3 cards worth $46.09 from both sides"). I did not confirm it.
- Same card added twice with the same printing merges into one entry with quantity 2 (not two rows). PRD allows either reading ("added multiple times or carry a quantity ≥ 1").
- No console errors, no blocked hosts.

### 3. PRD vs live discrepancies

- **"N printings" heading.** PRD (FLOW-025 step 3 and trade-balancer README line 95): the picker is "headed with the card's printing count (`N printings`...; 'only printing' for one)". Live: heading is just the card name "Sol Ring" and the line "Tap a price to use that printing and finish." There is no count anywhere (checked page text; `PrintingPicker.tsx` renders none). Both sizes.
- **Verdict wording.** PRD: "verdict line naming the side ahead (or 'Even')". Live: "Lopsided — Side A by 100%" plus "Side A +$1.19". It names the side and gives a percent; matches the intent. Assert "contains Side A/Side B" or "Even", not the exact words.
- **Scan commit merges identical printings** into one entry with quantity 2 (scan README says "every held card commits"). Fine; assert total quantity, not row count.
- **Foil-only retry picks an unpriced printing.** After a failed price fetch then Retry, Lightning Bolt landed on "The List · PLST" priced `$0.00` with caution, while other printings are priced. The PRD does not say which printing a retried entry picks, so not a discrepancy; do not assert its price after retry.

### 4. Edge cases

| Edge case | In test? | Why |
|---|---|---|
| Printing without price for chosen mode gives $0 + caution | include | Player-visible; the caution icon label is a stable hook. |
| Printing priced in one mode opens in that mode | include | Seen live; separate from the line above (foil-only, one pick). |
| Pre-add printings fetch fails: card added anyway, $0 + caution, Retry | include in FLOW-025 row | That is FLOW-025's own edge; test it there once, not here. |
| Same card more than once on a side; no duplicate block/cap | include (light) | Add Sol Ring twice, see quantity 2 / total doubles. Skip 10-card cap check. |
| Toggle foil on entry with no foil price | include | Same caution check as row 1; folded into step 8. |
| Wrong scanned print corrected via Change | skip | Needs scan; unit-tested in `TradeBalancer.scan.test.tsx`. |
| No camera, manual search remains | skip | Whole row is manual search already. |

### 5. Can't assert

- Exact prices, snapshot date text, art (images are a 1x1 stub). Exact verdict percent.
- Scan commit into a trade side CAN be shown with the card-video fixture (see FLOW-006); in this walk it produced a "Loading price…" state then a priced entry at both sizes. Put that in the FLOW-025 row, not here.

### Overlap with smoke suite

Smoke step "trade-balancer" already does: open `/trade-balancer`, Add card, type Sol Ring, tap suggestion, pick a nonfoil printing, wait for Side A total above `$0.00`. The new FLOW-009 test should reuse that opening (share the helper or skip those assertions) and spend its time on what smoke does not: Side B, Even vs Lopsided, quantity, remove, foil caution, foil-only open, warm-up request. Do not re-assert "total above $0.00 after one add" as a headline.

---

## FLOW-025 Fetch a card's printings and prices on demand

### 1. Row

- **Flow:** FLOW-025 Fetch a card's printings and prices on demand.
- **Setup:** `/trade-balancer`, fresh. Route handlers: one that holds `GET /api/cards/*/prices` until released (to see loading), one that returns 500 for it (to see failure). Fake-camera card video for the scan leg.
- **Steps (player terms):**
  1. Tap Add card, type Sol Ring, tap the suggestion while the price request is held. See "Loading printings…" in the sheet. Release. The printing list appears with a set filter box ("Filter by set name or code").
  2. Pick a nonfoil price. Entry appears already priced.
  3. Add Sol Ring again (type, tap suggestion): the picker opens immediately, and no second `/prices` request is sent.
  4. With the price request failing, add Lightning Bolt: the picker does not trap; the card is added at `$0.00` with ⚠ "No price for Lightning Bolt" and the text "Price unavailable right now." with a **Retry** button. Release the failure and tap Retry: one new `/prices` request, entry shows a printing.
  5. Scan leg (phone + desktop): tap "Scan a card onto Side A", wait for the pill, tap Exit scan. The entry shows "Loading price…" in place, then a set code and a price.
- **Expected results:**
  - On a suggestion tap, one `GET /api/cards/<oracle id>/prices` is sent and the picker shows a loading line until it returns. (step 1.)
  - Picker lists every printing, each with set, collector number, nonfoil and foil prices; scrolls inside its own sheet; a set filter appears (printing count over 5). (step 3, screen-layout.)
  - Entry priced from that same cache; repeating the same card sends no second request. (step 3.)
  - Failure before add: card added anyway, `$0.00` + caution + Retry; the failed result is not cached, so Retry re-fetches. (edge cases 1-2.)
  - Scan add: entry shows "Loading price…", then a printing and a price; one `/prices` request on exit, none while scanning. (step 1, scan path.)
  - No external network call: no request leaves 127.0.0.1 except image hosts (stubbed). (note: NFR-013.)
- **Sizes:** phone and desktop. The picker is a bottom sheet on phone; check both shapes.
- **Must-fail break:** in `apps/frontend/src/lib/trade/fetchCardPrintings.ts` make `cache.get(oracleId)` always miss (or skip `cache.set`) so a repeated card sends a second request; or change the failure branch in `components/trade/TradeEntryRow.tsx` (line ~113) so "Price unavailable right now." / Retry is not rendered.

### 2. Verified live?

Yes at both sizes.
- Held `/prices`: picker showed "Loading printings…"; released: full list (128 Sol Ring printings; Reality Fracture Commander first, Limited Edition Alpha last, newest first).
- Second add of Sol Ring: picker re-opened with no new `/api/cards/.../prices` request (the request log held exactly one for that card across both adds).
- 500 on prices: Lightning Bolt added at once, entry `data-pricing-status="error"`, ⚠ `$0.00`, "Price unavailable right now.", Retry button. After Retry: one new request, entry became "The List · PLST" (priced `$0.00`, caution).
- Scan leg with `fury.y4m`: after Exit scan, entry showed "Fury Sliver / Loading price…", then "The List · PLST · Change", `$0.34`, one `GET /api/cards/44623693-.../prices`.
- Scanning several distinct cards: all held cards committed to the side (Fury Sliver x2 and Kor Outfitter x2, merged by printing into quantity 2 each).

### 3. PRD vs live discrepancies

- **"N printings" heading missing** (see FLOW-009 section; quote: "headed with the card's printing count").
- **Unknown oracle id edge case** ("resolves to no printings and the entry shows the scan-unpriced/$0-plus-caution treatment"): not reachable by a player in this build with real data, so not walked. The failure branch gives the same visible state.
- **Snapshot date**: live shows "Prices as of 7 October 2026" in the header (phone: under the title; desktop: header slot). PRD FLOW-025 says the response "carries the snapshot date"; matches.

### 4. Edge cases

| Edge case | In test? | Why |
|---|---|---|
| Fetch fails after scan add: $0 + caution + Retry, not cached | skip | One failure test (manual path) is enough; same component and retry code. Pinned in `TradeBalancer.scan.test.tsx` and `fetchCardPrintings.test.ts`. |
| Fetch fails before add on manual path: added anyway with Retry | include | Core player promise; the picker must not trap. |
| Unknown oracle id: no printings, $0 + caution | skip | Not reachable by a player; unit-tested in `fetchCardPrintings.test.ts`. |
| Null price for selected foil mode: kept at $0 + caution | skip here | Covered in FLOW-009 row (foil on an unpriced printing). |
| Cache: re-adding sends no repeat request | include | Observable via request log. |

### 5. Can't assert

- Exact printing order beyond "first row is a recent set" (data changes on refresh). Assert only that the list has more than one row and a filter box appears.
- Which printing a scan lands on (art-match may pick a reprint). Assert "a set code and a price shape" only.
- Request timing of the cold backend warm-up beyond "a health request fired".

### Overlap with smoke suite

The smoke trade step already walks the happy manual path (suggestion tap to priced entry). The new test adds only the loading state, the cache (no repeat request), the failure + Retry path, and the scan path.

---

## FLOW-024 Fetch card detail on demand

### 1. Row

- **Flow:** FLOW-024 Fetch card detail on demand.
- **Setup:** `/in-depth`, Battlefield with Sol Ring added by search (and, as a second trigger, the Ask a Question page `/` with Sol Ring attached). Route handler that holds `GET /api/cards/<id>` until released; a second that returns 500.
- **Steps (player terms):**
  1. In-Depth: Confirm game context, Continue, Add a card to Battlefield, type Sol Ring, tap suggestion, tap **Add card**.
  2. Tap the ⓘ ("Show details for Sol Ring") with the detail request held. See the card name at once and the line "Loading details…".
  3. Release. See the oracle text ("{T}: Add {C}{C}."), type line (Artifact), mana value, colors.
  4. Close (✕, "Close details for Sol Ring") and reopen: text shows at once and no new `/api/cards/<id>` request is sent.
  5. Failure leg (fresh card, request returns 500): popup shows the name, "Details unavailable right now." and **Retry**. Release failure, tap Retry: oracle text appears and one new request was sent.
  6. Ask a Question: tap Add card, type Sol Ring, tap the suggestion, tap Close search (phone only), tap the ⓘ ("Show details for Sol Ring"): the same popup and the same request.
- **Expected results:**
  - Name renders immediately; a loading line shows inside the popup while the request is out. (step 2.)
  - After release, descriptive block appears: oracle text, type, mana value, colors. (step 3.)
  - Reopen sends no second request. (edge case 3.)
  - Failure shows name + retry, and no invented fields; Retry re-fetches and succeeds. (edge case 1.)
  - The Quick Lookup preview path opens the same popup. (trigger.)
- **Sizes:** phone and desktop.
- **Must-fail break:** in `apps/frontend/src/lib/cardDetail.ts` (fetch at line 24, cache near line 50) skip the cache write so reopening sends a second request; or remove the "Details unavailable right now." / Retry block in `components/CardPresentation.tsx` (around lines 257-264).

### 2. Verified live?

Yes at both sizes (Quick Lookup trigger checked at both, one step shorter than the In-Depth walk).
- Held request: popup showed "Sol Ring / Loading details…" with the rest of the page behind it (no layout jump seen in the screenshot, not measured).
- Released: "{1} / Artifact · Colorless / {T}: Add {C}{C}. / MANA VALUE 1 / SUBTYPES — / PRICE $1.19".
- Failure (500): "Sol Ring / Details unavailable right now. / Retry"; Retry made one request and the text appeared.
- Reopen: text shown, zero API requests.
- Quick Lookup: after attaching Sol Ring the stage shows ✕ and ⓘ; ⓘ opens the same popup and fires the same request. On phone the stage controls are hidden while the search box is open and appear after tapping "Close search".

### 3. PRD vs live discrepancies

- **Extra Price chip and prices request.** FLOW-024 step 3 lists the content as "oracle text, type line, mana cost/value, colors, sub/supertypes". Live also shows a "PRICE $1.19" chip and fires `GET /api/cards/<id>/prices` in the same open, beside the `GET /api/cards/<id>` request. The card-detail code comment calls it a "fact chip" (CardPresentation.tsx lines 46-86), and the PRD sections I searched do not mention it. So the PRD text is stale or the price chip is undocumented. Tests should assert the three PRD fields and ignore the chip.
- **"No overlay resize or layout shift"** (step 2): I saw none in screenshots but did not measure it with pixels; recommend not asserting it (the owner said no pixels).
- **Quick Lookup phone detail control hidden while the search box is open**: the PRD says the preview detail control is available; live it is hidden until search is closed. Mild; noted for the owner.

### 4. Edge cases

| Edge case | In test? | Why |
|---|---|---|
| Fetch fails: name + Retry, no invented fields | include | Player-visible, one route override. |
| Image failure does not trigger a detail fetch | skip | Pinned by `CardPresentation.test.tsx`; the live test stubs all images, so it cannot cleanly separate. |
| Reopen resolves from cache with no repeat request | include | Request log, one assertion. |
| Quick Lookup preview as second entry point | include (light) | Shows both triggers; one run, only the ⓘ opens a popup with the oracle text. |

### 5. Can't assert

- Exact oracle text of cards other than the fixed Sol Ring (data refresh can change wording); assert contains "Add {C}{C}" or just "Artifact".
- Pixel stability of the popup (no layout shift): no pixels.
- Whether the loading state shows when the backend is fast: the test must hold the request open itself to see it.

### Overlap with smoke suite

None of the smoke steps open a detail popup, so there is no duplication. The smoke "in-depth" step adds Sol Ring to Battlefield the same way as this row's setup; share that helper.

---

## Summary table

| Flow | Verified | Discrepancies |
|---|---|---|
| FLOW-006 | yes, phone + desktop, with real-card video fixture | Multi-card Exit scan adds only one card (defect); camera-denied falls back by exit, not automatically |
| FLOW-009 | yes, both sizes | no "N printings" heading |
| FLOW-025 | yes, both sizes | no "N printings" heading |
| FLOW-024 | yes, both sizes | Price chip + extra prices request not in PRD |
