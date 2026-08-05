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
Re-verified 2026-08-05 against `main` at `6f4b1d7`; measurements below are the re-verified
values. (Coordinates are stated production-relative — the dev shell's 32px mock-mode banner
offsets every live `y` reading by +32.)

| # | Severity | Finding | Measurement |
| --- | --- | --- | --- |
| 1 | high | Menu rail overlaps Life Tracker's Player 1 card; taps there open the Menu instead of adjusting life | rail `0,0 88×168` (`aria-label="Switch feature"`); `Decrease life for Player 1` button `13,57 197×202`; overlap `75×111` = **8,325px²**; `elementFromPoint` at `(22,34)`, `(40,68)`, `(60,118)`, `(80,158)` all → `Switch feature`, so the rail wins every contested point |
| 2 | medium | Rail overlaps the step-name eyebrow on every destination with a History zone | split rail `13,13 88×76`; its History zone `13,51 88×44`; `Quick Question` H2 at `25,83 380×24`; overlap `76×12`, covering the eyebrow's first 76px; `elementFromPoint(30, 83)` → `Conversation history` |
| 3 | medium | Selecting a saved conversation from mid-flight staging discards the staged attempt with no Draft — **in both conversation modes**, not just In-Depth | Quick Question staged with a typed question → open History → select entry → question gone from the DOM, `localStorage` holds only `thejudge.conversationHistory.entries`, no `thejudge.conversationDraft.lookup`. Contrast proven in the same session: staging the same question and leaving via Menu **does** write `thejudge.conversationDraft.lookup`. Same defect in both handlers — `MtgAssistantApp.tsx:651` and `QuickLookupApp.tsx:272` each call `restoreConversation(entry)` with no preceding `saveDraft` |
| 4 | low | Counter panel is a content-sized bottom sheet, unlike the history drawer (DEC-134) and Menu tray (DEC-133) | already owned by [`life-tracker-me-map-and-tray`](../life-tracker-me-map-and-tray/), which covers the same tray from the "cuts off the matrix" angle — fold this consistency note into that package rather than duplicating it |
| 5 | low | Pre-submit staged screens leave the lower half of the shell empty | Quick Question landing, zone confirm, zone collection at 430 × 900 — already an explicit DEC-131 non-goal; confirm whether it stays deferred |

## Mechanism (re-verified in source)

Findings 1 and 2 share one root cause: `.portal-menu-rail` (`index.css:100`) is an absolutely
positioned `5.5rem × 10.5rem` box whose *only* paint is a radial gradient that reaches full
transparency at 78% of its own extent. The hit area is the whole box; the visible glow is a
fraction of it. Everything past the fade is an invisible interceptor, and `z-index: 3` puts it
above destination content. The two-zone `.portal-menu-rail-split` variant is shorter
(`clamp(4.75rem, 4.1rem + 2.5vw, 6.25rem)` → 76px at 430px) but has the same paint-vs-hit gap.

Finding 3's mechanism: the Draft snapshot is an effect keyed on the `isActive` true→false edge
(`MtgAssistantApp.tsx:313`, `QuickLookupApp.tsx:126`). Menu-leave deactivates the destination and
fires it; reload is covered separately. Selecting a history entry never changes `isActive` — the
destination stays mounted and active — so the effect never runs and `restoreConversation` clobbers
staging in place.

## Related product truth

`DEC-122`, `DEC-126`, `DEC-127`, `DEC-133`, `DEC-135` (rail geometry and menu chrome);
`DEC-130` / `FLOW-017` (Draft slot); `DEC-134` (history drawer geometry);
`DEC-101` / `DEC-136` (life card tap zones); `NFR-001` (touch targets).
