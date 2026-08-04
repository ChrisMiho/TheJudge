---
status: owner-action
---

# feedback-delivery-onboarding

**Owner-only work package. No engineering work remains here — this is the human-interaction tail
that was split out of `feedback-bug-report` so the code could ship without waiting on it.**

The Feedback & Bug Report feature (DEC-104/DEC-105, REQ-086/087/088, FLOW-014) ships fully
implemented and functional in its **unconfigured / graceful no-op** state. Everything in this folder
is a step only a human account holder can perform: creating a third-party account, holding a real
form id, and confirming an email physically arrives in an inbox.

See `CHECKLIST.md` for the step-by-step. See `PRD/work/feedback-bug-report/` (while it exists) or
the promoted `sections/` entries for the engineering side.

## Why this is split out

`VITE_FEEDBACK_FORMSPREE_ID` is **public, non-secret, build-time config**. Supplying it is a
config-only change — no code edit, no redeploy blocker. Until it is set, `submitFeedback()` resolves
`unconfigured`, the modal surfaces the hint, and nothing throws. That makes the owner track
genuinely parallel to (and after) the engineering track rather than a dependency of it.

## Scope

| # | Item | Who | Blocking? |
| --- | --- | --- | --- |
| 1 | Create Formspree account + form, obtain form id | Owner | No — feature ships without it |
| 2 | Set `VITE_FEEDBACK_FORMSPREE_ID` in local `.env` and prod build config | Owner | No |
| 3 | Live-send smoke check: submit the modal for real, confirm the email arrives | Owner | Closes the feature out |
| 4 | (Optional) On-device camera smoke check for Trade Balancer scan input | Owner | No — covered by component tests |

## Non-goals

- No code changes belong in this package. If a step here turns up a real defect, open a normal work
  package for it rather than patching from this folder.
- The recipient email address is registered **with Formspree**, not in this repo. It must never be
  committed to the codebase, `.env.example`, or `.secrets/` (see `instructions/secrets-handling.md`).

## Closing this package

Once item 3 passes, delete this folder per `instructions/doc-lifecycle.md` and record the outcome in
the relevant `sections/` entry (delivery confirmed live, snapshot date).
