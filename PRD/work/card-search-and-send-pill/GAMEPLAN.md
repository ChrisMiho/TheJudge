# Gameplan — card search and send pill

## What a player gets

1. Typing a card name without its commas, apostrophes, hyphens or accents finds the card (`urborg tomb`, `jace the mind`, `fire ice`). Same result in Ask a Question's Add card, In-depth details' Cards step, and each Trade Balancer side. In-depth details also says "No matching card found" when nothing matches.
2. On a browser with no speech recognition (Firefox), the send control is one round 44px arrow, the budget ring circles it, and the text field takes the freed width. With speech recognition nothing changes.

## Slices

| Slice | Goal | Depends on |
| --- | --- | --- |
| A | Card search ignores punctuation and accents | none |
| B | No-mic send pill is one round arrow | none |

Parallel-ready; sequential order A then B only because B carries the Ship gates and PRD promotion checklist.

## Architecture and data flow

- A: `normalize` in `apps/frontend/src/lib/search.ts` is the single shared rule. `oracleSearch.ts` already imports it, so one change reaches all three searches. No ranking, threshold, list-length, data or dependency change.
- B: `ComposerPill.tsx` already knows `dictation.isSupported`. It picks a circle ring path and a narrow wrapper when false. All four boxes render through `ComposerPill`.

## Product truth (applied at build, by intent, with the code, in the same PR)

The accepted amendments in `GATE-QUESTIONS.md` are applied to `PRD/sections/` by `build`, not by cleanup. Each slice applies its own share:

- A: REQ-002, `system-map.md` card-search heading.
- B: REQ-212, REQ-206, `quick-lookup/README.md` ring line.

## Placement

No deliverable lands in `PRD/work/` (node 8 deletes it). Disposable captures only under `PRD/work/card-search-and-send-pill/.playwright-mcp/`.

## Verification checklist

- [ ] `npm --workspace apps/frontend run test` green
- [ ] `npm run quality:check` green
- [ ] Corpus recall re-run: first-two-words at or above 7,052 of 7,288; whole-name 7,324 of 7,324
- [ ] Browser: In-depth Cards step `urborg tomb` finds Urborg, Tomb of Yawgmoth
- [ ] Browser, no speech API: four boxes show a 44px send control and wrapper
- [ ] Browser and owned servers closed, ports released
