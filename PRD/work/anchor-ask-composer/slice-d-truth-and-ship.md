# Slice D — Apply product truth, verify, ship gates

## Status: done

## Goal

Product truth matches the shipped frame, and the whole package is verified end to end.

## Requirements

1. Apply the approved `GATE-QUESTIONS.md` diffs to `PRD/sections/`: functional-requirements (new REQ-218; amend REQ-110, REQ-129, REQ-206), screen-layout (Ask pre-submit Phone/Desktop/Fit/Notes; In-Depth Enrichment Fit), quick-lookup/README, in-depth/README, user-flows.
2. Place REQ-218 between REQ-217 and REQ-219 (the diff says after REQ-216; ids shifted). Re-verify every `-` anchor against current text; read current REQ-206 text at apply time (`indepth-chip-collapse` touches the same line).
3. Full quality gate and a final measured pass on both screens at 1440x716 and 390x740.

## Acceptance criteria

- [x] `### REQ-218` exists in `PRD/sections/functional-requirements.md` after REQ-217 and before REQ-219
- [x] REQ-110, REQ-129 and REQ-206 carry the amended wording and added REQ-218 dependencies
- [x] `PRD/sections/screen-layout.md`, `quick-lookup/README.md`, `in-depth/README.md` and `user-flows.md` carry the approved edits (grep for REQ-218 in each)
- [x] PRD ledger and id checks pass (`npm run test:scripts`)
- [x] `npm run quality:check` green
- [x] Final browser pass: both Ask screens at 1440x716 and 390x740 with a 300-character question, document height no greater than viewport, send pill inside viewport, cards visible (measured in browser)
- [x] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/anchor-ask-composer/.playwright-mcp/`

## PRD promotion checklist

- [x] All four IDs (REQ-218, REQ-110, REQ-129, REQ-206) applied to `PRD/sections/`; cleanup only promotes leftovers

## Verification

```bash
grep -n "### REQ-21[789]" PRD/sections/functional-requirements.md
grep -ln "REQ-218" PRD/sections/screen-layout.md PRD/sections/quick-lookup/README.md PRD/sections/in-depth/README.md PRD/sections/user-flows.md
npm run quality:check
```

## Files touched

- `PRD/sections/functional-requirements.md`
- `PRD/sections/screen-layout.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/in-depth/README.md`
- `PRD/sections/user-flows.md`

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/anchor-ask-composer/` ready to delete
