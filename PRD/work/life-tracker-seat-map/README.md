# life-tracker-seat-map

Turn the life-tracker commander-damage grid into a per-seat map on both the
on-card preview and the opened counter panel, and fix map/name containment at
7–8 players. Autonomous graph run; spec-forming half driven by `graph-kickoff`.

See `IDEA.md` for the shaped idea, `intake/` for the probe evidence, and
`GRAPH-RUN.md` for the run ledger.

## Autonomous metadata

- Autonomous base: origin/main
- Shared build branch: thejudge-auto/life-tracker-seat-map-work
- Base note: the spec-forming half's base `thejudge-auto/life-tracker-seat-map`
  merged to `main` via docs PR #180 (the answer-then-merge build signal). The
  build half therefore branches off fresh `main` (loaded `graph-implement` skill,
  Model B) and opens one code PR `…-work → main`, rather than a nested
  `-work → base` PR into an already-merged base. `main` is the PR target only;
  the driver never pushes `main`, and the owner merges the code PR at `land`.

## Preparation gate

- Quality-check: PASS (build-half re-grade, attempt 2, 2026-09-02 — after owner
  accepted REQ-173; re-confirmed against the finalized proposal)
- Checked artifact: `PRD/work/life-tracker-seat-map/DESIGN-BRIEF.md`
- Findings: none (one non-blocking citation nit, unchanged from attempt 1:
  DESIGN-BRIEF criterion 5 attributes the "me" self-cell to DEC-136, which covers
  only life-adjustment split/rotation; GATE-QUESTIONS REQ-173 scopes DEC-136 to
  rotation correctly — prose imprecision, not a product-truth error, does not
  affect implementability)
