status: owner-action

# scanner-recovers-and-runs-lighter

Card scanning recovers from a failed download, builds its data once, and the three scanners share one panel.

- Idea: `IDEA.md`
- Intake (evidence, not authority): `intake/GRAPH-BRIEF-scanner.md`
- Design: `DESIGN-BRIEF.md`
- Proposed product truth (owner verdicts): `GATE-QUESTIONS.md` — REQ-214, REQ-056, REQ-249 (new), REQ-048, REQ-066
- Live measurements: `evidence/measurements.md`
- Quality check: `QUALITY-CHECK.md` (PASS)
- Next: answer `GATE-QUESTIONS.md`, then merge the docs PR to build; `/graph-implement PRD/work/scanner-recovers-and-runs-lighter/` picks it up

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/scanner-recovers-and-runs-lighter/DESIGN-BRIEF.md`
- Findings: none blocking; advisory A1–A4 for map-out in `QUALITY-CHECK.md` (parity check is `identify.test.ts` + `vectors.json`, not the absent `reference/identify.py`; scan-map slice updates the four test fixtures carrying `imageUrl`; name `npm run data:scan-map` and drop the unused `getImageUrl` helper; confirm no other `screen-layout.md` row contradicts the new scanner row)
