# Slice B — Ask a Question: pair results

Screen: Ask a Question (pre-submit with five cards, the Add-card search open, the answered view with a follow-up typed). Visual source: `docs/design/ui-reimagining/direction-1/quick-question.html`.

Slice threshold: differing fraction at most 0.02 per pair (below the 0.05 ceiling; measured maximum 0.0174 at tolerance 12, so the planner's starting 0.04 is lowered to 0.02). Tolerance 12 per channel on every pair.

How the pairs are made: the same as `translation/frame/DIFF-RESULTS.md` (build in mock mode on 5411, a seeded-scene copy of the mockup on 5413, reduced motion, Blue, Playwright). The five cards are Lightning Bolt, Sol Ring, Llanowar Elves, Swords to Plowshares and Counterspell (the mockup's first five), with Lightning Bolt in front. The mockup's own scaffolding (`.demo-bar`, `.foot-note`, the phone `DEMO` tab) is hidden on the mockup side. Capture-only CSS that fixes a height on both sides: the Add-card result list at 150px (the app lists live matches, the mockup filters a demo shortlist) and the conversation thread at 320px (the mock provider's answer is a long dump of the prompt, the mockup's is two short paragraphs).

| Pair | Mask file | Tolerance | Differing fraction (pixels / compared) | Threshold | Result |
| --- | --- | --- | --- | --- | --- |
| default-with-cards 390x844 | default-with-cards-mask-390x844.json | 12 | 0.01738 (3714 / 213720) | 0.02 | PASS |
| default-with-cards 1440x900 | default-with-cards-mask-1440x900.json | 12 | 0.00996 (11832 / 1187586) | 0.02 | PASS |
| add-card-search 390x844 | add-card-search-mask-390x844.json | 12 | 0.00239 (404 / 168880) | 0.02 | PASS |
| add-card-search 1440x900 | add-card-search-mask-1440x900.json | 12 | 0.01036 (11437 / 1103776) | 0.02 | PASS |
| answered-follow-up 390x844 | answered-follow-up-mask-390x844.json | 12 | 0.00005 (5 / 110881) | 0.02 | PASS |
| answered-follow-up 1440x900 | answered-follow-up-mask-1440x900.json | 12 | 0.00270 (2678 / 993480) | 0.02 | PASS |

## Named mask regions (reasons are in each mask file)

- closed tray shadow and closed bottom sheets glow: the mockup keeps its closed Menu tray and three bottom sheets mounted off-screen and their glow bleeds onto the edges (as in `frame`); the app mounts them only while open.
- question box (the whole `.q-box` or `.followup`): REQ-205 wins over the mockup. The In-depth chip and the mic|send pill paint 44px (the mockup's are 40px), so the box is 4px taller and the pill 8px wider.
- search results (Add-card search): live data; the app lists matches from the whole card corpus, the mockup filters a ten-card demo shortlist.
- the conversation thread (answered view): live data; the judge's text comes from the AI provider (the mock provider's text here); the user's question bubble sits inside the same masked box.
- card art thumbnails (answered view, CARDS strip): the app draws the corpus image at its stored size, the mockup its own copy.

## Behaviour that wins over the mockup, and where the build differs on purpose

- REQ-205: the box controls (above).
- REQ-079 retired: no General rules topics panel and no locked topic pill (the mockup has none).
- REQ-167 and REQ-206: the Add-card search lists matches from the first character typed; the dots replace the `n / 10` pill. The mockup's dots row also carries a small `1 / 5` count (n of the cards attached, not of the cap); the build draws it as the mockup does.
- A card added turns the ring to it (the mockup's `focus = attached.length - 1`); the app's old build kept the front card where it was.
- The mockup's search results show a card type on the right (`.type`); the app's card list holds no type, so the column is not drawn.
- B12 literal wording versus the mockup: the criterion says the composer is two rows at both viewports. At 390x844 it is (text on top; In-depth chip bottom-left; mic|send pill bottom-right). At 1440x900 one line of text keeps the chip, the text and the pill in one row, exactly as the mockup draws it, because `flow.css` gives the box its two-row shape only when the text needs a second line (`:has(textarea.grown)`). The mockup wins on look, so the build follows it and the pair passes; the literal "two rows at both viewports" is not met at desktop width. Review decides.
- B17 helper text (REQ-070), side by side with the mockup: the question box hint is "What would you like to know?" in both (shortened in tiers on a narrow box by the same measurement the mockup uses); the Add-card field hint is "Search for a card to add" in both; the title row, the stage, the dots and the box carry no hint line in either. Differences: a conversation reopened from Question History reads "Reopened from your history" (the mockup adds the mode, how long ago and the game context); the mockup's Add-card results list shows each card's type, the app does not.
- The mock provider's answer shown in the thread is a dump of the prompt, not a ruling; it is a mock-mode artefact, not a layout difference.

## B8 — profile-switch pair

`default-with-cards-profile-red-build-390x844.png` and `default-with-cards-profile-green-build-390x844.png` (the mockup's own capture beside each): the header band, brand orb, title row chips, stage glow and arrows, dots, the question box edge, the In-depth chip and the mic|send pill, the scene and the tray's pool all recolour; nothing is left on Blue. Found and fixed on the way: the stage's `.ring` shares its name with Tailwind's `ring` utility, which painted a fixed blue 3px box-shadow round the stage in every profile; `index.css` now gives `.ring` no shadow.

## B9 — Life Tracker table (REQ-202)

`translation/life-tracker-table/after-build-<viewport>.png` re-captured after this slice (the table is unchanged by this slice; the difference from `before-build-` is the shared header and banner, as recorded in `frame`).

## B6 and B7 — REQ-216 audit (the brief's verbatim command, as recorded in `translation/frame/DIFF-RESULTS.md`)

`BASE` is `aa8a05e` (the commit this slice started from). `FILES`: `portal/quick-lookup/QuickLookupApp.tsx`, `CardStage.tsx`, `ComposerPill.tsx`, `DictationMicButton.tsx`, `ConversationThread.tsx`, `ConversationWorkspace.tsx`, `FollowUpComposer.tsx`, `AskAiWaitingPanel.tsx`, `CardSelectionPreview.tsx`, `StepEyebrow.tsx` (all under `apps/frontend/src/components/`; `ComposerSubmitButton.tsx` was dead code apart from its send glyph and is deleted).

(a1) over `FILES` printed 0. (a2) over every line added under `apps/frontend/src` since `BASE` printed 0. To get there: the error and note colours moved into status tokens (`--status-error`, `--status-warn`) in `lib/theme/glows.css` (token layer); the card tile and wait bubble classes moved onto `var(--surface-*)`/`var(--text-*)` tokens in `index.css`; the stage's ring placement (`--d`) and the budget fill (`--fill`) are set by token-layer helpers in `lib/theme/flowStyles.ts` so no component declares a custom property.

## B10 — cleanup evidence

- Playwright browser closed with `browser_close` (result: no open tabs).
- Servers this slice started and stopped: the build server (`VITE_ASK_AI_PROVIDER=mock PORT=3411 FRONTEND_PORT=5411 node scripts/dev.mjs`), the mockup server (`python3 -m http.server 5413` on a scratch copy of the mockup folder) and the one-file capture collector on 5414.
- Ports released: `lsof -i :5411`, `:3411`, `:5413`, `:5414` each printed nothing. Ports 5273, 3100 and 5300 were never touched.
- Capture path: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ui-look-translation/docs/design/ui-reimagining/build-screenshots/translation/ask-question/`.
