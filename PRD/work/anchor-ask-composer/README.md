status: ship-ready

# anchor-ask-composer

See IDEA.md. Intake: intake/GRAPH-BRIEF.md.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS (2026-10-05, build-half re-grade after gate resolution). All four verdicts are `accept` (REQ-218 new, REQ-110/129/206 amend); gate-review applied them with no change to the brief or the proposal diffs. All 69 proposed diff `-` anchors re-verified against current PRD/sections (functional-requirements, screen-layout, quick-lookup, in-depth, user-flows); REQ-218 id free; no findings.
- Checked artifact: `PRD/work/anchor-ask-composer/DESIGN-BRIEF.md`
- Findings: none
- Non-blocking build note: the REQ-218 diff says "insert after the REQ-216 entry", but REQ-217 and REQ-219 have since landed — place REQ-218 between REQ-217 and REQ-219 to keep ids in order. Placement only; nothing contradicted.
- History: kickoff half FAILed at gate-qc attempts 1 and 2 (wrong fit variant → `narrow-fit`; In-depth per-page variant; broken README diff wording; screen-layout Notes contradiction; scanner `narrow-fit` 31.5rem desktop width override), all RESOLVED by define attempt 3; PASS at kickoff attempt 3 (`d8b4458`).

## Slices

| Slice | Doc | Depends on | Summary |
| --- | --- | --- | --- |
| A | `slice-a-ask-frame.md` | none | Scope scanner 31.5rem override; frame Ask a Question |
| B | `slice-b-indepth-frame.md` | A | Frame In-depth Enrichment station only |
| C | `slice-c-keyboard.md` | A | Composer above the phone keyboard (visualViewport) |
| D | `slice-d-truth-and-ship.md` | A, B, C | Apply PRD diffs (REQ-218 between REQ-217 and REQ-219), final measured pass, ship gates |

Plan: `GAMEPLAN.md`.

Build: all four slices done 2026-10-05 (build evidence: `build-evidence.md`; captures: `.playwright-mcp/`). Product truth applied to `PRD/sections/` in slice D.
