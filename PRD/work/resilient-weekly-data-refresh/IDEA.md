# IDEA: resilient-weekly-data-refresh

## Problem
The weekly one-command refresh (`npm run data:refresh-pr`, REQ-195) cannot
refresh prices or rulings: Scryfall retired the old bulk-download format, so the
`/bulk-data` records for `default_cards` and `rulings` now expose
`jsonl_download_uri` (a gzipped JSONL file) and no longer carry `download_uri`.
`scripts/refresh-scryfall-data.mjs` reads `record.download_uri`, finds it absent,
and silently skips the card+rulings download — yet the wrapper still exits 0 and
opens a PR, so a broken refresh looks successful. Both 2026-09-08 runs left the
player-visible `Prices as of 5 June` line unmoved. Separately, the Commander
Spellbook combo refresh fires ~200 per-template Scryfall search calls every week
and keeps getting 429-throttled, even though combos only change when a new set
releases while prices change weekly.

## Outcome
The weekly refresh reliably advances the price snapshot on a slow overnight run:
(1) read `jsonl_download_uri`, download+gunzip the JSONL, and feed the downstream
builds (which today expect a single JSON array at
`apps/frontend/data/scryfall/default-cards.json`); (2) skip the combo re-fetch
when combos have not changed, reusing the last successful combo artifact so the
weekly run downloads and manages less and dodges the 429 storm; (3) keep the
200ms Scryfall pacing (PR #215) — the owner's priority is 100% success, not speed;
(4) fail loud instead of opening a misleading PR when the headline card download
did not actually refresh.

## Non-goals
- No runtime change: the app still reads only committed artifacts (NFR-013).
- Not moving to CI cron; still owner-invoked local + human approval (REQ-093,
  DEC-162, REQ-195).
- Not reversing the backend price move (the slim / DEC-088 posture stands).
- Not a rewrite of the combo template-expansion logic itself — only whether and
  when it runs in the weekly cadence.

## Prior run
See `PRD/instructions/receipts/weekly-data-refresh-pr-2026-09-08.md` (REQ-195 build
+ post-slim reconcile) and `commander-spellbook-combos-2026-08-22.md` (original
combo extract: 135 resolved / 32 unresolved baseline). Offered as input, not scope.
