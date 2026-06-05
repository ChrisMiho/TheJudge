# Design brief — Card WotC rule enrichment

## Status

- status: refined
- date: 2026-06-05
- package: `PRD/work/card-wotc-rule-enrichment/`

## Problem

TheJudge already sends card oracle text and structured game context to the backend prompt, but card-specific Oracle rulings are not included. This can leave the model under-grounded on interactions where published WotC rulings explain timing, replacement effects, triggered abilities, or card-specific exceptions.

## Outcome

Add published WotC Oracle rulings as backend-only prompt reference text for cards submitted in an `AskAiRequest`. The API contract, frontend flow, and user-facing UI stay unchanged.

## Scope

- Download Scryfall bulk type `rulings` only after explicit human approval.
- Trim the raw rulings bulk into a committed static artifact keyed by Scryfall `oracle_id`.
- Keep only `source === "wotc"` rulings whose `oracle_id` appears in the existing card metadata `cardId` set.
- Load the committed rulings artifact at backend startup.
- Add an optional `OFFICIAL RULINGS (WotC reference)` prompt section when submitted cards have matching rulings.
- Preserve the existing `POST /api/ask-ai` request and response shapes.

## Non-goals

- No frontend rulings UI.
- No new product-facing HTTP endpoint.
- No runtime Scryfall fetches.
- No deterministic rules engine, legality validation, or judge-grade output.
- No Scryfall-authored notes where `source !== "wotc"`.

## Locked decisions for refinement

| Topic | Decision |
| --- | --- |
| Product behavior | Prompt-only enrichment; users do not see a separate rulings surface. |
| API contract | Existing `POST /api/ask-ai` contract remains unchanged. |
| Source | Scryfall bulk data type `rulings`. |
| Download gate | Any Scryfall download requires explicit human approval in chat. |
| Raw data | Raw `apps/backend/data/scryfall/rulings.json` is gitignored and never committed. |
| Committed artifact | `apps/backend/data/cardRulingsByOracleId.json`. |
| Filter | WotC source only, intersected with current card metadata `cardId` values. |
| Runtime | Static file loaded at backend startup; missing artifact degrades by omitting rulings. |
| Prompt placement | After populated zone sections, before `SCOPE` and `QUESTION`. |
| Prompt budget | Existing `MAX_PROMPT_CHAR_BUDGET` remains authoritative; rulings get per-card and whole-section caps. |

## PRD references

- `DEC-001`: The product remains a flow-validation assistant.
- `DEC-002`: The product is not an authoritative judge.
- `DEC-010`: One main product-facing backend endpoint.
- `DEC-012`: Static prebuilt metadata strategy.
- `DEC-013`: No rules engine, legality validation, board-state simulation, or format enforcement.
- `DEC-020`: Provider boundary and frozen HTTP contracts across provider modes.
- `DEC-021`: `GameContext` is the parent model for prompt-facing game state.
- `DEC-025`: Prompts include stable MTG reference and scope boundaries.
- `PRD/sections/integrations-and-data.md`: API contract, metadata strategy, prompt context rules, and stack ordering.
- `PRD/sections/goals-and-non-goals.md`: Core goals and explicit non-goals.

## Refinement handoff

Refinement is approved. Durable product truth is promoted through `DEC-029` and the WotC rulings entries in `PRD/sections/integrations-and-data.md`.

## Implementation handoff

After refinement and quality-check, implementation agents should use `GAMEPLAN.md` plus the lettered slice docs. The existing slice docs are intentionally retained because they already define the implementation sequence and verification surface.
