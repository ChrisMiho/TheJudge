status: active

# scanner-recovers-and-runs-lighter

Card scanning recovers from a failed download, builds its data once, and the three scanners share one panel.

- Idea: `IDEA.md`
- Intake (evidence, not authority): `intake/GRAPH-BRIEF-scanner.md`
- Design: `DESIGN-BRIEF.md`
- Proposed product truth (owner verdicts): `GATE-QUESTIONS.md` — REQ-214, REQ-056, REQ-249 (new), REQ-048, REQ-066
- Live measurements: `evidence/measurements.md`
- Quality check: `QUALITY-CHECK.md` (PASS)
- Plan: `GAMEPLAN.md`
- Next: build slice A first (`/thejudge-implement PRD/work/scanner-recovers-and-runs-lighter/ slice a`), or the graph build half drives all four

## Slices

Sequential: all four touch shared scanner files (see `GAMEPLAN.md`).

| Slice | Doc | Player outcome | Depends on | Criteria (manual) |
| --- | --- | --- | --- | --- |
| A | `slice-a.md` | Scanning comes back after a failed download, with a plain-words message | none | 9 (2) |
| B | `slice-b.md` | Phones do less work per frame and hold one shared card identifier; results identical | A | 8 (1) |
| C | `slice-c.md` | One scanner panel; the exit box is the same 44 px square above the camera on all three tools | A, B | 11 (3) |
| D | `slice-d.md` | The scan map is 1.23 MB smaller | B | 12 (3) |

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/scanner-recovers-and-runs-lighter/DESIGN-BRIEF.md`
- Findings: none blocking (attempt 2, build-half re-grade after five accept verdicts, commit `2c840a0d`); advisory A1–A4 for map-out in `QUALITY-CHECK.md` (parity check is `identify.test.ts` + `vectors.json`, not the absent `reference/identify.py`; scan-map slice updates the four test fixtures carrying `imageUrl`; name `npm run data:scan-map` and drop the unused `getImageUrl` helper; confirm no other `screen-layout.md` row contradicts the new scanner row)
