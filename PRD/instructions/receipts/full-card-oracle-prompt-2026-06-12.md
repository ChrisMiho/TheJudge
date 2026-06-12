---
slug: full-card-oracle-prompt
date: 2026-06-12
status: shipped
---

# Receipt — Full Card Oracle in Every Zone

## Ship Checklist

- [x] Slice A, B, C acceptance criteria satisfied
- [x] Tests pass (183/183); TypeScript clean (backend + frontend)
- [x] Public contract unchanged (no API shape changes)
- [x] Durable outcomes promoted to sections/

## Problem solved

Non-stack zone cards (hand, battlefield, graveyard, etc.) were rendered in the LLM prompt with only `name`, `owner`, `details`, and `targets` — no oracle text or card metadata — despite the frontend already sending full `ZoneCardItem` payloads. Phase-scoped zone defaults (DEC-035) made non-stack submissions common, exposing the gap. Separately, several prompt budget and truncation constants were low enough to truncate oracle text or reject large prompts.

## Actions taken

- Extended `PromptContextZoneItem` with `oracleText`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`; replaced `details` with `contextNotes` to match the stack section
- Rewrote `normalizeZoneItem()` to mirror stack card field pass-through
- Added `formatZoneCardLines()` shared formatter; refactored `formatNonStackZoneSections()` and stack section to both use it
- Empty oracle text emits `oracleText: (none) — no oracle text recorded for this card`
- `caster` is omitted for non-stack items (non-stack cards are not cast)
- Updated `buildQueryText()` in `gameRulesRetrieval.ts` to include `typeLine` and `oracleText` for non-stack items
- Added `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` constant; all `MAX_*` constants raised to it or a fraction of it
- Regenerated all eval golden fixtures
- Added `oracle-text-all-zones` eval harness check
- App budget test updated to work at 1M cap

## Files created

- `apps/backend/src/app.budget.test.ts` — dedicated budget test at 1M cap

## Files updated

- `apps/backend/src/types/index.ts` — extended `PromptContextZoneItem`
- `apps/backend/src/prompt/context.ts` — rewrote `normalizeZoneItem()`
- `apps/backend/src/prompt/normalization.ts` — `formatZoneCardLines()`, raised `MAX_*` constants, `EFFECTIVELY_UNLIMITED_CHARS`
- `apps/backend/src/prompt/context.test.ts` — non-stack oracle + metadata assertions
- `apps/backend/src/prompt/normalization.test.ts` — non-stack `oracleText:` in prompt; budget/cap tests
- `apps/backend/src/gameRulesRetrieval.ts` — `buildQueryText()` includes non-stack `typeLine` and `oracleText`
- `apps/backend/src/gameRulesRetrieval.test.ts` — query text assertions for non-stack oracle
- `apps/backend/src/app.contract.test.ts` — budget-exceed test updated
- `apps/backend/src/mockAskAi.test.ts` — updated for new constants
- `apps/backend/src/cardRulings.test.ts` — updated for new constants
- `apps/backend/src/eval/fixtures/*.context.golden.json` — non-stack items gain oracle fields in normalized context
- `apps/backend/src/eval/fixtures/*.prompt.golden.txt` — full card blocks with `oracleText:` in non-stack zones
- `PRD/sections/decisions.md` — DEC-042 added; DEC-030 amended
- `PRD/sections/functional-requirements.md` — REQ-030 added; REQ-022 budget ref updated
- `PRD/sections/integrations-and-data.md` — all-zone metadata + cap note

## Files deleted

- `PRD/work/full-card-oracle-prompt/` (entire folder)

## Verification results

- `npm run test`: 183/183 pass
- `npx tsc --noEmit -p apps/backend`: clean
- `npx tsc --noEmit -p apps/frontend`: clean
- `multi-zone` golden: `oracleText:` present for Snapcaster Mage in HAND zone
- `full-context` golden: `oracleText:` present for Rhystic Study in BATTLEFIELD zone
- `cardId` absent from all prompt golden fixtures

## Open questions resolved

- **`caster` on non-stack cards**: Always omit. Non-stack cards have not been cast; the field has no semantic meaning outside the stack section.
- **Empty oracle**: When `oracleText` trims to empty, emit `oracleText: (none) — no oracle text recorded for this card`.
- **Single shared unlimited constant**: `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` in `normalization.ts`; all `MAX_*` reference it or a fraction. Keeps values high and tunable from one place.
- **Budget test strategy**: Moved budget-exceed test to a separate `app.budget.test.ts` file with explicit oversized payload, so `app.contract.test.ts` stays under budget at 1M.

## Post-ship monitoring

Track during next manual testing session:
- Mock `promptChars` / `promptUtilizationPercent` in logs for typical vs heavy payloads
- Provider latency p50/p95 if using live OpenAI
- Whether 1M cap needs lowering before production scale

Re-tune caps in a future slice if needed — DEC-042 (full oracle in all zones) must not be rolled back when caps are tightened.
