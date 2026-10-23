# Flow walks: color profile, Menu, Life Tracker, feedback

Flows: FLOW-007, FLOW-010, FLOW-013, FLOW-014. Walked live in headless Chrome at 390x844 and 1280x800, free mock AI, 2026-10-20.
Scratch scripts and screenshots: `/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/74cadfda-9e1b-4aea-877f-fe60b293ae3a/scratchpad/flow-walk/chrome-life/`.

Two notes that apply to every row:
- Playwright is not installed in the repo's `node_modules` (the import path in the brief did not resolve). I used a 1.61.1 copy from `~/.npm/_npx`. The build step must make sure `playwright` 1.63 is installed.
- The Menu button is named "Switch feature" in the app. Its items are `menuitem`s. The six Theme cells are buttons named "Theme: White" … "Theme: Colorless" with `aria-pressed`.

Home screen is `/quick-lookup` (the app redirects `/` there).

---

## FLOW-007 Choose, customize, persist app color profile

### 1. Row
- **Setup:** fresh context, empty storage, open `/`. Storage keys: `thejudge.theme.paletteId`, `thejudge.theme.colorlessCustomRgb`.
- **Steps:**
  1. Open the ☰ Menu ("Switch feature"). See the Theme band.
  2. Pick Blue, then Black, Red, Green. After each pick, read the page's theme.
  3. Pick Colorless. A color picker ("Customize Colorless color") and a "Reset to gray" button appear.
  4. Set the picker to `#ff8800`. Close the Menu. Reload.
  5. Open the Menu again. Pick Blue, then Colorless again. Press "Reset to gray".
- **Expected (each with its PRD sentence):**
  - Six cells in the order White, Blue, Black, Red, Green, Colorless; White lit by default (`aria-pressed=true`). "White, Blue, Black, Red, Green, and Colorless in that order … White as the default."
  - Each pick sets `html[data-profile]` and `data-theme` to that color, and the computed `--accent` and the `<meta name="theme-color">` change to a new value. "App immediately applies the selected profile to the whole surface." Assert that the value changed from the previous profile, not the hex. (Seen: accent #ede7d6 white, #0050d8 blue, #7c3aed black, #c10230 red, #0a7a42 green, #52525b colorless.)
  - The picker and "Reset to gray" show only while Colorless is lit. "If the user selects Colorless, the Theme section exposes an inline full-spectrum color input and `Reset to gray`."
  - Custom pick: `--accent` becomes the pick (seen `#ff8800`, `html[data-accent]` set). "App immediately applies its hue."
  - After reload: profile still Colorless, `--accent` still the custom color, picker value unchanged. "On later reloads, app restores the selected profile and any remembered Colorless custom RGB."
  - Switching to Blue then back to Colorless brings the custom color back. "Remembers the exact pick independently."
  - Reset to gray: `--accent` back to the neutral gray and the saved custom value is gone from storage. "App deletes only the custom value and restores fixed neutral gray." The profile stays Colorless.
  - The typed Ask question is still in the box after the changes. "All without leaving the current workflow step."
- **Sizes:** phone and desktop (the Menu is a tray at both; behavior was identical).
- **Must-fail break:**
  - `apps/frontend/src/lib/theme/applyPalette.ts`: delete the `root.setAttribute("data-profile", palette.id)` line. Every color assert fails.
  - `apps/frontend/src/lib/theme/themePrefs.ts`: make `saveThemePaletteId` do nothing. The reload assert fails.
  - Same file: make `removeColorlessCustomRgb` do nothing. The reset assert fails.

### 2. Verified live?
Yes, at both sizes. Walked White to Colorless, custom `#ff8800`, reload, Blue then back, Reset, same-profile re-pick. All matched the table above. Screenshots `theme-custom-phone.png`, `theme-custom-desk.png`.

### 3. PRD vs live discrepancies
- "the flat ground … panel fills … all profile-driven." I could not see this on `body`: its computed background stayed `rgb(9, 9, 11)` for all six profiles. The profile shows through the token variables (`--accent`, wash) and the ambient scene. The test should assert `--accent` and `data-profile`, not the body background. I did not measure the ground element itself.
- Nothing else differs. The default White, the order, the lit cell, and the Colorless extras all match.

### 4. Edge cases
| Edge case | Include? | Why |
|---|---|---|
| Missing/corrupt stored profile (`violet`, `garbage!!`) falls back to White and deletes the value | Include one case (`violet`) | Seen live: White, key deleted. Player-visible. Unit-pinned in `themePrefs.test.ts`, but the live fallback is cheap. |
| Malformed saved custom RGB deleted, gray used | Include, same seeded reload as above | Seen live: stored `colorless` + `notahex` gave gray and removed the key. |
| Storage unavailable: profile applies this session, app continues | Include | Seen live with `localStorage` throwing: Red applied; after reload back to White; no crash. |
| Re-picking the current profile is a no-op | Include as one line | Seen live: Menu stayed open, nothing reset. |
| Low-contrast custom lifted but keeps hue | Skip | Real (seen `#111111` becomes `#4f4f4f`), but pinned in `palettes.tokens.test.ts`; asserting numbers here is pixel-chasing. |
| Theme never changes AI request/answer | Skip | Not player-visible; covered by `App.theming.test.tsx`. |

### 5. Can't assert
- Tab icon (favicon) color: headless can read the `<link rel=icon>` href but not see the tab. Use `<meta name="theme-color">` instead (it changed with every profile).
- Real contrast ratios and how the ambient scene looks. Screenshot review only.

---

## FLOW-010 Switch destinations via the Menu

### 1. Row
- **Setup:** fresh context, open `/`. Type "draft question abc" in the "Magic question" box first.
- **Steps:**
  1. Tap ☰ ("Switch feature"). The tray lists Ask a Question (✓, current), Question History, Life Tracker, Trade Balancer, Send feedback, then the Theme band.
  2. Tap Ask a Question (the current one).
  3. Open the Menu, tap Life Tracker. Then Trade Balancer. Then Ask a Question.
  4. Reload while on Life Tracker. Open `/` again in the same tab. Open `/` in a new tab.
  5. Open the Menu and press Esc.
- **Expected:**
  - Menu lists exactly those five entries plus Theme; current has `aria-current="page"` and a ✓. "lists Ask a Question…, Question History, Life Tracker, and Trade Balancer, with the current destination lit; below them sit Send feedback and the six-cell Theme band."
  - Life Tracker: URL becomes `/life-tracker`, no page reload (a `window` marker survives). "switches the active view … without leaving the app or reloading."
  - Back on Ask a Question the typed draft is still there. "preserves each destination's in-session state."
  - Choosing the current destination changes nothing (URL, draft). "selecting the current mode is a no-op." The Menu closes afterwards, which the PRD allows ("unless the implemented control naturally closes").
  - Reload on `/life-tracker` stays there; `/` in the same tab goes to Life Tracker; a brand-new tab goes to Ask a Question (`/quick-lookup`). "refreshing the page restores whichever destination was last active in that browser tab … a brand-new tab/window … opens on the first registered destination."
  - The ☰ button sits at the left of the header (about 50px wide on phone, 54 on desktop) and the brand is not covered by anything but its own slot. "the portal button and Menu must not overlap or intercept taps meant for the brand."
- **Sizes:** phone and desktop. Same behavior at both.
- **Must-fail break:**
  - `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`: make the Life Tracker item navigate to Trade Balancer. The URL assert fails.
  - `apps/frontend/src/lib/portal/activeDestinationPrefs.ts`: make the save a no-op. The `/` after Life Tracker assert fails (it would land on Ask).

### 2. Verified live?
Yes, at both sizes, all steps above. (Draft kept after round trip: seen. Reload/new-tab: seen.)

### 3. PRD vs live discrepancies
- "User selects another destination. App switches the active view to the selected destination." Question History is listed beside the destinations but it is not one. Tapping it opens a "Question History" bottom sheet over whatever screen you are on (URL did not change, it showed "No saved conversations yet"). The test should treat it as a sheet with a "Close Question History" button, not a destination switch.
- "taps the ☰ Menu button … Menu tray slides in": confirmed. Esc closes it.
- The tracker URL after a switch is `/life-tracker`; the PRD talks only about "view" switching. Not a conflict.

### 4. Edge cases
| Edge case | Include? | Why |
|---|---|---|
| Choosing the current destination is a no-op | Include | Seen live. One assert (draft/URL unchanged). |
| Each destination keeps in-session state; In-Depth secondary-details collapses on return | Include the draft-survives round trip only | The In-Depth disclosure rule is covered by the In-Depth flow tests, not this one. |
| Refresh restores last destination, in-session state resets | Include (destination part only) | Seen live. Unit-pinned in `App.persist-active-destination.test.tsx`; browser pin is cheap. |
| New tab opens on the first destination | Include | Seen live. |
| Button must not overlap brand / step columns | Include a hit-test: click the brand mark and confirm the Menu does not open | Player-visible, cheap. I only measured boxes (portal slot 12–73px on phone); the click test is not walked. |
| Navigation never changes AI/prompt | Skip | Not player-visible. |

### 5. Can't assert
Nothing blocked. The slide-in animation is not worth asserting.

---

## FLOW-013 Life tracker and hand-off to MTG Assistant

### 1. Row
- **Setup:** fresh context, open `/life-tracker` (or Menu then Life Tracker). Storage key `thejudge.lifeTracker.state`.
- **Steps:**
  1. Open Game Setup (gear, "Open game setup"). Press "Decrease player count" to 3 players, then "Set starting life to 25". Open "Edit names", type Ada (Player 1) and Bo (Player 2). Press Done.
  2. Tap "−" on Player 1 three times, "+" once. Tap the "−" at the card's near edge (the middle of the card holds other controls — same trick the smoke suite uses).
  3. Tap Player 2's life number, type 0, Enter. See the skull. Tap "+" once. Skull gone.
  4. Tap the "Day" pill: it becomes "Night".
  5. Open counters for Player 1. Tap "Increase commander damage from Player 2" twice (Player 1's life drops by 2). Switch to the Counters tab, tap Poison twice.
  6. Reload. Everything is still there.
  7. Menu, Ask a Question, "Add in-depth details". Check the roster. Open secondary details.
  8. Menu, Life Tracker. State is intact. Game Setup, "Reset current game", confirm "Reset".
- **Expected:**
  - Default is 4 players at 40. After pressing "Decrease player count" twice: 2 players at 20 (the 20 preset is lit). "2 → 20, 3+ → 40." "Custom" opens a box defaulting to 60. "Custom defaulting to 60."
  - Cards read "Player 1 (Ada), 25 life" (the card's accessible name). Starting life 25 seeds each card. "each player card seeds to the starting life."
  - After the taps: "Player 1 (Ada), 23 life". "tap each card's `+`/`−` zones."
  - Life 0 shows an image named "Player 2 (Bo) is at zero or less life"; at 1 it is gone. "a card shows a skull when that player's life reaches ≤ 0 and clears it if life returns above 0."
  - Header control label flips "currently day" to "currently night". "tapping it flips day ↔ night."
  - Counter panel title "Counters · Player 1 (Ada) <N> life"; commander damage from Player 2 reads 2 and Player 1's life is 2 lower (seen 23 to 21). "incrementing opponent commander damage also decrements that player's life."
  - After reload: names, lives, night, counters unchanged. "a reload or phone-lock restores the in-progress game."
  - In-Depth roster has Ada / Bo / Player 3, Player 1 life 35 (40−3−2), poison 2 on Player 1 and commander damage 2 from Player 2; no day/night field. "roster is seeded one-way from current tracker state (count, names, life, counters); day/night designation is not included." Zero counters show empty. "counters left at zero or unset are omitted."
  - Back in the tracker the live state is the same (seen: Ada 22, night). "Returning to the tracker preserves its live state."
  - Reset: every life back to the starting life (seen 40 on a default game), counters cleared, names kept ("Player 1 (Ada), 40 life"). "an explicit reset / New Game returns counters to starting values."
- **Sizes:** phone and desktop. Same behavior; only the layout differs (screenshots `lt-phone.png`, `lt-desk.png`). Seat rotation is not asserted.
- **Must-fail break:**
  - `apps/frontend/src/lib/lifeTracker/seed.ts`: make `trackerStateToRosterSeed` return default life for every player. The In-Depth life assert fails.
  - `apps/frontend/src/lib/lifeTracker/persistence.ts`: make `saveTrackerState` do nothing. The reload assert fails.
  - `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx`: change the skull condition `player.life <= 0` to `< 0`. The skull assert fails.

### 2. Verified live?
Yes, at both sizes, every step above. Not walked: Custom-life apply (only saw the box and its 60 default), list layout, "Ombre" card style, 8 players.

### 3. PRD vs live discrepancies
- "the user may edit before Decrypt." The In-Depth button in the live app is named "Confirm game context", not "Decrypt". Use the live name. (The Decrypt wording may live on a later step; I did not walk past the roster.)
- "Users open a player's counter panel to track … always-visible `−`/`+` bands." True, but the "Reset current game" needs a confirm step (Keep / Reset buttons). The PRD says only "an explicit reset / New Game".
- "Names are edited via Game Setup's Edit names disclosure." True. Note that after naming, the card's accessible name is "Player 1 (Ada), 25 life" but the −/+ buttons keep the old name ("Decrease life for Player 1 (Ada)"): they include the display name in the label, so use a regex or the seat label.
- The tracker's default is 4 players at 40 (the PRD does not state a default).
- A "Day/night" counter exists in the named counters list, apart from the header control. The PRD says nothing about it; do not mix them up in locators.

### 4. Edge cases
| Edge case | Include? | Why |
|---|---|---|
| Player count constrained to 2–8 | Skip | 2 and the default were seen; 8 needs many taps; covered by `state.test.ts`. Include only "2 players gives 20" since it is the count-default rule. |
| Zero/unset counters omitted from seed | Include (empty commander-damage field for untouched pairs) | Seen live; same In-Depth check as the main row. |
| Reload mid-game restores state | Include | Main row. |
| Skull is only a cue; life can go back up | Include | Main row (+1 clears it). |
| Old save with `dayNightEnabled` flag loads, flag ignored | Include as a seeded-storage variant | Cheap: seed `thejudge.lifeTracker.state` with the flag, confirm the Day pill still shows. Not walked live; `persistence.test.ts` may already pin it (not read in full). |
| Seat orientation / table rotation | Skip | Visual only (screenshot review). |

### 5. Can't assert
- Phone lock / screen sleep restoring state: reload stands in for it.
- That the life number faces each seat: only a screenshot can show that.

---

## FLOW-014 Send feedback

### 1. Row
- **Setup:** two builds of the page matter.
  - The server running for this walk was built with `VITE_FEEDBACK_FORMSPREE_ID` baked in from `apps/frontend/.env`. There, the "Send feedback" submit button is enabled and a click would post to Formspree. I never clicked it.
  - `scripts/smoke-browser.mjs` removes that variable (line 49), so the build the real tests use has no delivery configured. I reproduced that state by blanking the id in the served script (nothing left the machine; zero non-local requests). The test must also remove it, and must route Formspree away so it can never post.
- **Steps (unconfigured build):**
  1. Type "keep me" in the Ask box. Open the Menu, tap "Send feedback".
  2. See the form: three pills Bug / Suggestion / Other (Bug lit), a message box, an email box, the snapshot row.
  3. Type a message and a bad email ("bad"). Press Enter.
  4. Open the snapshot row ("Your report includes a snapshot of the app right now").
  5. Press Esc. Open again and press the close (✕) button.
- **Expected:**
  - Opens as a sheet titled "Send feedback"; URL still `/quick-lookup`, the Ask draft still "keep me". "opens the feedback form in the shared sheet … without switching the active destination or losing in-progress state."
  - Three pills, Bug / Suggestion / Other, Bug lit by default (`aria-pressed`). "three pills."
  - The submit button "Send feedback" is disabled, with the visible hint "Feedback delivery isn't configured in this build, so sending is unavailable right now." "no Formspree form id configured → submit is disabled/no-op with an explanatory hint."
  - Pressing Enter in the email box does nothing: no error, no sending, no request. (Honest outcome: nothing is sent and the player is told why.)
  - The snapshot row expands to a list with: Captured at, Active view, Provider mode, Route, Viewport, Build, Browser, Flow state. "an expandable summary of exactly what is included." Assert it opens and lists "Active view" and "Route"; do not assert values.
  - Esc and ✕ both close the sheet; the Ask draft is unchanged. "the underlying screen state is unchanged."
  - Zero requests to any non-local host during all of this.
- **Sizes:** phone and desktop. Same behavior.
- **Must-fail break:**
  - `apps/frontend/src/hooks/useFeedbackForm.ts` line 93: make `isUnconfigured` always `false`. The submit button becomes enabled and the hint disappears, so the disabled/hint asserts fail.
  - `apps/frontend/src/components/feedback/FeedbackModal.tsx`: remove the `fb-snap-row` toggle's `onClick`. The summary assert fails.

### 2. Verified live?
Partly.
- Configured build (as served): form, pills, snapshot summary, malformed-email message ("Enter a valid email address, or leave it blank." appears on Enter), Esc and ✕ close. No submit.
- Unconfigured state (reproduced by rewriting the served script): disabled submit plus the hint, Enter does nothing, no outside requests. Both sizes.
- Not walked: the thank-you page, the inline server error, and the rate-limit message. They need a successful or failing post to Formspree, which I will not do. They are pinned by `submitFeedback.test.ts`, `useFeedbackForm.test.ts`, `FeedbackModal.test.tsx`, and `App.feedback.test.tsx`.

### 3. PRD vs live discrepancies
- "Esc or the close control dismisses the modal and restores focus to the portal trigger." After Esc and after ✕, `document.activeElement` was `<body>`, not the ☰ button (both sizes). The sheet opens from a Menu item that closes first, so there is nothing to focus. Either the PRD or the app should change. The test should not assert focus until the owner picks.
- "The form shows … an expandable summary of exactly what is included (screen/step, game context + typed question, zones/cards/enrichment, conversation history, provider mode, active destination, environment)." On the Ask screen with a typed question, the live summary has only: Captured at, Active view, Provider mode, Route, Viewport, Build, Browser, and Flow state = "no feature contributed a snapshot". The typed question was not listed. I did not check it from inside an In-Depth flow, where more may appear.
- "message empty → submit is blocked with an inline message-required prompt" and "malformed email → inline format prompt." Both are reachable only in a configured build. In an unconfigured build the submit is already disabled, and the prompts never show. They cannot be tested in the build the harness uses.
- "On success the sheet shows a thank-you" and "network error → inline error, draft preserved." Unreachable without a real post (see section 2).
- Provider mode in the snapshot reads `openai` even though the backend is the mock AI. The label comes from the frontend's own setting (`VITE_ASK_AI_PROVIDER`), not the backend. Not a PRD sentence; noted so nobody asserts "mock".
- Closing the sheet discards the draft (message was empty when reopened). The PRD only promises a kept draft after an error.

### 4. Edge cases
| Edge case | Include? | Why |
|---|---|---|
| Message empty blocked | Skip | Unreachable in the harness build (submit disabled). Pinned in `useFeedbackForm.test.ts` and `FeedbackModal.test.tsx`. |
| Email malformed blocked | Skip | Same. |
| No form id configured: disabled with hint, no crash | Include (the main row) | This is the honest outcome in the built app. |
| Network error / rate limit: inline error, draft kept | Skip | Needs a real post; pinned by `submitFeedback.test.ts` and `App.feedback.test.tsx`. |
| Esc / ✕ dismiss, screen unchanged | Include dismiss + unchanged; skip focus | Focus differs from PRD (above). |
| Does not switch destination | Include | One URL assert. |

### 5. Can't assert
- Delivery: success, error, and rate-limit states and the thank-you page cannot be reached without sending to Formspree.
- Focus returning to the ☰ button (the app does not do this today).

---

## Overlap with the existing browser smoke suite (`scripts/smoke-browser.mjs`)

- The smoke step `life-tracker` already does: Menu, Life Tracker, "−" on Player 1, sees "Player 1, 39 life". The new FLOW-013 test should start from that and go further. Do not repeat the single tap; make "−" a part of the longer walk, or drop the smoke step once the flow test exists.
- The smoke step `feedback` already does: Menu, "Send feedback", sees the heading. FLOW-014 begins the same way. Keep the open step in one place only (let the flow test own it and remove the smoke step, or leave smoke as is and start the flow test at the pills).
- Neither smoke step touches the Theme band, destinations other than Life Tracker, reload persistence, hand-off, or the unconfigured hint.
- The Menu-open-then-tap-item move appears in all four flows. Put it in one shared helper, and have FLOW-010 own the "Menu lists everything and switches destinations" asserts so the other tests only use it.
- Theme band: FLOW-007 owns it. FLOW-010's Menu check should only confirm the band exists (six cells), not re-test picking.

## Unit tests that already pin related behavior (so the browser tests stay thin)
`App.theming.test.tsx`, `App.mtg-color-themes.test.tsx`, `lib/theme/themePrefs.test.ts`, `palettes.tokens.test.ts`, `App.persist-active-destination.test.tsx`, `App.player-life-tracker-flow.test.tsx`, `App.player-life-tracker-seed.test.tsx`, `lib/lifeTracker/seed.test.ts`, `persistence.test.ts`, `App.feedback.test.tsx`, `hooks/useFeedbackForm.test.ts`, `components/feedback/FeedbackModal.test.tsx`, `lib/feedback/submitFeedback.test.ts`.
