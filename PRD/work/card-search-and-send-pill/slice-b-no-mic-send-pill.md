# Slice B — no-mic send pill is one round arrow

## Status: planned

## Goal

Without speech recognition the send control is one round 44x44 arrow with the budget ring round it; with it, nothing changes.

## Requirements

1. In `ComposerPill.tsx`, when `dictation.isSupported` is false: render only the arrow, wrapper and button 44px wide, ring path a circle starting at the top and running clockwise, text field takes the freed width. Adjust `.send-wrap` in `styles/flow.css` / `index.css` as needed, keeping the 44px touch floor (REQ-205).
2. All four boxes (Ask a Question, its follow-up, In-depth details' question, its follow-up) are covered through `ComposerPill`. With speech recognition the pill (88x44, mic left, arrow right) is unchanged.
3. `build` applies this slice's share of the accepted `PRD/sections/` amendments by intent, together with the code, in the same PR: REQ-212 (arrow-alone pill is one round 44px control with the ring round it, and the measuring test) and REQ-206 (ring start when there is no split) in `functional-requirements.md`, plus the "Built:" ring line in `quick-lookup/README.md`. Wording follows the finalized `GATE-QUESTIONS.md` diff.

## Acceptance criteria

- [ ] `ComposerPill.test.tsx` without the speech API: one 44px round send control, wrapper 44px, no microphone control; with the API: unchanged
- [ ] Component tests for each of the four boxes without the speech API (FollowUpComposer, EnrichmentStep, quick-lookup, conversation workspace) show no empty half
- [ ] Ring path without speech is a circle starting at the top, clockwise; with speech the stadium path is unchanged
- [ ] Frontend test suite passes
- [ ] REQ-212 and REQ-206 in `PRD/sections/functional-requirements.md` and the `quick-lookup/README.md` ring line carry the accepted amendments
- [ ] Browser with both speech objects removed before load: in all four boxes the send control and its wrapper are each 44px wide, ring circles the arrow; with speech the pill is 88x44 mic left, arrow right; screenshots recorded
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/card-search-and-send-pill/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ComposerPill.test.tsx src/components/FollowUpComposer.test.tsx src/components/EnrichmentStep.test.tsx
npm --workspace apps/frontend run test
```

## Files touched

- `apps/frontend/src/components/ComposerPill.tsx`
- `apps/frontend/src/components/ComposerPill.test.tsx`
- `apps/frontend/src/components/FollowUpComposer.test.tsx`
- `apps/frontend/src/components/EnrichmentStep.test.tsx`
- `apps/frontend/src/styles/flow.css`
- `apps/frontend/src/index.css`
- `PRD/sections/functional-requirements.md` (REQ-212, REQ-206)
- `PRD/sections/quick-lookup/README.md`

## PRD promotion checklist (executed in cleanup)

- [ ] Confirm slice A and B section amendments are present in `PRD/sections/`; promote only leftovers
- [ ] No deliverable remains in `PRD/work/card-search-and-send-pill/`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/card-search-and-send-pill/` ready to delete
