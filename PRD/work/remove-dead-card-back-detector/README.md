status: owner-action

# remove-dead-card-back-detector

Delete the uncalled `isCardBack` method, its export-only `CARD_BACK_THRESHOLD`
constant, and the now-unread private `cardBack` field write in
`apps/frontend/src/lib/scan/identify.ts`. Keep the live `CARD_BACK_ID` DB filter
untouched.

Not a pure refactor: the method was kept dormant by design under DEC-055 as the
cheap card-back-detection re-enable path, so deleting it changes product truth
and raises the re-enable cost. Refinement recorded that in `PRD/sections/` and
the delete-vs-keep decision is posed to the owner in `GATE-QUESTIONS.md`. See
`DESIGN-BRIEF.md` and `IDEA.md` for evidence and non-goals.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/codehealth-20260901-1457-1-deadcardback

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/remove-dead-card-back-detector/DESIGN-BRIEF.md`
- Findings: none
