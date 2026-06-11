status: active

# Full Card Oracle in Every Zone

Parent work package to restore full card metadata (including oracle text) for every card in every populated zone in the LLM prompt, and raise prompt-size/truncation constants to effectively unlimited values while keeping diagnostics infrastructure.

## Problem summary

Recent context-collection enhancements (especially phase-scoped zone defaults per DEC-035) made non-stack-heavy submissions common. The backend prompt **only includes `oracleText` for stack cards**; hand, battlefield, graveyard, and other zones render name/owner/notes only. That contradicts the written product contract (“oracle text for each card”) and degrades LLM grounding for the exact scenarios users now enter most often.

Separately, several prompt budget and truncation constants can truncate stack oracle text or reject oversized prompts. Policy for this slice: **keep all limit machinery**, raise values to very large amounts during testing, continue tracking via diagnostics and mock output.

## Confirmed product choices

| Decision | Choice |
| --- | --- |
| Card metadata in prompt | **Full block for every card in every populated zone** — oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, context notes |
| Frontend payload | **No change** — `ZoneCardItem` already includes oracle and metadata via `buildZoneCardFromMetadata` |
| Limit constants | **Keep all knobs** — raise to very large values (effectively unlimited for now) |
| Budget enforcement | **Keep code path** — with 1M budget, normal payloads should not 400; diagnostics/logging remain |
| Phase-scoped context | **Out of scope** — do not revert zone defaults (DEC-035) or phase guidance (DEC-036) |
| `details:` prompt label | **Replace with `contextNotes:`** in non-stack sections for parity with stack |

## Proposed durable IDs (draft — confirm at ship)

| ID | Title | Promote to `sections/` at closeout |
| --- | --- | --- |
| DEC-042 (draft) | All-zone card metadata in LLM prompt | `decisions.md` |
| REQ-030 (draft) | Prompt assembly includes full card block in every populated zone | `functional-requirements.md` |
| DEC-030 amend (draft) | Temporary high prompt/truncation caps for testing | `decisions.md` note under DEC-030 |

See `DESIGN-BRIEF.md` for full draft wording.

## Implementation map

| Slice | Name | Status | Depends on |
| --- | --- | --- | --- |
| A | Backend Context + Prompt Formatting | pending | — |
| B | Limit Constants + Retrieval + Tests | pending | A |
| C | Ship + Closeout | pending | A, B |

**Slice A** is the functional fix (oracle + metadata in all zones). **Slice B** raises caps, fixes supplemental-rules query signal, regenerates goldens, updates PRD. **Slice C** is verification gates, receipt, and work-folder cleanup per `instructions/doc-lifecycle.md`.

## How to use this folder

1. Read `IDEA.md` for motivation and non-goals.
2. Read `DESIGN-BRIEF.md` for current vs target behavior, field matrix, and limit policy.
3. Read `GAMEPLAN.md` for architecture and file map.
4. Implement slices A → B in order; run slice C checklist before promoting to `sections/`.

## Related PRD sections

- `sections/integrations-and-data.md` — AI Prompt Context Rules (lines ~264–285); already lists “oracle text for each card” but implementation is stack-only today
- `sections/functional-requirements.md` — REQ-022 cites `MAX_PROMPT_CHAR_BUDGET = 35000`
- `sections/decisions.md` — DEC-030 (prompt budget), DEC-035 (2-zone defaults), DEC-036 (phase guidance)
- `instructions/receipts/phase-scoped-prompt-context-2026-06-06.md` — prior ship context for why non-stack submissions increased

## Code anchors (current bug)

| Location | Issue |
| --- | --- |
| `apps/backend/src/prompt/context.ts` — `normalizeZoneItem()` | Drops oracle and card metadata; maps `contextNotes` → `details` only |
| `apps/backend/src/prompt/normalization.ts` — `formatNonStackZoneSections()` | No `oracleText:` line; uses `details:` not `contextNotes:` |
| `apps/backend/src/types/index.ts` — `PromptContextZoneItem` | Missing oracle/metadata fields present on `PromptContextStackItem` |
| `apps/backend/src/gameRulesRetrieval.ts` — `buildQueryText()` | Non-stack query uses `name` + `details` only |

## Docs in this folder

| Doc | Purpose |
| --- | --- |
| `IDEA.md` | Problem, user-visible impact, desired outcome, non-goals |
| `DESIGN-BRIEF.md` | Technical scope, before/after, draft DEC/REQ, risks, open questions |
| `GAMEPLAN.md` | Architecture, data flow, file map, eval impact |
| `slice-a-backend-context-and-formatting.md` | Context types + unified prompt formatting |
| `slice-b-limits-retrieval-tests.md` | Limit bumps, retrieval, tests, goldens, PRD edits |
| `slice-c-ship-closeout.md` | Ship gates, receipt template, promotion checklist |

## Resolved refinement decisions

- [x] DEC-042 and REQ-030 confirmed and promoted to `sections/`
- [x] `caster` on non-stack cards: always omit — non-stack cards are not cast; field has no semantic meaning outside stack
- [x] Limit constants: single shared `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000`; all `MAX_*` reference it; values kept high for tunability
- [x] Empty oracle: `oracleText: (none) — no oracle text recorded for this card`
- [x] Eval harness `oracle-text-all-zones` check: included in Slice B
