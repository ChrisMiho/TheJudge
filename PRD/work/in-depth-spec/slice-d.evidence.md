# Slice D — manual evidence log

2026-08-27 D3 — Read the full diff of `PRD/README.md` against the fork
point (`3045e60`, confirmed via `git merge-base HEAD origin/main`): exactly
one row was added (`sections/in-depth/`) and no other Section Inventory or
Instruction Inventory row was added, removed, or reordered. The diff is a
single hunk inserting one line between the `sections/quick-lookup/` and
`sections/shared-chrome/` rows; every other line in the file is unchanged.

2026-08-27 D6 — Read the full package diff since the fork point
(`git diff --stat $(git merge-base HEAD origin/main)`): the only durable-
truth files touched are `PRD/sections/in-depth/README.md` (new, 514 lines,
plus slices A and C's bounded header corrections — DEC-018, DEC-122 mention,
DEC-047, REQ-033) and `PRD/README.md` (one row). Every other changed path is
`PRD/work/in-depth-spec/` bookkeeping or the `PRD/work/STATUS.md` board row
(confirmed unchanged in this diff so far — the board row moves to ship-ready
at this slice's completion, not before). No change under `apps/`; no change
to any existing DEC/REQ/FLOW/NFR body, `system-map.md`, `screen-layout.md`,
`open-questions.md`, or `goals-and-non-goals.md`. Slices A, B, and C already
verified both durable-truth files against their cited sources and applied
the four licensed corrections (DEC-018, DEC-122, DEC-047, REQ-033). Three
further discrepancies slice C found between the backend-path section's
`Built:` claims and actual `apps/backend/src/` code (gameStateNotes/
ADDITIONAL GAME STATE unimplemented, conversationHistory's per-message char
cap, and the SCOPE/CONVERSATION HISTORY section-order claim) are documented
in `slice-c.evidence.md` and reported via a PR comment — they are real,
sourced, and out of every slice's bounded-correction license, so they are
not corrected here either. There is no further durable-truth promotion for
`thejudge-cleanup` to perform beyond `PRD/sections/in-depth/README.md` and
the `PRD/README.md` row; the three flagged discrepancies are a follow-up
package's work, not this package's.
