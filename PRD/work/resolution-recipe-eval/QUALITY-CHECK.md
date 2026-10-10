# Quality check — resolution-recipe-eval

Run `graph-20261010-200144`, node `gate-qc` (build-half re-grade). Graph is
controlling. Date 2026-10-10. Graded: `DESIGN-BRIEF.md` and the finalized
`GATE-QUESTIONS.md` (gate review commit `2e4720cd`, brief reconciliation none)
against `origin/main` at `bcef4543` (includes PR #282).

History: spec-forming attempt 1 FAIL (F1 to F5); attempt 2 (run
`graph-20261010-183425`, commit `a5f98eec`) PASS; build-half re-grade after the
owner accepted all 24 slots: PASS (this report).

**Verdict: PASS.** No findings. The package stays at `refined`.

## Direct checks

1. **Diff blocks match live text.** A script compared every removed (`-`) and
   context (` `) line in the five blocks (REQ-230, REQ-228, REQ-187, REQ-224,
   REQ-185) with live `PRD/sections/functional-requirements.md` at this base:
   33 lines, 0 mismatches. PR #282 did not move any of them.
2. **Grep reproduces.** The brief's grep returns 104 hits at this base. The
   table has 104 rows and the file:line list of the table equals the list of
   grep hits exactly (0 diff). Dispositions: 10 amend, 20 build, 74 keep, as
   the brief states.
3. **Verdict slots.** All 24 slots (REQ-230, REQ-228, REQ-187, REQ-224,
   REQ-185, G1, G2, G3-01 to G3-16, G4) read `accept`; none blank, none edit or
   reject, so no edited text exists to conflict with the brief. G5 is answered
   by the REQ-187 slot. Accept on REQ-224 and REQ-185 agree. G1's accept and
   G2's wording agree (the recipe's closing line is the "conclusion and key
   reasons" form). Counts agree across brief and questions file (16 hard cases,
   104 rows).
4. **Nothing outside the package changed.**
   `git diff --stat origin/main HEAD -- PRD/sections apps scripts docs` is
   empty.

## Status

PASS: `STATUS.refined` and the board row under `## refined` stay as they are;
map-out owns the move to `active`. README `## Preparation gate` left to the
driver. Brief and questions file not edited.
