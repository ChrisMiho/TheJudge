# Slice D — cold-start measurement

## Status: planned

## Goal

Give "cold start with the model loaded" an operational definition, and record
the already-measured cost against the existing under-3-second answer target.

## Requirements

1. **Measurement, already made — do not re-run it.** `DESIGN-BRIEF.md`'s
   `## Measurement plan`, Baseline E, defines cold-start model readiness as
   the wall-clock time from process start to the first System 3 query
   embedding returning, with the model read from the packaged on-disk cache
   and no network call, and measured it at 181.2 ms locally (plus 3.7 ms/3.6 ms
   to parse the rule-embeddings/rule-index artifacts; 1.05 ms steady state).
   This slice records that definition and that number in `PRD/sections/`; it
   does not re-measure on this machine or add a new automated cold-start
   benchmark.
2. Apply the NFR-002 documentation block to
   `PRD/sections/non-functional-requirements.md` by intent: the new
   `- Constraints:` bullet defining and requiring cold-start model readiness
   to be measured and recorded, and the new `- Notes:` bullet with the full
   2026-09-05 measurement, including the requirement that the deployed figure
   be read from the Lambda function's own cold-start log line rather than
   assumed from the local number.

## Acceptance criteria

- [ ] D1 — `PRD/sections/non-functional-requirements.md`'s NFR-002 defines
      cold-start model readiness (wall-clock, process start to first System 3
      query embedding, packaged on-disk cache, no network call) and requires
      it to stay a small enough share of the 3-second answer target
- [ ] D2 — NFR-002's Notes record the 2026-09-05 local measurement (181.2 ms
      cold-start model readiness; 1.05 ms steady-state) and require the
      deployed figure to be read from the Lambda function's own cold-start log
      line, not assumed from the local number

## Verification

Manual: read `PRD/sections/non-functional-requirements.md`'s NFR-002 section
and confirm the new constraint and notes bullet are present and match the
finalized `GATE-QUESTIONS.md` diff.

## Files touched

- `PRD/sections/non-functional-requirements.md`
