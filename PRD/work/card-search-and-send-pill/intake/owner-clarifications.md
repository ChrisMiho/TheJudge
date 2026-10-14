# Owner clarifications and launch-session findings (2026-10-13)

Source: the `/graph-kickoff` launch session, before node 1. The owner's note is
`hardtosearch.md` (copied verbatim beside this file). These are the owner's answers
to two clarifying questions, quoted, plus what the driver measured. Findings are
evidence, not product decisions.

## Owner's words

- Request: "i want to fix @PRD/ideasForLater/hardtofind/hardtosearch.md"
- Which button breaks on Firefox: "the button that is broken is the voice button in the question box, it just doesnt show"
- Follow-up: "so the issue is that the button looks like its there, but the text/icon on the box isnt there, is there anyway we can confirm this on our end?"

## Finding 1 — Urborg, Tomb of Yawgmoth is hard to find in card search

Measured by running `getSuggestions` from `apps/frontend/src/lib/search.ts` against
the real `apps/frontend/public/data/cardMetadata.json` (main @ 181b829f):

| Query typed | Suggestions shown |
| --- | --- |
| `urborg` | Urborg, Urborg Elf, Urborg Drake |
| `urborg tomb` | (none) |
| `urborg tomb of` | (none) |
| `urborg tomb of yawgmoth` | Urborg, Tomb of Yawgmoth |
| `urborg, tomb` | Urborg, Tomb of Yawgmoth |
| `tomb of yawg` | Urborg, Tomb of Yawgmoth |
| `yawgmoth` | Yawgmoth Demon, Yawgmoth's Will, Yawgmoth's Edict |

Cause, read from the code: matching is exact-substring on lower-cased names, so the
comma in the real name breaks any query typed without it (only a near-complete name
gets in through the 2-edit typo allowance). The list is capped at 3
(`MAX_SUGGESTIONS`), and a bare `urborg` fills all three slots with shorter names
first. The same punctuation sensitivity presumably affects other names with commas
or apostrophes (e.g. `yawgmoths will` vs `Yawgmoth's Will`) — not measured.

## Finding 2 — the send pill shows an empty half on Firefox

REQ-212 shows the microphone half only where the browser exposes
`SpeechRecognition` / `webkitSpeechRecognition`; Firefox does not, so the mic is
correctly omitted. But `.send-wrap` in `apps/frontend/src/styles/flow.css` is a
fixed `width: 80px` (rendered 88px) and the budget ring path in
`ComposerPill.tsx` (`SEND_RING_PATH`, viewBox 0 0 88 48) is the two-half stadium,
so the pill keeps its two-half width with only the arrow inside.

Confirmed in Chromium with both speech APIs set to `undefined` before page load
(the same code path Firefox takes), on a fresh Vite dev server from main, Ask a
Question box at 1100px wide with text typed: `.send-wrap` 88px, `.send-pair` 88px,
the send button 44px at the left edge, no `.mic` element. Screenshot:
`firefox-mic-sim-box.png` beside this file — the arrow sits in the left half and
the right half is an empty gradient. REQ-212 already states "where it does not,
the pill is the arrow alone and nothing else changes"; the render does not meet it.
Not yet observed in a real Firefox binary (Playwright's Firefox is not installed).
