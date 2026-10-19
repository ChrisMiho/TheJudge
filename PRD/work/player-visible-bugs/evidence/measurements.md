# Live measurements — player-visible-bugs (define, 2026-10-18)

**What happened:** five of the seven bugs were reproduced in a real browser
against this branch's frontend. Bug 6 cannot happen to a player (the server
refuses the request first). Bug 7 was measured in part: the In-Depth zone tabs
are 40 px tall, under the app's 44 px floor.

**What it means for you:** nothing to do. The brief (`../DESIGN-BRIEF.md`)
builds on these results.

## Setup

- Frontend dev server: Vite from this worktree's `apps/frontend`, run with the
  main checkout's installed `vite` binary (the worktree has no
  `node_modules`), on `http://127.0.0.1:5391`. No backend was run.
- Backend answers were stood in for by Playwright request routes:
  `GET /api/cards/:oracleId/prices` (bug 1) and `POST /api/ask-ai` forced to
  HTTP 500 (bug 5).
- Camera: Playwright Chromium with `navigator.mediaDevices.getUserMedia`
  replaced by a canvas stream that draws one real card image (Lightning Bolt,
  printing `074d2360-3ded-412d-90b5-2b8ab209fe47`, from `cards.scryfall.io`)
  centred on a dark background. The app's real scanner (detector, fingerprint
  identify, vote, lock) recognised it: Trade held 8 locks in about 9 seconds.
- Viewport 1200x672 for bugs 1–5; 390x844 for bug 7.
- Screenshots: `../.playwright-mcp/` (gitignored, local only).
- Server stopped and the browser closed afterwards; port 5391 has no listener.

## Bug 1 — Trade scan prices a different printing (LIVE-CONFIRMED)

Two proofs.

1. Real data, real functions, in the page (`import()` through Vite): Lightning
   Bolt has 52 printings in the shipped scan map. Feeding the identify step's
   printing-id candidates through `resolveScanCandidatesRanked` gives the held
   candidates `[{ card_id: "4457ed35-…" (the oracle id), distance: 40 }]`. The
   oracle id is not a key of the scan map (`oracleIdIsScanMapKey: false`), so
   `scannedPrintingIdForOracle(heldCandidates, …)` returns `null`. Given the
   identify step's own candidates instead, it returns the scanned printing
   `074d2360-…`.
2. End to end in Trade Balancer: the prices route returned two printings —
   `Newest Reprint` at $1.00 first, and the scanned printing (`The Printing
   In Your Hand`) at $9.99 second. Scan onto Side A, close the scanner. The
   entry reads **"Lightning Bolt — Newest Reprint · NEW — $1.00"**; Side A
   total $1.00. The spec says it should default to the scanned printing
   ($9.99). Screens: `bug1-trade-scanning.png`, `bug1-trade-after-close.png`.

## Bug 2 — In-Depth Stack refuses a repeat scan silently (LIVE-CONFIRMED)

In-Depth: confirm game, pick the Stack zone, Cards station, Scan.

- First lock: "Added Lightning Bolt", pill shows 1.
- 8 more seconds on the same card: the pill stays at 1 and no text appears
  (Trade, with no duplicate rule, reached 8 in the same time — so the scanner
  was re-locking and the Stack rule was refusing each one).
- Close: Stack 1. Re-open with Bolt already on the Stack: the scanner shows
  "Locking on Lightning Bolt 2/3" over and over; no message, nothing added.
  Close: still Stack 1. The station's own status line is hidden while the
  scanner is open (`!isScanOpen && statusMessage`), and the hold check never
  calls it anyway.
- Screens: `bug2-indepth-stack-rescan-blocked-silently.png`,
  `bug2-indepth-stack-already-on-stack-rescan.png`.

## Bug 3 — feedback from another tool carries In-Depth (LIVE-CONFIRMED)

After visiting In-Depth (Cards station, one Stack card), switch to Trade
Balancer, Menu → Send feedback, open the snapshot details. It reads **Active
view: trade-balancer, Route: /trade-balancer** but **Screen: MTG Assistant,
Flow step: zone-collection, Cards collected: stack 1, Game context: 2
players**. Screen: `bug3-feedback-from-trade-carries-indepth.png`.

## Bug 4 — resume from Life Tracker seeds the roster (LIVE-CONFIRMED)

A saved In-Depth conversation (2 players, 20 life) was put in Question
History. On Life Tracker (4 players; Player 1 lowered to 33), Menu → Question
History → the entry → Open conversation. In-Depth opens the conversation.
Tapping Edit and going to station 1 shows **4 players, Player 1 at 33, the rest
at 40, player details already expanded** — the tracker's roster, not the
saved game's. Screen: `bug4-resume-from-life-tracker-seeds-roster.png`.

## Bug 5 — Retry does nothing on a resumed conversation (LIVE-CONFIRMED)

Fresh page (no In-Depth Draft, In-Depth never opened, so no game context).
Menu → Question History → open the saved In-Depth conversation → send a
follow-up. The ask route returns 500: the error shows with "Retry in 10s".
After the countdown, Retry is enabled. Tap it: **no request is sent (ask calls
stay at 1), no message appears, the screen does not change.** Screens:
`bug5-retry-before-tap.png`, `bug5-retry-after-tap-nothing.png`.

This is the reachable form of "Retry is silent with no game context": the
failed request was a follow-up, which never needs the current game context.

## Bug 6 — empty-named Stack cards (CODE-ONLY: unreachable)

Not run live: no player action can produce it. The request check rejects
any card, Stack or zone, whose name is empty after trimming —
`apps/backend/src/validation/askAiRequest.ts:17-22` (`boundedText` trims, then
`min(1)`), used for `name` at `:94` and shared by Stack cards
(`stackZoneCardItemSchema`, `:125-130`). The prompt step's trim
(`apps/backend/src/prompt/normalization.ts:16-17`, `\s+` then `trim()`) removes
the same characters the check already trimmed, so a name that passes the
check is never empty in the prompt.

## Bug 7 — appearance items (PARTLY LIVE)

At 390x844, In-Depth Cards station:

- Zone tabs (`.zone-tabs button`): Stack 75x40, Battlefield 103x40, Hand 73x40
  — **40 px tall, under REQ-205's 44 px floor.** Same on the Context station.
- `.seg button` (In-Depth card menu / Context station segmented control): not
  reached live; `index.css:2176` sets `min-height: 40px` (code-only).
- Page ground as players see it today: `body` background `rgb(9, 9, 11)`,
  `min-height` 844 px (= `100vh`), font stack includes Roboto — the
  `index.css` rule wins over `styles/shell.css`.
- 480 vs 479 px breakpoints, the two monospace stacks and the grouped
  `.act-zones`/`.place-zones` rule were not measured: none is a reported
  player symptom (see the brief).
