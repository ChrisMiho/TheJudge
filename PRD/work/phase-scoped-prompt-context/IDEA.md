# Idea: Phase-Scoped Prompt Context

## Problem

The backend currently ships all collected context in one generic prompt regardless of which turn phase the user is in. Because the relevant context changes meaningfully from phase to phase, a single template misleads the LLM — most visibly with the "resolve the stack" option, which uses a social/table term that does not map cleanly to LLM reasoning. Default zones also default to too many per phase, diluting focus.

## Desired Outcome

Each turn phase has its own prompt template that the context-collection layer populates. The templates surface only the fields that are meaningful for that phase, the "resolve the stack" framing is removed from the default options entirely, and each phase defaults to exactly one zone so the user's first interaction is tight and unambiguous.

## Non-Goals

- This does not redesign the context-collection UI flow itself.
- This does not change the provider boundary or API contract shape.
- This does not introduce new turn phases; it only improves how existing phases drive prompts.

## Decomposition Intent

This idea is expected to ship as multiple incremental work packages (slices) so each piece can be built, tested, and validated independently before the next is added.
