# Idea: single-source the cross-cutting product-truth invariants

## Problem
A handful of cross-cutting rules — "one main product-facing endpoint",
"mock-first local default", "no deterministic rules engine" — are each restated
verbatim across many section and instruction files instead of living in one
canonical place. The "one endpoint" rule alone is asserted in five live docs
(REQ-012, REQ-072, NFR-004, `goals-and-non-goals.md`, and
`instructions/technical-design-rules.md`), so any change must touch all five and
it is easy to miss one. This bit us live during the image-first-cards gate: the
D5 block enumerated that rule's amendment set from memory, cited DEC-010 (a
retired historical row, not the live rule), and missed two live assertions
(REQ-012 and NFR-004) — a live rule would still have forbidden an owner-approved
change.

## Outcome
Each cross-cutting invariant gets one canonical home — the way DEC-168 already
consolidates per-feature truth into read-first feature specs — and every other
mention links to it instead of restating it, so a change is made in one place.
Paired with a process guardrail: refinement and gate-authoring must grep for
every assertion of a rule before writing an amendment set, never enumerate the
set from memory.

## Non-goals
Not a rewrite of how product truth is represented, and not dropping the
REQ/DEC/NFR ID system — the IDs were exactly what let us recover here (grep
found all five homes in seconds). The lever is de-duplication plus grep-derived
amendment sets, not removing IDs. Scope stays bounded to cross-cutting
invariants asserted in 3+ places; single-feature requirements are already
handled by the feature-spec consolidation and are out of scope.

## Evidence
- image-first-cards `GATE-QUESTIONS.md` D5 near-miss (this session, 2026-09-04):
  amendment set listed from memory, cited a retired DEC, missed REQ-012 + NFR-004.
- Separate drift noticed while orienting: root `README.md` still instructs
  "record new DEC bodies in `PRD/sections/decisions/<domain>.md` and keep the
  router index current", while `PRD/README.md` and `instructions/requirement-format.md`
  say the decision log is retired and no new `DEC-###` should be authored — a
  concrete cross-doc contradiction to fold into the audit.

## Prior run
- `PRD/instructions/receipts/codebase-duplication-audit-2026-08-23.md` — a
  de-duplication audit of the same shape but over the code corpus, not PRD
  product-truth. Related method, different target; context only, decides nothing.
- `PRD/instructions/receipts/image-first-cards-2026-09-05.md` — the run whose D5
  gate near-miss (cited above) motivated this idea. Origin evidence, not a prior
  run against this ground.
