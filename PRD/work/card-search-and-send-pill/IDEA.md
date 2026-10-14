# Card search and send pill

A player who types "urborg tomb" into card search sees nothing, and a bare "urborg" shows three shorter Urborg cards that crowd out Urborg, Tomb of Yawgmoth. Only the comma-exact name, or nearly the whole name, finds it. On Firefox the question box's send pill keeps its two-half width but the mic half is absent, so the left half holds the arrow and the right half is an empty gradient that looks like a missing icon.

Outcome: a player can find a card with a comma or apostrophe in its name without typing the punctuation, and a player on a browser without speech recognition sees a send pill that looks complete. Evidence is in `intake/owner-clarifications.md` (measured query table, Chromium simulation, screenshot `intake/firefox-mic-sim-box.png`); it is evidence, not decided fixes.

Non-goals: no fix is chosen here (refinement decides). Not observed yet in a real Firefox binary. Other punctuated names (for example `yawgmoths will`) are suspected but unmeasured.

## Prior run

- `PRD/instructions/receipts/anchor-ask-composer-2026-10-05.md` — the composer's control row (chip + mic|send pill) and budget ring around the send pill.
- `PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md` — built REQ-212 (mic half shown only where speech recognition exists).
- `PRD/instructions/receipts/ui-look-translation-2026-10-02.md` — touched `DictationMicButton.tsx` and the autocomplete hooks (`useAutocompleteSuggestions.ts`, `useAutocompleteKeyboard.ts`).
