# Idea: Full Card Oracle in Every Zone

## Problem

TheJudge sends structured game context to the LLM via a backend-assembled prompt. The PRD contract says every submitted card should include oracle text. In practice:

- **Stack cards** get a rich metadata block including `oracleText`, mana cost, type line, colors, targets, and context notes.
- **Non-stack zone cards** (battlefield, hand, graveyard, exile, library, command) only get `name`, `owner`, `details` (context notes), and `targets` — **no oracle text or other card fields**.

This is a **backend prompt assembly gap**, not a frontend data gap. The frontend already sends full `ZoneCardItem` payloads with `oracleText` for every zone via `buildAskAiRequest` → `buildZoneCardFromMetadata`.

### Why it surfaced now

Phase-scoped context (DEC-034, DEC-035) changed default workflows:

| Phase | Default zones | Typical missing oracle |
| --- | --- | --- |
| `main_1` / `main_2` | battlefield + hand | Both zones lack oracle in prompt |
| `combat` | battlefield + stack | Battlefield permanents lack oracle |
| `draw` | hand + library | Both zones lack oracle |
| `cleanup` | battlefield + graveyard | Both zones lack oracle |

Previously, `stack_resolving` defaulted users toward stack-centric flows where oracle **did** appear for stack spells. Removing that phase did not cause the bug — it **exposed** an existing asymmetry.

### User-visible impact

Without oracle text on board/hand/graveyard cards, the model must guess card abilities from names alone. Examples that fail today:

- Rhystic Study on battlefield — tax trigger text absent from prompt (`full-context` fixture)
- Snapcaster Mage in hand + Counterspell in graveyard — flashback interaction under-specified (`multi-zone` fixture)
- Combat-phase battlefield auras/enchantments — no oracle for static/triggered abilities

### Secondary issue: truncation and budget limits

Several limits can still affect **stack** oracle and overall prompt size:

| Limit | Current | Effect |
| --- | ---: | --- |
| `MAX_ORACLE_TEXT_CHARS` | 480 | Truncates long oracle text with `...(truncated)` |
| `MAX_PROMPT_CHAR_BUDGET` | 35,000 | Returns 400 validation error when exceeded |
| `MAX_CONVERSATION_HISTORY_CHARS` | 6,000 | Drops oldest conversation turns |
| Rulings / notes caps | various | Truncates enrichment sections |

These do **not** explain missing non-stack oracle (that is the formatting gap). Policy for this work: raise all caps to very large test values while keeping instrumentation.

## Desired Outcome

1. Every card in every populated zone appears in the LLM prompt with **full card metadata**, including verbatim oracle text.
2. Stack and non-stack zone sections use a **consistent card block format** (zone-appropriate labels: `owner` vs `caster`, stack role, `manaSpent`).
3. All existing `MAX_*` limit constants and diagnostics remain in code, but values are raised so behavior is effectively unlimited during testing.
4. `getPromptDiagnostics`, mock budget lines, and structured logging continue to report prompt size and utilization.
5. Supplemental rules retrieval (`buildQueryText`) includes non-stack oracle for better rule scoring.

## Success signals

- Mock provider `FULL PROMPT (SENT TO PROVIDER)` section shows `oracleText:` under every zone header that has cards.
- `multi-zone` and `full-context` eval goldens include non-stack oracle lines.
- A `main_1` submission with battlefield + hand cards sends full oracle for both zones.
- No regression in stack ordering, scope sentence, or section order checks.

## Non-Goals

- Frontend changes (payload is already correct)
- Reverting phase-scoped prompt context or two-zone phase defaults
- Removing limit constants, truncation helpers, or budget rejection code paths
- Changing `POST /api/ask-ai` request/response shapes
- Increasing inbound Zod `oracleText` max beyond 2000 chars (separate from prompt assembly limits)
- Paraphrasing, summarizing, or rewriting oracle text
- Adding `cardId` to LLM-facing prompt text (eval harness forbids this today)
- Adding `imageUrl` to LLM-facing prompt text (existing mock/debug omission rule)

## Decomposition Intent

Ship as three slices:

1. **A** — Context normalization + prompt formatting (core fix)
2. **B** — Limit bumps + retrieval query + tests/goldens + PRD drafts
3. **C** — Ship gates, receipt, promote to `sections/`, delete work folder
