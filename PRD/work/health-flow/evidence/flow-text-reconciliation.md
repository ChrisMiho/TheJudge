# Flow text reconciliation (health-flow)

Every "PRD vs live" note from the four flow walks, sorted against the feature specs and REQs. Read-only: nothing in `PRD/sections/` was changed. Line numbers are as of 2026-10-20.

## Summary

- Counts: **A** (flow text stale) 10 · **B** (live app differs from spec) 4 · **C** (spec gap) 7 · **D** (test-only note) 30. Plus 5 known bugs handled elsewhere.
- B1 — Ask a Question answer screen shows a "CARDS" strip of tiles, each opening the card-detail sheet; the spec promises one "Sol Ring" / "N cards" button opening a bottom sheet or right drawer. Recommend: amend the spec.
- B2 — Trade Balancer's printing picker has no "N printings" heading; the spec promises one. Recommend: fix the app.
- B3 — Send feedback from Ask a Question leaves out the typed question, cards and conversation; the spec says the snapshot carries them. Recommend: fix the app.
- B4 — In-depth card tiles have a direct ✕ Remove; one spec sentence says the card menu replaces it. Recommend: amend that one spec sentence.

## Known bugs (handled elsewhere)

1. FLOW-005 / FLOW-011: a follow-up fails with 400 after a long answer (each history message is capped at 10,000 characters in `askAiRequest.ts:228`). The fix should also settle REQ-027's own number: `functional-requirements.md:517` says "max 2000 chars/message", the code says 10,000. Both mock-mode edge lines (`user-flows.md:117`, `:269`) depend on this fix.
2. FLOW-016 / FLOW-017: a reopened conversation's Draft is wiped by the next follow-up.
3. FLOW-014: focus does not return to the Menu button after feedback closes.
4. FLOW-017: choosing the Draft row while an answered thread is open does nothing (owner: it should open the draft). `user-flows.md:400` already says this, so no text change.
5. FLOW-006: In-depth Exit scan commits only one of several held cards.

Out of scope: FLOW-008 and FLOW-012 stub removal.

## A — flow text stale (10)

| # | Flow | What the flow text says | What the spec and the app do | Spec that backs the change |
|---|---|---|---|---|
| A1 | FLOW-005 | history over 6,000 characters is cut | the cap is 1,000,000 (effectively unlimited) | `functional-requirements.md:521` (REQ-027) |
| A2 | FLOW-005 | no ✎ Edit | ✎ Edit sits beside View Context and returns to the review with everything kept | `functional-requirements.md:5488` (REQ-209); `in-depth/README.md:323-326` |
| A3 | FLOW-006 | no camera → "fall back to manual search" | the scanner stays open and shows "Camera unavailable"; the player reaches search through Exit scan | `functional-requirements.md:1166` (REQ-053: "surfaces the existing `camera-error` path and manual search remains available"); `:1722` (REQ-071: copy `Camera unavailable`) |
| A4 | FLOW-006 | held cards use the corner detail control | each held card is a thumbnail; tapping the thumbnail opens the detail sheet; there is no corner control | `scan/README.md:122-124` |
| A5 | FLOW-007 | the profile repaints "the flat ground" | the profile repaints the colour wash over the ground; `body` stays the same dark colour in all six | `functional-requirements.md:4987`, `:5001` (REQ-200: "visibly changes the background wash") |
| A6 | FLOW-010 | Question History is listed with the destinations | Question History opens a sheet over the current screen and does not switch destination | `functional-requirements.md:5586` (REQ-213) |
| A7 | FLOW-013 | reset / New Game just resets | both ask first in the shared confirm sheet (Keep / Reset) | `life-tracker/README.md:109-110` |
| A8 | FLOW-023 | "opens Quick Question from the feature portal" | the player opens Ask a Question from the Menu | `functional-requirements.md:5356` (REQ-206) |
| A9 | FLOW-023 | "the card-attach control … then the Question field" | title with Add card / Scan, card stage, two-row question box | `functional-requirements.md:5359` (REQ-206); `quick-lookup/README.md:48-50` |
| A10 | FLOW-023 | each card is "previewed then added" | a search pick goes straight onto the stage; a scan joins when the scanner closes | `quick-lookup/README.md:59-63` |

## B — live app differs from the spec (4, owner decides)

| # | Flow | What a player sees today | What the spec promises | Governing spec | Recommendation |
|---|---|---|---|---|---|
| B1 | FLOW-011, FLOW-023 | Under the title, a "CARDS" strip with one small tile per card ("View Sol Ring"). A tap opens that card's detail sheet, centred on desktop. No button names the card or says "2 cards". | "a compact adaptive context trigger — a bottom sheet below 768px or a right-side drawer at 768px+; the trigger label names the single card or states the count (`"N cards"`)" | `quick-lookup/README.md:155-158`; `functional-requirements.md:5363` (REQ-206); `:2354` (REQ-097) | **Amend the spec.** The strip was built on purpose in the look-matching pass to match the mockup (code comment, `QuickLookupApp.tsx:483-486`). Two REQs already speak of "the strip": REQ-213 (`:5590`, "with its cards in the strip") and REQ-209 (`:5488`, "the Cards strip"). After the spec changes, FLOW-011 step 8 (`user-flows.md:260`) becomes an A edit. |
| B2 | FLOW-009, FLOW-025 | The picker heading is the card name and "Tap a price to use that printing and finish." No count shows. | "heads with the card's printing count (`N printings`, counted from the fetched list; 'only printing' for one)" | `trade-balancer/README.md:93-95`; `user-flows.md:569` agrees | **Fix the app.** It is a small change in `PrintingPicker.tsx`, and the spec is clear. |
| B3 | FLOW-014 | On Ask a Question with a typed question, the snapshot lists only Captured at, Active view, Provider mode, Route, Viewport, Build, Browser, and "Flow state: no feature contributed a snapshot". The question, cards and conversation are missing. Only In-depth registers a snapshot contributor (`MtgAssistantApp.tsx:442`). | "each report attaches a snapshot of current app state — screen/step, in-progress game context and typed question, zones/cards/enrichment, conversation history (if any) …" | `user-feedback/README.md:58-62`; `functional-requirements.md:2096` (REQ-088) | **Fix the app.** Ask a Question is the landing page, so most reports come from there with no context. |
| B4 | FLOW-002 | Each In-depth card tile has a direct ✕ ("Remove Sol Ring") and an ⓘ, as well as the tap menu with "Remove from the Battlefield". | "each tile's **Card actions** button opens a menu (…Remove — REQ-209) in place of a direct Remove button" | `in-depth/README.md:192-194` | **Amend that sentence.** The app, REQ-058 (`functional-requirements.md:1288`, "retaining Remove") and FLOW-002 step 4 (`user-flows.md:54`, "keeps Remove") all keep the tile's Remove. That README line is the only outlier. |

## C — spec gap (7)

| # | Flow | What the app does | PRD covers it? | Flow text |
|---|---|---|---|---|
| C1 | FLOW-024 | The detail popup also shows a "PRICE $1.19" chip, which sends a second request to `GET /api/cards/<id>/prices`. It shows one representative printing's price. The look-matching pass added it on purpose (`CardPresentation.tsx:46-86`). | No. FLOW-024, REQ-128 and the card-detail sections list oracle text, type, mana and colors only. | **Add a sentence**, ideally after the feature spec gains it. Draft for FLOW-024 step 3, appended: "A Price chip beside them shows one representative USD price, read from the same per-card price route Trade Balancer uses (`GET /api/cards/:oracleId/prices`, FLOW-025)." Tests ignore the chip until then. |
| C2 | FLOW-003, FLOW-005 | When a follow-up fails, the box empties and the follow-up does not appear as a bubble. Only the Retry button still holds the text. It appears after a successful retry. | Partly. REQ-014 says "question is preserved", which was written for the first ask. Nothing says where a failed follow-up's text shows. | **Leave alone.** Retry resends the right text, so nothing is lost. If the owner wants the text visible while it fails, that is a new UX ask. |
| C3 | FLOW-011, FLOW-024 | On a phone, while card search is open, the stage hides. A small thumbnail strip with "N of 10 attached" shows instead, and the stage's ✕/ⓘ come back only after Close search. | No. REQ-206 describes the stage only and says "there is no `n / <cap>` count pill" (`functional-requirements.md:5358`). The "N of 10 attached" note sits close to that line. | **Leave alone.** Tests close search before asserting the stage or opening ⓘ. Worth a look if the owner reads "1 of 10 attached" as the retired count pill. |
| C4 | FLOW-009, FLOW-025 | After a failed price fetch, Retry gave the entry a default printing ("The List · PLST") with no price, so it showed $0.00 even though other printings have prices. | No. The trade README says only that the foil mode is re-derived on retry (`trade-balancer/README.md:99-104`), not which printing is chosen. | **Leave alone.** Tests do not assert the price after a retry. If the owner wants a rule, it is "retry picks the newest priced printing". |
| C5 | FLOW-013 | A fresh tracker starts at 4 players, 40 life. | No default count is stated (`life-tracker/README.md:26-28`). | **Leave alone.** Tests set the player count explicitly. |
| C6 | FLOW-018 | On desktop, after a delete, the reading pane says "Pick a question to read it here." | No. | **Leave alone.** |
| C7 | FLOW-014 | Closing the feedback sheet throws away the typed message. | No. The spec only promises a kept draft after a send error (`user-feedback/README.md:83-85`). | **Leave alone.** |

## D — test-only notes, no PRD change (30)

| # | Flow | Note | Test guidance |
|---|---|---|---|
| D1 | FLOW-001 | The "Players in game" panel shows as a "2 players" bar under "GAME CONTEXT". The PRD uses the name as a label, not as promised copy (REQ-070 lets helper copy follow the mockup). | Use the "Show player details" button. |
| D2 | FLOW-001 | Zone checkboxes are hidden behind their labels. | Click the label text. |
| D3 | FLOW-001, FLOW-005 | A stale "Card added" / "Stacked" status line stays under the question and follow-up boxes. | Do not assert on it. |
| D4 | FLOW-001 | The players arrow does not rotate when open. | Do not assert on it. |
| D5 | FLOW-004 | The live text "Duplicate cards are not supported in MVP1." is quoted word for word by REQ-214 (`functional-requirements.md:5620`). The flow text paraphrases it. | Assert "Duplicate cards are not supported". |
| D6 | FLOW-004 | The duplicate still shows as a search suggestion; it is refused at Add. | Assert at Add. |
| D7 | FLOW-005 | Follow-up Retry starts as a 13 s countdown. This is FLOW-003 step 6's cooldown. | Wait ~15 s. |
| D8 | FLOW-005 | The banner header is brand-only, as written. "Ask a Question" is the chat's own title, which REQ-209 expects ("View Context beside the title", `:5488`). | No header assert beyond "no step name". |
| D9 | FLOW-003 | The app shows the error body's `message`. Every AI or provider failure sends "Miho is working on it" (`integrations-and-data.md:222`, `errors.ts:9`). The other sentence the walker saw came from known bug 1. | Fake errors with the real provider body shape. |
| D10 | FLOW-011 | Card-name chips can't be shown, because the mock answer never names a card. | Skip. |
| D11 | FLOW-011 | ↺ Start over has no visible word; its accessible name is "Start over — clears the cards and the question". | Use the accessible name. |
| D12 | FLOW-011, FLOW-023 | The stage shows ‹/› arrows and an "n / total" next to the dots (accessible name "Card n of total"). | Use the accessible names. |
| D13 | FLOW-023 | Search also lists "Sol Ring // Sol Ring" and "Soaring". | Pick by exact name. |
| D14 | FLOW-016 | One card shows as a single tile; no cards shows a dashed tile. REQ-213 already says "three, then +n; a dashed frame for none" (`:5589`). | — |
| D15 | FLOW-016 | The 600–1000px range was not walked. | — |
| D16 | FLOW-017 | The stored Draft shape has no zones in lookup mode, which is fine. | Do not seed storage by hand. |
| D17 | FLOW-018 | The confirm sheet's buttons read "Keep" / "Delete". REQ-208 says "a keep action and a clear action" (`:5450`). | Use the live names. |
| D18 | FLOW-018 | The phone delete control is the word "Delete" with accessible name "Delete: Ask a Question: <title>". | Use that name. |
| D19 | FLOW-006 | The scan can land on a same-art reprint (TSP scanned, PLST added). This is already parked as a bug in `PRD/ideasForLater/codebase-cleanup-followups/IDEA.md` §1. | Never assert a printing from a scan. |
| D20 | FLOW-009 | The verdict reads "Lopsided — Side A by 100%", which names the side as the spec asks. | Assert the side name or "Even". |
| D21 | FLOW-009 | Identical printings merge into one row with quantity 2, as `trade-balancer/README.md:115-117` says. | Assert quantity, not row count. |
| D22 | FLOW-025 | No player can reach an unknown oracle id. | Skip. |
| D23 | FLOW-024 | "No layout shift" was not measured. | No pixel asserts. |
| D24 | FLOW-010 | The URL changes to `/life-tracker`. | Fine to assert. |
| D25 | FLOW-013 | "before Decrypt" is still right: Decrypt is the send pill (accessible name "Decrypt Stack", `in-depth/README.md:254-256`). "Confirm game context" is the Game station's Continue. | Use both live names. |
| D26 | FLOW-013 | The −/+ labels include the display name ("Decrease life for Player 1 (Ada)"). | Use a regex. |
| D27 | FLOW-013 | A per-player "Day/night" counter exists apart from the header pill (`life-tracker/README.md:82-84`). | Scope locators. |
| D28 | FLOW-014 | "Message required" and "bad email" can't be reached in the unconfigured build (submit is disabled). | Unit tests own them. |
| D29 | FLOW-014 | The thank-you, error and rate-limit states need a real Formspree post. | Unit tests own them. |
| D30 | FLOW-014 | The snapshot's provider mode reads the frontend setting ("openai"), not the backend's. | Do not assert "mock". |

## A diffs — exact text for `PRD/sections/user-flows.md`

Each `old` matches exactly once in the file (checked with `grep -cF`).

### FLOW-005

A1, line 116:

```old
`MAX_CONVERSATION_HISTORY_CHARS` (6000)
```

```new
`MAX_CONVERSATION_HISTORY_CHARS` (1,000,000, effectively unlimited — REQ-027)
```

A2, line 115 (adds one edge case after it):

```old
  - start over is not available while a request is in flight
```

```new
  - start over is not available while a request is in flight
  - once a ruling exists, **✎ Edit** beside View Context returns to the review with the game context, every card's details and the question kept; the answered conversation is already saved to Question History and the next send starts a new conversation (REQ-209)
```

### FLOW-006

A3, line 146:

```old
  - if camera permission is denied or unavailable, fall back to manual search and surface the reason
```

```new
  - if camera permission is denied or unavailable, the scanner shows the reason (`Camera unavailable`) and manual search stays available through **Exit scan** (REQ-053, REQ-071)
```

A4, line 136 (two replacements in step 5):

```old
Its viewport-capped 320px panel lists each held card with the shared container-relative image + corner detail popup presentation and a persistent Remove control
```

```new
Its viewport-capped 320px panel lists each held card as a thumbnail with its name and a persistent Remove control
```

```old
An available uncropped image grows to its list-row width (DEC-160) without displacing the camera chrome; the corner control opens a popup whose descriptive fields
```

```new
The thumbnail never displaces the camera chrome; a tap on it opens the shared card detail popup (the entry has no corner-detail overlay), whose descriptive fields
```

### FLOW-007

A5, line 170:

```old
applies the selected profile to the whole surface — the flat ground,
```

```new
applies the selected profile to the whole surface — the colour wash over the flat ground,
```

### FLOW-010

A6, line 229:

```old
lists **Ask a Question** (current also while In-depth details is open), **Question History**, **Life Tracker**
```

```new
lists **Ask a Question** (current also while In-depth details is open), **Question History** (which opens its sheet over the current screen rather than switching destination, REQ-213), **Life Tracker**
```

### FLOW-013

A7, line 302:

```old
an explicit reset / New Game returns counters to starting values
```

```new
an explicit reset / New Game, after a confirm in the shared confirm sheet (REQ-208), returns counters to starting values
```

### FLOW-023

A8, line 527:

```old
  1. User opens Quick Question from the feature portal; the app switches to the lookup view (frontend-only, no reload).
```

```new
  1. User opens **Ask a Question** from the Menu (REQ-206); the app switches to the question page (frontend-only, no reload).
```

A9, line 528:

```old
the card-attach control — now able to hold more than one card — then the Question field
```

```new
the title with **Add card** and **Scan** beside it, the card stage when any card is attached, then the two-row question box
```

A10, line 529:

```old
each resolves to one oracle-level card, previewed then added, and each can be removed
```

```new
each resolves to one oracle-level card placed on the stage at once (a scanned card joins when the scanner closes, REQ-214), and each can be removed
```
