# Idea: Consolidate Shared Logic and Remove Duplication

## Problem

A codebase analysis revealed multiple instances of accidentally duplicated logic — zone ordering constants defined in three separate files, player display formatting functions with identical algorithms implemented independently in both apps, truncation helpers re-implemented within the same backend package, default question strings copied verbatim across the stack, and a player label array hardcoded in three places (validation schema, normalization module, test utilities). Additionally, two backend modules have grown large and mix unrelated concerns: `normalization.ts` (470 lines) handles normalization, display formatting, and diagnostics together, and `EnrichmentStep.tsx` (689 lines) mixes UI rendering, state management, validation, and data transformation.

## Desired Outcome

Each piece of shared logic has a single authoritative definition that is imported wherever needed. Zone ordering constants, player label arrays, and fallback question strings exist in one place. The backend `cardRulings.ts` collapses its near-identical rulings resolution pair into a single function. `normalization.ts` is split by concern. `EnrichmentStep.tsx` extracts helper utilities and state logic into separate, testable units.

## Non-Goals

- No new product features or behavior changes
- No changes to prompt content, API contracts, or request/response shapes
- No creation of a shared npm package between frontend and backend
- No frontend/backend unification of normalization strategies that serve different purposes (search vs. prompt building)
- No changes to test coverage thresholds beyond what cleanup naturally produces
