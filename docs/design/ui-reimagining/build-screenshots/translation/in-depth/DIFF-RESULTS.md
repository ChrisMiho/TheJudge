# Slice C — In-depth details: pair results

Screen: In-depth details (Game, Zones, Cards, Placing, Context, Review, Ruling). Visual source: `docs/design/ui-reimagining/direction-1/in-depth-question.html`.

Slice threshold: differing fraction at most 0.04 per pair (below the 0.05 ceiling). Measured maximum 0.0302 (ruling at 390x844), so the planner's 0.04 is kept. Tolerance 12 per channel on every pair.

How the pairs are made: the same as `translation/frame/DIFF-RESULTS.md` (build in mock mode on port 5411, the seeded-scene copy of the mockup with the local Inter font on 5413, reduced motion, profile Blue, Playwright). The build side is put in each state by a saved Draft (a fixed set of six cards in Stack, Battlefield and Hand: Lightning Bolt and Counterspell on the Stack, Sol Ring and Llanowar Elves on the Battlefield, Swords to Plowshares and Lightning Helix in Hand; Bolt targets the Elves, Counterspell is cast by Player 2 and targets the Bolt), the same six the mockup's demo strip seeds. States: game (station 1); zones (station 2, Stack, Battlefield, Hand ticked); cards (Stack tab, two cards); placing (three carried cards: Lightning Bolt, Sol Ring, Llanowar Elves, mockup loaded with `?carry=` and "Other zones" opened); context (card 1 of 6, Lightning Bolt); review (all six, filter pills); ruling (the answered chat, the thread box fixed at 320px on both sides).

| Pair | Mask file | Tolerance | Differing fraction (pixels / compared) | Threshold | Result |
| --- | --- | --- | --- | --- | --- |
| game 390x844 | game-mask-390x844.json | 12 | 0.00701 (1730 / 246760) | 0.04 | PASS |
| game 1440x900 | game-mask-1440x900.json | 12 | 0.00755 (9247 / 1224000) | 0.04 | PASS |
| zones 390x844 | zones-mask-390x844.json | 12 | 0.00724 (1787 / 246760) | 0.04 | PASS |
| zones 1440x900 | zones-mask-1440x900.json | 12 | 0.00448 (5487 / 1224000) | 0.04 | PASS |
| cards 390x844 | cards-mask-390x844.json | 12 | 0.00065 (161 / 246760) | 0.04 | PASS |
| cards 1440x900 | cards-mask-1440x900.json | 12 | 0.00529 (6476 / 1224000) | 0.04 | PASS |
| placing 390x844 | placing-mask-390x844.json | 12 | 0.00453 (1117 / 246760) | 0.04 | PASS |
| placing 1440x900 | placing-mask-1440x900.json | 12 | 0.01608 (19677 / 1224000) | 0.04 | PASS |
| context 390x844 | context-mask-390x844.json | 12 | 0.02777 (6853 / 246760) | 0.04 | PASS |
| context 1440x900 | context-mask-1440x900.json | 12 | 0.01191 (14573 / 1224000) | 0.04 | PASS |
| review 390x844 | review-mask-390x844.json | 12 | 0.02630 (6490 / 246760) | 0.04 | PASS |
| review 1440x900 | review-mask-1440x900.json | 12 | 0.01609 (19696 / 1224000) | 0.04 | PASS |
| ruling 390x844 | ruling-mask-390x844.json | 12 | 0.03023 (4588 / 151770) | 0.04 | PASS |
| ruling 1440x900 | ruling-mask-1440x900.json | 12 | 0.00973 (10099 / 1037884) | 0.04 | PASS |

Pairs live beside this file as `<state>-build-<viewport>.png`, `<state>-mockup-<viewport>.png` and `<state>-mask-<viewport>.json`.

## Named mask regions (every one has its reason in the mask file)

- closed tray shadow (x 0 to 80, full height) and closed bottom sheets glow (y 796 to 844 at 390x844): the mockup keeps its closed Menu tray and bottom sheets mounted and their glow bleeds onto the edges; the app mounts them only while open (as in `frame`).
- the conversation thread (ruling): live data; the judge's text comes from the AI provider (the mock provider's text here), not the mockup's written ruling.

## Capture-only adjustments (both sides, not app behaviour)

- Review: the "optional — blank asks ..." small text under "Your question" is hidden on both sides. The app's blank-question fallback reads from the cards in play ("Resolve the stack") and the mockup always says "How does this resolve?"; the two lines wrap differently and would shift the box below.
- Ruling: the thread is fixed at 320px, as in slice B.

## Behaviour that wins over the mockup, and where the build differs on purpose

- REQ-018: placing a carried card keeps every zone one tap away. The mockup folds the zones you did not choose behind "Other zones ▾"; the build shows all seven tiles at once (the zones already chosen first, the rest dashed). The mockup side is captured with "Other zones" opened so the two compare.
- REQ-205: the Context sheet's fields are 44px tall (the mockup's are 42px); the gap above each is 2px smaller so the sheet keeps the mockup's height. The small controls (the round ‹, the corner widgets, "Skip to review", "Leave this card out", Collapse, the review's ✎ and filter pills, the target pill's ✕) keep the mockup's look and get a transparent halo that makes the hit area 44px. The zone tabs (40px tall) keep the mockup's height: a halo there would be clipped by their scrolling strip, so they stay 40px; recorded for the owner.
- REQ-137 and REQ-138: the open roster stacks the three counter selects one per line and keeps every counter row content-sized with one gap (the mockup's roster uses a three-column grid and a stretched row). The open roster is not one of the seven paired states.
- REQ-100: each open player card keeps its own disclosure arrow (all arrows drive the one shared state); the mockup has one "More details for all players" link under the roster.
- REQ-209 guardrail, REQ-210 (Mana spent on every zone's card), REQ-211 (Copies on a Stack card, behind More details, as a - and + control inside the shared pop-up; the mockup's number picker and slide-over sheet are not built) and REQ-058 (the identity ring on the hero art and on every review thumbnail) unchanged.
- The card menu stays on the shared pop-up shell (REQ-208): a bottom sheet on a phone and a centred card on desktop. The mockup's desktop pop-over pointing at the tapped card is not built. The menu's content takes the mockup's look (thumbnail head, Move to pills with the arcane signs, one pill for the order, tray rows).
- The Zones heading reads "Zones in play" and the lede "Select every zone your question touches." (REQ-070, the mockup's own words). The step's old "Zone confirmation" heading text moved to the section's accessible label, as in the mockup.
- Context sheet: the type line and printed cost under the card name are read from the existing card-detail path (the same on-demand `GET /api/cards/:oracleId` and session cache the card detail popup uses); no new endpoint.

## C6 and C7 — REQ-216 audit (the brief's verbatim command)

`BASE` is `0e1c460` (the commit this slice started from). `FILES`: `portal/MtgAssistantApp.tsx`, `StationsRail.tsx`, `ZoneCollectionStep.tsx`, `ZoneCardPicker.tsx`, `ZoneCardMenu.tsx`, `ZoneConfirmStep.tsx`, `EnrichmentStep.tsx`, `FrozenGameContextDetails.tsx`, `PlayerRosterEditor.tsx`, `AdaptiveContextDialog.tsx`, and the new `CardHero.tsx` (all under `apps/frontend/src/components/`).

Command (the same text as `translation/frame/DIFF-RESULTS.md`):

```
PAT='#[0-9a-fA-F]{3,8}\b|rgba?\( *[0-9.]|hsla?\( *[0-9.]|\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b|shadow-\[|box-shadow: *-?[0-9]|--[a-zA-Z][a-zA-Z0-9-]*"? *:|setProperty\('
SKIP='\.test\.tsx?$|/(tokens|shell|flow|ambience)\.css$|^apps/frontend/src/lib/theme/|^apps/frontend/src/components/AmbientScene\.tsx$|^apps/frontend/src/components/trade/TradePile\.tsx$|^apps/frontend/src/components/(ScanCardOutline|ScanDebugOverlay)\.tsx$|^apps/frontend/src/lib/cardIdentityRing\.ts$|^apps/frontend/src/components/portal/life-tracker/(PlayerLifeCard|PlayerLifeTrackerApp)\.tsx$'
printf '%s\n' $FILES | grep -vE "$SKIP" | while read -r f; do cat "$f"; done | grep -cE "$PAT"      # (a1)
git diff -U0 "$BASE"..HEAD -- apps/frontend/src | SKIP="$SKIP" awk '/^\+\+\+ /{f=substr($0,7); keep=(f !~ ENVIRON["SKIP"]); next} keep && /^\+/' | grep -cE "$PAT"      # (a2)
```

(a1) printed 0 (90 hits before the rebuild). (a2) printed 0 over the working tree against `BASE` before the milestone commit (the same lines the commit holds). To get there: the mockup's literal shadows moved into named tokens in `lib/theme/glows.css` (`--idq-shadow-*`, `--dialog-shadow`), the card-back and position-tag fills became `--card-back` and `--pos-ground`, the Cards shelf's tile width (`--tile-w`) is declared there too, and `#ff8fa3`/`#000` forms read `--status-error` or `black`. `EnrichmentStep.tsx` no longer holds `#e2e8f0` (grep count 0, C13).

## C8 — profile-switch pair

`cards-profile-red-build-390x844.png` and `cards-profile-green-build-390x844.png` (the mockup's own capture beside each): the rail's nodes and lit path, the Add/Scan chips, the zone tabs and counts, the hint plate, the shelf glow and card rings' accent, the order tags, the Continue bar and its chevron, the scene and the header all recolour; nothing is left on Blue. Differing fractions against the mockup (unmasked, tolerance 12, the closed-tray and sheet-glow edges included): red 0.0992, green 0.0669, shown for completeness.

## C9 — Life Tracker table (REQ-202)

`translation/life-tracker-table/after-build-<viewport>.png` re-captured after this slice: it is pixel-identical to the previous capture (0 differing pixels at both widths), so this slice does not touch the table.

## C11, C12, C14 — observations

- C11: the ruling shows a pencil Edit chip beside View context and the round ↺ at both widths (`ruling-build-*.png`). The new tests: `EnrichmentStep.test.tsx` ("ruling ✎ Edit (REQ-209)") and `App.answered-state.test.tsx` ("renders ✎ Edit beside View context and Start over, and returns to the review with everything kept"): the answered thread is in Question History before Edit, the review comes back with the card, its details and the question, and the next send adds a second history entry.
- C12: each of the seven states renders in the mockup's DOM order (the pairs above); the placing state offers all seven zones at once.
- C14: the identity ring is on the hero art of the Context sheet and on every review row's thumbnail; the existing ring tests pass (`App.interaction-flows.presentation.test.tsx`, `EnrichmentStep.card-state-cues.test.tsx`) and the Review pair shows the rings.

## C10 — cleanup evidence

- Playwright browser closed with `browser_close` (result: no open tabs).
- Servers this slice started and stopped: the build server (`VITE_ASK_AI_PROVIDER=mock PORT=3411 FRONTEND_PORT=5411 node scripts/dev.mjs`), the mockup server (`python3 -m http.server 5413` on the scratch copy of the mockup folder) and the one-file capture collector on 5414.
- Ports released: `lsof -i :5411`, `:3411`, `:5413`, `:5414` each printed nothing in the listening state. Ports 5273, 3100 and 5300 were never touched.
- Capture path: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ui-look-translation/docs/design/ui-reimagining/build-screenshots/translation/in-depth/`.
