# Gameplan — player-visible-bugs

Five slices, one code PR. Slice A (Trade scan prices the wrong printing) goes
first, in its own commits, by the owner's order. Preparation gate:
`Quality-check: PASS` (README, verified before mapping).

## What a player gets

- Scan a card onto a Trade side and the entry defaults to the printing in your
  hand (A).
- Feedback sent from Trade or Life Tracker no longer describes the In-Depth
  screen (B). Retry on a reopened conversation resends the failed question (B).
- On In-Depth's Cards station, a refused repeat scan says why inside the
  scanner (C, REQ-214 accepted).
- Reopening a saved question from Life Tracker keeps that question's players
  (D, REQ-085 accepted).
- In-Depth zone tabs and the Reorder / Copies buttons are 44 px tall; Life
  Tracker stays at 42 px (E).

Bug 6 (blank card names) needs no change. Bug 7's other four items need no
change (see `DESIGN-BRIEF.md`).

## Slices

| Slice | Bug | Doc | Gate diff applied | Depends on |
| --- | --- | --- | --- | --- |
| A | 1 Trade scanned printing | `slice-a-trade-scanned-printing.md` | none | none |
| B | 3 feedback context, 5 Retry | `slice-b-feedback-and-retry.md` | none | none (parallel-ready; sequenced after A by owner order) |
| C | 2 scanner refusal line | `slice-c-scanner-refusal-line.md` | REQ-214 | none |
| D | 4 reopen keeps players | `slice-d-reopen-keeps-players.md` | REQ-085 | none |
| E | 7 tap floor | `slice-e-tap-floor.md` | none | none; last, carries ship gates |

Slices touch different files except `MtgAssistantApp.tsx` (B only) and
`index.css` (E only), so they are parallel-ready. They run in letter order
because the owner asked for A first and one PR collects them. Each slice is
its own commit group.

## Architecture and data flow

- A: the scan hook keeps two lists on a lock. Voting uses card-level (oracle)
  ids so printings do not split a vote. The held card now carries the identify
  step's own printing-id candidates, and Trade's close handler reads them to
  default the entry's printing.
- B: the feedback registration takes an active flag so a hidden, still-mounted
  In-Depth stops contributing. The submit hook exposes whether a failed
  request is saved and a resend of it; Retry uses that before any staging
  check.
- C: the scan hook already returns `blockedNotice`; it flows
  `ZoneCollectionStep` to `ZoneCardPicker` to `ScanPanel`, drawn with the
  existing `tb-note` style and `role="status"`.
- D: a resume path in `App.tsx` sets the destination without the roster-seed
  check; the two resume handlers in `FeaturePortalMenu` use it. The Ask a
  Question carry seed is untouched.
- E: two `min-height` values in `index.css` go from 40 to 44 px.

## Spec application (build, not map-out)

`build` applies the finalized diffs in `GATE-QUESTIONS.md` to `PRD/sections/`
together with the code, by intent against current truth: REQ-214 with slice C
(`functional-requirements.md` and `scan/README.md`), REQ-085 with slice D
(`functional-requirements.md` and `life-tracker/README.md`). This mapping step
edits neither.

## Quality-check advisories, carried

1. Bug 7 base `.seg button` assertion must be line-start anchored (slice E).
2. The stylesheet test may sit in `ZoneCollectionStep.test.tsx` or beside the
   existing 44 px floor tests (slice E).
3. Cosmetic long sentence in the brief's bug 2 foot note (slice C: no action;
   the brief is not edited).

## Collisions

No other package is active. Card-search, card-rings and pop-ups briefs plan
after this merges. Touch only the lines each slice names.

## Verification checklist

- [ ] Every slice's `criteria.json` has all criteria true with evidence.
- [ ] `npm run typecheck`, `npm run lint`, `npm --workspace apps/frontend run test` green.
- [ ] `npm run quality:check` green for touched areas.
- [ ] REQ-214 and REQ-085 diffs present in `PRD/sections/` exactly once.
- [ ] Slice E REQ-202 Life Tracker screenshot pair recorded in slice evidence.
- [ ] `git diff --stat origin/main...HEAD` touches no file outside the slices' lists.

## PRD promotion checklist (executed in cleanup)

- REQ-214 acceptance lines and `scan/README.md` text present (slice C).
- REQ-085 acceptance line and `life-tracker/README.md` line present (slice D).
- Nothing else is promoted; bugs 1, 3, 5, 7 follow existing spec lines.
