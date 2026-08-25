# Idea — user-feedback-spec

Product truth for the Feedback & Bug Report feature is scattered across
`PRD/sections/decisions/feedback.md` (DEC-104, DEC-105), REQ-086–088,
FLOW-014, and the `system-map.md` entry, so reading current behavior means
walking a decision log rather than reading one page. This package writes the
current-state feature spec at `PRD/sections/user-feedback/README.md`, on the
DEC-168 template established by `sections/life-tracker/README.md`, so an
agent or the owner can read what the feature does today in one place. It
consolidates current behavior only — frontend-only delivery via one external
dependency (Formspree), no server state, no backend route — and does not
change or re-decide any product behavior. The spec is written draft and
non-authoritative: `decisions.md` stays precedence #1 and Read-First #1, and
any conflict between the new spec and a cited `DEC`/`REQ`/`FLOW` is resolved
in the spec's favor by correcting the spec, not the source. Out of scope:
deciding new feedback behavior, editing `PRD/sections/decisions/feedback.md`
or any other decision body, and touching `apps/` code — this is Phase A #2 of
the docs-refactor gameplan (`PRD/work/adhoc/refactor-gameplan.md`,
`PRD/work/adhoc/PROGRESS.md`), the same pattern Phase A #1 (`life-tracker`,
DEC-168, PR #105/#106) already shipped.

## Prior run

- `PRD/instructions/receipts/feedback-bug-report-2026-08-03.md` — shipped the
  Feedback & Bug Report feature itself (DEC-104/105, portal action entry,
  `FeedbackModal`, Formspree delivery). This is the behavior this spec
  consolidates, not a spec-writing precedent.
- `PRD/instructions/receipts/feedback-delivery-onboarding-2026-08-05.md` —
  owner-action follow-up that confirmed live Formspree delivery and wired the
  production build env var. Confirms the feature is live, not just coded.

## Non-goals

- No new or changed feedback behavior — DEC-104/105 are not touched.
- No edits to `PRD/sections/decisions/feedback.md`, `functional-requirements.md`,
  `user-flows.md`, or any other existing DEC/REQ/FLOW body.
- No GAMEPLAN, slice docs, or DESIGN-BRIEF from this shape step — those come
  from `thejudge-refinement` and `thejudge-map-out`.
- No `apps/` code change; this is a documentation-only package.
