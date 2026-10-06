status: ship-ready

# Blue ambient personality

Direct implementation authorized by the owner on 2026-10-05 from the existing probe. This package uses the normal TheJudge lifecycle in Codex and requires no graph runner.

## Preparation gate

- Quality-check: PASS (QUALITY-CHECK.md)
- Approval: owner request to implement the outlined fix

| Slice | Objective | Dependencies | Status |
| --- | --- | --- | --- |
| A | Initial desktop constellations and geometric inscriptions | none | done |
| B | Quieter links and Blue glyph-derived sigils | A done | done |

Verification: `slice-b.evidence.md` (current) and `slice-a.evidence.md` (initial implementation). All 28 focused tests, full quality gate and production build pass. Independent review approved the revision. PR #264 targets `main` from `fix/blue-ambient-personality`; the related probe is included for provenance. Owner-requested review server remains running: `review-server.md`.

2026-10-05 owner review: reduce the desktop links and derive the larger forms from Blue’s existing glyphs. Revision B tracks that refinement on PR #264; A remains the original verified implementation.
