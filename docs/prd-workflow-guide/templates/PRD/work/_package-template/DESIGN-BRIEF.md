# DESIGN BRIEF: <slug>

The approved product definition. Written by refinement after clarifying
questions and explicit human approval. This is the last point at which product
intent can be cheaply changed, and it is the artifact the quality gate checks.

Durable truth created or amended by this work is written into `PRD/sections/`
at the same time as this brief — this document is the working record, the
sections are the truth.

## Scope

<What is being built, stated so a different agent could plan implementation
from it without asking a question.>

## Out of scope

- <Explicitly excluded, especially anything a reader would reasonably assume
  is included.>

## Decisions taken

| ID | Decision | Where recorded |
|---|---|---|
| DEC-### | <one line> | `sections/decisions/<domain>.md` |

## Requirements created or amended

| ID | Title | New or amended |
|---|---|---|
| REQ-### | <title> | new |

## Flows affected

- FLOW-### — <how it changes, or "unchanged, must still hold">

## Behavior detail

<The substance of the brief. Per surface, per state, or per case — whatever
structure the feature calls for. Be specific enough that acceptance criteria
can be written directly from it.>

## Constraints and invariants

- <What must not change. Contracts, data shapes, existing behavior.>

## Assumptions

<Only for autonomous runs. One row per assumption with the authoritative
evidence that justified it — a DEC, a REQ, an existing tested behavior, or an
established local pattern.>

| Assumption | Evidence |
|---|---|
| <assumption> | <DEC-### / REQ-### / file path> |

## Open questions

- Q-### — <question, and whether it blocks implementation or merely scopes it>

<!-- No fixed template beyond this; the shape follows the feature. The test of
     a finished brief is whether an agent handed only this document and
     PRD/sections/ could produce a gameplan without asking anything. -->
