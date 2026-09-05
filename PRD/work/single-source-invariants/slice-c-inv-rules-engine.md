# Slice C — INV-RULES-ENGINE: one canonical home for "assistant, not a rules engine"

## Status: planned

## Goal

"TheJudge is an MTG assistant, not an official judge or a deterministic rules
engine" is asserted across roughly twenty files, several citing retired
decisions (DEC-001, DEC-002, DEC-013) as if they were the live rule. This
slice makes `goals-and-non-goals.md:85` (Scope Notes, already the fullest
DEC-094 framing) the one place that carries the full rule; every other home
becomes a short pointer.

## Depends on

Slice A. `functional-requirements.md`'s REQ-094 constraint (~2195) is a
single line both invariants touch; Slice A's accepted diff already writes
both pointers there in one edit. This slice verifies that line, it does not
re-edit it. Run Slice A first.

## Requirements

1. Apply the accepted `INV-RULES-ENGINE` diff from
   `PRD/work/single-source-invariants/GATE-QUESTIONS.md` in full: append the
   canonical rule text and echoed-in list to `goals-and-non-goals.md:85`
   Scope Notes (also touching the related constraint/non-goal lines ~50,
   ~65, ~66 per the diff).
2. Update every pointer home: `PRD/sections/overview.md` (~23-24 Product
   Positioning, ~39 Current Product Status), `PRD/sections/problem-statement.md`
   (~31, ~32), `PRD/instructions/technical-design-rules.md` (~32-35 Forbidden
   Design Drift), `PRD/instructions/agent-working-rules.md` (~41, ~44),
   `PRD/sections/integrations-and-data.md` (~370-373 backend must-not-add
   list), `PRD/sections/functional-requirements.md` (REQ-081 ~1863, REQ-083
   ~1918), `PRD/sections/in-depth/README.md` (~49-50),
   `PRD/sections/quick-lookup/README.md` (~34), `PRD/sections/user-flows.md`
   (~268 Quick-Lookup note, ~302 life-tracker note),
   `PRD/sections/system-map/prompt-assembly.md` (~92),
   `PRD/sections/system-map/game-rules-retrieval.md` (~46, ~89),
   `PRD/sections/life-tracker/README.md` (~44), root `README.md` (~3).
3. Verify (do not re-edit) `functional-requirements.md` REQ-094 (~2195): it
   should already carry the dual pointer to NFR-004 and to
   `goals-and-non-goals.md` Scope Notes, written by Slice A.
4. Every pointer that currently cites a retired DEC (DEC-001, DEC-002,
   DEC-013) as the live rule repoints to `canonical rule: goals-and-non-goals.md
   Scope Notes` and keeps the retired ID only as a resolvable index reference,
   per the same scope test used in Slice A.
5. Locate each edit by the quoted current text in the proposal's diff, not by
   trusting the line numbers (last verified 2026-09-04) — re-grep first if a
   quoted line has moved.

## Acceptance criteria

- [ ] C1 — `goals-and-non-goals.md` Scope Notes (~85) carries the full
      canonical assistant-not-rules-engine rule text, the echoed-in list of
      the other homes, and the retired DEC-001/DEC-002/DEC-013 note; related
      lines (~50, ~65, ~66) are updated per the diff
- [ ] C2 — `overview.md` Product Positioning (~23-24) and Current Product
      Status (~39) each append the canonical pointer
- [ ] C3 — `problem-statement.md` (~31, ~32) appends the canonical pointer
- [ ] C4 — `technical-design-rules.md` Forbidden Design Drift (~32-35)
      appends one pointer to the group
- [ ] C5 — `agent-working-rules.md` (~41, ~44) each append the canonical
      pointer
- [ ] C6 — `integrations-and-data.md` backend must-not-add list (~370-373)
      appends one pointer to the group
- [ ] C7 — `functional-requirements.md` REQ-081 (~1863) and REQ-083 (~1918)
      each repoint their DEC-013 citation to the canonical home
- [ ] C8 — `functional-requirements.md` REQ-094 (~2195) is verified to
      already carry the dual pointer written by Slice A (no re-edit)
- [ ] C9 — `in-depth/README.md` (~49-50) appends the canonical pointer
- [ ] C10 — `quick-lookup/README.md` (~34) appends the canonical pointer
- [ ] C11 — `user-flows.md` (~268 Quick-Lookup note, ~302 life-tracker note)
      each repoint their DEC-002/DEC-013 citation to the canonical home
- [ ] C12 — `system-map/prompt-assembly.md` (~92) and
      `system-map/game-rules-retrieval.md` (~46, ~89) each append the
      canonical pointer
- [ ] C13 — `life-tracker/README.md` (~44) appends the canonical pointer
- [ ] C14 — root `README.md` (~3) appends the canonical pointer
- [ ] C15 — re-grep the rules-engine pattern family and `grep -rniE
      'DEC-001|DEC-002|DEC-013'` across `PRD/` and root `README.md`; every
      returned rule-stating line is the canonical home or a listed pointer
      above; the out-of-scope per-feature clauses
      (`functional-requirements.md:238,252,1735,1820,2218`) and
      `decisions.md` index rows are unchanged; no unlisted rule-stating home
      remains (manual check — no test command applies to this docs-only
      slice)

## Verification

```bash
grep -rniE 'rules engine|not an official judge|legality validation|board.?state simulation' PRD/ README.md --include='*.md' | grep -v '/work/\|/receipts/\|/ideasForLater/'
grep -rniE 'DEC-001|DEC-002|DEC-013' PRD/ README.md --include='*.md' | grep -v '/work/\|/receipts/\|/ideasForLater/'
```

## Files touched

- `PRD/sections/goals-and-non-goals.md`
- `PRD/sections/overview.md`
- `PRD/sections/problem-statement.md`
- `PRD/instructions/technical-design-rules.md`
- `PRD/instructions/agent-working-rules.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/functional-requirements.md` (verify-only for REQ-094; edited
  for REQ-081/REQ-083)
- `PRD/sections/in-depth/README.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/user-flows.md`
- `PRD/sections/system-map/prompt-assembly.md`
- `PRD/sections/system-map/game-rules-retrieval.md`
- `PRD/sections/life-tracker/README.md`
- `README.md` (root)
