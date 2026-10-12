status: ship-ready

# follow-ups-keep-their-rules

Follow-ups reuse the opening question's rule excerpts, and the answer-quality eval gains a pushback follow-up mode. See `IDEA.md`. Intake evidence (never authority) is in `intake/`.

Refined 2026-10-12: design in `DESIGN-BRIEF.md`; proposed product truth in `GATE-QUESTIONS.md` (new REQ-246, REQ-247; amendments to REQ-022, REQ-024, REQ-027, REQ-074, REQ-178, REQ-226, REQ-228, REQ-238, REQ-242; no blocker); measurements and the amendment grep in `evidence/`.

## Slices

Mapped 2026-10-12: `GAMEPLAN.md`. One worktree, one branch. The REQ-246 follow-up item (new-topic follow-ups) is not sliced.

| Slice | Doc | Goal | Depends on |
| --- | --- | --- | --- |
| A | `slice-a-eval-pushback-mode.md` | The eval's pushback mode (REQ-247, REQ-226, REQ-228); tooling only. Status: done 2026-10-12 (evidence note: `slice-a.evidence.md`) | none |
| B | `slice-b-follow-ups-keep-rules.md` | Follow-ups keep the opening question's rules (REQ-246 and seven amendments, 13 derived-doc rows); ship gates. Status: done 2026-10-12 (evidence note: `slice-b.evidence.md`) | A (ordering: the "before" run is launched from A's commit) |

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/follow-ups-keep-their-rules/DESIGN-BRIEF.md`
- Findings: none
