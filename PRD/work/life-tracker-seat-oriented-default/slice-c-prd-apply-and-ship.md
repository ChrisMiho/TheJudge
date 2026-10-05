# Slice C — Apply REQ-217 product truth and ship gates

## Status: planned

## Goal

Apply the accepted REQ-217 four-file diff from GATE-QUESTIONS.md to `PRD/sections/` together with the code, and close with the promotion checklist and ship gates.

## Requirements

1. Apply the diff verbatim from `GATE-QUESTIONS.md`: (1) append REQ-217 after REQ-216 in `PRD/sections/functional-requirements.md`; (2) amend the DEC-170 row in place in `PRD/sections/decisions.md` (no new DEC); (3) amend the Backed-by line and the Life table split bullet in `PRD/sections/life-tracker/README.md`; (4) update the Player Life Tracker summary line in `PRD/sections/system-map.md` (~543).
2. If the built behavior differs from the diff wording (e.g. the helper derives list pair columns from `gridColumn`), amend the section text to match what shipped; do not leave the spec and code disagreeing.
3. Run the repo's PRD link/ledger checks for the touched sections.
4. Promotion checklist for cleanup: REQ-217, DEC-170 amendment, life-tracker README bullet and system-map summary are present in `PRD/sections/`; then `PRD/work/life-tracker-seat-oriented-default/` is ready to delete.

## Acceptance criteria

- [ ] C1: `PRD/sections/functional-requirements.md` contains `### REQ-217` after REQ-216 with the near-edge title
- [ ] C2: The DEC-170 row in `PRD/sections/decisions.md` is amended in place to state it is superseded by REQ-217, and no new DEC row was added
- [ ] C3: `PRD/sections/life-tracker/README.md` Backed-by lists REQ-217 and the Life table split bullet describes the near-edge rule for both layouts
- [ ] C4: `PRD/sections/system-map.md` Player Life Tracker summary names the near-edge `−`/`+` rule (REQ-217)
- [ ] C5: A `grep -rn "fixed on-screen left/right\|fixed screen left" PRD/sections` returns no stale statement of the old grid split (each remaining hit is dispositioned in the evidence log)
- [ ] C6: Ship gates all satisfied (below)

## Verification

```bash
grep -n "REQ-217" PRD/sections/*.md PRD/sections/life-tracker/README.md
grep -rn "fixed on-screen left/right\|fixed screen left" PRD/sections
```

Tests:

- PRD checks that the repo provides for section edits (see `package.json` scripts; run the ledger/link check if present).

## Files touched

- `PRD/sections/functional-requirements.md`
- `PRD/sections/decisions.md`
- `PRD/sections/life-tracker/README.md`
- `PRD/sections/system-map.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/life-tracker-seat-oriented-default/` ready to delete
