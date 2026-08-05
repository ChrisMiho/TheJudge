# IDEA: chrome-hit-areas-and-mid-flight-exits

## Problem

The Menu corner rail (DEC-122/DEC-126/DEC-133) is an invisible edge-strip hit area, and on
destinations without a History zone it is 5.5rem × 10.5rem — large enough to sit on top of real
destination content. On Life Tracker it covers roughly 88 × 125px of Player 1's card, so taps in
that corner open the Menu instead of adjusting life; DEC-136 made the whole card a life zone, which
turns a previously-tolerable overlap into a live mis-tap during a game. The same rail also covers
the first characters of every destination's step-name eyebrow. Separately, opening a saved
conversation is a third way to leave mid-flight staging that DEC-130's Draft slot does not cover:
Menu-leave and reload both snapshot a Draft, but selecting a history entry discards the staged
attempt (zones, cards, enrichment, typed question) with nothing written to
`thejudge.conversationDraft.<mode>`. Finally, the Life Tracker counter panel is still a
content-sized bottom sheet — the shape the history drawer moved away from in DEC-134.

## Outcome

Suite chrome never intercepts taps meant for destination content: the Menu rail's hit area is
bounded to what it actually paints (or destination content is inset clear of it), verified by
hit-testing the overlap regions rather than by eyeballing screenshots. Leaving mid-flight staging by
opening a saved conversation snapshots a Draft first, exactly as Menu-leave already does, so the
staged attempt is recoverable from the same drawer. Modal/panel surfaces read as one family rather
than a mix of left trays and content-sized bottom sheets.

## Non-goals

Redesigning the corner rail's visual language, the destination registry, seat arrangements, or the
conversation contract; adding new counters, destinations, or Draft slots; any backend, prompt,
`AskAiRequest`, Zod, or data-pipeline change.

## Evidence

Found with Playwright MCP at 430 × 900 against the branch behind PR #71, after that PR's fixes.

| # | Severity | Finding | Measurement |
| --- | --- | --- | --- |
| 1 | high | Menu rail overlaps Life Tracker's Player 1 card; taps there open the Menu instead of adjusting life | rail `0,0 88×168`; card `12,56 199×406`; overlap ≈ 8,512px²; `document.elementFromPoint(22, 66)` → `Switch feature` |
| 2 | medium | Rail overlaps the step-name eyebrow on every destination | rail `13,13 88×76`; `Quick Question` H2 at `25,83 380×24`; `elementFromPoint(30, 95)` → `portal-menu-rail-zone` (History) |
| 3 | medium | Selecting a saved conversation from mid-flight staging discards the staged attempt with no Draft | staged In-Depth at zone-collection with Battlefield card → select history entry → `localStorage` holds only `thejudge.conversationHistory.entries`; no `thejudge.conversationDraft.game` |
| 4 | low | Counter panel is a content-sized bottom sheet, unlike the history drawer (DEC-134) and Menu tray (DEC-133) | `PlayerLifeTrackerApp` `GameSetupModal` / `CounterPanel` overlays |
| 5 | low | Pre-submit staged screens leave the lower half of the shell empty | Quick Question landing, zone confirm, zone collection at 430 × 900 — already an explicit DEC-131 non-goal; confirm whether it stays deferred |

## Related product truth

`DEC-122`, `DEC-126`, `DEC-127`, `DEC-133`, `DEC-135` (rail geometry and menu chrome);
`DEC-130` / `FLOW-017` (Draft slot); `DEC-134` (history drawer geometry);
`DEC-101` / `DEC-136` (life card tap zones); `NFR-001` (touch targets).
