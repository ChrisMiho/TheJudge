# In-Depth Question tool: browser test rows, verified live

Flows: FLOW-001, FLOW-002, FLOW-004, FLOW-005, FLOW-015.
Walked 2026-10-20 against the live app (frontend :5792, mock-AI backend :5791), phone 390x844 and desktop 1280x800, headless Chrome.
Scripts and screenshots: `/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/74cadfda-9e1b-4aea-877f-fe60b293ae3a/scratchpad/flow-walk/in-depth/`.

## Read this first (things that change how the tests are built)

1. **The mock AI breaks the second chat turn.** The mock answer is the whole assembled prompt (about 19,000 characters). The follow-up request sends that answer back as history, and the backend rejects any history message over 10,000 characters: `400 VALIDATION_ERROR ... conversationHistory.1.content String must contain at most 10000 character(s)`. The player sees "Retry in 12s" and the follow-up never lands. So FLOW-005 can only be tested if the test swaps the first answer for a short fake one in the browser's network layer (route the POST, let the real backend answer, then hand the page a short `answer`). The test can still read the real mock response to check the prompt. This is also a possible real bug: a long real answer (over 10,000 characters) would break the next follow-up the same way, even though the PRD says oldest turns are truncated at 6,000 characters.
2. **`playwright` is in `package.json` (1.63.0) but not installed in `node_modules`.** I ran with 1.61.1 from the npx cache. The suite build must install it.
3. **A two-card walk changes the Context buttons.** With one card the Context station ends with "OK — finish context". With two or more cards it shows "Next card" until the last card, then "Finish context". The reference smoke script only walks one card, so a shared walk helper must click "Next card" (card count minus one) times and then match `/finish context/i`.
4. Card images: route `cards.scryfall.io` to a 1x1 PNG. A card tile in image mode shows no name text, so tests find tiles by the buttons `Remove <name>`, `Show details for <name>` and the group `Card actions for <name>`.

---

## FLOW-001 Capture game context, zones, and ask a question

### Row
- **Setup:** fresh browser context, no stored state. Image route as above. Watch `POST /api/ask-ai` to read the request body. Do not alter the response.
- **Steps (player terms):**
  1. Open In-depth (`/in-depth`). Station rail shows 1 Game, 2 Zones, 3 Cards, 4 Context.
  2. Tap the "2 players" bar (button "Show player details"). Type "Alice" in "Player 1 display name" and 17 in "Player 1 life total". Tap one "Show secondary details for all players" arrow.
  3. Tap "Continue" (button name "Confirm game context").
  4. On Zones, untap Battlefield and Hand. "Continue" is disabled. Tap Stack and Battlefield.
  5. Tap "Continue". On Cards, open the "Stack" tab, tap "Add a card to Stack", type "Lightning Bolt", pick it, tap "Begin stackening!". Open the "Battlefield" tab, tap "Add a card to Battlefield", type "Sol Ring", pick it, tap "Add card".
  6. Tap "Continue". On Context walk the two cards with "Next card", then "Finish context".
  7. Leave the question box blank. Tap the send pill (button "Decrypt Stack").
- **Expected results:**
  - Both secondary-details arrows flip together; the second player's block opens too, and the page has no sideways scroll. (PRD: "activating any arrow expands or collapses ... for all active players"; "must not ... introduce document-level horizontal scroll".)
  - Active player list reads "Player 1 (Alice)". (PRD: "Active player and downstream player selects show display names as `Player N (Name)`".)
  - With both zones untapped, "Continue" is disabled. (PRD: "at least one zone is required to continue".)
  - Zone tabs read "Stack1" and "Battlefield1"; Hand has no tab because it was unticked. (PRD step 3.)
  - The review says "optional — blank asks “Resolve the stack”". (PRD: blank question uses "Resolve the stack" when the stack has cards.)
  - The request body has `question` = "Resolve the stack", `players[0]` with `displayName: "Alice"` and `lifeTotal: 17`, `turnPhase: "main_1"`, `selectedZones` = stack and battlefield, and `zones` holding only `stack` and `battlefield` (no `hand` key). (PRD: "if a selected zone has no cards, omit that zone key"; step 5 payload.)
  - The answer screen shows the user's first bubble "Resolve the stack" and one assistant bubble with some text (presence only). (PRD step 7 and FLOW-005 step 1.)
- **Sizes:** phone and desktop. The layout differs (stations, sheets), so both are worth walking.
- **Must-fail break:** in `apps/frontend/src/lib/contextFlow/flow.ts` change `DEFAULT_STACK_QUESTION` to a different string. The blank-question check and the first bubble fail. Second break: in the zone step, let "Continue" stay enabled with zero zones (the zero-zone guard); the disabled check fails.

### Verified live?
Yes at both sizes. Walked every step above; the payload matched (`question:"Resolve the stack"`, `displayName:"Alice"`, `lifeTotal:17`, `selectedZones:["stack"]` in my one-zone variant, only populated zones in `zones`). Zero zones leaves "Continue" disabled. Combat phase shows a "Combat step" select defaulting to Declare Blockers. Secondary arrows are synchronized (both `aria-expanded=true`). No horizontal page scroll with details open at either size.
I did not run a stack-plus-battlefield combined payload in one pass; I ran stack-only (blank question) and battlefield-only (typed question) payloads.

### PRD vs live discrepancies
- PRD: "The expandable **Players in game** panel". Live: the panel bar reads "2 players" under a "GAME CONTEXT" heading; no text says "Players in game". Assert on the "Show player details" button, not the words.
- PRD: "Zone confirmation ... preselects likely zones". Live matches (Battlefield and Hand at main_1), but the zone choices are hidden checkboxes behind labels. Tests must click the label text ("Stack"), not `check()` the input.
- PRD: "the composer ... a send pill". Live matches (button named "Decrypt Stack", no visible text).
- Stale text: after finishing Context the small status line still reads "Card added" (or "Stacked") under the question box, and it also shows under the follow-up composer after the answer arrives. Cosmetic; do not assert on that line.
- Expanded players arrow: the little triangle stays pointing right when details are open. Cosmetic.

### Edge cases
| Edge case | Include? | Why |
|---|---|---|
| Missing/invalid game context blocks Continue | Skip | Hard to make invalid through the UI; life/name inputs clamp. Unit-tested in `App.game-setup-zones.test.tsx`. |
| Zero zones blocks Continue | Include | Player-visible, quick, one click. |
| Selected zone with no cards omitted from payload | Include | Checked in the request body. |
| No selected zone has a card blocks Continue | Include | Seen: Continue is disabled with an empty zone. Same zone-empty state as FLOW-002's last-card edge, so test it once, in FLOW-002. |
| "No matching card found" | Include | Seen live with a nonsense search. One line in the FLOW-004 walk, not its own flow. |
| Blank question fallback | Include | "Resolve the stack" seen. The other fallback (no stack: "Explain the interaction with the provided game state") is seen on the review screen; skip as a second walk, same code path. |
| Stack selected but empty, another zone has cards: submit allowed | Skip | Not walked; pinned in `App.interaction-flows.stack-context.test.tsx`. |
| Empty/same-as-label display name counts as unset | Skip | Unit-level (`DEC-027` tests). |
| Image absent or fails: name fallback, no broken icon | Include in FLOW-002 | Same tile; seen live (tile shows "Sol Ring", zero broken images). |
| Silver ring for colorless / colors missing | Skip | Pixel/colour; the owner does not want style checks. |
| Stack cap of 10 | Include in FLOW-004 | Seen live. |
| Phase change keeps cards | Skip | Not walked; unit-tested. |
| Secondary details default collapsed, reset after leaving and returning | Partly include | Include "default collapsed" and "all arrows flip together". Skip "reset on return" (one more navigation, low value). |
| No sideways page scroll with details open | Include | Cheap check on both sizes. |
| Composer never collapses or clips after leaving and resizing (DEC-131) | Skip | Needs resize mid-walk; pinned in `App.responsive-presentation.test.tsx`. |
| Composer grows with typing, no page scroll | Skip | Pixel behaviour. |
| Card-detail add action in first viewport on phone | Skip | Pixel behaviour. |
| Brand-tap 10x hero reveal | Skip | Pinned in `App.brand-tap-egg.test.tsx`. |

### Can't assert
- Anything the real AI says. The mock answer is the full prompt; assert only that a non-empty assistant bubble exists.
- Camera scan (headless fake camera, other flow).
- Exact colours, ring glow, card art (the 1x1 image is a dark red block).

---

## FLOW-002 Inspect and remove cards from selected zones

### Row
- **Setup:** fresh context, image route normal. For the image-fail leg: a second context where `cards.scryfall.io` is aborted instead.
- **Steps:**
  1. Open `/in-depth`, "Continue", "Continue" to Cards (Battlefield and Hand are preselected).
  2. Tap "Add a card to Battlefield". Add "Sol Ring" with owner "Player 1", then "Sol Ring" again with owner "Player 2", then "Lightning Bolt".
  3. Read the Battlefield tab count. Tap the ✕ on the first Sol Ring tile (button "Remove Sol Ring").
  4. Tap "Continue" twice to the review. Read which owner remains.
  5. Tap "Station 3: Cards" and remove the last card.
  6. Image-fail leg: repeat the add with images aborted.
  7. Tap a tile's "Card actions" area (the tile), read the tray.
- **Expected results:**
  - Tab reads "Battlefield3", tiles in add order: Sol Ring, Sol Ring, Lightning Bolt. (PRD step 2: "in add order".)
  - Removing the first Sol Ring takes the tab to "Battlefield2" and leaves one Sol Ring and the Lightning Bolt. (PRD step 5-6: "Zone card count updates".)
  - The review lists Sol Ring "Player 2’s". (PRD note: "removing ... one copy targets only that copy and leaves its siblings intact".)
  - After removing the last card the tab reads "Battlefield0" and "Continue" is disabled. (PRD edge: "that zone remains selected but is omitted from the request payload"; FLOW-001: "continue/submit is blocked until the user adds a card to a selected zone".)
  - Image-fail leg: each tile shows the card name as text, zero broken images, and "Remove" and "Show details" still work. (PRD: "show no broken-image icon ... name-only fallback ... keep the complete tile controls".)
  - The tray (tap on a tile) offers a zone list, Left/Right (non-stack) or order moves, "ⓘ Card details", and "✕ Remove from the Battlefield". (PRD step 4 / FLOW-001 step 3: "Move to · order · Card details · Remove".)
- **Sizes:** phone and desktop (both walked; same results).
- **Must-fail break:** in `apps/frontend/src/components/ZoneCardMenu.tsx` (or the remove handler it calls) remove by `cardId` instead of `instanceId`. Both Sol Rings vanish, the count and owner check fail. Second break: make the image-error handler render nothing; the name-fallback check fails.

### Verified live?
Yes at both sizes. Saw counts 3 then 2 then 0, the right copy left ("Player 2’s"), tray with Remove from the Battlefield, zero broken images with images aborted and the card name shown, and "Continue" disabled at zero cards.
Not verified: the card-details popup content (that is FLOW-024) and horizontal scroll of a long strip (not reached with three tiles).

### PRD vs live discrepancies
- PRD: "a tap opens the card's menu (Move to · order · Card details · Remove)". Live: the tile also has a direct ✕ button (`Remove <name>`) on its face, in addition to the tray's "Remove from the Battlefield". Two ways to remove. Tests should pick one (the ✕) and treat the tray as a separate check.
- PRD FLOW-002 step 4: "Image mode keeps Remove and stack position where applicable while hiding duplicated identity labels". Live: matches (no name text on image tiles, "TOP"/"BOTTOM" tags on stack tiles).
- PRD: "a corner detail control opens a dismissible popup". Live: the ⓘ button is there (`Show details for <name>`); I did not open it.

### Edge cases
| Edge case | Include? | Why |
|---|---|---|
| Image absent/fails: name fallback, no broken icon | Include | Seen live; player-visible. |
| Last card removed: zone stays selected, omitted from payload | Include | Seen: tab "Battlefield0", Continue disabled. Payload omission is covered by FLOW-001's payload check. |
| Same card twice, remove one copy, sibling intact | Include | Seen live via owners. This is the one-line guard for DEC-082. |
| Manual reorder out of scope | Skip | Not a behaviour. |
| Tile ring colours | Skip | Style. |

### Can't assert
- The real card art or colours (1x1 stub image).
- Fetch-on-demand card detail text (needs the card API; FLOW-024).

---

## FLOW-004 Block duplicate stack card add

### Row
- **Setup:** fresh context. Image route normal.
- **Steps:**
  1. Open `/in-depth`, "Confirm game context", tap the "Stack" zone label (so Stack, Battlefield, Hand are on), "Continue".
  2. Tap the "Stack" tab, then "Add a card to Stack". Type a nonsense word; see "No matching card found". Type "Sol Ring", pick it, tap "Begin stackening!".
  3. Search "Sol Ring" again, pick it, and tap "Add to Stack" (the button name changes once the stack has a card).
  4. Optional second leg in the same test: add nine more different cards to reach ten, search an eleventh, pick it, tap "Add to Stack".
- **Expected results:**
  - Empty stack: the add button reads "Begin stackening!"; after one card it reads "Add to Stack". (In-depth spec: "reads Begin stackening! when empty and Add to Stack otherwise".)
  - The second Sol Ring is refused: a message containing "Duplicate cards are not supported" shows and the Stack tab still reads "Stack1". (PRD steps 3-4: "UI blocks the add. UI shows a message that duplicate cards are not supported yet.")
  - The first card carries a "TOP" tag; with two different cards the tags read "BOTTOM" then "TOP". (Spec: "shelf tags cards BOTTOM … TOP".)
  - Ten cards: tab "Stack10" and the eleventh add is refused with "MVP stack limit reached (10 cards)." and the tab stays "Stack10". (FLOW-001: "if the stack has 10 cards, block additional adds".)
- **Sizes:** phone and desktop (duplicate leg walked on both; the ten-card leg walked on phone only).
- **Must-fail break:** in `apps/frontend/src/lib/zoneCards.ts` make the duplicate check return "not duplicate" for the stack (or flip the comparison). The second Sol Ring goes in and the message and count checks fail. Cap break: `MAX_STACK_SIZE` in `apps/frontend/src/lib/stackLimits.ts` from 10 to 11.

### Verified live?
Yes. Phone and desktop: nonsense search shows "No matching card found"; "Begin stackening!" then "Add to Stack"; duplicate add leaves the stack at one and shows "Duplicate cards are not supported in MVP1."; BOTTOM and TOP tags seen with two cards. Phone only: ten cards reached ("Stack10"), eleventh add refused with "MVP stack limit reached (10 cards).", and the count survived Back then Station 3.

### PRD vs live discrepancies
- PRD: "a message that duplicate cards are not supported yet". Live text: "Duplicate cards are not supported in MVP1." Same meaning, different words. Assert on the shared phrase "Duplicate cards are not supported".
- Live detail the PRD does not state: the second search lists the card as a normal suggestion; the add is only refused at the Add button. The "Add" button's name matched after pick. Not a conflict.

### Edge cases
| Edge case | Include? | Why |
|---|---|---|
| "This may reject some real gameplay scenarios" | Skip | A note about the product, not a behaviour. |
| Ten-card cap | Include | Same stack, same step, seen live; costs ten adds (about 5 seconds). |
| Scanner duplicate check at recognition | Skip | Needs the camera (can't in headless fake camera for a real card); unit-tested in `ScanPanel.test.tsx` and `useScanCapture.test.ts`. |
| Duplicate in a non-stack zone is allowed | Skip here | Covered by FLOW-002's same-card-twice check. |

### Can't assert
- Scanned duplicates (needs a real card in view of the fake camera).

---

## FLOW-005 Post-decrypt follow-up chat

### Row
- **Setup:** fresh context. Route `POST /api/ask-ai`: let the real mock backend answer, record the full response, and hand the page a **short** `answer` (for example "First short answer: yes it taps for two colorless.") for the first call and "Second short answer" for the second. This is needed because of the 10,000-character history cap (see top). Phase for the failure leg: a second route that returns 500 `{code, message:"boom"}` for the next POST only.
- **Steps:**
  1. Walk In-depth with Sol Ring to the review, type "Does Sol Ring tap for mana?", send.
  2. Answer screen: read the log. Tap "◈ View context", read it, close with its ✕ (or Escape).
  3. Type a follow-up in "Follow-up question". Type 350 characters; see the box stop at 300.
  4. Failure leg: with the 500 route on, send "What if it is Player 2's turn?". See the error and the Retry button. Wait for the countdown to end, turn the failure off, tap "Retry".
  5. While a request is held in flight: check Send is disabled and Start over is gone.
  6. Tap "↺ Start over".
  7. Tap "Add in-depth details".
- **Expected results:**
  - Log order: the player's question bubble first, then an assistant bubble. (PRD step 1.)
  - View context opens a dialog titled "Frozen game context" listing Turn, Setup (Player 1: 20 life), Battlefield: Sol Ring, Owner: Player 1. At 390 wide it is a bottom sheet (box at the bottom, full width); at 1280 it is a right drawer (480 wide, full height). After closing, focus returns to the "View context" button. (PRD step 2.)
  - Follow-up box stops at 300 characters. (PRD step 4.)
  - While in flight, the Send button is disabled and the Start over and View context controls are not shown. (PRD step 5; edge "start over is not available while a request is in flight".)
  - Failure: the error text shows with a Retry button that starts as "Retry in 13s" and becomes "Retry". Retry resubmits and the log ends with: question, answer, follow-up bubble, second answer. (PRD edge: failed follow-up shows error plus retry; "resubmits the failed follow-up with the same frozen context and history".)
  - The follow-up request body has `conversationHistory` with two entries (user, assistant) and the same `gameContext`. The mock answer's prompt text contains "CONVERSATION HISTORY" followed later by "QUESTION" and the follow-up text, with the history lines in between. (PRD step 7; PRD mock edge: "answer contains the exact assembled LLM-facing prompt".)
  - Start over clears the thread and lands on the Ask a Question page (route `/quick-lookup`, empty "Magic question" box, "Add in-depth details" pill). Tapping the pill opens In-depth at Station 1 (Game) with the roster kept (the Active player list still reads "Player 1 (Alice)" if a name was set). (PRD edge: start over; "player roster is preserved ... next walk starts at station 1".)
  - Long answers: scroll the log to the top, send another follow-up; a "New response" button shows, the log does not jump; tap it and the newest assistant message takes focus; text typed in the follow-up box stays. (PRD step 8 and edge "activating New response scrolls to and places keyboard focus on the newest assistant message without clearing any composer draft".) To make the log long, the route replaces the answer with 40 short paragraphs.
- **Sizes:** phone and desktop (all legs walked at both).
- **Must-fail break:** in `apps/backend/src/prompt/promptFormatting.ts` skip emitting the `CONVERSATION HISTORY` block; the prompt-order check and the history check fail. UI break: in `apps/frontend/src/components/ConversationThread.tsx` stop focusing the newest message on "New response"; the focus check fails.

### Verified live?
Yes at both sizes, with the first answer swapped as described. Seen: bubbles in order; View context sheet at the bottom on phone (box y=536, 390 wide) and a right drawer on desktop (x=800, 480 wide), focus back on the trigger after Escape; 300-character stop; in-flight Send disabled with Start over and View context gone; 500 shows "boom" and a "Retry in 13s" button that becomes tappable; retry gives all four bubbles; request body history had two turns; the mock prompt shows "CONVERSATION HISTORY / User: ... / Assistant: ... / QUESTION / <follow-up>"; New response appears, focus lands on the last assistant bubble, and the typed draft stays; Start over lands on `/quick-lookup`, and "Add in-depth details" opens Station 1 with the roster name kept.
Not walked: the 6,000-character truncation (needs real long history).

### PRD vs live discrepancies
- PRD edge: "if history chars exceed `MAX_CONVERSATION_HISTORY_CHARS` (6000), oldest turns are truncated before the prompt is assembled". Live with the mock: the very first follow-up already fails with a 400 because the first answer (19,200 characters) is over a separate 10,000-character cap on each history message, so truncation is never reached. Described at the top. A real answer over 10,000 characters would hit the same wall.
- PRD edge: "the error is shown and a retry button is presented". Live: Retry is shown disabled with a countdown ("Retry in 13s") for about 13 seconds first. The test must wait about 15 seconds for the failure leg.
- PRD step 8: "User bubble and then assistant bubble are appended". Live on failure: the follow-up's own bubble is not in the log while it is failing (only the error and Retry show); the bubble appears after the retry succeeds.
- PRD note: "the answered-state conversation header stays a slim brand-only header with no step name". Live: the answered screen has an "Ask a Question" heading (h1) plus "View context", "Edit", and "↺" buttons. There is no In-depth step name, so the intent is met, but it is not "brand-only". The "Edit" button (back to the Context review) is not mentioned in FLOW-005.
- Stale "Card added" status line under the follow-up box (cosmetic, from the staged flow).

### Edge cases
| Edge case | Include? | Why |
|---|---|---|
| Follow-up fails: error plus Retry resubmits with same context/history | Include | Seen live. Needs a 15-second wait for the countdown. |
| Start over clears thread, keeps roster, lands on Ask a Question; next walk at Station 1 | Include | Seen live. |
| Start over unavailable while in flight | Include | Seen live; same held-request used for the Send-disabled check. |
| History over 6,000 characters truncated | Skip | Needs a long real history; backend unit test (`app.contract.test.ts` and follow-up fixture `follow-up-chat.fixture.json`). |
| Mock mode: assistant bubble contains the full prompt | Include (as the prompt-order check) | Used to prove CONVERSATION HISTORY sits before QUESTION. Reads the mock's own echo, not AI wording. |
| Reader past 64px from bottom: no force-scroll; New response places focus | Include | Seen live. One leg, both sizes. |
| New response keeps draft | Include | Same leg. |
| Follow-ups are text-only | Skip | Not a behaviour to see. |

### Can't assert
- The real AI's answer, or whether it uses the history well.
- The 6,000-character truncation (needs real long answers).
- Exact scroll pixels (only "New response" shows and focus moves).

---

## FLOW-015 Commander Spellbook combo enrichment

### Recommendation
Exempt it from the "one test per flow" list, or give it one thin test only if the owner wants a browser check. It is backend prompt-building with no screen of its own (PRD note: "not a new user-visible screen or API"). It is only visible in the browser because the mock AI prints its whole prompt into the answer bubble, so a test reads the mock's echo, not what a real player sees.

What covers it today: `apps/backend/src/prompt/comboPromptIntegration.test.ts`, the six `commander-spellbook-*.prompt.golden.txt` fixtures under `apps/backend/src/eval/fixtures/`, and `apps/backend/src/runtime/createConfiguredApp.test.ts`. Those cover every edge case in the PRD (wrong-zone, unresolved template, partial, missing artifacts).

### Row (only if the owner wants a thin browser check)
- **Setup:** fresh context, normal routes. The answer text must be the real mock answer (no swapping).
- **Steps:** walk In-depth to Cards (Battlefield). Add "Basalt Monolith" and "Rings of Brighthearth". Context: "Next card", then "Finish context". Type "How does this resolve?" and send. Then repeat with only "Sol Ring" and the same question.
- **Expected results:**
  - The two-card board answer contains the heading "COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED", and it sits after the rules text and before "QUESTION". Candidate 1 reads "all pieces present; card state unverified" with both cards "present in a compatible zone (battlefield)" and a commanderspellbook.com link. (PRD steps 2, 5, 6: complete variants without combo intent; "a fully assigned candidate renders as all pieces present with card state explicitly unverified, never as 'complete'".)
  - The Sol Ring-only answer has no such heading. (PRD edge: "game context contains only part of a combo and the question has no combo intent: no partial variant is supplied".)
- **Sizes:** desktop only is enough (text-only check, nothing size-dependent).
- **Must-fail break:** in `apps/backend/src/commanderSpellbook/formatting.ts` change `COMBO_SECTION_HEADING`, or make the matcher return no variants; the heading check fails.

### Verified live?
Yes (phone). Basalt Monolith + Rings of Brighthearth with "How does this resolve?": heading present, candidate 1 "all pieces present; card state unverified" (both cards "present in a compatible zone (battlefield); must be commander: no"), candidates 2 and 3 "partial; missing pieces named below" (for example Forsaken Monument "MISSING (1 needed)"). Sol Ring alone, same question: no combo section. Basalt Monolith alone, no combo words: no combo section. Basalt Monolith alone with "Is there a combo with this?": section present (explicit intent). Sol Ring alone with "Is there a combo here?": section present (explicit intent with no named card, so submitted cards seed matching).

### PRD vs live discrepancies
None found. The section order (after rules, before QUESTION) and wording match PRD steps 5-6. The wrong-zone, unresolved-template, and missing-artifact edges were not walked (need other cards or a broken backend data file).

### Edge cases
| Edge case | Include? | Why |
|---|---|---|
| Lookup question with combo words but no attached card | Skip | Quick Question flow, not In-Depth; backend test. |
| Lookup card attached, no combo intent | Skip | Same. |
| Partial combo, no intent: nothing supplied | Include (Sol Ring-only leg) | Only if the thin test is kept. |
| Wrong-zone card | Skip | Backend golden fixture `commander-spellbook-wrong-zone`. |
| Unresolved template | Skip | Golden fixture `commander-spellbook-unresolved-template`. |
| Fewer than needed copies: missing | Skip | Backend test. |
| Artifacts missing/malformed: omit with one warning | Skip | Needs breaking backend data; backend test. |

### Can't assert
- Anything about what the real AI does with the combo section. The browser sees only the mock's prompt echo.
- That the combo data on the live site matches the corpus.
