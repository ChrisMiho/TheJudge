# life-tracker-seat-map

Turn the life-tracker commander-damage grid into a per-seat map on both the
on-card preview and the opened counter panel, and fix map/name containment at
7–8 players. Autonomous graph run; spec-forming half driven by `graph-kickoff`.

See `IDEA.md` for the shaped idea, `intake/` for the probe evidence, and
`GRAPH-RUN.md` for the run ledger.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/life-tracker-seat-map

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/life-tracker-seat-map/DESIGN-BRIEF.md`
- Findings: none (one non-blocking citation nit: DESIGN-BRIEF criterion 5 attributes
  the "me" self-cell to DEC-136, which covers only life-adjustment split/rotation;
  GATE-QUESTIONS REQ-173 scopes DEC-136 to rotation correctly — prose imprecision,
  not a product-truth error, does not affect implementability)
