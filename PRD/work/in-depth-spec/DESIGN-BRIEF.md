# Design brief — in-depth-spec

Phase A #7 of the docs-refactor gameplan, the last of the seven current-state
feature specs. Run in orchestrated (graph) mode: the approval pause is replaced
by the preparation-contract assumption ladder, with material assumptions and
their evidence recorded below.

## Scope

Write one derived, draft, non-authoritative current-state feature spec for the
**In-Depth Question** destination at `PRD/sections/in-depth/README.md`, on the
DEC-168 template the earlier six Phase A specs used. In-Depth is the largest and
most entangled destination — the primary MTG Assistant loop (staged game-context
capture + the `mode: "game"` Ask AI backend + the post-decrypt conversation).

The spec consolidates existing DEC/REQ/FLOW/system-map/screen-layout truth into
one player-first view. It changes no shipped behavior and edits no authoritative
source body. No new stable IDs are minted (DEC-168 already exists).

## Non-goals

- No change to In-Depth product behavior; no edit or supersession of any
  DEC/REQ/FLOW body.
- No new DEC/REQ/FLOW/Q id; no renumbering; no precedence flip (the decision log
  stays #1 through Phase A/B — this spec carries the draft marker).
- No resolution of any open question. Q-001 (rules-retrieval vocabulary), Q-002
  (scanner debug outline), Q-003/Q-004 (Quick Lookup), and Q-005
  (card-collection-manager) are not In-Depth-owned, so none folds into this spec.
- Intake (`intake/refactor-gameplan.md`) is evidence only; the documents it cites
  were not opened.

## Files written

- `PRD/sections/in-depth/README.md` — the current-state In-Depth spec.
- `PRD/work/in-depth-spec/DESIGN-BRIEF.md` — this file.
- `PRD/README.md` — one Section Inventory row for `sections/in-depth/`
  (navigation only, per DEC-168's Impact block).

## New stable IDs

None. Expected and confirmed: this is a derived view over existing truth.

## Entanglement rulings (the hard part of #7)

In-Depth touches nearly every domain. Ownership was assigned so each row lands in
exactly one spec, following the boundaries the prior six specs already drew:

- **Owned and specified here:** the four-step staged flow (game context → zone
  confirmation → zone collection → enrichment), the game-mode request contract and
  validation, game-mode prompt assembly (all sections including phase guidance,
  zone sections with full card metadata, `ADDITIONAL GAME STATE`, combo context),
  the decrypt waiting panel, the post-decrypt conversation origin (freeze,
  follow-up, history assembly, start over, failure handling), and the In-Depth
  game-context UI (roster disclosure, counters, zone strip).
- **Consumed, cited, not re-specified:** the shared answered-conversation
  workspace, View Context overlay, history drawer, card-detail popup, Menu rail,
  suite shell, and shared layout language (`sections/shared-chrome/`); the camera
  scan input path FLOW-006 (`sections/scan/`); the rules-retrieval System 1/2/3
  and combo-corpus machinery (`system-map.md`). The spec follows the same
  full-backend-path treatment Quick Lookup used and the same "consumed but owned
  elsewhere" deferral shared-chrome used.

## Assumption ladder decisions (evidence recorded)

1. **In-Depth destination = MTG Assistant staged flow + `mode: "game"`.** Ladder
   step 1 (active decisions). Evidence: DEC-094 names MTG Assistant the primary
   feature (staged context + Ask AI); IDEA.md and the registry (DEC-095/DEC-135)
   name the `in-depth` destination; FLOW-001 is "the primary core product flow."
2. **Include the full backend path in the spec.** Ladder step 3 (established local
   pattern). Evidence: the Quick Lookup spec (`sections/quick-lookup/README.md`)
   set the precedent that an Ask AI destination's spec describes its whole backend
   branch (validation → assembly → retrieval → provider) and cites the
   rules/combo DECs; In-Depth is the other `POST /api/ask-ai` branch, so it gets
   the same treatment for `mode: "game"`.
3. **Defer the shared conversation frame and layout language to shared-chrome
   rather than restating them.** Ladder step 1. Evidence: `sections/shared-chrome/`
   explicitly owns `ConversationWorkspace`, View Context, history drawer, card
   popup, Menu rail, shell, and the layout language, and names In-Depth as a
   consumer; REQ-025/026/028 depend on REQ-097/098 (shared). Restating them would
   duplicate the exact rows shared-chrome consolidated.
4. **Defer scan (FLOW-006) to `sections/scan/` and reference it as the zone-
   collection input path.** Ladder step 1. Evidence: the scan spec's Backed-by
   already claims the scan REQ/FLOW set; FLOW-006 is scan-owned and mounts into
   In-Depth zone collection.
5. **`MAX_CONVERSATION_HISTORY_CHARS` kept as an ambiguous/flagged bound, not
   silently resolved.** Ladder step 2 + DEC-168's ambiguous-bound rule. Evidence:
   REQ-027 (with DEC-042) sets it to 1,000,000; FLOW-005's edge case still reads
   6000. Two cited sources conflict, so the bound stays and is flagged, directing
   the reader to confirm against `apps/backend/src/**`, rather than the spec
   picking a number.
6. **Player-count range stated as 2–8 (the Life Tracker seed range).** Ladder
   step 2 (tested behavior). Evidence: REQ-015 constrains to the `PlayerLabel`
   model with `MIN_PLAYERS`/`MAX_PLAYERS`; the Life Tracker spec and DEC-101 fix
   the seed to 2–8 with matching count-driven life defaults. Stated as the current
   configuration, not as new product truth.

## Existing IDs the spec references (no new IDs)

- **DEC:** 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 013, 014, 015, 016,
  017, 019, 020, 021, 022, 023, 024, 025, 026, 027, 028, 029, 030, 031, 032, 033,
  034, 035, 036, 037, 038, 039, 040, 041, 042, 043, 045, 046, 049, 067, 076, 078,
  082, 091, 092, 094, 096, 102, 106, 116, 118, 120, 123, 127, 128, 131, 146, 151,
  153, 156, 158, 160, 161, 162.
- **REQ:** 001–032, 045, 056, 058, 061, 069, 070, 093, 094, 095, 100, 106, 110,
  121, 130, 132, 136, 137, 138, 139, 144.
- **FLOW:** 001, 002, 003, 004, 005.
- **NFR:** 001, 002, 006.
- **Cited as consumed / cross-boundary (owned elsewhere):** FLOW-006 (scan),
  FLOW-010 (feature portal), REQ-097/098 and the shared-chrome conversation set,
  DEC-095/135/145/124/149 (shared chrome), DEC-050/070 (scan), DEC-012 (card
  metadata).

## Genuine decision blocker

None. Every uncertainty resolved from an authoritative source via the assumption
ladder, or preserved as a flagged ambiguous bound within the spec.
