status: active

# Full Card Oracle in Every Zone

Parent work package to restore full card metadata (including oracle text) for every card in every populated zone in the LLM prompt, and raise prompt-size/truncation constants to effectively unlimited values while keeping diagnostics infrastructure.

## Problem summary

Recent context-collection enhancements (especially phase-scoped zone defaults) made it common to submit non-stack-heavy game states. The backend prompt only includes `oracleText` for stack cards; hand, battlefield, graveyard, and other zones render name/owner/notes only. That contradicts the product contract (“oracle text for each card”) and degrades LLM grounding.

Separately, several prompt budget and truncation constants may have contributed to perceived content loss. We are not removing the limit machinery — only raising values to very large amounts during testing while keeping tracking/logging.

## Confirmed product choices

| Decision | Choice |
| --- | --- |
| Card metadata in prompt | **Full block for every card in every populated zone** — oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, context notes |
| Frontend payload | **No change** — `ZoneCardItem` already includes oracle and metadata |
| Limit constants | **Keep all knobs** — raise to very large values (effectively unlimited for now) |
| Budget enforcement | **Keep code path** — with 1M budget, normal payloads should not 400; diagnostics/logging remain |
| Phase-scoped context | **Out of scope** — do not revert zone defaults or phase guidance |

## Implementation map

| Slice | Name | Status | Depends on |
| --- | --- | --- | --- |
| A | Backend Context + Prompt Formatting | pending | — |
| B | Limit Constants + Retrieval + Tests | pending | A |

Slice A is the core fix. Slice B raises caps, updates supplemental-rules query text, refreshes tests/goldens, and aligns PRD docs.

## Related PRD sections

- `sections/integrations-and-data.md` — backend prompt must include oracle text for each card
- `sections/functional-requirements.md` — REQ-022 prompt budget references (to update after limit bump)
- `sections/decisions.md` — DEC-030 prompt budget; optional new decision for all-zone card metadata
- `apps/backend/src/prompt/context.ts` — `normalizeZoneItem` drops non-stack metadata today
- `apps/backend/src/prompt/normalization.ts` — stack vs non-stack formatting gap; limit constants
- `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts` — why non-stack submissions increased

## Docs in this folder

- `IDEA.md` — problem, desired outcome, non-goals
- `DESIGN-BRIEF.md` — technical scope, prompt shape, limit table, risks
- `GAMEPLAN.md` — architecture, data flow, file map, verification checklist
- `slice-a-backend-context-and-formatting.md` — extend context types; unified zone card blocks
- `slice-b-limits-retrieval-tests.md` — raise caps; retrieval query; tests; goldens; PRD alignment
