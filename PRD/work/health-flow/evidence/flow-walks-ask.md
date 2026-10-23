# Flow walks: Ask a Question group (FLOW-003, 011, 023, 016, 017, 018)

Walked live on 2026-10-20 against the built app (frontend :5792, mock-AI backend :5791), phone 390x844 and desktop 1280x800, Chrome headless with fake camera. Scripts and screenshots: `/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/74cadfda-9e1b-4aea-877f-fe60b293ae3a/scratchpad/flow-walk/ask/`.

Tool note: `node_modules/playwright` is not installed in this checkout. I used the cached npx copy (v1.61.1). The build step needs `playwright` installed.

## Facts every test shares (seen live)

- Ask a Question lives at `/quick-lookup`; the app lands on it from `/`. Menu button is named "Switch feature"; items: Ask a Question, Question History, Life Tracker, Trade Balancer, Send feedback.
- Question box: textbox "Magic question"; send button "Ask TheJudge" (disabled when blank/spaces). Add-card button "Add card" (its "＋" glyph breaks exact-name matches, use `name: "Add card"` substring); search textbox "Card search"; result buttons are the card names. After a card is picked the search stays open ("Close search", counter "1 of 10 attached").
- Answered view: buttons "Edit cards", "Start over — clears the cards and the question", "View <card name>"; follow-up textbox name contains "follow-up", send button "Send"; "300 characters remaining" counter.
- Waiting panel text: "Consulting the stack…" plus a timer. The mock answers in under 100 ms, so a test must delay the route to see it.
- **Mock answer is over 10,000 characters** (it prints the whole prompt). Any follow-up then fails validation with a 400 ("conversationHistory.1.content String must contain at most 10000 character(s)"). So tests that need a follow-up, or a second saved answer to resume, must pass the ask-ai POST through `route.fetch()` and replace `answer` with a short string. Everything else in the response stays real.
- Storage keys: `thejudge.conversationHistory.entries`, `thejudge.conversationDraft.lookup`.
- Card images from `cards.scryfall.io` render as a red placeholder tile with the 1x1 PNG. Assert tiles/buttons by name, never the picture.

---

## FLOW-003 Handle failed AI request (Ask a Question variant)

**Row**
- Setup: route `POST **/api/ask-ai` to answer HTTP 503 `{"code":"PROVIDER_UNAVAILABLE","message":"Miho is working on it","retryAfterSeconds":13}`. Switch the route back to pass-through (answer shortened) before pressing Retry. A second variant aborts the request (network failure).
- Steps: open Ask a Question. Add "Sol Ring". Type "Does it tap for two?". Press "Ask TheJudge" (fails). Wait out the countdown. Press "Retry" (works). Type a follow-up, press "Send" (fails). Wait, press "Retry" (works).
- Expected:
  1. The text "Miho is working on it" shows. (FLOW-003 step 2)
  2. The Question form is back with the question text still in the box and "Sol Ring" still attached (the "Remove Sol Ring" button exists). (step 3, FLOW-011 edge "Question form reappears")
  3. A retry button reads "Retry in 13s" and is disabled; after about 13 s it reads "Retry" and is enabled. (steps 5-6)
  4. Retry sends the same question and cards again (compare the two request bodies); the answer appears. (FLOW-003 / FLOW-011 edge)
  5. When the follow-up fails, the first answer stays on screen, "Miho is working on it" and a disabled "Retry in 13s" appear; retry sends the same follow-up with history and both bubbles show afterward. (step 4, FLOW-005 via FLOW-011 edge)
- Sizes: phone and desktop.
- Must-fail break: in `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` `doDecryptRequest`, change the failure branch to `setError(null)` (or drop `setPendingRetry`). Second break: in `startRetryCooldown` use 0 seconds, so the 13 s check fails.

**Verified live?** Yes, both sizes. 503 and abort both showed "Miho is working on it", box and card kept, button "Retry in 13s" disabled, enabled at 14 s, retry sent identical question, follow-up failure kept the first answer visible. Retry after follow-up failure appended "Follow two" plus a new answer with 2 history turns.

**PRD vs live discrepancies**
- FLOW-003 step 2: "Frontend shows the message **Miho is working on it**." Live code shows the backend's own `message` when it has one, and only falls back to "Miho is working on it" when it has none or the request never arrives. The real backend sends that same text for provider outages, so the test is fine only if the fake error carries it. A 400 validation error shows the validation sentence instead (seen live).
- FLOW-003 step 3 "keeps ... question intact" is true for the first ask. For a failed follow-up the composer empties and the follow-up text is not shown as a bubble; only the Retry button remembers it. Test should not expect the follow-up text back in the box.

**Edge cases**
- Repeated failures do not wipe state: include (fail twice before success; cheap, same test).
- Failure in In-depth details: skip here, belongs to the In-depth flow's test.
- Real timeouts / provider codes: skip, needs the real AI.

**Can't assert:** real provider failure shapes (mock backend never fails on its own; the failure is simulated by the route). The exact retryAfter comes from our fake body.

---

## FLOW-011 Ask a Question with optional card context

**Row**
- Setup: fresh context (empty storage). Pass-through route that shortens the answer and records request bodies. For the waiting step, delay the route 2.5 s.
- Steps:
  1. Open `/`. See title "Ask a Question", buttons "Add card", "Scan", the Question box, "Add in-depth details", mic and send.
  2. Type a question, press "Ask TheJudge". Waiting panel "Consulting the stack…" shows and the Question form is gone. Then the thread shows the typed question bubble and an answer, with no card strip.
  3. Press "Start over — clears the cards and the question": empty page returns.
  4. Add "Sol Ring" (search, pick). Close search. Leave the box empty, press "Ask TheJudge".
  5. Thread shows "Tell me about Sol Ring." as the question and an answer; a "CARDS" strip with a "View Sol Ring" button. Press it: a card detail dialog opens with name, "Artifact", rules text; close it.
  6. Press "Edit cards": back to the pre-submit page with Sol Ring still attached and the question kept.
  7. Blank-box check: with no card, "Ask TheJudge" is disabled, and also with only spaces. With a card attached and an empty box it is enabled.
  8. Type 320 characters: box holds 300, counter reads "0 characters remaining".
- Expected, each tied to PRD:
  - Pre-submit view has Add card, Scan, card stage (when a card is attached), question box (step 2).
  - Request body is `mode: "lookup"`, has `question`, has `cards` only when attached, has no `gameContext` (step 6).
  - Waiting panel replaces the form while in flight and the card stage stays (7a).
  - Answer thread starts with the player's question as sent, then the answer; with a card, a card-context trigger; without, none (step 8).
  - Blank question blocked, card + blank sends "Tell me about {Card Name}." (edge 1).
  - Edit cards keeps cards and question; Start over clears them (step 10).
  - 300-character cap on raw text (step 5).
- Sizes: phone and desktop.
- Must-fail break: in the Quick Lookup submit code (the `Tell me about` fallback in `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` / its compose helper), return the empty string, or make the disabled check ignore attached cards. A second break: make "Edit cards" call the same reset as "Start over".

**Verified live?** Yes, both sizes for steps 1-8 (follow-up with shortened answer sent `{mode:"lookup", question, cards:[Sol Ring], conversationHistory}` with no gameContext). Waiting panel seen at phone with a 2.5 s delay; card stage stayed. Edit cards kept card and question text. Screenshots p4/p5/p9 in the scratch folder.

**PRD vs live discrepancies**
- FLOW-011 step 8: "a compact card-context trigger opens its read-only presentation (naming the single card or the count, "N cards") in a mobile bottom sheet or desktop right drawer." Live: a "CARDS" strip with one small tile per card, each a "View <name>" button; it opens a centered card detail dialog at desktop (not a right drawer). I did not see text such as "Sol Ring" or "2 cards" on the trigger. Phone dialog not inspected closely.
- FLOW-011 step 8: "a card name in the answer ... renders as a tappable chip". Can't check: mock answer never names an attached card in a chip-able way (see Can't assert).
- FLOW-011 edge "in mock provider mode ... assistant bubble appends in the same thread": true for the first answer, but a follow-up in plain mock mode fails with 400 because the mock answer is over 10,000 characters (seen live). The thread cannot continue in mock mode without shortening the answer.
- FLOW-011 step 2 "card stage ... front card full size, the other card peeking at each side": true only after "Close search". While search is open the cards show as a small strip with "N of 10 attached". The stage on desktop shows "Previous card / Next card" arrows and a "2 / 2" pager.
- FLOW-011 step 10 "↺ Start over": button has no visible word, only the icon; its accessible name is "Start over — clears the cards and the question".

**Edge cases**
- Blank blocked / card + blank fallback: include.
- 11th card blocked with limit message: include in FLOW-023 only (live message: "You've added 10 cards, the most one Quick Question can use. Remove a card below to add another."; the search box is replaced by that message, so an 11th add cannot even be typed).
- AI failure: skip here, covered by FLOW-003 test.
- Follow-up failure: skip here, covered by FLOW-003 test.
- History over the shared cap (REQ-027): skip, unit tested in backend and needs a giant conversation.
- Mock-mode answer contains the prompt: skip as its own check; the first-answer test may assert the answer text contains "FULL PROMPT" only if the owner wants it (not recommended, it is wording).
- Scan input: skip, headless fake camera never matches a card. Walked live: "Scan" opens "SCAN A CARD" with "Exit scan", "Capture", "Hold steady", no card ever added. FLOW-006 test owns scan.
- Off-domain persona: skip, needs real AI.
- "New response" pill when reader is >64px from bottom (REQ-098): skip, needs a long thread; the mock answer is too long to follow up without shortening, and the pill is better as one scroll test elsewhere. Not walked.

**Can't assert:** answer content/quality, card-name chips in answers, off-domain persona, scan matching, backend prompt assembly (retrieval, rulings, step summary).

---

## FLOW-023 Ask a Quick Question about several cards

**Row**
- Setup: fresh context, pass-through route recording bodies, shortened answer.
- Steps: open Ask a Question. Add "Sol Ring", then "Rhystic Study" (search stays open; type the second name straight into "Card search"). Counter reads "2 of 10 attached". Press "Close search". Stage shows a front card plus a peeking neighbor, "Previous card"/"Next card", pager "2 / 2". Remove one card with "Remove <name>" and re-add. Type "How do these interact?" and press "Ask TheJudge". Open "View Sol Ring" then "View Rhystic Study". Send a follow-up with "Send".
- Expected:
  - Counter and stage reflect each add/remove; each card removable (step 3, REQ-167).
  - The request carries a `cards` list of two entries, mode "lookup", no gameContext (step 4).
  - The thread's card strip holds both cards, each opens its own detail (step 6 "frozen context shows all attached cards").
  - The follow-up request carries the same two cards plus conversationHistory (step 6).
  - Cap: attach ten different cards; counter reads "10 of 10 attached" and the limit sentence appears; an eleventh cannot be added (edge 3).
- Sizes: phone and desktop. (The ten-card cap only on phone is enough, since the logic is size-free.)
- Must-fail break: in the lookup submit payload builder drop all but the first card (`cards.slice(0,1)`), or raise the cap to 11 in the card-limit constant behind REQ-167.

**Verified live?** Yes. Two-card ask at phone: request `cards` had both, answer view "CARDS" strip with "View Sol Ring" and "View Rhystic Study". Desktop: stage with arrows and "2 / 2", detail dialog for Sol Ring (name, "Artifact", "{T}: Add {C}{C}.", mana value, price). Ten cards then the limit sentence at phone. Silent fallback with two cards composes "Tell me about Sol Ring and Rhystic Study."

**PRD vs live discrepancies**
- FLOW-023 step 1: "opens Quick Question from the feature portal". Live name is "Ask a Question" in the Menu ("Quick Question" label appears only as the history kind tag "QUICK" and in the limit sentence). No feature portal screen; the Menu is the way.
- FLOW-023 step 2: "the card-attach control ... then the Question field". Live has title row with Add card / Scan buttons, then stage, then question box. Same shape as FLOW-011; no separate attach control.
- FLOW-023 step 3: "each resolves to one oracle-level card, previewed then added". Live adds on a single tap of the search result; there is no separate preview step. The detail is reachable through the stage's "Show details for <name>" button.
- Same card-context presentation difference as FLOW-011 step 8 (strip of tiles + centered dialog).
- Search results include odd extras: "Sol Ring // Sol Ring" and "Soaring" for "Sol Ring". Tests must pick by exact name.

**Edge cases**
- No cards / one card equals FLOW-011: skip (FLOW-011 test owns them).
- Beyond the cap blocked: include.
- Off-domain: skip, real AI.
- AI failure, follow-up failure, history cap: skip, FLOW-003 owns.
- Backend combo/rulings enrichment: skip, backend unit tests and real AI.

**Can't assert:** that the answer used all cards (mock). Camera scan of multiple cards.

---

## FLOW-016 Resume a saved conversation from Question History

**Row**
- Setup: fresh context. Create two saved answers through the UI (pass-through route, shortened answers): ask "First question about Sol Ring" with Sol Ring attached, press "Start over — clears the cards and the question", ask "Second question no cards". Press Start over again and type "A draft in progress" (so a Draft exists too).
- Steps: Menu "Switch feature", "Question History". Phone: tap the entry "First question about Sol Ring". Desktop: click it (reading pane shows "CARDS", the question and the answer), then "Open conversation".
- Expected:
  - Sheet shows "Question History" with "2 of 20", a Draft row ("Resume where you left off", tag "DRAFT"), then entries most-recent-first, each with the question, the answer's first line, tag "QUICK", "1 card"/"no cards", "N follow-up", "just now" (step 2).
  - Desktop reading pane appears on click, with "Delete this question" and "Open conversation" (step 3); phone tap opens at once.
  - After opening: sheet closes; under the title "Reopened from your history"; thread shows the old question and answer; the card strip shows Sol Ring; the follow-up box is enabled (steps 5-6).
  - The pre-submit text was kept as the Draft row (step 4 / FLOW-017 5a): reopen Question History and the "DRAFT" row is there.
  - Send a follow-up: reopen history; that entry is first and its meta reads "1 follow-up" (step 7).
- Sizes: phone (tap) and desktop (reading pane + Open conversation); both are different paths.
- Must-fail break: in the history-resume handler (App-level `onResume` / the code that sets "Reopened from your history") skip loading the messages, or in `lib/conversationHistory/persistence.ts` save upserts with a new id on update so the entry doesn't move/replace. Simplest: make resume load only `frozenContext` and not `visibleMessages`.

**Verified live?** Yes, both sizes (probe11/12/13). Phone tap and desktop pane+Open conversation both reopened with "Reopened from your history". Follow-up moved the entry to the top with "1 follow-up".

**PRD vs live discrepancies**
- FLOW-016 step 2: "each showing a fan of its cards ... the game context for In-depth". Live row shows one card tile (or a dashed "—" tile for no cards), not a fan, for one-card entries; I did not test a multi-card fan. In-depth not walked.
- FLOW-016 step 3 mentions the `600px` breakpoint; phone and desktop sizes behave as stated; the 600-1000px range not walked.
- See FLOW-017: after the resumed follow-up succeeds, the Draft row that was saved at resume disappeared (both sizes). PRD 5a says it stays recoverable; the "first successful submit clears Draft" edge may be firing on a follow-up. Needs an owner call: defect or intended.

**Edge cases**
- Corrupted entry dropped: skip, unit tested (`persistence.test.ts` "drops only a corrupt entry").
- Over 20 entries pruned: skip, unit tested ("prunes to the 20 most-recently-updated").
- Select the already-active conversation is a no-op: skip, not walked; low player value.
- Start Over after resume auto-saves outgoing: skip, covered by the setup path of every history test.
- Menu tray closes before sheet opens: include (assert the Menu items are gone when "Question History" heading shows).
- History reachable on every destination: include one step: open it from Life Tracker (done live in FLOW-018 below); not the whole resume.
- Resume the other flow's entry (In-depth): skip here; the In-depth helper's test owns it.

**Can't assert:** In-depth entries (other group), real-answer first-line wording.

---

## FLOW-017 Preserve and resume mid-flight Draft

**Row**
- Setup: fresh context; no network needed (no ask).
- Steps (Ask Quick Question side only; In-depth is the other group's twin):
  1. Add "Sol Ring", close search, type "Draft one". Open Menu, Life Tracker; open "Question History" there: a "Resume where you left off" "DRAFT" row exists. Close it. Menu, Ask a Question: question and Sol Ring are back.
  2. Reload: question and card are back.
  3. Replace the text with "Draft two", reload: "Draft two" comes back (not "Draft one").
  4. Clear the text and press "Remove Sol Ring". Reload: empty page. Open Question History: "No saved conversations yet", no Draft row.
  5. Seed `thejudge.conversationDraft.lookup` with `{not json`, reload: page mounts empty; history opens to the empty list.
  6. Type "Submit me", ask: the Draft key is gone afterward.
  7. Select a Draft from Life Tracker's history: lands on `/quick-lookup` with the draft text in the box.
- Expected, tied to PRD: Draft appears as its own row (step 1); survives Menu leave and reload (steps 2-3); replaced text wins (edge 5, REQ-108); emptied staging removes it (edge 4); corrupt draft dropped (edge 2); first successful submit clears it (edge 3); history reachable from other destinations (edge 6); selecting Draft from the other flow switches destination first (step 5).
- Sizes: phone and desktop (all passed on both).
- Must-fail break: in the Draft-save hook for lookup (`App.tsx` / `lib/conversationHistory/persistence.ts` draft writer), only write when the question is non-empty AND skip the "remove when nothing staged" branch; or debounce the write by 5 s so a quick reload loses the replaced text.

**Verified live?** Yes, both sizes (probe16 phone+desktop; probe14 for cross-flow pick).

**PRD vs live discrepancies**
- FLOW-017 step 5: "Selecting Draft restores that flow's mid-flight staged state." Live: when a past conversation is open on Ask a Question (for example after resuming), choosing the Draft row just closes the sheet and the answered thread stays; the draft text does not appear until a reload. (Cross-flow pick from Life Tracker and a pick while already pre-submit are fine.) The PRD does not say what should happen from an answered view; owner call.
- FLOW-017 step 5a / FLOW-016 step 4: Draft stays recoverable after resuming a saved conversation, but is gone after the next successful follow-up in that resumed thread (both sizes). Possible defect (draft wiped by an unrelated follow-up).
- FLOW-017 step 1: "typed question, optional card, zones/enrichment" in Quick Question: stored shape is `{mode:"lookup", selectedCards, question, updatedAt}`; no zones. Fine.

**Edge cases**
- Empty history and no Draft: include (inside step 4).
- Corrupt Draft: include (step 5); also unit tested, but the player-visible "mounts fresh" is the point.
- Submit clears Draft: include (step 6).
- Emptied staging removes Draft; replaced question reload: include (steps 3-4); these were real bugs (ask-box-prefilled-text).
- Life Tracker / Trade Balancer keeps history reachable: include (step 1).
- Selecting a completed conversation with no staging writes no Draft: skip, unit tested (`App.mid-flight-draft.test.tsx` "writes no Draft when there is no meaningful staging").
- Selecting a completed conversation while answered: skip, unit tested/low value.
- Same behaviour in In-depth: skip here, other group.

**Can't assert:** nothing blocked; no AI needed.

---

## FLOW-018 Delete a saved conversation from Question History

**Row**
- Setup: fresh context; create two answers ("Alpha question" then, after Start over, "Beta question"; Beta stays active) with shortened answers.
- Steps: Menu, "Question History". Phone: press the row's "Delete" for Alpha. Desktop: click Alpha row, then "Delete this question". A confirm shows `Delete "Alpha question"?` with "Keep" and "Delete". Press "Keep": Alpha remains and history stays open. Delete again, press "Delete": Alpha gone ("1 of 20"). Close with Escape; Beta is still on screen. Menu, Life Tracker, Question History, delete Beta, confirm: list shows "No saved conversations yet". Close, Menu, Ask a Question: clean empty page, and storage has 0 entries (no re-save).
- Expected, tied to PRD: confirm names the entry (step 3, REQ-208); confirm removes it from list and storage (step 4); cancel leaves it (edge 1); deleting a non-active entry leaves the workspace alone (step 5); deleting the active conversation from the other flow's history clears Ask a Question without re-saving it (step 5); last entry deleted shows empty state (edge 2); Escape closes (step 6).
- Sizes: phone (row Delete) and desktop (pane Delete this question): different controls.
- Must-fail break: in the delete handler, call the confirm's "Keep" path like "Delete" (skip removal), or after delete call `saveHistoryEntry` for the active thread (re-save). Second: skip the workspace clear when the deleted id is the active conversation.

**Verified live?** Yes, both sizes (probe17).

**PRD vs live discrepancies**
- FLOW-018 step 3: "confirm sheet naming the entry". Live text: `Delete "Alpha question"?` then "This removes it from Question History for good." with "Keep" / "Delete" buttons. Fine; "Cancel" is called "Keep".
- Phone delete control is the word "Delete" beside each row, not an icon; accessible name "Delete: Ask a Question: <title>".
- Desktop after deleting, the pane shows "Pick a question to read it here." (not stated in PRD).

**Edge cases**
- Cancel keeps entry: include. Last entry gives empty state: include. Draft row has no delete: include as one assertion (no "Delete" next to the DRAFT row; seen live, the Draft row has none).
- Storage write fails: skip, unit tested ("swallows a delete write failure").
- 20-entry prune: skip, unit tested.
- In-depth conversation deleted from here: skip, other group.

**Can't assert:** nothing blocked.

---

## Overlaps and how to avoid duplicates

- FLOW-023 vs FLOW-011: 023 states 011's no-card and one-card cases are its special cases. Put all single-card and no-card checks (blank block, "Tell me about {Card}" fallback, waiting panel, Edit cards, Start over, 300 cap) in the FLOW-011 test; give FLOW-023 only what is new with several cards (two-plus cards in request and follow-up, per-card view, ten-card cap message). Do not repeat the typed-question and answer-shown checks in 023.
- FLOW-003 vs 011/023: both list "AI failure" as an edge case. Test it once, in FLOW-003 (first ask fail and follow-up fail). Leave it out of 011/023.
- FLOW-016 vs 017: 016's "Draft recoverable after opening a conversation" is 017's step 5a. Assert it only in FLOW-017 (or only 016), not both. Recommend 016 asserts the resume and the follow-up-moves-to-top, and 017 asserts the Draft survival rules.
- FLOW-016 vs 018: both open Question History and need two saved answers. Share one setup helper that makes two answers through the UI; do not seed storage by hand (the saved shape changes).
- The "Question History reachable from every destination" check appears in 016, 017 and 018; do it once (FLOW-017 step 1).
- Shared helper needs: pass-through route that shortens answers (follow-ups and second answers are impossible in plain mock mode), exact-name search-result picks, and the "Add card" substring name.
