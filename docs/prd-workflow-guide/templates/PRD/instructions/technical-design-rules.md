# technical-design-rules.md

> **This is the least portable file in the system. Rewrite it entirely for your
> project.** The structure below is what to fill in; none of the example
> contents should survive.

## Purpose

Constrains how an agent may propose architecture or implementation detail.

## Allowed Design Direction

The stack and patterns already chosen. An agent proposing something outside this
list needs a decision first.

- Frontend: <framework, language, styling approach>
- Backend: <runtime, framework>
- Data: <storage approach>
- Testing: <framework and layering>
- <Pattern that is already established and should be extended rather than
  replaced>

## Required Constraints

Invariants that must survive every change.

- <Public contract that stays fixed — name it precisely>
- <Ordering, serialization, or data-shape rule that is easy to break silently>
- <Cross-cutting rule: accessibility floor, motion preferences, error handling>
- <Layering rule: which module may depend on which>

## Forbidden Design Drift

The highest-value section in this file. Name the tempting things nobody is to
build. Be specific and be blunt — a generic "avoid over-engineering" stops
nothing.

- no <the microservice split someone will propose>
- no <the plugin or extension system>
- no <the caching or queueing layer that is not yet justified>
- no <the abstraction that would be built "for future flexibility">
- no <additional product-facing endpoints beyond those in integrations-and-data.md>
- no <heavyweight dependency category you have decided against>

## Design Proposal Rules

- Reuse before creating. Search for an existing helper, hook, or module first
  and say what you found.
- Tie every proposal to a `REQ` or `DEC`. An unbacked proposal is out of scope.
- Prefer the smallest solution that satisfies the requirement.
- Keep extensibility separate from scope: note the future seam, do not build it.

## Test Expectations

Test titles follow `test-naming.md`. Slice letters, requirement IDs, and
decision IDs never appear in test titles.

<!-- Grow this file from real incidents. Every time you have to reject an agent
     proposal on architectural grounds, the reason belongs here as a rule, so
     you only have to reject it once. -->
